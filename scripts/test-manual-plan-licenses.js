const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const billing = require("../src/features/account/billing-commands.js");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const licenseSql = fs.readFileSync(path.join(root, "supabase/migrations/20261011151202_normalize_manual_plan_licenses.sql"), "utf8");
const presentationSql = fs.readFileSync(path.join(root, "supabase/migrations/20261011151604_superadmin_plan_presentation_persistence.sql"), "utf8");

function fixture(chosen, license, options = {}) {
  const events = { calls: [], toasts: [], audits: [], diagnostics: [], reloads: 0, applications: [] };
  const deps = {
    isSuperAdmin: () => options.authorized !== false,
    getClienteSaasPorId: () => ({ id: "client-test", email: "test@example.invalid", activePlan: "free" }),
    getAssinaturaSaas: () => ({ activePlan: "free" }),
    getPlanoSaas: (slug) => ({ slug, name: slug.toUpperCase() }),
    solicitarPlanoSuperadmin: async () => chosen,
    normalizarSlugPlano: (slug) => String(slug).toLowerCase(),
    solicitarEntradaTexto: async () => options.date ?? "2099-12-31",
    solicitarConfirmacaoAcao: async () => true,
    mostrarToast: (message, kind) => { events.toasts.push({ message, kind }); return { remove() {} }; },
    chamarSuperadminUpdateSubscription: async (id, action, payload) => {
      events.calls.push({ id, action, payload });
      if (options.reject) throw new Error(options.reject);
      return typeof license === "function" ? license(payload) : license;
    },
    carregarSaasSupabaseSilencioso: async () => { events.reloads++; },
    aplicarLicencaEfetivaClienteSaas: (...args) => events.applications.push(args),
    registrarAuditoria: (...args) => events.audits.push(args),
    registrarDiagnostico: (...args) => events.diagnostics.push(args),
    renderApp() {},
    alert(message) { throw new Error(message); }
  };
  return { deps, events };
}

async function main() {
  for (const plan of ["start", "pro"]) {
    const { deps, events } = fixture(plan, (payload) => ({
      active_plan: plan, effective_status: "ACTIVE", premium_until: payload.premiumUntil
    }));
    await billing.alterarPlanoClienteSaas("client-test", deps);
    assert.equal(events.calls.length, 1, `${plan}: deve chamar RPC uma vez`);
    assert.equal(events.calls[0].action, "SET_PLAN_MANUAL");
    assert.equal(events.calls[0].payload.planCode, plan.toUpperCase());
    assert.ok(Date.parse(events.calls[0].payload.premiumUntil) > Date.now());
    assert.equal(events.reloads, 1);
    assert.equal(events.applications.length, 1);
    assert.ok(events.toasts.some((item) => item.kind === "sucesso"));
  }

  {
    const { deps, events } = fixture("free", { active_plan: "free", effective_status: "FREE" });
    deps.solicitarEntradaTexto = () => { throw new Error("Free não deve pedir validade"); };
    await billing.alterarPlanoClienteSaas("client-test", deps);
    assert.equal(events.calls[0].action, "SET_FREE");
    assert.equal(events.calls[0].payload.premiumUntil, null);
  }

  for (const options of [{ date: "2020-01-01" }, { authorized: false }]) {
    const { deps, events } = fixture("pro", { active_plan: "pro", effective_status: "ACTIVE" }, options);
    await billing.alterarPlanoClienteSaas("client-test", deps);
    assert.equal(events.calls.length, 0, "sem permissão ou validade futura não pode gravar");
  }

  for (const [license, options] of [
    [{ active_plan: "free", effective_status: "FREE" }, {}],
    [null, { reject: "permissão negada" }]
  ]) {
    const { deps, events } = fixture("pro", license, options);
    await billing.alterarPlanoClienteSaas("client-test", deps);
    assert.equal(events.audits.length, 0, "falha não deve registrar alteração concluída");
    assert.ok(!events.toasts.some((item) => item.kind === "sucesso"));
    assert.ok(events.toasts.some((item) => item.kind === "erro"));
  }

  assert.ok(licenseSql.includes("public.erp_is_superadmin()"));
  assert.ok(licenseSql.includes("'previous_plan'") && licenseSql.includes("'new_plan'"));
  assert.ok(licenseSql.includes("'previous_until'") && licenseSql.includes("'new_until'"));
  assert.ok(licenseSql.includes("p_until is null or p_until <= now()"));
  assert.ok(licenseSql.includes("s.mercado_pago_subscription_id"), "contratos do provedor devem ser protegidos");
  assert.ok(licenseSql.includes("'manual_plan_expired'"), "concessão vencida deve ser rebaixada e auditada");
  assert.ok(licenseSql.includes("and s.manual_override is true"), "rebaixamento automático não pode afetar pagamento comum");
  assert.ok(licenseSql.includes("'UNBLOCK'"), "desbloqueio deve reconhecer Start e Pro");
  assert.ok(!licenseSql.includes("plan_code = 'PREMIUM'"), "nova escrita não pode conceder PREMIUM");
  assert.ok(presentationSql.includes("public.erp_is_superadmin()"));
  assert.ok(presentationSql.includes("p.metadata->'presentation'"));
  assert.ok(!presentationSql.includes("set price ="), "edição visual não pode alterar cobrança");
  assert.ok(app.includes("carregarApresentacaoPlanosRemota"));
  assert.ok(app.includes("superadmin_update_plan_presentation"));
  assert.ok(!app.includes("simplificaPlanPresentationOverrides"), "cache visual antigo não deve ser fonte ativa");
  assert.ok(!app.includes("Simplifica@123"), "fluxo legado de senha fixa deve estar desativado");
  assert.ok(app.includes('activePlanEfetivo === "pro"'), "Start não pode virar Premium no espelho da licença");
  assert.ok(app.includes("Não foi possível confirmar a validade no Supabase"), "dias extras não devem usar validade local sem confirmação");
  console.log("Manual plan license and presentation tests OK (frontend + static SQL contracts)");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
