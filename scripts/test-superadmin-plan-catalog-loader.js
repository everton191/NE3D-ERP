"use strict";

const assert = require("node:assert/strict");
const adminCommands = require("../src/features/saas/saas-admin-commands.js");

function fixture(options = {}) {
  let state = { status: "idle", data: null };
  const calls = [];
  const toasts = [];
  const deps = {
    isSuperAdmin: () => options.authorized !== false,
    syncConfig: options.session === false ? {} : { supabaseAccessToken: "synthetic-session", supabaseUrl: "http://127.0.0.1" },
    JSON, Date, String,
    getSuperAdminPlanCatalogRemoteState: () => state,
    setSuperAdminPlanCatalogRemoteState: (next) => { state = next; },
    renderApp() {},
    mostrarToast: (message, kind) => toasts.push({ message, kind }),
    ErrorService: { toAppError: () => ({ userMessage: "Falha controlada no catálogo" }) },
    registrarDiagnostico() {}, registrarErroAplicacaoSilencioso() {},
    requisicaoSupabase: async (url, request) => {
      calls.push({ url, request });
      if (options.reject) throw new Error("rede indisponível");
      return { plans: [{ slug: "free" }, { slug: "start" }, { slug: "pro" }] };
    }
  };
  return { deps, calls, toasts, state: () => state };
}

async function main() {
  const ok = fixture();
  const data = await adminCommands.carregarCatalogoPlanosSuperadminRemoto({ feedback: false }, ok.deps);
  assert.equal(ok.calls.length, 1, "o módulo deve usar as dependências passadas pelo app");
  assert.equal(ok.calls[0].url, "/rest/v1/rpc/get_superadmin_plan_catalog");
  assert.equal(ok.calls[0].request.method, "POST");
  assert.equal(ok.calls[0].request.body, "{}");
  assert.equal(ok.state().status, "success");
  assert.deepEqual(ok.state().data, data);
  assert.equal(ok.toasts.length, 0, "feedback=false não deve exibir sucesso extra");
  for (const options of [{ authorized: false }, { session: false }]) {
    const t = fixture(options);
    assert.equal(await adminCommands.carregarCatalogoPlanosSuperadminRemoto({}, t.deps), null);
    assert.equal(t.calls.length, 0, "sem autorização/sessão não deve consultar RPC");
    if (options.session === false) assert.equal(t.state().status, "missing-token");
  }
  const failed = fixture({ reject: true });
  assert.equal(await adminCommands.carregarCatalogoPlanosSuperadminRemoto({}, failed.deps), null);
  assert.equal(failed.state().status, "error");
  assert.equal(failed.state().data, null);
  assert.ok(failed.toasts.some((item) => item.kind === "erro"));
  assert.ok(!failed.toasts.some((item) => item.kind === "sucesso"));
  console.log("PASS superadmin catalog loader: injected dependencies, authenticated RPC boundary, missing session/authority and failure without false success.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
