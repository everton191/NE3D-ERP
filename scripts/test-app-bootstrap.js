"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class FakeTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    const registered = this.listeners.get(type) || [];
    registered.push(listener);
    this.listeners.set(type, registered);
  }
  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) listener(event);
  }
  count(type) { return (this.listeners.get(type) || []).length; }
}

const windowRef = new FakeTarget();
const documentRef = new FakeTarget();
documentRef.visibilityState = "visible";
documentRef.title = "Simplifica";
windowRef.document = documentRef;
windowRef.screen = { orientation: new FakeTarget() };
windowRef.setTimeout = (fn) => { fn(); return 1; };
windowRef.clearTimeout = () => {};
windowRef.UiV3Dev = null;

const source = fs.readFileSync(path.join(__dirname, "..", "src", "app", "bootstrap.js"), "utf8");
vm.runInNewContext(source, { window: windowRef });

let persisted = 0;
let diagnostics = 0;
const noop = () => {};
const context = new Proxy({
  document: documentRef,
  clearTimeout: noop,
  setTimeout: windowRef.setTimeout,
  getResizeTimer: () => null,
  setResizeTimer: noop,
  getTelaAtual: () => "dashboard",
  setTelaAtual: noop,
  getAdminLogado: () => false,
  getUsuarioAtual: () => ({ id: "test" }),
  getSyncConfig: () => ({}),
  getStorefrontAutosaveDraft: () => false,
  getStorefrontSessionRecoveryState: () => ({}),
  estaOnline: () => true,
  monitorPromocoes3dPrecisaAtualizar: () => false,
  salvarDados: () => { persisted += 1; },
  registrarDiagnostico: () => { diagnostics += 1; },
  processarRetornoOAuthSupabase: async () => true,
  sincronizarRelayNotificacoesAndroid: async () => {},
  carregarNotificacoesMensagensRemotas: async () => {},
  sincronizarLicencaEfetivaSePossivel: async () => {},
  sincronizarAlteracoesLocaisSilencioso: async () => {},
  storefrontFlushPendingQueue: async () => ({ pending: true })
}, { get(target, property) { return property in target ? target[property] : noop; } });

assert.equal(windowRef.SimplificaAppBootstrap.start(context), true, "bootstrap deve iniciar uma vez");
assert.equal(windowRef.SimplificaAppBootstrap.start(context), false, "bootstrap não pode registrar listeners duplicados");
for (const event of ["resize", "orientationchange", "pagehide", "online", "offline", "error", "unhandledrejection"]) {
  assert.equal(windowRef.count(event), 1, `listener global único esperado: ${event}`);
}
for (const event of ["visibilitychange", "DOMContentLoaded"]) {
  assert.equal(documentRef.count(event), 1, `listener de documento único esperado: ${event}`);
}
windowRef.dispatch("pagehide");
assert.equal(persisted, 1, "pagehide deve preservar dados locais");
windowRef.dispatch("error", { message: "erro", filename: "x.js", lineno: 1, colno: 2 });
windowRef.dispatch("unhandledrejection", { reason: new Error("rejeitada") });
assert.equal(diagnostics, 2, "erros globais devem continuar registrados");
console.log("APP BOOTSTRAP: inicialização única e listeners globais preservados.");

function deferred() {
  let resolve;
  const promise = new Promise((release) => { resolve = release; });
  return { promise, resolve };
}

