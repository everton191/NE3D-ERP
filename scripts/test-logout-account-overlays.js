"use strict";

// Frontend regression only: real profile renderers, overlay controller and logout
// run against an in-memory DOM. This does not certify remote session revocation.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("app.js");

function extractFunction(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const next = /\n(?:async )?function \w+\(/g;
  next.lastIndex = start;
  const end = next.exec(app);
  assert.ok(end, `${name} must have a following declaration`);
  return app.slice(start, end.index);
}

function storage(entries = []) {
  const data = new Map(entries);
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key)
  };
}

class Element {
  constructor(html = "") {
    this.innerHTML = html;
    this.children = [];
    this.style = {};
    this.dataset = {};
    const classes = new Set();
    this.classList = {
      add: (...values) => values.forEach((value) => classes.add(value)),
      remove: (...values) => values.forEach((value) => classes.delete(value)),
      contains: (value) => classes.has(value),
      toggle(value, enabled) { enabled ? classes.add(value) : classes.delete(value); }
    };
  }
  get outerHTML() { return this.innerHTML; }
  querySelector(selector) {
    // The rendered account card is retained so the real promotion helper and
    // controller receive the actual identity/plan markup, not canned content.
    if ([".modal-card", ".topbar-profile-menu"].includes(selector)
      && this.innerHTML.includes(selector.slice(1))) return new Element(this.innerHTML);
    return null;
  }
  cloneNode() { return new Element(this.innerHTML); }
  setAttribute() {}
  addEventListener() {}
  append(child) { child.parentElement = this; this.children.push(child); }
  closest() { return this.parentElement; }
  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
      this.parentElement = null;
    }
  }
}

