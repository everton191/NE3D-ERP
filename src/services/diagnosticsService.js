(function () {
  "use strict";

  const QUEUE_KEY = "simplifica3d:diagnosticsQueue:v1";
  const THROTTLE_MS = 20 * 1000;
  const MAX_QUEUE = 150;
  const MAX_KEYS = 48;
  const MAX_TEXT = 1600;
  const SENSITIVE_KEY_PATTERN = /access[_-]?token|refresh[_-]?token|password|senha|authorization|apikey|api[_-]?key|card|cartao|cartão|document|cpf|cnpj|secret|webhook[_-]?secret/i;
  const PLAN_EVENTS = new Set([
    "checkout_opened",
    "checkout_abandoned",
    "checkout_returned_without_payment",
    "payment_pending_real",
    "payment_approved",
    "payment_failed",
    "subscription_created",
    "subscription_cancel_requested",
    "subscription_cancel_at_period_end",
    "subscription_reactivated",
    "subscription_expired",
    "webhook_received",
    "webhook_validation_failed",
    "webhook_ignored_duplicate",
    "webhook_plan_resolved",
    "webhook_plan_resolution_failed"
  ]);
  const DIAGNOSTIC_EVENTS = new Set([
    "login_failed",
    "sync_failed",
    "order_save_failed",
    "cash_entry_failed",
    "inventory_update_failed",
    "storefront_open_failed",
    "store_editor_failed",
    "checkout_opened",
    "checkout_abandoned",
    "payment_pending_real",
    "payment_approved",
    "payment_failed",
    "subscription_cancel_requested",
    "subscription_cancel_at_period_end",
    "subscription_expired",
    "webhook_received",
    "webhook_validation_failed",
    "pwa_cache_error",
    "pdf_generation_failed"
  ]);
  PLAN_EVENTS.forEach((eventType) => DIAGNOSTIC_EVENTS.add(eventType));

  const state = {
    getContext: null,
    send: null,
    throttle: new Map(),
    flushing: false,
    featureFlags: {
      enableAiDiagnostics: false,
      enableAiAssistant: false,
      enableAiBugSummary: false
    }
  };

  function getStorageSafe() {
    try {
      if (typeof localStorage === "undefined") return null;
      const key = `${QUEUE_KEY}:probe`;
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return localStorage;
    } catch (_) {
      return null;
    }
  }

  function parseJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function getQueue() {
    const storage = getStorageSafe();
    if (!storage) return [];
    const queue = parseJson(storage.getItem(QUEUE_KEY) || "[]", []);
    return Array.isArray(queue) ? queue : [];
  }

  function setQueue(queue) {
    const storage = getStorageSafe();
    if (!storage) return;
    try {
      storage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
    } catch (_) {}
  }

  function limitText(value, max = MAX_TEXT) {
    return String(value == null ? "" : value).slice(0, max);
  }

  function sanitizeDiagnosticPayload(value, depth = 0) {
    if (depth > 4) return "[truncated]";
    if (value == null) return null;
    if (typeof value === "string") return limitText(value, 900);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.slice(0, 24).map((item) => sanitizeDiagnosticPayload(item, depth + 1));
    if (typeof value !== "object") return limitText(value, 240);

    const output = {};
    Object.keys(value).slice(0, MAX_KEYS).forEach((key) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        output[key] = "[redacted]";
        return;
      }
      output[key] = sanitizeDiagnosticPayload(value[key], depth + 1);
    });
    return output;
  }

  function normalizeError(error) {
    if (error instanceof Error) {
      return {
        type: limitText(error.name || "Error", 80),
        message: limitText(error.message || "Erro inesperado", 900),
        stack: sanitizeStack(error.stack || "")
      };
    }
    if (typeof error === "object" && error) {
      return {
        type: limitText(error.name || error.code || "Error", 80),
        message: limitText(error.message || JSON.stringify(sanitizeDiagnosticPayload(error)), 900),
        stack: sanitizeStack(error.stack || "")
      };
    }
    return { type: "Error", message: limitText(error || "Erro sem detalhes", 900), stack: "" };
  }

  function sanitizeStack(stack) {
    return limitText(String(stack || "")
      .replace(/access[_-]?token=[^&\s]+/gi, "access_token=[redacted]")
      .replace(/refresh[_-]?token=[^&\s]+/gi, "refresh_token=[redacted]")
      .replace(/authorization:\s*[^\n]+/gi, "authorization: [redacted]"), 1800);
  }

  function getDefaultContext() {
    const nav = typeof navigator !== "undefined" ? navigator : {};
    const ua = nav.userAgent || "";
    return {
      userId: "",
      screen: "",
      action: "",
      appVersion: "",
      buildNumber: "",
      platform: nav.userAgentData?.mobile ? "mobile-web" : "web",
      deviceModel: nav.userAgentData?.platform || nav.platform || "",
      os: ua,
      browser: ua,
      isPwa: typeof matchMedia === "function" ? matchMedia("(display-mode: standalone)").matches : false,
      isApk: !!(typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.()),
      route: typeof location !== "undefined" ? location.pathname : "",
      planAtTime: "",
      subscriptionStatusAtTime: "",
      paymentStatusAtTime: ""
    };
  }

  function getContext(extra = {}) {
    let configured = {};
    try {
      if (typeof state.getContext === "function") configured = state.getContext() || {};
    } catch (_) {}
    return { ...getDefaultContext(), ...configured, ...extra };
  }

  function stableHash(text) {
    let hash = 0;
    const source = String(text || "");
    for (let index = 0; index < source.length; index += 1) {
      hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
    }
    return Math.abs(hash).toString(36);
  }

  function normalizeFingerprintPart(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[0-9a-f]{8}-[0-9a-f-]{13,}/g, "#")
      .replace(/[a-f0-9]{8,}/g, "#")
      .replace(/\b\d+\b/g, "#")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  }

  function generateErrorFingerprint(error, context = {}) {
    const info = normalizeError(error);
    const ctx = getContext(context);
    const key = [
      normalizeFingerprintPart(info.message),
      normalizeFingerprintPart(ctx.screen),
      normalizeFingerprintPart(ctx.action),
      normalizeFingerprintPart(ctx.appVersion),
      normalizeFingerprintPart(info.stack.split("\n")[1] || "")
    ].join("|");
    return `err_${stableHash(key)}`;
  }

  function throttleKey(kind, payload) {
    return [kind, payload.fingerprint || payload.event_type || payload.title || "", payload.screen || "", payload.action || ""].join("|");
  }

  function shouldThrottle(kind, payload) {
    const key = throttleKey(kind, payload);
    const now = Date.now();
    const last = Number(state.throttle.get(key)) || 0;
    if (now - last < THROTTLE_MS) return true;
    state.throttle.set(key, now);
    return false;
  }

  function enqueue(kind, payload) {
    const queue = getQueue();
    queue.push({
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,
      kind,
      payload,
      createdAt: new Date().toISOString()
    });
    setQueue(queue);
  }

  async function send(kind, payload) {
    if (typeof state.send === "function") return state.send(kind, payload);
    if (typeof window !== "undefined" && typeof window.requisicaoSupabase === "function") {
      if (kind === "error") {
        return window.requisicaoSupabase("/rest/v1/rpc/register_app_error", {
          method: "POST",
          telemetry: false,
          body: JSON.stringify({
            p_error_key: payload.fingerprint || "APP_ERROR",
            p_error_message: payload.error_message,
            p_screen_name: payload.screen,
            p_action_name: payload.action,
            p_app_version: payload.app_version,
            p_device_model: payload.device_model,
            p_os_version: payload.os,
            p_platform: payload.platform,
            p_metadata: payload.metadata_json || {},
            p_user_email: payload.user_email || ""
          })
        });
      }
      if (kind === "feedback") {
        return window.requisicaoSupabase("/rest/v1/app_feedback_reports", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          telemetry: false,
          body: JSON.stringify(payload)
        });
      }
      if (kind === "event") {
        return window.requisicaoSupabase("/rest/v1/app_diagnostic_events", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          telemetry: false,
          body: JSON.stringify(payload)
        });
      }
    }
    throw new Error("Diagnostics sender unavailable");
  }

  async function safeSend(kind, payload) {
    if (shouldThrottle(kind, payload)) return { ok: false, queued: false, reason: "THROTTLED" };
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      enqueue(kind, payload);
      return { ok: false, queued: true, reason: "OFFLINE" };
    }
    try {
      await send(kind, payload);
      return { ok: true, queued: false };
    } catch (error) {
      enqueue(kind, payload);
      return { ok: false, queued: true, reason: "SEND_FAILED", error: error?.message || String(error) };
    }
  }

  function buildBasePayload(context = {}) {
    const ctx = getContext(context);
    return {
      user_id: ctx.userId || null,
      screen: limitText(ctx.screen || ctx.screenName || "", 120),
      action: limitText(ctx.action || ctx.actionName || "", 140),
      app_version: limitText(ctx.appVersion || "", 80),
      build_number: limitText(ctx.buildNumber || "", 40),
      platform: limitText(ctx.platform || "", 80),
      device_model: limitText(ctx.deviceModel || "", 160),
      os: limitText(ctx.os || ctx.osVersion || "", 180),
      browser: limitText(ctx.browser || "", 180),
      is_pwa: !!ctx.isPwa,
      is_apk: !!ctx.isApk,
      route: limitText(ctx.route || "", 180),
      plan_at_time: limitText(ctx.planAtTime || "", 40),
      subscription_status_at_time: limitText(ctx.subscriptionStatusAtTime || "", 60),
      payment_status_at_time: limitText(ctx.paymentStatusAtTime || "", 60)
    };
  }

  async function reportAppError(error, context = {}) {
    const errorInfo = normalizeError(error);
    const base = buildBasePayload(context);
    const fingerprint = context.fingerprint || generateErrorFingerprint(error, base);
    const payload = {
      ...base,
      user_email: limitText(context.userEmail || "", 180) || null,
      error_message: errorInfo.message,
      error_stack_sanitized: errorInfo.stack,
      error_type: errorInfo.type,
      fingerprint,
      severity: context.severity || "low",
      status: "new",
      metadata_json: sanitizeDiagnosticPayload(context.metadata || {})
    };
    return safeSend("error", payload);
  }

  function normalizeFeedbackType(type) {
    const value = String(type || "").toLowerCase();
    if (["bug", "bug_report", "erro"].includes(value)) return "bug_report";
    if (["sugestao", "sugestão", "suggestion"].includes(value)) return "suggestion";
    if (["melhoria", "improvement", "feature"].includes(value)) return "improvement";
    if (["duvida", "dúvida", "question"].includes(value)) return "question";
    if (["reclamacao", "reclamação", "complaint"].includes(value)) return "complaint";
    return "other";
  }

  async function reportFeedback(payload = {}) {
    const base = buildBasePayload(payload);
    const clean = sanitizeDiagnosticPayload(payload.metadata || payload.metadata_json || {});
    const message = limitText(payload.message || payload.description || "", 1600);
    const report = {
      user_id: base.user_id,
      type: normalizeFeedbackType(payload.type),
      title: limitText(payload.title || "Feedback", 140),
      message,
      description: message,
      screen: base.screen,
      screen_name: base.screen,
      action: base.action,
      app_version: base.app_version,
      platform: base.platform,
      device_model: base.device_model,
      plan_at_time: base.plan_at_time,
      status: "new",
      priority: payload.priority || "normal",
      metadata: clean,
      metadata_json: clean
    };
    return safeSend("feedback", report);
  }

  async function reportDiagnosticEvent(eventType, payload = {}) {
    const base = buildBasePayload(payload);
    const event = String(eventType || payload.event_type || "diagnostic_event");
    const clean = sanitizeDiagnosticPayload(payload.metadata || payload.metadata_json || {});
    const eventPayload = {
      user_id: base.user_id,
      event_type: event,
      screen: base.screen,
      action: base.action,
      app_version: base.app_version,
      platform: base.platform,
      severity: payload.severity || (PLAN_EVENTS.has(event) ? "medium" : "low"),
      fingerprint: payload.fingerprint || `evt_${stableHash(`${event}|${base.screen}|${base.action}|${base.app_version}`)}`,
      metadata_json: clean
    };
    return safeSend("event", eventPayload);
  }

  async function flushPendingDiagnosticsQueue() {
    if (state.flushing) return false;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
    state.flushing = true;
    try {
      const queue = getQueue();
      const pending = [];
      for (const item of queue) {
        try {
          await send(item.kind, item.payload);
        } catch (_) {
          pending.push(item);
        }
      }
      setQueue(pending);
      return pending.length === 0;
    } finally {
      state.flushing = false;
    }
  }

  function generateCodexTechnicalReport(data = {}) {
    const bug = data.bug || data.cluster || {};
    const relatedEvents = data.events || [];
    const relatedFeedbacks = data.feedbacks || [];
    const priority = bug.severity === "critical" ? "Crítica" : bug.severity === "high" ? "Alta" : bug.severity === "medium" ? "Média" : "Baixa";
    return `# Relatório técnico para correção

## Resumo
${limitText(bug.title || bug.summary || bug.error_message || bug.fingerprint || "Problema coletado pelo diagnóstico.", 600)}

## Frequência
Ocorrências: ${Number(bug.occurrence_count) || 0}
Usuários afetados: ${Number(bug.affected_users_count || bug.affected_user_count) || 0}
Primeira ocorrência: ${bug.first_seen_at || "-"}
Última ocorrência: ${bug.last_seen_at || "-"}

## Contexto
Tela: ${bug.screen || bug.screen_name || "-"}
Ação: ${bug.action || bug.action_name || "-"}
Versões afetadas: ${Array.isArray(bug.affected_versions) ? bug.affected_versions.join(", ") : (bug.app_version || "-")}
Plataformas: ${Array.isArray(bug.affected_platforms) ? bug.affected_platforms.join(", ") : (bug.platform || "-")}
Dispositivos: ${bug.device_model || "-"}

## Evidências
Mensagens de erro: ${bug.error_message || "-"}
Stack sanitizada: ${bug.error_stack_sanitized || "-"}
Eventos relacionados: ${relatedEvents.map((event) => event.event_type || event.fingerprint || "evento").join(", ") || "-"}
Feedbacks relacionados: ${relatedFeedbacks.map((item) => item.title || item.type || "feedback").join(", ") || "-"}

## Possível causa
${bug.probable_cause || "Hipótese técnica ainda não definida. Investigar pelos arquivos prováveis e eventos relacionados."}

## Arquivos prováveis
${Array.isArray(bug.probable_files) ? bug.probable_files.join("\n") : (bug.probable_files || "-")}

## Prioridade
${priority}

## Instrução para Codex
Corrigir o problema mantendo compatibilidade, sem alterar regras fora do escopo, adicionando teste anti-regressão e documentando a correção.`;
  }

  function generateDiagnosticsSummaryReport(filters = {}, data = {}) {
    const bugs = data.bugs || [];
    const feedbacks = data.feedbacks || [];
    const events = data.events || [];
    const topBugs = bugs.slice().sort((a, b) => (Number(b.occurrence_count) || 0) - (Number(a.occurrence_count) || 0)).slice(0, 10);
    const critical = bugs.filter((bug) => bug.severity === "critical");
    const paymentEvents = events.filter((event) => /^payment_|^checkout_|^subscription_|^webhook_/.test(event.event_type || ""));
    const syncEvents = events.filter((event) => /sync/.test(event.event_type || ""));
    return {
      filters: sanitizeDiagnosticPayload(filters),
      topBugs,
      topFeedbacks: feedbacks.slice(0, 10),
      criticalBugs: critical,
      paymentEvents,
      syncEvents,
      priorityRecommendations: [
        critical.length ? "Corrigir bugs críticos primeiro." : "Sem bugs críticos no recorte.",
        paymentEvents.length ? "Revisar eventos de pagamento/webhook antes de expandir planos." : "Sem eventos de pagamento no recorte.",
        syncEvents.length ? "Auditar sincronização/offline." : "Sem falhas de sync no recorte."
      ]
    };
  }

  function getAiDiagnosticsFeatureFlags() {
    return { ...state.featureFlags };
  }

  function configure(options = {}) {
    state.getContext = options.getContext || state.getContext;
    state.send = options.send || state.send;
    setTimeout(() => flushPendingDiagnosticsQueue(), 1000);
  }

  const api = {
    configure,
    reportAppError,
    reportFeedback,
    reportDiagnosticEvent,
    generateErrorFingerprint,
    sanitizeDiagnosticPayload,
    flushPendingDiagnosticsQueue,
    generateCodexTechnicalReport,
    generateDiagnosticsSummaryReport,
    getAiDiagnosticsFeatureFlags,
    DIAGNOSTIC_EVENTS: Array.from(DIAGNOSTIC_EVENTS),
    PLAN_EVENTS: Array.from(PLAN_EVENTS),
    _normalizeFeedbackType: normalizeFeedbackType
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.DiagnosticsService = api;
    window.reportAppError = reportAppError;
    window.reportFeedback = reportFeedback;
    window.reportDiagnosticEvent = reportDiagnosticEvent;
    window.generateErrorFingerprint = generateErrorFingerprint;
    window.sanitizeDiagnosticPayload = sanitizeDiagnosticPayload;
    window.flushPendingDiagnosticsQueue = flushPendingDiagnosticsQueue;
    window.addEventListener("online", () => flushPendingDiagnosticsQueue());
    window.addEventListener("error", (event) => {
      reportAppError(event.error || event.message, {
        action: "window.onerror",
        metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno }
      }).catch(() => {});
    });
    window.addEventListener("unhandledrejection", (event) => {
      reportAppError(event.reason || "Unhandled promise rejection", {
        action: "window.onunhandledrejection"
      }).catch(() => {});
    });
  }
})();
