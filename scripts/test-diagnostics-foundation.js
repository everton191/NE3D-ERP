const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const diagnostics = require("../src/services/diagnosticsService.js");

async function run() {
  const serviceFile = "src/services/diagnosticsService.js";
  const migrationFile = "supabase/migrations/20260529162000_diagnostics_bugs_feedback_codex.sql";
  const hardeningMigrationFile = "supabase/migrations/20260529173500_diagnostics_validation_hardening.sql";
  const app = read("app.js");
  const service = read(serviceFile);
  const index = read("index.html");
  const sw = read("sw.js");
  const migration = read(migrationFile);
  const hardeningMigration = read(hardeningMigrationFile);

  assert(exists(serviceFile), "DiagnosticsService deve existir");
  assert(index.includes("/src/services/diagnosticsService.js"), "index.html deve carregar DiagnosticsService antes do app");
  assert(index.indexOf("/src/services/diagnosticsService.js") < index.indexOf("/app.js"), "DiagnosticsService deve carregar antes do app.js");
  assert(sw.includes("./src/services/diagnosticsService.js"), "PWA deve precachear DiagnosticsService");

  [
    "app_error_logs",
    "app_error_log_users",
    "app_feedback_reports",
    "app_diagnostic_events",
    "app_bug_clusters",
    "app_bug_reports_exports",
    "app_ai_analysis_runs",
    "app_ai_knowledge_base"
  ].forEach((table) => {
    assert(migration.includes(`public.${table}`), `migration deve preparar ${table}`);
    assert(new RegExp(`alter table public\\.${table} enable row level security`, "i").test(migration), `${table} deve ativar RLS`);
  });

  assert(!/using\s*\(\s*true\s*\)/i.test(migration), "migration nova nao pode criar policy using true");
  assert(!/with check\s*\(\s*true\s*\)/i.test(migration), "migration nova nao pode criar policy with check true");
  assert(migration.includes("public.erp_is_superadmin()"), "policies devem respeitar superadmin");
  assert(migration.includes("auth.uid() is null or user_id is null or user_id = auth.uid()"), "insert de usuario comum deve ser isolado por user_id");
  assert(hardeningMigration.includes("refresh_app_bug_cluster_from_error"), "fase 6B deve atualizar clusters por trigger");
  assert(hardeningMigration.includes("app_bug_clusters"), "fase 6B deve manter clusters sincronizados");
  assert(hardeningMigration.includes("affected_versions"), "cluster deve registrar versoes afetadas");
  assert(hardeningMigration.includes("affected_screens"), "cluster deve registrar telas afetadas");
  assert(hardeningMigration.includes("affected_platforms"), "cluster deve registrar plataformas afetadas");

  const sanitized = diagnostics.sanitizeDiagnosticPayload({
    access_token: "secret",
    refreshToken: "secret",
    password: "secret",
    authorization: "Bearer secret",
    card: "4111",
    nested: { cpf: "123", ok: "visivel" }
  });
  assert.equal(sanitized.access_token, "[redacted]");
  assert.equal(sanitized.refreshToken, "[redacted]");
  assert.equal(sanitized.password, "[redacted]");
  assert.equal(sanitized.authorization, "[redacted]");
  assert.equal(sanitized.card, "[redacted]");
  assert.equal(sanitized.nested.cpf, "[redacted]");
  assert.equal(sanitized.nested.ok, "visivel");

  const fp1 = diagnostics.generateErrorFingerprint(new Error("Pedido 123 falhou"), {
    screen: "pedido",
    action: "salvar",
    appVersion: "1.0.16"
  });
  const fp2 = diagnostics.generateErrorFingerprint(new Error("Pedido 999 falhou"), {
    screen: "pedido",
    action: "salvar",
    appVersion: "1.0.16"
  });
  assert.equal(fp1, fp2, "fingerprint deve normalizar numeros e deduplicar erros similares");

  const sent = [];
  diagnostics.configure({
    getContext: () => ({
      userId: "00000000-0000-0000-0000-000000000001",
      screen: "dashboard",
      action: "teste",
      appVersion: "1.0.16",
      platform: "web"
    }),
    send: async (kind, payload) => {
      sent.push({ kind, payload });
      return { ok: true };
    }
  });

  const errorResult = await diagnostics.reportAppError(new Error("Falha controlada"), { action: "unit" });
  assert.equal(errorResult.ok, true, "erro deve ser enviado pelo service configurado");
  assert.equal(sent[0].kind, "error", "erro deve usar canal error");

  const feedbackResult = await diagnostics.reportFeedback({
    type: "suggestion",
    title: "Melhorar tela",
    message: "Mensagem de teste",
    metadata: { password: "nao salvar" }
  });
  assert.equal(feedbackResult.ok, true, "feedback deve ser enviado");
  assert.equal(sent[1].kind, "feedback", "feedback deve usar canal feedback");
  assert.equal(sent[1].payload.metadata.password, "[redacted]", "feedback deve sanitizar payload");

  const eventResult = await diagnostics.reportDiagnosticEvent("checkout_abandoned", { metadata: { webhook_secret: "nao" } });
  assert.equal(eventResult.ok, true, "evento de plano deve ser aceito");
  assert.equal(sent[2].kind, "event", "evento deve usar canal event");
  assert.equal(sent[2].payload.metadata_json.webhook_secret, "[redacted]", "evento deve sanitizar segredo");

  [
    "sync_failed",
    "store_editor_failed",
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
    "webhook_plan_resolution_failed",
    "pwa_cache_error"
  ].forEach((eventType) => assert(diagnostics.DIAGNOSTIC_EVENTS.includes(eventType), `evento diagnostico aceito: ${eventType}`));

  const localStorageMemory = new Map();
  Object.defineProperty(global, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => localStorageMemory.has(key) ? localStorageMemory.get(key) : null,
      setItem: (key, value) => localStorageMemory.set(key, String(value)),
      removeItem: (key) => localStorageMemory.delete(key)
    }
  });
  Object.defineProperty(global, "navigator", { configurable: true, value: { onLine: false } });
  diagnostics.configure({
    getContext: () => ({
      userId: "00000000-0000-0000-0000-000000000001",
      screen: "offline",
      action: "fila",
      appVersion: "1.0.16",
      platform: "web"
    }),
    send: async () => {
      throw new Error("offline");
    }
  });
  const offlineResult = await diagnostics.reportDiagnosticEvent("sync_failed", { action: "offline-test" });
  assert.equal(offlineResult.queued, true, "offline deve colocar diagnostico em fila local");
  Object.defineProperty(global, "navigator", { configurable: true, value: { onLine: true } });
  const flushed = [];
  diagnostics.configure({
    send: async (kind, payload) => {
      flushed.push({ kind, payload });
      return { ok: true };
    }
  });
  const flushResult = await diagnostics.flushPendingDiagnosticsQueue();
  assert.equal(flushResult, true, "fila offline deve ser processada ao voltar online");
  assert.equal(flushed.length, 1, "fila offline deve reenviar um item");
  assert.equal(flushed[0].kind, "event", "fila deve preservar tipo do diagnostico");

  const codexReport = diagnostics.generateCodexTechnicalReport({
    bug: {
      title: "Erro no editor",
      occurrence_count: 3,
      affected_users_count: 2,
      severity: "high",
      screen: "lojaAdmin",
      action: "salvar",
      app_version: "1.0.16",
      platform: "web"
    }
  });
  [
    "# Relatório técnico para correção",
    "## Resumo",
    "## Frequência",
    "## Evidências",
    "Stack sanitizada",
    "## Arquivos prováveis",
    "## Instrução para Codex"
  ].forEach((marker) => assert(codexReport.includes(marker), `relatorio Codex deve conter ${marker}`));

  const summary = diagnostics.generateDiagnosticsSummaryReport({}, {
    bugs: [{ occurrence_count: 2, severity: "critical" }],
    feedbacks: [{ title: "Sugestao" }],
    events: [{ event_type: "payment_failed" }, { event_type: "sync_failed" }]
  });
  assert.equal(summary.criticalBugs.length, 1, "relatorio semanal deve destacar bugs criticos");
  assert.equal(summary.paymentEvents.length, 1, "relatorio semanal deve destacar pagamentos");
  assert.equal(summary.syncEvents.length, 1, "relatorio semanal deve destacar sync");

  const flags = diagnostics.getAiDiagnosticsFeatureFlags();
  assert.equal(flags.enableAiDiagnostics, false, "IA diagnostica deve nascer desligada");
  assert.equal(flags.enableAiAssistant, false, "assistente IA deve nascer desligado");
  assert.equal(flags.enableAiBugSummary, false, "resumo IA de bugs deve nascer desligado");
  assert(!/\bfetch\s*\(/.test(read(serviceFile)), "DiagnosticsService nao deve chamar fetch direto");
  assert(!/sk-[A-Za-z0-9_-]{20,}/.test(read(serviceFile) + migration), "diagnosticos nao devem conter chave de API");

  [
    "reportAppError",
    "reportFeedback",
    "reportDiagnosticEvent",
    "generateErrorFingerprint",
    "sanitizeDiagnosticPayload",
    "flushPendingDiagnosticsQueue"
  ].forEach((marker) => assert(service.includes(marker), `DiagnosticsService deve expor ${marker}`));
  [
    "window.DiagnosticsService.configure",
    "app_bug_reports_exports?select=*",
    "atualizarSeveridadeRelatorioAutomatico",
    "atualizarNotaAdminBug",
    "atualizarNotaAdminFeedback",
    "atualizarStatusClusterDiagnostico",
    "atualizarSeveridadeClusterDiagnostico",
    "atualizarNotaAdminCluster",
    "renderSuperAdminDiagnosticos",
    "gerarRelatorioCodexDiagnostico",
    "Sistema e status"
  ].forEach((marker) => assert(app.includes(marker), `app deve integrar ${marker}`));

  assert(app.includes("Obrigado! Seu relato foi enviado e será analisado."), "feedback deve mostrar mensagem final amigavel");

  console.log("Diagnostics foundation tests OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