function createStartupHarness(cachedUser) {
  const calls = [];
  const timers = [];
  const renders = [];
  const oauth = deferred();
  const restore = deferred();
  let clock = 0;
  let nextTimerId = 0;
  let screen = "dashboard";
  let resizeTimer = null;
  const window = new FakeTarget();
  const document = new FakeTarget();
  document.documentElement = { dataset: {} };
  document.visibilityState = "hidden";
  window.document = document;
  window.screen = { orientation: new FakeTarget() };
  // An occluded WebView need not deliver animation frames. Startup must still
  // run its timer, then await the normal authentication/cache boundaries.
  window.requestAnimationFrame = () => { calls.push("requestAnimationFrame"); return 1; };
  window.setTimeout = (fn, delay) => {
    const timer = { id: ++nextTimerId, fn, delay, due: clock + delay };
    timers.push(timer);
    return timer.id;
  };
  window.clearTimeout = (id) => {
    const timer = timers.find((item) => item.id === id);
    if (timer) timer.cancelled = true;
  };
  const track = (name) => () => { calls.push(name); };
  // Keep dependencies explicit: a new startup call must not be hidden by a
  // catch-all Proxy returning a no-op for missing production dependencies.
  const context = {
    document,
    clearTimeout: window.clearTimeout,
    setTimeout: window.setTimeout,
    getResizeTimer: () => resizeTimer,
    setResizeTimer: (value) => { resizeTimer = value; },
    sincronizarModoInterfaceComViewport: track("viewport-sync"),
    agendarAtualizacaoViewportOperacionalMobile: track("viewport-update"),
    storefrontFlushAutosaveNow: track("storefront-autosave"),
    salvarRascunhoPedidoRapidoLocal: track("save-order-draft"),
    salvarCacheSessaoLocal: track("save-session-cache"),
    salvarDados: track("save-data"),
    sincronizarRelayNotificacoesAndroid: async () => {},
    getTelaAtual: () => screen,
    agendarRenderizacaoPreservandoScroll: track("render-preserving-scroll"),
    carregarNotificacoesMensagensRemotas: async () => {},
    sincronizarLicencaEfetivaSePossivel: async () => {},
    sincronizarAlteracoesLocaisSilencioso: async () => {},
    registrarDiagnostico: track("diagnostic"),
    estaOnline: () => false,
    monitorPromocoes3dPrecisaAtualizar: () => false,
    carregarPromocoes3d: track("load-promotions"),
    atualizarIndicadorSincronizacao: track("sync-indicator"),
    atualizarStorefrontConnectionBadge: track("connection-badge"),
    mostrarToast: track("toast"),
    storefrontFlushPendingQueue: async () => ({ pending: true }),
    sincronizarLojaOnlineAdminRemoto: async () => {},
    getStorefrontAutosaveDraft: () => false,
    storefrontQueuePendingAction: track("queue-storefront"),
    getStorefrontSessionRecoveryState: () => ({}),
    recomporFilaSyncPendente: track("rebuild-sync-queue"),
    getSyncConfig: () => ({}),
    processarRetornoOAuthMercadoLivre: track("marketplace-oauth"),
    configurarTelemetriaErros: track("telemetry"),
    configurarMonetizacaoAds: track("ads"),
    ensureAppShellLayers: track("shell"),
    iniciarIntroAbertura: track("intro"),
    configurarEventListenersArquitetura: track("architecture-listeners"),
    configurarGestosDrawerLateral: track("drawer-gestures"),
    configurarMenusContextuaisProdutosLoja: track("storefront-menus"),
    configurarAtalhosOperacionais: track("shortcuts"),
    configurarViewportOperacionalMobile: track("viewport"),
    configurarNavegacaoInternaApp: track("navigation"),
    configurarProtecaoGestosMobile: track("gesture-guard"),
    processarRotaPublicaLegal: track("legal-route"),
    processarParametrosAssinaturaUrl: track("subscription-return"),
    processarRetornoOAuthSupabase: () => { calls.push("oauth"); return oauth.promise; },
    restaurarCacheSessaoLocal: () => { calls.push("restore-cache"); return restore.promise; },
    processarRotaSuperadminInicial: track("superadmin-route"),
    normalizarTelaInicialAndroid: track("android-route"),
    getUsuarioAtual: () => cachedUser,
    getAdminLogado: () => false,
    setTelaAtual: (value) => { screen = value; },
    renderApp: () => {
      renders.push({
        restoring: document.documentElement.dataset.simplificaBootstrap === "restoring",
        step: window.__simplificaSessionCheckVisualState?.step
      });
    },
    recuperarPedidoRapidoAposReabertura: track("recover-order"),
    iniciarAutoBackup: track("auto-backup"),
    iniciarMonitorAtualizacao: track("update-monitor"),
    iniciarMonitorPlanoSaas: track("plan-monitor"),
    iniciarMonitorLicencaOnline: track("license-monitor"),
    iniciarLembreteBackupPlanoFree: track("free-backup-reminder"),
    iniciarMonitorPromocoes3d: track("promotions-monitor"),
    verificarBancosDadosAoEntrar: track("check-data"),
    monitorarSessao: track("session-monitor"),
    moverJanelaDashboard: track("move-dashboard"),
    moverCalculadora: track("move-calculator"),
    verificarDuploToqueForaCalculadora: track("calculator-double-tap"),
    finalizarJanelaDashboard: track("finish-dashboard"),
    finalizarCalculadora: track("finish-calculator")
  };
  vm.runInNewContext(source, { window });
  assert.equal(window.SimplificaAppBootstrap.start(context), true);
  assert.equal(window.SimplificaAppBootstrap.start(context), false);
  assert.equal(document.count("DOMContentLoaded"), 1, "startup deve permanecer registrado uma única vez");
  const startup = document.listeners.get("DOMContentLoaded")[0]();
  return {
    window, document, calls, timers, renders, oauth, restore, startup,
    getScreen: () => screen,
    advanceTo(time) {
      assert(time >= clock);
      while (true) {
        const next = timers.filter((timer) => !timer.cancelled && !timer.executed && timer.due <= time)
          .sort((left, right) => left.due - right.due || left.id - right.id)[0];
        if (!next) break;
        clock = next.due;
        next.executed = true;
        next.fn();
      }
      clock = time;
    }
  };
}

