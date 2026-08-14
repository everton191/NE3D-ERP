"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const harness = fs.readFileSync(path.join(root, "scripts/android-ai-order-disposable-harness.js"), "utf8");

const sandboxGuard = 'window.__simplificaOrderValidationSandbox === true || localStorage.getItem("simplifica_order_validation_sandbox") === "1"';
assert.ok((app.match(new RegExp(sandboxGuard.replaceAll(".", "\\."), "g")) || []).length >= 6,
  "o sandbox deve bloquear pedido e todos os caminhos de sincronização remota");
for (const operation of [
  "sincronizarFilaOfflinePendente",
  "processarMudancaRealtimeSupabase",
  "baixarAtualizacoesSupabaseSilencioso",
  "executarPollingSyncTempoReal",
  "salvarBackupSupabase"
]) {
  const start = app.indexOf(`function ${operation}`);
  assert.ok(start >= 0, `${operation} deve existir`);
  assert.ok(app.slice(start, start + 700).includes(sandboxGuard), `${operation} deve abortar no sandbox`);
}
assert.ok(app.includes('window.__simplificaOrderFaultInjection === "BEFORE_LOCAL_PERSIST"'));
assert.ok(app.includes('window.__simplificaOrderFaultInjection === "AFTER_LOCAL_PERSIST"'));
assert.ok(harness.includes('validateForeground()'), "o harness deve validar o pacote em foreground");
assert.ok(harness.includes('WebView não corresponde ao Simplifica 3D esperado'), "o harness deve validar a WebView correta");
assert.ok(!/adb\([^\n]*(?:input|tap|swipe|text)/i.test(harness), "o harness não pode usar injeção genérica ADB de entrada");
assert.ok(harness.includes('pendingSync: JSON.parse(JSON.stringify(pendingSync))'), "a fila de sync deve entrar no snapshot");
assert.ok(harness.includes('localStorage.setItem("simplifica_order_validation_sandbox", "1")'), "o sandbox deve sobreviver ao reinício do processo");
assert.ok(harness.includes('localStorage.removeItem("simplifica_order_validation_sandbox")'), "a marca persistente deve ser removida ao final");
assert.ok(harness.includes('BEFORE_LOCAL_PERSIST') && harness.includes('AFTER_LOCAL_PERSIST'), "os dois limites da persistência devem receber fault injection");
assert.ok(app.includes('allowedCapabilities: ["ORDER.CREATE"]'), "somente ORDER.CREATE deve entrar no gate de escrita da IA");
assert.ok(app.includes('Somente você pode autorizar'), "o chat deve exigir confirmação humana explícita");

console.log("Contrato do sandbox descartável e fault injection validado.");
