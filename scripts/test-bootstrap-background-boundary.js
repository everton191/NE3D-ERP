"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const functions = [
  "temAcessoNuvem", "obterIntervaloAutoBackupMs", "iniciarAutoBackup", "executarAutoBackup",
  "registrarAtividadeSessao", "agendarAtualizacaoPromocoes3d", "iniciarMonitorPromocoes3d",
  "iniciarMonitorPlanoSaas"
].map((name) => {
  const match = source.match(new RegExp(`^(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, "m"));
  assert(match, `canonical function must exist: ${name}`);
  return match[0];
}).join("\n\n");

function createHarness({ failed = false, online = true, target = "supabase" } = {}) {
  let blocked = failed;
  let nextTimer = 0;
  const calls = [];
  const timers = [];
  const stored = new Map([
    ["synthetic-session-cache", "preserved-fixture"],
    ["sessionLastActivity", "1700000000000"]
  ]);
  const context = {
    window: { SimplificaAppBootstrap: { hasFailed: () => blocked } },
    getUsuarioAtual: () => blocked ? null : { id: "synthetic-fixture" },
    usuarioAtualEmail: "fixture@example.invalid",
    adminLogado: true,
    syncConfig: {
      supabaseAccessToken: "synthetic-not-a-token",
      autoBackupEnabled: true,
      autoBackupTarget: target,
      autoBackupInterval: 30,
      autoBackupLastRun: "",
      lastActivityAt: ""
    },
    billingConfig: { licenseEmail: "fixture@example.invalid", clientId: "synthetic-client" },
    autoBackupTimer: null,
    autoBackupRodando: false,
    promotions3dRefreshTimer: null,
    sessionWarned: true,
    PROMOTIONS_3D_REFRESH_MS: 300000,
    ENABLE_GOOGLE_DRIVE_BACKUP: true,
    telaAtual: "dashboard",
    estaOnline: () => online,
    sessionStorage: {
      getItem: (key) => stored.get(key) || null,
      setItem: (key, value) => { calls.push("storage-write"); stored.set(key, value); },
      removeItem: (key) => { calls.push("storage-remove"); stored.delete(key); }
    },
    salvarDados: () => { calls.push("save-data"); stored.set("saved-state", "modified"); },
    registrarAtividadeUsuarioAtual: () => { calls.push("remote-session-activity"); },
    sincronizarSupabaseSilencioso: async () => { calls.push("sync-supabase"); },
    sincronizarUrlSilencioso: async () => { calls.push("sync-url"); },
    sincronizarGoogleDriveSilencioso: async () => { calls.push("sync-drive"); },
    registrarHistorico: () => { calls.push("history"); },
    agendarRenderizacaoPreservandoScroll: () => { calls.push("render"); },
    carregarMonitorPromocoes3d: () => { calls.push("load-promotion-monitor"); },
    atualizarIndicadoresMenuPromocoes3d: () => { calls.push("promotion-menu"); },
    carregarPromocoes3d: () => { calls.push("promotion-fetch"); },
    verificarVencimentoPlanoLocal: () => { calls.push("plan-expiry"); },
    fetch: () => { throw new Error("No network is allowed in this test"); }
  };
  const schedule = (kind) => (callback, delay) => {
    const timer = { id: ++nextTimer, kind, callback, delay, cancelled: false };
    timers.push(timer);
    return timer.id;
  };
  const cancel = (id) => {
    const timer = timers.find((entry) => entry.id === id);
    if (timer) timer.cancelled = true;
  };
  context.setTimeout = schedule("timeout");
  context.setInterval = schedule("interval");
  context.clearTimeout = cancel;
  context.clearInterval = cancel;
  vm.createContext(context);
  vm.runInContext(functions, context);
  const snapshot = () => JSON.stringify({
    stored: [...stored],
    syncConfig: context.syncConfig,
    sessionWarned: context.sessionWarned,
    autoBackupRodando: context.autoBackupRodando,
    autoBackupTimer: context.autoBackupTimer,
    promotions3dRefreshTimer: context.promotions3dRefreshTimer,
    timerCount: timers.length
  });
  return {
    context, calls, timers, stored, snapshot,
    fail: () => { blocked = true; },
    fire: async (timer) => { assert(!timer.cancelled); await timer.callback(); }
  };
}

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("retained token does not authorize auto-backup after startup failure", async () => {
  const h = createHarness({ failed: true });
  assert.equal(h.context.getUsuarioAtual(), null);
  assert.equal(h.context.temAcessoNuvem(), true,
    "fixture must exercise the real legacy token/license fallback, not a mocked cloud gate");
  const before = h.snapshot();
  await h.context.executarAutoBackup();
  assert.deepEqual(h.calls, [], "failed startup must block remote backup even with retained credentials");
  assert.equal(h.snapshot(), before, "failed startup must preserve all local fixture state");
});

test("auto-backup initialization is inert after startup failure", () => {
  const h = createHarness({ failed: true });
  const before = h.snapshot();
  h.context.iniciarAutoBackup();
  assert.deepEqual(h.calls, []);
  assert.equal(h.snapshot(), before, "failed startup must not schedule backup or persist state");
});

for (const target of ["supabase", "url", "drive", "unconfigured"]) {
  for (const forced of [false, true]) {
    test(`failed startup blocks ${target} backup, forced=${forced}`, async () => {
      const h = createHarness({ failed: true, target });
      const before = h.snapshot();
      await h.context.executarAutoBackup(forced);
      assert.deepEqual(h.calls, []);
      assert.equal(h.snapshot(), before);
    });
  }
}

test("backup timeout and interval scheduled before failure remain inert afterwards", async () => {
  const h = createHarness();
  h.context.iniciarAutoBackup();
  assert.deepEqual(h.timers.map((timer) => [timer.kind, timer.delay]), [
    ["interval", 1800000], ["timeout", 10000]
  ]);
  h.fail();
  const before = h.snapshot();
  for (const timer of [...h.timers]) await h.fire(timer);
  assert.deepEqual(h.calls, [], "already scheduled callbacks must not synchronize or render after failure");
  assert.equal(h.snapshot(), before);
});

test("healthy scheduled backup keeps the normal single execution", async () => {
  const h = createHarness();
  h.context.iniciarAutoBackup();
  const timeout = h.timers.find((timer) => timer.kind === "timeout");
  assert(timeout);
  await h.fire(timeout);
  assert.deepEqual(h.calls, ["sync-supabase", "render"]);
  assert.equal(h.context.autoBackupRodando, false);
});

test("failed startup preserves session activity storage and prevents remote activity", () => {
  const h = createHarness({ failed: true });
  const before = h.snapshot();
  h.context.registrarAtividadeSessao();
  assert.deepEqual(h.calls, []);
  assert.equal(h.snapshot(), before);
});

test("healthy session activity retains ordinary persistence", () => {
  const h = createHarness();
  h.context.registrarAtividadeSessao();
  assert.deepEqual(h.calls, ["storage-write", "remote-session-activity"]);
  assert.equal(h.context.sessionWarned, false);
  assert.notEqual(h.stored.get("sessionLastActivity"), "1700000000000");
});

for (const online of [true, false]) {
  test(`promotion monitor scheduled before failure does not fetch or reschedule, online=${online}`, async () => {
    const h = createHarness({ online });
    h.context.iniciarMonitorPromocoes3d();
    assert.deepEqual(h.calls, ["load-promotion-monitor", "promotion-menu"]);
    h.calls.length = 0;
    h.fail();
    const before = h.snapshot();
    await h.fire(h.timers[0]);
    assert.deepEqual(h.calls, []);
    assert.equal(h.snapshot(), before);
  });

  test(`promotion refresh scheduled before failure does not fetch or reschedule, online=${online}`, async () => {
    const h = createHarness({ online });
    h.context.agendarAtualizacaoPromocoes3d();
    h.fail();
    const before = h.snapshot();
    await h.fire(h.timers[0]);
    assert.deepEqual(h.calls, []);
    assert.equal(h.snapshot(), before);
  });
}

test("healthy promotion refresh keeps the existing fetch", async () => {
  const h = createHarness();
  h.context.agendarAtualizacaoPromocoes3d();
  await h.fire(h.timers[0]);
  assert.deepEqual(h.calls, ["promotion-fetch"]);
});

test("plan monitor scheduled before failure cannot mutate licenses afterwards", async () => {
  const h = createHarness();
  h.context.iniciarMonitorPlanoSaas();
  assert.deepEqual(h.calls, ["plan-expiry"]);
  h.calls.length = 0;
  h.fail();
  const before = h.snapshot();
  await h.fire(h.timers[0]);
  assert.deepEqual(h.calls, []);
  assert.equal(h.snapshot(), before);
});

test("healthy plan monitor retains its ordinary expiry checks", async () => {
  const h = createHarness();
  h.context.iniciarMonitorPlanoSaas();
  await h.fire(h.timers[0]);
  assert.deepEqual(h.calls, ["plan-expiry", "plan-expiry"]);
});

(async () => {
  const failures = [];
  for (const { name, run } of tests) {
    try { await run(); }
    catch (error) { failures.push(name); console.error(`FAIL: ${name}: ${error.message.split("\n")[0]}`); }
  }
  console.log(`BOOTSTRAP BACKGROUND BOUNDARY: ${tests.length - failures.length}/${tests.length} PASS; canonical functions, synthetic state, no network.`);
  if (failures.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