function fixture(v3, withPopup = true) {
  const alice = { nome: "Conta A", email: "a@example.invalid", papel: "user", clientId: "company-a" };
  const bob = { nome: "Conta B", email: "b@example.invalid", papel: "user", clientId: "company-b" };
  const users = [alice, bob];
  const licenses = {
    "company-a": { slug: "pro", nome: "PRO", status: "active", descricao: "PRO ativo", expiresAt: "2099-12-01" },
    "company-b": { slug: "start", nome: "START", status: "active", descricao: "START ativo", expiresAt: "2099-11-01" }
  };
  const originalLicenses = JSON.stringify(licenses);
  const layers = { modal: "modal-layer", drawer: "drawer-layer", overlay: "overlay-layer" };
  const nodes = Object.fromEntries(Object.values(layers).map((id) => [id, new Element("Conteúdo de conta anterior")]));
  if (withPopup) nodes.popup = new Element();
  const portalRoot = new Element();
  const body = new Element();
  Object.values(nodes).forEach((node) => node.classList.add("is-active"));
  const listeners = new Set();
  const calls = [];
  const document = {
    body, activeElement: null,
    getElementById: (id) => nodes[id] || null,
    createElement: () => new Element(),
    querySelector: (selector) => v3 && selector.startsWith('[data-ui-version="v3"]') ? portalRoot : null,
    addEventListener: (event, listener) => { if (event === "keydown") listeners.add(listener); },
    removeEventListener: (event, listener) => { if (event === "keydown") listeners.delete(listener); }
  };
  const sessionStorage = storage([
    ["usuarioAtualEmail", alice.email], ["simplificaSuperadminAuthenticated", "true"],
    ["adminLogado", "sim"], ["sessionLastActivity", "fixture"]
  ]);
  const localStorage = storage([["session-cache", "previous session"], ["data-scope", alice.clientId], ["licenses", originalLicenses]]);
  let screen = "dashboard";
  let renderedUser = alice.email;
  const noop = () => {};
  const context = {
    document, sessionStorage, localStorage,
    window: { console: { info: noop }, __simplificaLocalLockActive: true, SimplificaAppBootstrap: { startAuthenticated: noop } },
    console, queueMicrotask: (task) => task(),
    addEventListener: noop, history: { pushState: noop }, location: { href: "http://127.0.0.1/fixture" },
    HTMLElement: Element,
    usuarioAtualEmail: alice.email, adminLogado: true, localLockModalOpen: true,
    accountSecurityState: { loaded: true, settings: { previousAccount: alice.email } },
    syncConfig: { supabaseUserId: "auth-a", supabaseEmail: alice.email },
    scopedDataCacheReady: true, LOCAL_SESSION_CACHE_KEY: "session-cache", ACTIVE_DATA_SCOPE_KEY: "data-scope",
    APP_LAYER_IDS: layers, sideDrawerOpen: true, sideDrawerProgress: 1, sideDrawerGesture: {},
    appConfig: { businessName: "Empresa de homologação", theme: "light" },
    ensureAppShellLayers: noop,
    getUsuarioAtual: () => users.find((user) => user.email === context.usuarioAtualEmail) || null,
    getPlanoAtual: (user = context.getUsuarioAtual()) => licenses[user?.clientId] || { slug: "free", nome: "Free" },
    getEscopoDadosAtual: () => context.getUsuarioAtual()?.clientId || "",
    salvarCacheDadosUsuario: (scope) => calls.push(["cache", scope]),
    pararRealtimeSyncUsuario: (reason) => calls.push(["realtime", reason]),
    desconectarRelayNotificacoesAndroid: async () => { calls.push(["relay"]); },
    limparSessaoSensivelSupabase: () => calls.push(["sensitive-session"]),
    limparDadosOperacionaisLocais: () => calls.push(["operational-data"]),
    limparCacheTemporarioContaAnterior: () => calls.push(["temporary-cache"]),
    registrarSeguranca: (...args) => calls.push(["security", ...args]),
    salvarDados: () => calls.push(["save"]),
    renderApp: () => { renderedUser = context.usuarioAtualEmail || "login"; },
    escaparHtml: String, renderUsuarioAvatar: () => "", renderUiIcon: () => "",
    classeStatusPlano: () => "active", getUserAccessRole: () => "user",
    isSimplificaMode: () => false, getThemePreferenceLabel: String,
    podeAcessarAdministracaoEmpresa: () => false, isSuperAdmin: () => false
  };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(read("src/ui-v3/overlays/controller.js"), context);
  vm.runInContext(read("src/features/account/account-profile-modals.js"), context);
  vm.runInContext(read("src/features/account/auth-commands.js"), context);
  const functions = ["getAppLayer", "setAppLayerContent", "syncAppShellLayerState", "closeModal", "closeDrawer", "hideOverlay", "promoverPopupParaDialogUiV3", "fecharPopup", "abrirMenuUsuarioTopo", "logoutUsuario", "concluirLoginUsuario"];
  vm.runInContext(functions.map(extractFunction).join("\n"), context);
  const incidental = () => Promise.resolve();
  const loginDeps = new Proxy({
    window: context.window, document, syncConfig: context.syncConfig, billingConfig: {}, sessionStorage,
    AuthService: { hydrateAuthenticatedUser: async (user) => user },
    usuarioEstaBloqueado: () => false, isSuperAdmin: () => false,
    registrarDispositivoLicenca: () => true, registrarSessaoSaasLocal: () => true,
    setUsuarioAtualEmail: (email) => { context.usuarioAtualEmail = email; },
    getUsuarioAtualEmail: () => context.usuarioAtualEmail,
    setAdminLogado: (value) => { context.adminLogado = value; },
    getSaasClients: () => [], getPlanoAtual: context.getPlanoAtual,
    deveMostrarOnboarding: () => false, temAcessoNuvem: () => false,
    getTelaAtual: () => screen, setTelaAtual: (value) => { screen = value; },
    renderApp: context.renderApp
  }, { get: (target, key) => key in target ? target[key] : incidental });
  context.getAuthCommandsDeps = () => loginDeps;

  function openProfile(kind) {
    if (kind === "topbar") return context.abrirMenuUsuarioTopo();
    context.window.SimplificaAccountProfileModals.abrirPerfilPremiumPainel(null, {
      ...context, windowRef: context.window, documentRef: document,
      PlanService: { getPolicy: () => ({ isPro: context.getPlanoAtual().slug === "pro" }) },
      getUsuariosContaAtiva: () => [context.getUsuarioAtual()]
    });
  }
  const visibleAccount = () => (nodes.popup?.innerHTML || "") + portalRoot.children.map((node) => node.innerHTML).join("");
  function assertClosed() {
    assert.equal(nodes.popup?.innerHTML || "", "", "legacy account popup must be removed at logout");
    assert.equal(portalRoot.children.length, 0, "UiV3 account portal must be removed at logout");
    assert.equal(portalRoot.classList.contains("ui3-overlay-open"), false);
    assert.equal(listeners.size, 0, "account keyboard listener must be removed");
    Object.values(layers).forEach((id) => {
      assert.equal(nodes[id].innerHTML, "", `${id} must not cover login`);
      assert.equal(nodes[id].classList.contains("is-active"), false);
    });
    ["app-modal-open", "app-drawer-open", "app-layer-open"].forEach((name) => assert.equal(body.classList.contains(name), false));
  }
  return { context, alice, bob, licenses, originalLicenses, localStorage, sessionStorage, calls, openProfile, visibleAccount, assertClosed, renderedUser: () => renderedUser };
}

