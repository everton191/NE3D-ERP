"use strict";
// Runtime contract only: all network and destructive effects are stubs.
const assert = require("node:assert/strict");
const api = require("../src/features/saas/saas-admin-commands.js");
const id = "00000000-0000-4000-8000-000000000001";
function fixture(authorized = true) {
  const calls = [], removed = [];
  const deps = {
    JSON, Date, String, Number, Object, Array, Promise, encodeURIComponent,
    podeSalvarAdminSupabaseRemoto: () => authorized,
    isSuperAdmin: () => authorized,
    requisicaoSupabase: async (url, request) => {
      calls.push({ url, request, body: request.body ? JSON.parse(request.body) : null });
      if (url.includes("/plans?")) return [{ id, slug: "pro" }];
      return { ok: true, auth_verified_absent: true, remaining: { users: 0 } };
    },
    registrarDiagnostico() {}, getPlanoSaas: () => ({ id: "pro" }), pareceUuid: (value) => value === id,
    setSaasPlans() {}, getSaasPlans: () => [], mesclarListaPorId: (old, next) => next,
    normalizarPlanoSaas: (row) => row, salvarDados() {},
    getClienteSaasPorId: () => ({ id, isTestUser: true, email: "synthetic@example.invalid" }),
    contarResumoExclusaoClienteTesteLocal: () => ({}), textoResumoExclusaoClienteTeste: () => "Synthetic only",
    solicitarEntradaTexto: async () => "EXCLUIR TESTE", mostrarToast: () => ({ remove() {} }),
    removerDadosLocaisUsuarioTesteSaas: (target) => { removed.push(target); return {}; },
    registrarAuditoria() {}, renderApp() {}, alert: () => { throw new Error("Unexpected alert"); }
  };
  return { deps, calls, removed };
}
const cases = [
  ["atualizarClienteSaasSupabaseParcial", [id, { name: "Synthetic" }], 1],
  ["atualizarStatusPerfisClienteSupabase", [id, "blocked"], 2],
  ["atualizarDadosPerfisClienteSupabase", [id, { name: "Synthetic", phone: "" }], 2],
  ["atualizarFlagTesteClienteSaasSupabase", [id, true], 3],
  ["atualizarAnonimizacaoClienteSaasSupabase", [id, "synthetic-anon@example.invalid"], 3],
  ["obterPlanIdSupabase", ["pro"], 1],
  ["excluirUsuarioTesteSaas", [id], 1]
];
async function main() {
  for (const [name, args, writes] of cases) {
    const denied = fixture(false);
    await api[name](...args, denied.deps);
    assert.equal(denied.calls.length, 0, `${name}: missing authority/session must not call network`);
    assert.equal(denied.removed.length, 0);
    const allowed = fixture();
    const result = await api[name](...args, allowed.deps);
    assert.equal(allowed.calls.length, writes, `${name}: must use supplied dependencies`);
    if (name === "obterPlanIdSupabase") assert.equal(result, id);
    else if (name === "excluirUsuarioTesteSaas") {
      assert.deepEqual(allowed.removed, [id]);
      assert.equal(allowed.calls[0].url, "/rest/v1/rpc/delete_test_user_client");
      assert.equal(allowed.calls[0].body.p_confirmation, "EXCLUIR TESTE");
    } else {
      assert.equal(result.ok, true);
      assert(allowed.calls.every((call) => call.request.method === "PATCH"));
      assert(allowed.calls.every((call) => call.body.updated_at));
    }
  }
  for (const result of [{ ok: false }, { ok: true, auth_verified_absent: false },
    { ok: true, auth_verified_absent: true, remaining: { users: 1 } }]) {
    const t = fixture();
    t.deps.requisicaoSupabase = async () => result;
    await api.excluirUsuarioTesteSaas(id, t.deps);
    assert.equal(t.removed.length, 0, "no local cleanup without confirmed complete remote result");
  }
  const canceled = fixture();
  canceled.deps.solicitarEntradaTexto = async () => null;
  await api.excluirUsuarioTesteSaas(id, canceled.deps);
  assert.equal(canceled.calls.length, 0);
  console.log("PASS SaaS admin dependency bindings: seven real commands; authority/session guards, payload boundary and confirmed cleanup. Network/deletion are stubs; no actual writes.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