async function flushPromiseCallbacks() {
  for (let turn = 0; turn < 8; turn += 1) await Promise.resolve();
}

async function testStartupWithoutAnimationFrame(cachedUser) {
  const harness = createStartupHarness(cachedUser);
  const { window, document, calls, timers, renders } = harness;
  assert.deepEqual(timers.map((timer) => timer.delay), [700, 1500, 2300, 3000],
    "o temporizador de 3 segundos deve existir mesmo quando requestAnimationFrame nunca responde");
  assert.equal(renders[0].step, 1);
  harness.advanceTo(700);
  assert.equal(renders.at(-1).step, 2);
  harness.advanceTo(1500);
  assert.equal(renders.at(-1).step, 3);
  harness.advanceTo(2300);
  assert.equal(renders.at(-1).step, 4);
  harness.advanceTo(2999);
  await flushPromiseCallbacks();
  assert(!calls.includes("oauth"), "verificação deve manter a duração de 3 segundos");
  assert(!calls.includes("architecture-listeners"));

  harness.advanceTo(3000);
  await harness.startup;
  assert(calls.includes("architecture-listeners"), "startup deve continuar sem um quadro de animação");
  assert(calls.includes("oauth"));
  assert(!calls.includes("restore-cache"), "cache deve aguardar o retorno OAuth");
  assert.equal(document.documentElement.dataset.simplificaBootstrap, "restoring");
  assert(!calls.includes("auto-backup"), "tarefas autenticadas devem aguardar a restauração");

  harness.oauth.resolve(false);
  await flushPromiseCallbacks();
  assert(calls.includes("restore-cache"));
  assert(!calls.includes("superadmin-route"));
  assert.equal(document.documentElement.dataset.simplificaBootstrap, "restoring",
    "o temporizador visual não pode encerrar uma restauração ainda pendente");
  assert.equal(window.__simplificaSessionCheckVisualState.step, 4);
  assert(!calls.includes("auto-backup"));

  harness.restore.resolve(Boolean(cachedUser));
  await flushPromiseCallbacks();
  assert.equal(document.documentElement.dataset.simplificaBootstrap, undefined);
  assert.equal(window.__simplificaSessionCheckVisualState, undefined);
  assert.equal(renders.at(-1).restoring, false);
  assert(calls.indexOf("superadmin-route") > calls.indexOf("restore-cache"));
  assert(calls.indexOf("android-route") > calls.indexOf("restore-cache"));
  assert(!calls.includes("diagnostic"));
  const authenticatedTasks = ["auto-backup", "plan-monitor", "license-monitor", "free-backup-reminder", "promotions-monitor", "session-monitor", "recover-order"];
  for (const name of authenticatedTasks) {
    assert.equal(calls.filter((call) => call === name).length, cachedUser ? 1 : 0,
      `${name} deve iniciar somente com usuário restaurado`);
  }
  assert.equal(window.SimplificaAppBootstrap.startAuthenticated(), false,
    "tarefas autenticadas não devem duplicar nem iniciar sem usuário");
  assert.equal(harness.getScreen(), cachedUser ? "dashboard" : "admin");
}

(async () => {
  await testStartupWithoutAnimationFrame(null);
  await testStartupWithoutAnimationFrame({ id: "cached-fixture" });
  console.log("APP BOOTSTRAP: 3 segundos sem RAF, OAuth/cache aguardados e tarefas autenticadas protegidas.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
// HERMES_PHASE0_TEST 

// HERMES_PHASE0_WRITE_TEST_1790210360 — MARKER ONLY

// HERMES_PHASE0_WRITE_TEST_1790210373