async function run() {
  for (const v3 of [false, true]) {
    for (const kind of ["panel", "topbar"]) {
      const f = fixture(v3);
      f.openProfile(kind);
      assert.ok(f.visibleAccount().includes(f.alice.email), "actual account renderer must expose fixture A before logout");
      assert.ok(f.visibleAccount().includes("PRO"));
      f.context.logoutUsuario();
      f.assertClosed();
      assert.equal(f.renderedUser(), "login");
      assert.equal(f.context.usuarioAtualEmail, "");
      assert.equal(f.context.syncConfig.supabaseUserId, "");
      assert.equal(f.context.syncConfig.supabaseEmail, "");
      assert.equal(f.context.adminLogado, false);
      assert.equal(f.context.localLockModalOpen, false);
      assert.equal(f.context.accountSecurityState.loaded, false);
      ["usuarioAtualEmail", "simplificaSuperadminAuthenticated", "adminLogado", "sessionLastActivity"].forEach((key) => assert.equal(f.sessionStorage.getItem(key), null));
      ["session-cache", "data-scope"].forEach((key) => assert.equal(f.localStorage.getItem(key), null));
      assert.ok(f.calls.some(([name, value]) => name === "cache" && value === f.alice.clientId), "save the old scope before clearing identity");
      for (const expected of ["realtime", "relay", "sensitive-session", "operational-data", "temporary-cache", "save"]) {
        assert.ok(f.calls.some(([name]) => name === expected), `existing logout effect retained: ${expected}`);
      }
      assert.ok(f.calls.some(([name, action, , , email]) => name === "security" && action === "Logout" && email === f.alice.email));
      f.context.logoutUsuario(); // Repeated logout remains safe with no active overlay.
      f.assertClosed();
      f.context.syncConfig.supabaseUserId = "auth-b";
      await f.context.concluirLoginUsuario(f.bob);
      assert.equal(f.renderedUser(), f.bob.email, "real login completion must bind account B");
      f.openProfile(kind);
      assert.ok(f.visibleAccount().includes(f.bob.email));
      assert.ok(f.visibleAccount().includes("START"));
      assert.ok(!f.visibleAccount().includes(f.alice.email), "account A must not leak into account B's overlay");
      assert.equal(JSON.stringify(f.licenses), f.originalLicenses, "logout/login must not mutate either license");
      assert.equal(f.localStorage.getItem("licenses"), f.originalLicenses);
      f.context.logoutUsuario();
      f.assertClosed();
      console.log(`PASS logout/account switch: ${v3 ? "UiV3" : "legacy"} ${kind}`);
    }
  }
  const noPopup = fixture(false, false);
  noPopup.context.logoutUsuario();
  noPopup.assertClosed();
  console.log("PASS logout without popup; remote Auth revocation and physical Android remain separate integration gates.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
