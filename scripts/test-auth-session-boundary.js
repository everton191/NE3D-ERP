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
  const publicDeps = new Proxy({
    window,
    document: {
      documentElement: { dataset: { simplificaBootstrap: "ready" } },
      getElementById: () => ({ querySelector: () => null }),
      querySelector: () => null,
      body: { classList: { add: noop } }
    },
    getUsuarioAtual: () => null, getAdminLogado: () => false,
    getTelaAtual: () => "admin", isTelaPublica: () => false,
    ensureAppShellLayers: noop, setTelaAtual: noop, aplicarPersonalizacao: noop, applyViewportModeClasses: noop,
    renderAuthPublica: (options) => {
      sessionCheck = options?.verificacaoSessao;
      return sessionCheck ? "session-check" : "login-form";
    },
    atualizarArvoreInterface: (_, html) => { authMarkup = html; }
  }, { get(target, key) { if (key in target) return target[key]; throw new Error(`PRE_AUTH accessed private dependency: ${String(key)}`); } });
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.equal(authMarkup, "login-form");
  assert.equal(sessionCheck, undefined);
  // The current bootstrap exposes a public session-check shell while restoring.
  // Its DOM marker must not cause PRE_AUTH to touch authenticated dependencies.
  publicDeps.document.documentElement.dataset.simplificaBootstrap = "restoring";
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.equal(authMarkup, "session-check");
  assert.equal(sessionCheck.title, "Fazendo login");
  window.__simplificaLocalLockActive = true;
  window.SimplificaAppUiRenderers.renderApp(publicDeps);
  assert.equal(authMarkup, "session-check");
  assert.equal(sessionCheck.biometric, true);
  assert.equal(sessionCheck.title, "Confirme sua identidade");
  console.log("Auth boundary: profile awaited; PRE_AUTH, restoration and biometric shells stay isolated; stage logs contain no user data.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
