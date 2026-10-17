"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

async function run() {
  const stages = [];
  const window = { console: { info: (s) => stages.push(s), error: (s) => stages.push(s) } };
  vm.runInNewContext(read("src/features/account/auth-commands.js"), { window });
  const auth = window.SimplificaAuthCommands;
  let releaseProfile;
  let navigated = false;
  let currentUser = "";
  const user = { email: "fixture@example.invalid", papel: "superadmin" };
  const deps = new Proxy({
    window: { SimplificaAppBootstrap: { startAuthenticated() {} } },
    syncConfig: { supabaseUserId: "fixture" }, billingConfig: {},
    AuthService: { hydrateAuthenticatedUser: () => new Promise((resolve) => { releaseProfile = () => resolve(user); }) },
    usuarioEstaBloqueado: () => false,
    isSuperAdmin: () => true,
    registrarSessaoSaasLocal: () => true,
    sessionStorage: { setItem() {}, removeItem() {} },
    setUsuarioAtualEmail: (value) => { currentUser = value; },
    getUsuarioAtualEmail: () => currentUser,
    getSaasClients: () => [], getPlanoAtual: () => ({}),
    getTelaAtual: () => "admin", setTelaAtual: () => { navigated = true; },
    document: { getElementById: () => null },
    renderApp: () => { assert.equal(currentUser, user.email); }
  }, { get: (target, key) => key in target ? target[key] : () => Promise.resolve() });
  const login = auth.concluirLoginUsuario(user, deps);
  assert.equal(navigated, false, "navigation must wait for profile preparation");
  assert.equal(currentUser, "", "application session must not be committed while preparing");
  releaseProfile();
  await login;
  assert.equal(navigated, true);
  assert(stages.findIndex((s) => s.endsWith("PROFILE_READY")) < stages.findIndex((s) => s.endsWith("SESSION_READY")));
  assert(!stages.join(" ").includes(user.email), "stage instrumentation must not log user data");

  vm.runInNewContext(read("src/features/app-ui/app-ui-renderers.js"), { window });
  const noop = () => {};
  let authMarkup = "";
  let sessionCheck;
  const renderHistory = [];
  let rejectIdentityReads = false;
  const cachedIdentity = { email: "cached-fixture@example.invalid", ativo: true, papel: "user" };
  const publicDeps = new Proxy({
    window,
    document: {
      documentElement: { dataset: { simplificaBootstrap: "ready" } },
      getElementById: () => ({ querySelector: () => null }),
      querySelector: () => null,
      body: { classList: { add: noop } }
    },
    getUsuarioAtual: () => rejectIdentityReads ? cachedIdentity : null, getAdminLogado: () => false,
    getTelaAtual: () => "admin", isTelaPublica: () => false,
    ensureAppShellLayers: noop, setTelaAtual: noop, aplicarPersonalizacao: noop, applyViewportModeClasses: noop,
    renderAuthPublica: (options) => {
      sessionCheck = options?.verificacaoSessao;
      return sessionCheck ? "session-check" : "login-form";
    },
    atualizarArvoreInterface: (_, html) => { authMarkup = html; renderHistory.push(html); }
  }, { get(target, key) {
    if (rejectIdentityReads && ["getUsuarioAtual", "getAdminLogado", "getTelaAtual", "isTelaPublica"].includes(key)) {
      throw new Error(`silent restoration accessed cached identity/private navigation: ${String(key)}`);
    }
    if (key in target) return target[key];
    throw new Error(`PRE_AUTH accessed private dependency: ${String(key)}`);
  } });
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.equal(authMarkup, "login-form");
  assert.equal(sessionCheck, undefined);
  // Quiet restoration must not flash either authentication or private content.
  // Even a cached identity cannot be read until restoration has completed.
  publicDeps.document.documentElement.dataset.simplificaBootstrap = "restoring";
  renderHistory.length = 0;
  authMarkup = "unchanged-startup";
  rejectIdentityReads = true;
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.deepEqual(renderHistory, [], "quiet restoration must have no authentication/private render, including repeated renders with cached identity");
  assert.equal(authMarkup, "unchanged-startup", "quiet restoration must leave startup content unchanged");
  assert.equal(window.__simplificaSessionCheckVisualState, undefined, "renderer cannot manufacture progress to reveal the session-check window");
  // A slow/required check explicitly revealed by bootstrap may render only the
  // public check shell; cached identity and private navigation remain blocked.
  window.__simplificaSessionCheckVisualState = { title: "Verificando sessão", message: "Aguarde", progress: 42, step: 2 };
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.equal(authMarkup, "session-check");
  assert.equal(sessionCheck.title, "Verificando sessão");
  assert.equal(sessionCheck.progress, 42);
  assert.equal(sessionCheck.step, 2);
  delete window.__simplificaSessionCheckVisualState;
  window.__simplificaLocalLockActive = true;
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.equal(authMarkup, "session-check");
  assert.equal(sessionCheck.biometric, true);
  assert.equal(sessionCheck.title, "Confirme sua identidade");
  window.__simplificaLocalLockActive = false;
  for (const bootstrapState of ["restoring", "ready"]) {
    publicDeps.document.documentElement.dataset.simplificaBootstrap = bootstrapState;
    for (const stage of ["SESSION_PREPARING", "PROFILE_READY"]) {
      window.SimplificaAuthCommands.traceLogin(stage);
      window.SimplificaAppUiRenderers.renderApp(publicDeps);
      assert.equal(authMarkup, "session-check", `${bootstrapState}/${stage} must show the required login check even without visual state`);
      assert.equal(sessionCheck.title, "Fazendo login");
      assert.equal(sessionCheck.biometric, false);
    }
  }
  window.SimplificaAuthCommands.traceLogin("SESSION_READY");
  rejectIdentityReads = false;
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.equal(authMarkup, "login-form", "completed restoration without an authenticated user must still show login");
  assert.equal(sessionCheck, undefined);
  // A failed bootstrap must not enter the normal shell, even with a stale
  // identity or another broken initializer. Recovery is owned by bootstrap.
  publicDeps.document.documentElement.dataset.simplificaBootstrap = "failed";
  window.SimplificaAppBootstrap = {
    renderFailure() { authMarkup = "startup-failed"; return true; }
  };
  publicDeps.ensureAppShellLayers = () => { throw new Error("failed startup cannot initialize the private shell"); };
  publicDeps.getUsuarioAtual = () => { throw new Error("failed startup cannot resolve cached identity"); };
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.equal(authMarkup, "startup-failed");

  const getterSource = read("app.js").match(/^function getUsuarioSessaoReal\(\) \{[\s\S]*?^\}/m)?.[0];
  assert(getterSource, "canonical session getter must exist");
  const stored = new Map([["simplificaSuperadminAuthenticated", "true"]]);
  let failed = true;
  const cachedUser = { email: "cached-fixture@example.invalid", ativo: true, papel: "user" };
  const getterContext = {
    window: { SimplificaAppBootstrap: { hasFailed: () => failed } },
    usuarioAtualEmail: cachedUser.email,
    usuarios: [cachedUser],
    normalizarEmail: (value) => String(value || "").toLowerCase(),
    normalizarUsuarios: (value) => value,
    sessionStorage: { getItem: (key) => stored.get(key) }
  };
  vm.runInNewContext(getterSource, getterContext);
  assert.equal(getterContext.getUsuarioSessaoReal(), null, "failed startup must mask cached user and superadmin identity");
  assert.equal(getterContext.usuarioAtualEmail, cachedUser.email, "do not erase persisted/active identity during failure recovery");
  assert.equal(stored.get("simplificaSuperadminAuthenticated"), "true", "do not mutate session storage during failure recovery");
  failed = false;
  assert.equal(getterContext.getUsuarioSessaoReal().papel, "superadmin", "healthy startup must retain the existing identity rules");
  stored.delete("simplificaSuperadminAuthenticated");
  assert.equal(getterContext.getUsuarioSessaoReal().papel, "user");
  console.log("Auth boundary: profile awaited; quiet restoration renders nothing, required login/biometric checks and failed startup stay isolated; stage logs contain no user data.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
