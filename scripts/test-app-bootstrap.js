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
  let reject;
  const promise = new Promise((release, fail) => { resolve = release; reject = fail; });
  return { promise, resolve, reject };
}

function createStartupHarness(cachedUser, options = {}) {
  const calls = [];
  const timers = [];
  const renders = [];
  const diagnosticArguments = [];
  const oauth = deferred();
  const restore = deferred();
  let clock = 0;
  let nextTimerId = 0;
  let screen = "dashboard";
  let resizeTimer = null;
  const fault = new Error("startup-secret-fixture@example.invalid");
  const failIfRequested = (name) => {
    if (options.faultAt === name) throw fault;
  };
  const window = new FakeTarget();
  const document = new FakeTarget();
  document.documentElement = { dataset: {} };
  document.visibilityState = "hidden";
  const retryButton = new FakeTarget();
  retryButton.click = () => {
    const event = { preventDefault() {} };
    if (typeof retryButton.onclick === "function") retryButton.onclick(event);
    else {
      const retryMarkup = host.innerHTML.match(/<button\b[^>]*\bid="bootstrapRetryBtn"[^>]*>/i)?.[0] || "";
      const inlineAction = retryMarkup.match(/\bonclick="([^"]+)"/i)?.[1];
      if (inlineAction) vm.runInNewContext(inlineAction, { location: window.location, window });
    }
    retryButton.dispatch("click", event);
  };
  const classes = new Set(["app-modal-open", "app-drawer-open", "app-layer-open", "preserved-body-class"]);
  const layers = Object.fromEntries(["modal-layer", "drawer-layer", "overlay-layer", "toast-layer"]
    .map((id) => [id, { innerHTML: `private-${id}-fixture` }]));
  const introOverlay = { removed: false, remove() { this.removed = true; } };
  const host = {
    innerHTML: "",
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name))
    },
    querySelector: (selector) => selector === "#bootstrapRetryBtn" ? retryButton : null
  };
  document.body = options.host === "body" ? host : { classList: host.classList };
  document.getElementById = (id) => {
    if (id in layers) return layers[id];
    if (id === "introOverlay") return introOverlay.removed ? null : introOverlay;
    if (id === "bootstrapRetryBtn" && host.innerHTML.includes("bootstrapRetryBtn")) return retryButton;
    if (id === "app" && options.host !== "app-shell" && options.host !== "body") return host;
    if (id === "app-shell" && options.host === "app-shell") return host;
    return null;
  };
  document.querySelector = (selector) => selector === "#bootstrapRetryBtn" ? retryButton : null;
  window.document = document;
  window.screen = { orientation: new FakeTarget() };
  window.location = { reload: () => { calls.push("reload"); } };
  // An occluded WebView need not deliver animation frames. Startup must await
  // authentication/cache boundaries, never a timer or an animation frame.
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
  const track = (name) => () => { calls.push(name); failIfRequested(name); };
  const trackAsync = (name) => async () => { calls.push(name); failIfRequested(name); };
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
    sincronizarRelayNotificacoesAndroid: trackAsync("notification-relay"),
    getTelaAtual: () => screen,
    agendarRenderizacaoPreservandoScroll: track("render-preserving-scroll"),
    carregarNotificacoesMensagensRemotas: trackAsync("remote-messages"),
    sincronizarLicencaEfetivaSePossivel: trackAsync("license-sync"),
    sincronizarAlteracoesLocaisSilencioso: trackAsync("data-sync"),
    registrarDiagnostico: (...args) => {
      calls.push("diagnostic");
      diagnosticArguments.push(args);
      if (options.diagnosticThrows) throw new Error("diagnostic-fixture");
    },
    estaOnline: () => false,
    monitorPromocoes3dPrecisaAtualizar: () => false,
    carregarPromocoes3d: track("load-promotions"),
    atualizarIndicadorSincronizacao: track("sync-indicator"),
    atualizarStorefrontConnectionBadge: track("connection-badge"),
    mostrarToast: track("toast"),
    storefrontFlushPendingQueue: async () => { calls.push("flush-storefront"); return { pending: true }; },
    sincronizarLojaOnlineAdminRemoto: trackAsync("remote-storefront"),
    getStorefrontAutosaveDraft: () => true,
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
    processarRetornoOAuthSupabase: () => {
      calls.push("oauth");
      failIfRequested("oauth");
      if (!options.oauthAttemptsStarter) return oauth.promise;
      return oauth.promise.then((processed) => {
        calls.push(`oauth-start:${window.SimplificaAppBootstrap.startAuthenticated()}`);
        return processed;
      });
    },
    restaurarCacheSessaoLocal: () => { calls.push("restore-cache"); return restore.promise; },
    processarRotaSuperadminInicial: track("superadmin-route"),
    normalizarTelaInicialAndroid: track("android-route"),
    getUsuarioAtual: () => cachedUser,
    getAdminLogado: () => Boolean(options.cachedAdmin),
    setTelaAtual: (value) => { screen = value; },
    renderApp: () => {
      calls.push("render");
      const restoring = document.documentElement.dataset.simplificaBootstrap === "restoring";
      const step = window.__simplificaSessionCheckVisualState?.step;
      const phase = restoring ? (step === 1 ? "initial" : "timer") : "final";
      renders.push({ restoring, step, phase, clock });
      failIfRequested(`render-${phase}`);
      calls.push("render-complete");
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
    window, document, calls, timers, renders, diagnosticArguments, oauth, restore, startup, host, retryButton, fault,
    layers, introOverlay, classes,
    getScreen: () => screen,
    getClock: () => clock,
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

function testFailureBoundaryContract() {
  const harness = createStartupHarness(null);
  assert.equal(typeof harness.window.SimplificaAppBootstrap.renderFailure, "function",
    "bootstrap deve expor uma fronteira de falha independente do renderer autenticado");
  assert.equal(harness.window.SimplificaAppBootstrap.renderFailure(), false,
    "a fronteira de falha não deve interferir na abertura saudável");
  assert.equal(harness.window.SimplificaAppBootstrap.hasFailed(), false);
  assertHealthyLayers(harness);
}

function assertHealthyLayers(harness) {
  for (const [id, layer] of Object.entries(harness.layers)) {
    assert.equal(layer.innerHTML, `private-${id}-fixture`, `abertura saudável não pode apagar ${id}`);
  }
  assert.equal(harness.introOverlay.removed, false);
  for (const className of ["app-modal-open", "app-drawer-open", "app-layer-open", "preserved-body-class"]) {
    assert(harness.classes.has(className), `abertura saudável não pode remover ${className}`);
  }
}

function assertFailureLayers(harness, label) {
  for (const [id, layer] of Object.entries(harness.layers)) {
    assert.equal(layer.innerHTML, "", `camada antiga não pode cobrir a recuperação: ${id}/${label}`);
  }
  assert.equal(harness.introOverlay.removed, true, `intro antiga não pode cobrir a recuperação: ${label}`);
  for (const className of ["app-modal-open", "app-drawer-open", "app-layer-open"]) {
    assert(!harness.classes.has(className), `classe de camada obsoleta deve sair: ${className}/${label}`);
  }
  assert(harness.classes.has("preserved-body-class"), "limpeza visual não pode apagar classes não relacionadas");
}

async function testStartupFailure(options, identity) {
  const harness = createStartupHarness(identity.user, { ...options, cachedAdmin: identity.admin });
  const { window, document, calls } = harness;
  if (options.faultAt === "render-timer") harness.advanceTo(700);
  await harness.startup;
  await flushPromiseCallbacks();

  if (options.trigger === "oauth-reject") {
    assert(calls.includes("oauth"));
    harness.oauth.reject(harness.fault);
  } else if (options.trigger === "cache-reject" || options.trigger === "after-restore") {
    harness.oauth.resolve(false);
    await flushPromiseCallbacks();
    assert(calls.includes("restore-cache"));
    if (options.trigger === "cache-reject") harness.restore.reject(harness.fault);
    else harness.restore.resolve(Boolean(identity.user));
  }
  await flushPromiseCallbacks();

  const label = `${options.label || options.faultAt || "render"}/${identity.label}`;
  assert.equal(window.SimplificaAppBootstrap.hasFailed(), true, `falha fatal deve permanecer bloqueada: ${label}`);
  assert.equal(document.documentElement.dataset.simplificaBootstrap, "failed", label);
  assert.equal(window.__simplificaSessionCheckVisualState, undefined,
    `progresso obsoleto não pode continuar na falha: ${label}`);
  assert.match(harness.host.innerHTML, /Tentar novamente/i, `recuperação visível esperada: ${label}`);
  assert(!harness.host.innerHTML.includes(harness.fault.message), `erro interno não pode vazar no HTML: ${label}`);
  assert(!harness.host.innerHTML.includes("cached-fixture"), `identidade cacheada não pode aparecer na falha: ${label}`);
  assert(!JSON.stringify(harness.diagnosticArguments).includes(harness.fault.message),
    `diagnóstico não pode registrar mensagem arbitrária com dados de sessão: ${label}`);
  assertFailureLayers(harness, label);
  if (options.label === "render-final") {
    for (const task of ["auto-backup", "plan-monitor", "license-monitor", "free-backup-reminder", "promotions-monitor", "session-monitor", "check-data"]) {
      assert(!calls.includes(task), `render final inválido não pode ter iniciado ${task}: ${label}`);
    }
  }

  const beforeBlockedWork = calls.length;
  assert.equal(window.SimplificaAppBootstrap.renderFailure(), true);
  assert.equal(window.SimplificaAppBootstrap.renderFailure(), true);
  assert.equal(window.SimplificaAppBootstrap.startAuthenticated(), false,
    `falha não pode liberar tarefas com identidade antiga: ${label}`);
  window.dispatch("pagehide");
  window.dispatch("offline");
  window.dispatch("online");
  document.visibilityState = "visible";
  document.dispatch("visibilitychange");
  document.visibilityState = "hidden";
  document.dispatch("visibilitychange");
  harness.oauth.resolve(false);
  harness.restore.resolve(true);
  harness.advanceTo(10000);
  await flushPromiseCallbacks();
  assert.deepEqual(calls.slice(beforeBlockedWork), [],
    `eventos/retornos tardios não podem sincronizar nem sobrescrever caches após falha: ${label}`);
  assert.equal(document.documentElement.dataset.simplificaBootstrap, "failed");

  assert.equal(window.SimplificaAppBootstrap.start({}), false,
    `recuperação não pode registrar um segundo bootstrap por cima do primeiro: ${label}`);
  harness.retryButton.click();
  assert.deepEqual(calls.slice(beforeBlockedWork), ["reload"],
    `recuperação deve somente recarregar, sem mutar identidade/cache/licença: ${label}`);
}

async function testStartupFailureMatrix() {
  const identities = [
    { label: "sem-usuario", user: null, admin: false },
    { label: "usuario-cacheado", user: { id: "cached-fixture" }, admin: false },
    { label: "superadmin-cacheado", user: null, admin: true }
  ];
  const cases = [
    ...[
      "telemetry", "marketplace-oauth", "ads", "shell", "intro",
      "architecture-listeners", "drawer-gestures", "storefront-menus", "shortcuts",
      "viewport", "navigation", "gesture-guard", "legal-route", "subscription-return", "oauth",
      "update-monitor"
    ].map((faultAt) => ({ faultAt })),
    { label: "render-inicial", faultAt: "render-initial" },
    { label: "render-temporizador", faultAt: "render-timer" },
    { label: "oauth-rejeitado", trigger: "oauth-reject" },
    { label: "cache-rejeitado", trigger: "cache-reject" },
    { label: "rota-superadmin", faultAt: "superadmin-route", trigger: "after-restore" },
    { label: "rota-android", faultAt: "android-route", trigger: "after-restore" },
    { label: "render-final", faultAt: "render-final", trigger: "after-restore" },
    { label: "diagnostico-indisponivel", faultAt: "telemetry", diagnosticThrows: true },
    { label: "fallback-app-shell", faultAt: "telemetry", host: "app-shell" },
    { label: "fallback-body", faultAt: "telemetry", host: "body" }
  ];
  for (const identity of identities) {
    for (const options of cases) await testStartupFailure(options, identity);
  }
  console.log(`APP BOOTSTRAP: ${cases.length * identities.length} falhas controladas, caches preservados e recuperação somente por reload.`);
}

function assertAuthenticatedTasks(harness, cachedUser) {
  const { calls, window } = harness;
  const authenticatedTasks = ["auto-backup", "plan-monitor", "license-monitor", "free-backup-reminder", "promotions-monitor", "session-monitor", "recover-order"];
  for (const name of authenticatedTasks) {
    assert.equal(calls.filter((call) => call === name).length, cachedUser ? 1 : 0,
      `${name} deve iniciar somente com usuário restaurado`);
  }
  assert.equal(window.SimplificaAppBootstrap.startAuthenticated(), false,
    "tarefas autenticadas não devem duplicar nem iniciar sem usuário");
  assert.equal(harness.getScreen(), cachedUser ? "dashboard" : "admin");
  if (cachedUser) {
    assert(calls.indexOf("auto-backup") > calls.lastIndexOf("render-complete"),
      "primeiro backup deve ser iniciado somente depois do render final saudável");
  }
}

async function testImmediateStartupWithoutAnimationFrame(cachedUser) {
  const harness = createStartupHarness(cachedUser);
  const { window, document, calls, timers, renders } = harness;
  assert(calls.includes("architecture-listeners"),
    "inicializadores devem começar no relógio 0, sem a antiga espera obrigatória de 3 segundos");
  assert(calls.includes("oauth"), "a validação real deve começar imediatamente, sem esperar temporizador ou RAF");
  assert(!calls.includes("requestAnimationFrame"));
  assert.deepEqual(timers.map((timer) => timer.delay), [700, 1500, 2300],
    "só as etapas visuais não bloqueantes devem ficar agendadas antes da validação");
  await harness.startup;
  assert.equal(window.SimplificaAppBootstrap.startAuthenticated(), false);
  assert.equal(document.documentElement.dataset.simplificaBootstrap, "restoring");
  assert(!calls.includes("restore-cache"), "cache deve aguardar a classificação OAuth");

  harness.oauth.resolve(false);
  await flushPromiseCallbacks();
  assert(calls.includes("restore-cache"));
  assert.equal(window.SimplificaAppBootstrap.startAuthenticated(), false,
    "restauração rápida ainda pendente não pode antecipar tarefas autenticadas");
  assert(!calls.includes("auto-backup"));
  harness.restore.resolve(Boolean(cachedUser));
  await flushPromiseCallbacks();

  assert.equal(harness.getClock(), 0, "caminho pronto deve concluir sem avançar nenhum temporizador");
  assert(timers.every((timer) => !timer.executed));
  assert.equal(document.documentElement.dataset.simplificaBootstrap, undefined);
  assert.equal(window.__simplificaSessionCheckVisualState, undefined);
  assert.deepEqual(renders.map((render) => render.phase), ["initial", "final"],
    "sessão pronta não deve aguardar nem renderizar etapas artificiais de progresso");
  assert.equal(renders.at(-1).clock, 0);
  assertAuthenticatedTasks(harness, cachedUser);
  const renderCount = renders.length;
  harness.advanceTo(10000);
  await flushPromiseCallbacks();
  assert.equal(renders.length, renderCount, "temporizadores visuais tardios não podem sobrescrever a tela pronta");
  for (const name of ["architecture-listeners", "oauth", "restore-cache"]) {
    assert.equal(calls.filter((call) => call === name).length, 1,
      `${name} deve executar uma única vez na abertura rápida`);
  }
  assertAuthenticatedTasks(harness, cachedUser);
  assertHealthyLayers(harness);
}

async function testPendingAuthenticationWithoutAnimationFrame(cachedUser) {
  const harness = createStartupHarness(cachedUser);
  const { window, document, calls, timers, renders } = harness;
  assert.deepEqual(timers.map((timer) => timer.delay), [700, 1500, 2300],
    "temporizadores de progresso devem permanecer disponíveis apenas como feedback não bloqueante");
  await harness.startup;
  assert(calls.includes("architecture-listeners"));
  assert(calls.includes("oauth"));
  assert.equal(renders[0].step, 1);
  assert.equal(window.SimplificaAppBootstrap.startAuthenticated(), false,
    "identidade cacheada não pode iniciar tarefas antes da validação e do render saudáveis");
  harness.advanceTo(700);
  assert.equal(renders.at(-1).step, 2);
  harness.advanceTo(1500);
  assert.equal(renders.at(-1).step, 3);
  harness.advanceTo(2300);
  assert.equal(renders.at(-1).step, 4);
  harness.advanceTo(60000);
  await flushPromiseCallbacks();
  assert(!calls.includes("restore-cache"), "cache deve aguardar o retorno OAuth");
  assert.equal(document.documentElement.dataset.simplificaBootstrap, "restoring",
    "mesmo após todos os temporizadores, OAuth pendente deve manter o acesso bloqueado");
  assert(!calls.includes("auto-backup"), "tarefas autenticadas devem aguardar a restauração");
  assert.equal(window.SimplificaAppBootstrap.startAuthenticated(), false,
    "o starter público deve continuar bloqueado enquanto OAuth/cache não terminam");

  harness.oauth.resolve(false);
  await flushPromiseCallbacks();
  assert(calls.includes("restore-cache"));
  assert(!calls.includes("superadmin-route"));
  harness.advanceTo(120000);
  await flushPromiseCallbacks();
  assert.equal(document.documentElement.dataset.simplificaBootstrap, "restoring",
    "o temporizador visual não pode encerrar uma restauração ainda pendente");
  assert.equal(window.__simplificaSessionCheckVisualState.step, 4);
  assert(!calls.includes("auto-backup"));
  assert.equal(window.SimplificaAppBootstrap.startAuthenticated(), false,
    "cache ainda pendente não pode liberar o starter, mesmo após OAuth concluído");

  harness.restore.resolve(Boolean(cachedUser));
  await flushPromiseCallbacks();
  assert.equal(document.documentElement.dataset.simplificaBootstrap, undefined);
  assert.equal(window.__simplificaSessionCheckVisualState, undefined);
  assert.equal(renders.at(-1).restoring, false);
  assert(calls.indexOf("superadmin-route") > calls.indexOf("restore-cache"));
  assert(calls.indexOf("android-route") > calls.indexOf("restore-cache"));
  assert(!calls.includes("diagnostic"));
  assertAuthenticatedTasks(harness, cachedUser);
  assertHealthyLayers(harness);
}

async function testHandledOAuthRemainsHealthy(cachedUser) {
  const harness = createStartupHarness(cachedUser, { oauthAttemptsStarter: true });
  await harness.startup;
  harness.oauth.resolve(true);
  await flushPromiseCallbacks();
  assert(!harness.calls.includes("restore-cache"),
    "retorno OAuth já tratado não pode restaurar uma segunda identidade cacheada");
  assert.equal(harness.document.documentElement.dataset.simplificaBootstrap, undefined);
  assert.equal(harness.window.SimplificaAppBootstrap.hasFailed(), false);
  assert.equal(harness.window.SimplificaAppBootstrap.renderFailure(), false);
  assert.equal(harness.host.innerHTML, "");
  assert(!harness.calls.includes("diagnostic"));
  assert(harness.calls.includes("oauth-start:false"),
    "starter chamado pelo login OAuth deve aguardar o render final saudável");
  assert.equal(harness.calls.filter((call) => call === "auto-backup").length, cachedUser ? 1 : 0,
    "depois do render saudável, OAuth deve iniciar uma única vez as tarefas do usuário autenticado");
  if (cachedUser) {
    assert(harness.calls.indexOf("auto-backup") > harness.calls.lastIndexOf("render"));
    assert.equal(harness.window.SimplificaAppBootstrap.startAuthenticated(), false);
  }
  assertHealthyLayers(harness);
}

(async () => {
  testFailureBoundaryContract();
  await testImmediateStartupWithoutAnimationFrame(null);
  await testImmediateStartupWithoutAnimationFrame({ id: "cached-fixture" });
  await testPendingAuthenticationWithoutAnimationFrame(null);
  await testPendingAuthenticationWithoutAnimationFrame({ id: "cached-fixture" });
  await testHandledOAuthRemainsHealthy(null);
  await testHandledOAuthRemainsHealthy({ id: "oauth-fixture" });
  await testStartupFailureMatrix();
  for (const faultAt of ["auto-backup", "session-monitor"]) {
    await testStartupFailure({ faultAt, trigger: "after-restore" },
      { label: "usuario-cacheado", user: { id: "cached-fixture" }, admin: false });
  }
  console.log("APP BOOTSTRAP: 2 falhas de monitores controladas; camadas limpas apenas em falha; starter aguarda render saudável.");
  console.log("APP BOOTSTRAP: caminho pronto no relógio 0 sem RAF; OAuth/cache pendentes continuam bloqueados após 120 segundos simulados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
// HERMES_PHASE0_TEST 

// HERMES_PHASE0_WRITE_TEST_1790210360 — MARKER ONLY

// HERMES_PHASE0_WRITE_TEST_1790210373
