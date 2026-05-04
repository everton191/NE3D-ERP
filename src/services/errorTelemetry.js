(function () {
  "use strict";

  const QUEUE_KEY = "simplifica3d:errorTelemetryQueue";
  const THROTTLE_MS = 30 * 1000;
  const MAX_QUEUE = 100;
  const MAX_METADATA_KEYS = 40;
  const SENSITIVE_KEY_PATTERN = /senha|password|token|access[_-]?token|refresh[_-]?token|authorization|apikey|api[_-]?key|secret|card|cartao|cartão|key/i;

  const state = {
    configured: false,
    getContext: null,
    send: null,
    throttle: new Map(),
    flushing: false
  };

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function getQueue() {
    return safeJsonParse(localStorage.getItem(QUEUE_KEY) || "[]", []);
  }

  function setQueue(queue) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
    } catch (_) {}
  }

  function normalizeText(value, maxLength) {
    return String(value || "").slice(0, maxLength);
  }

  function sanitizeMetadata(value, depth = 0) {
    if (depth > 4) return "[truncated]";
    if (value == null) return null;
    if (typeof value === "string") return normalizeText(value, 900);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeMetadata(item, depth + 1));
    if (typeof value !== "object") return normalizeText(value, 240);

    const output = {};
    Object.keys(value).slice(0, MAX_METADATA_KEYS).forEach((key) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        output[key] = "[redacted]";
        return;
      }
      output[key] = sanitizeMetadata(value[key], depth + 1);
    });
    return output;
  }

  function normalizeError(error) {
    if (!error) return { message: "Erro sem detalhes", name: "Error" };
    if (error instanceof Error) {
      return {
        name: normalizeText(error.name || "Error", 80),
        message: normalizeText(error.message || "Erro inesperado", 900),
        stack: normalizeText(error.stack || "", 1200)
      };
    }
    if (typeof error === "object") {
      return {
        name: normalizeText(error.name || error.code || "Error", 80),
        message: normalizeText(error.message || JSON.stringify(sanitizeMetadata(error)), 900),
        code: normalizeText(error.code || "", 120)
      };
    }
    return { name: "Error", message: normalizeText(error, 900) };
  }

  function getDefaultContext() {
    const nav = typeof navigator !== "undefined" ? navigator : {};
    return {
      appVersion: "",
      deviceModel: nav.userAgentData?.platform || nav.platform || "",
      osVersion: nav.userAgent || "",
      platform: nav.userAgentData?.mobile ? "mobile-web" : "web",
      screenName: "",
      userEmail: ""
    };
  }

  function getContext() {
    const base = getDefaultContext();
    try {
      if (typeof state.getContext === "function") return { ...base, ...state.getContext() };
    } catch (_) {}
    return base;
  }

  function toPayload(input) {
    const context = getContext();
    const errorInfo = normalizeError(input?.error);
    const metadata = sanitizeMetadata({
      ...(input?.metadata || {}),
      error_name: errorInfo.name,
      error_code: errorInfo.code || "",
      error_stack: errorInfo.stack || ""
    });

    return {
      p_error_key: normalizeText(input?.errorKey || errorInfo.code || "APP_ERROR", 140),
      p_error_message: normalizeText(errorInfo.message, 900),
      p_screen_name: normalizeText(input?.screenName || context.screenName || "", 120),
      p_action_name: normalizeText(input?.actionName || "", 140),
      p_app_version: normalizeText(context.appVersion || "", 80),
      p_device_model: normalizeText(context.deviceModel || "", 160),
      p_os_version: normalizeText(context.osVersion || "", 160),
      p_platform: normalizeText(context.platform || "", 80),
      p_metadata: metadata || {},
      p_user_email: normalizeText(context.userEmail || "", 180)
    };
  }

  function throttleKey(payload) {
    return [
      payload.p_user_email || "anonymous",
      payload.p_error_key,
      payload.p_screen_name,
      payload.p_action_name,
      payload.p_app_version
    ].join("|");
  }

  function shouldThrottle(payload) {
    const key = throttleKey(payload);
    const now = Date.now();
    const last = Number(state.throttle.get(key)) || 0;
    if (now - last < THROTTLE_MS) return true;
    state.throttle.set(key, now);
    return false;
  }

  function enqueue(payload) {
    const queue = getQueue();
    queue.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      payload,
      createdAt: new Date().toISOString()
    });
    setQueue(queue);
  }

  async function sendPayload(payload) {
    if (typeof state.send === "function") return state.send(payload);
    if (typeof window.requisicaoSupabase === "function") {
      return window.requisicaoSupabase("/rest/v1/rpc/register_app_error", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    throw new Error("Telemetry sender unavailable");
  }

  async function logAppError(input) {
    try {
      if (window.appConfig?.telemetryEnabled === false) return false;
      const payload = toPayload(input || {});
      if (shouldThrottle(payload)) return false;

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        enqueue(payload);
        return false;
      }

      await sendPayload(payload);
      return true;
    } catch (error) {
      try {
        enqueue(toPayload(input || {}));
      } catch (_) {}
      if (typeof console !== "undefined") console.warn("[Telemetry] Falha ao registrar erro", error?.message || error);
      return false;
    }
  }

  async function flushPendingErrorLogs() {
    if (state.flushing) return false;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
    state.flushing = true;
    try {
      const queue = getQueue();
      if (!queue.length) return true;
      const pending = [];
      for (const item of queue) {
        try {
          await sendPayload(item.payload);
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

  function configure(options) {
    state.getContext = options?.getContext || state.getContext;
    state.send = options?.send || state.send;
    state.configured = true;
    setTimeout(() => flushPendingErrorLogs(), 1000);
  }

  window.ErrorTelemetry = {
    configure,
    logAppError,
    flushPendingErrorLogs,
    sanitizeMetadata,
    _toPayload: toPayload
  };

  window.addEventListener("online", () => flushPendingErrorLogs());
  window.addEventListener("error", (event) => {
    logAppError({
      errorKey: "WINDOW_ERROR",
      error: event.error || event.message,
      screenName: "",
      actionName: "window.error",
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    logAppError({
      errorKey: "UNHANDLED_REJECTION",
      error: event.reason || "Unhandled promise rejection",
      screenName: "",
      actionName: "window.unhandledrejection"
    });
  });
})();
