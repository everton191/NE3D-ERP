const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");
const { getTarget, createFixtures, runWithCleanup } = require("./supabase-homolog-test-utils");
const { target, url, anonKey, serviceKey } = getTarget(process.argv[2]);
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const service = createClient(url, serviceKey, options);
const runId = crypto.randomBytes(6).toString("hex");
const fixtures = createFixtures(service, runId);
const password = crypto.randomBytes(24).toString("base64url");
const must = (result, label) => { if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data; };
async function register(label) {
  const email = `s3d-payment-${runId}-${label}@example.invalid`;
  const created = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: { name: label, business_name: `Empresa ${label} ${runId}` } }), "Auth sintetico");
  fixtures.user(created.user);
  const client = fixtures.session(createClient(url, anonKey, options));
  must(await client.auth.signInWithPassword({ email, password }), "login");
  const profile = must(await service.from("profiles").select("client_id").eq("user_id", created.user.id).single(), "perfil");
  return { id: created.user.id, clientId: profile.client_id, client };
}
async function snapshot(user) {
  return {
    client: must(await service.from("clients").select("*").eq("id", user.clientId).single(), "cliente"),
    subscription: must(await service.from("subscriptions").select("*").eq("client_id", user.clientId).single(), "assinatura")
  };
}
function payment(user, extra = {}) {
  return { client_id: user.clientId, user_id: user.id, amount: 59.9, plan_price: 59.9,
    status: "pending", plan_slug: "pro", mercado_pago_payment_id: `synthetic-${runId}-${crypto.randomUUID()}`, ...extra };
}
async function insert(user, extra, client = service) {
  return must(await client.from("payments").insert(payment(user, extra)).select("*").single(), "inserir pagamento sintetico");
}
async function update(id, changes) {
  return must(await service.from("payments").update(changes).eq("id", id).select("*").single(), "atualizar pagamento sintetico");
}
async function main() {
  const current = await register("current");
  const other = await register("other");
  const store = must(await service.from("stores").insert({ owner_id: current.id, name: `Synthetic ${runId}`,
    slug: `synthetic-payment-${runId}`, active: true, publication_status: "published" }).select("id").single(), "loja sintetica");
  const storeAllowed = async () => must(await current.client.rpc("storefront_publication_allowed", { p_store_id: store.id }), "publicacao da loja");
  assert.equal(await storeAllowed(), false, "Free nao publica mesmo com loja marcada published");
  const otherBefore = await snapshot(other);
  // Rejected status reproduces the old permissive INSERT policy without granting
  // any license, even when running this test against the vulnerable baseline.
  for (const status of ["rejected", "pending", "approved"]) {
    const result = await current.client.from("payments").insert(payment(current, { status }));
    assert.equal(result.error?.code, "42501", `usuario comum nao pode fabricar pagamento ${status}`);
  }
  console.log("PASS usuario comum nao pode fabricar pagamentos nem aprovar o proprio plano");

  for (const plan of ["start", "pro"]) {
    const before = (await snapshot(current)).subscription;
    const row = await insert(current, { plan_slug: ` ${plan.toUpperCase()} `, billing_variant: `${plan}_monthly` });
    const pending = (await snapshot(current)).subscription;
    assert.equal(pending.pending_plan, plan);
    assert.equal(pending.active_plan, before.active_plan, "pendente nao concede plano");
    assert.equal(pending.premium_until, before.premium_until);
    if (before.active_plan !== "free") assert.equal(pending.plan_status, "ACTIVE");
    assert.equal(await storeAllowed(), before.active_plan !== "free", "pendencia nao retira uma validade ja paga");
    await update(row.id, { status: "approved" });
    const approved = (await snapshot(current)).subscription;
    assert.equal(approved.active_plan, plan);
    assert.equal(approved.plan_code, plan.toUpperCase());
    assert.equal(approved.billing_variant, `${plan}_monthly`);
    assert.equal(approved.plan_status, "ACTIVE");
    assert.equal(approved.subscription_active, true);
    assert.equal(approved.is_trial_active, false);
    assert.equal(must(await current.client.rpc("get_effective_license"), "licenca efetiva").active_plan, plan);
    assert.equal(await storeAllowed(), true);
    must(await service.from("subscriptions").update({ plan_status: "BLOCKED" }).eq("client_id", current.clientId), "bloqueio sintetico");
    assert.equal(await storeAllowed(), false, "bloqueio impede loja publica");
    must(await service.from("subscriptions").update({ plan_status: "ACTIVE" }).eq("client_id", current.clientId), "restaurar fixture");
    const until = approved.premium_until;
    await Promise.all([update(row.id, { status: "approved" }), update(row.id, { status: "approved", amount: 61 })]);
    assert.equal((await snapshot(current)).subscription.premium_until, until, "repeticao nao renova");
    const renewal = await insert(current, { plan_slug: plan, billing_variant: `${plan}_monthly`, status: "approved" });
    const renewed = (await snapshot(current)).subscription;
    assert.equal(Date.parse(renewed.premium_until) - Date.parse(until), 30 * 86400000);
    await update(renewal.id, { status: "approved" });
    assert.equal((await snapshot(current)).subscription.premium_until, renewed.premium_until);
    const rejection = await insert(current, { plan_slug: plan });
    assert.equal(await storeAllowed(), true, "renovacao pendente nao tira loja paga do ar");
    await update(rejection.id, { status: "rejected" });
    const rejected = (await snapshot(current)).subscription;
    assert.equal(rejected.active_plan, plan);
    assert.equal(rejected.plan_status, "ACTIVE");
    assert.equal(rejected.premium_until, renewed.premium_until);
    assert.deepEqual(await snapshot(other), otherBefore, "pagamento A nao altera B");
    console.log(`PASS ${plan}: pendente, aprovacao, repeticao concorrente, renovacao e rejeicao sem perder validade`);
  }

  const legacy = await insert(current, { plan_slug: "premium", billing_variant: "premium_monthly", status: "approved" });
  assert.equal((await snapshot(current)).subscription.active_plan, "pro");
  const raw = must(await service.from("payments").select("plan_slug,billing_variant,amount,metadata").eq("id", legacy.id).single(), "historico legado");
  assert.equal(raw.plan_slug, "premium");
  assert.equal(raw.billing_variant, "premium_monthly");
  assert.equal(raw.amount, legacy.amount);
  console.log("PASS alias Premium reconhecido como Pro sem reescrever historico do pagamento");

  for (const plan of ["start", "pro"]) {
    const changing = await insert(current, { plan_slug: plan, billing_variant: `${plan}_monthly`, status: "approved" });
    const creditedUntil = (await snapshot(current)).subscription.premium_until;
    for (const status of ["pending", "rejected", "cancelled", "refunded", "charged_back"]) {
      await update(changing.id, { status });
      assert.equal((await snapshot(current)).subscription.premium_until, creditedUntil, "validade preservada para revisao");
      await update(changing.id, { status: "approved" });
      assert.equal((await snapshot(current)).subscription.premium_until, creditedUntil,
        `${plan}: same payment must not renew again after ${status}`);
      assert.equal((await snapshot(current)).subscription.payment_status, "approved", "projecao deve limpar pendencia resolvida");
      assert.equal((await snapshot(current)).subscription.pending_plan, null);
    }
    const review = must(await service.from("audit_logs").select("details").eq("client_id", current.clientId)
      .eq("action", "billing_payment_review_required").contains("details", { payment_id: changing.id }), "revisao do estorno");
    assert.equal(review.length, 1, "encaminhamento para revisao nao deve duplicar");
    assert.equal(review[0].details.policy, "preserve_existing_validity");
    assert.equal(review[0].details.review_required, true);
  }
  console.log("PASS um credito por pagamento, inclusive apos pendencia, rejeicao, cancelamento, estorno e chargeback");

  const beforeConcurrent = (await snapshot(current)).subscription.premium_until;
  const subscriptionId = (await snapshot(current)).subscription.id;
  await Promise.all([insert(current, { status: "approved", subscription_id: subscriptionId }),
    insert(current, { status: "approved", subscription_id: subscriptionId })]);
  assert.equal(Date.parse((await snapshot(current)).subscription.premium_until) - Date.parse(beforeConcurrent), 60 * 86400000);
  console.log("PASS dois pagamentos distintos concorrentes renovam sem perder dias");
  await Promise.all([insert(current, { status: "approved", subscription_id: subscriptionId }),
    current.client.rpc("get_effective_license").then((result) => must(result, "licenca concorrente"))]);
  console.log("PASS aprovacao e leitura autenticada da licenca concorrentes sem abortar");

  const validExpiry = (await snapshot(current)).subscription;
  const expiryFields = ["premium_until", "plan_expires_at", "current_period_end", "expires_at"];
  const past = new Date(Date.now() - 86400000).toISOString();
  must(await service.from("subscriptions").update(Object.fromEntries(expiryFields.map((field) => [field, past])))
    .eq("client_id", current.clientId), "vencimento sintetico");
  assert.equal(await storeAllowed(), false, "plano vencido nao publica");
  must(await service.from("subscriptions").update(Object.fromEntries(expiryFields.map((field) => [field, validExpiry[field]])))
    .eq("client_id", current.clientId), "restaurar validade sintetica");
  assert.equal(await storeAllowed(), true);

  const beforeInvalid = await snapshot(current);
  for (const plan of ["free", "trial", "premium_trial", "desconhecido", "", null]) {
    const result = await service.from("payments").insert(payment(current, { plan_slug: plan, status: "approved" }));
    assert.equal(result.error?.code, "22023", "plano de pagamento invalido deve ser rejeitado");
  }
  for (const subscriptionId of [otherBefore.subscription.id, crypto.randomUUID()]) {
    const result = await service.from("payments").insert(payment(current, { subscription_id: subscriptionId }));
    assert.equal(result.error?.code, "23503", "assinatura fornecida deve pertencer ao cliente");
  }
  assert.deepEqual(await snapshot(current), beforeInvalid);
  assert.deepEqual(await snapshot(other), otherBefore);
  const modified = await current.client.from("payments").update({ status: "approved" }).eq("id", legacy.id).select("id");
  assert(modified.error || modified.data.length === 0, "usuario comum nao pode alterar pagamentos");
  console.log("PASS planos invalidos, assinatura inexistente/cruzada e alteracao direta bloqueados sem efeitos");

  must(await service.from("superadmins").insert({ user_id: current.id, status: "active" }), "superadmin sintetico");
  await insert(current, { plan_slug: "start", billing_variant: "start_monthly", status: "pending" }, current.client);
  console.log("PASS caminho administrativo autorizado preservado");
  console.log(`PASS pagamentos via API: ${target} ${new URL(url).origin}; nenhum gateway externo chamado`);
}
runWithCleanup(main, [() => fixtures.cleanup()]).catch((error) => {
  console.error(`FAIL pagamentos: ${error.message}`); process.exitCode = 1;
});
