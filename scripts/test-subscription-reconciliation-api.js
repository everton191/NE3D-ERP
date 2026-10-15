const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");
const { getTarget, createFixtures, runWithCleanup } = require("./supabase-homolog-test-utils");

// Baseline reproduction also uses local Auth/PostgREST: never customer data.
const { target, url, anonKey, serviceKey } = getTarget(process.argv[2]);
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const service = createClient(url, serviceKey, options);
const runId = crypto.randomBytes(6).toString("hex");
const password = crypto.randomBytes(24).toString("base64url");
const fixtures = createFixtures(service, runId);
const failures = [];
const must = (result, label) => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
};
async function check(label, work) {
  try { await work(); console.log(`PASS ${label}`); }
  catch (error) { failures.push(new Error(`${label}: ${error.message}`)); console.log(`FAIL ${label}`); }
}
async function register(label) {
  const email = `s3d-reconcile-${runId}-${label}@example.invalid`;
  const name = `Empresa ${label} ${runId}`;
  const created = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: { name, business_name: name } }), "Auth sintetico");
  fixtures.user(created.user);
  const client = fixtures.session(createClient(url, anonKey, options));
  must(await client.auth.signInWithPassword({ email, password }), "login sintetico");
  const profile = must(await service.from("profiles").select("client_id,company_id")
    .eq("user_id", created.user.id).single(), "perfil sintetico");
  return { id: created.user.id, email, name, client, ...profile };
}
async function snapshot(user) {
  const data = {};
  for (const [table, field, value] of [
    ["clients", "id", user.client_id], ["subscriptions", "client_id", user.client_id],
    ["companies", "id", user.company_id], ["company_members", "company_id", user.company_id],
    ["profiles", "user_id", user.id], ["erp_profiles", "id", user.id]
  ]) data[table] = must(await service.from(table).select("*").eq(field, value).order("id"), table);
  return data;
}
const sync = (user) => user.client.rpc("sync_saas_user_after_login", {
  p_name: user.name, p_business_name: user.name, p_phone: null
});
const registration = (user, email = user.email) => user.client.rpc("register_saas_client", {
  p_name: user.name, p_responsible_name: user.name, p_email: email,
  p_phone: null, p_plan_slug: "free", p_trial_days: 0
});

async function main() {
  const other = await register("other");
  // A stale pending payment and deliberately stale client cache must not be
  // reconciled by another tenant's signup, login or payment event.
  must(await service.from("subscriptions").update({ pending_plan: "pro", payment_status: "pending",
    pending_started_at: "2020-01-01T00:00:00Z", plan_expires_at: "2030-01-01T00:00:00Z" })
    .eq("client_id", other.client_id), "preparar pendencia de B");
  must(await service.from("clients").update({ plan_expires_at: null }).eq("id", other.client_id),
    "preparar cache de B");
  const beforeSignup = await snapshot(other);
  const current = await register("current");
  await check("cadastro A preserva todos os campos de B, inclusive updated_at", async () => {
    assert.deepEqual(await snapshot(other), beforeSignup);
  });
  for (const [label, action] of [
    ["login/sync", () => sync(current)],
    ["cadastro RPC proprio", () => registration(current, `  ${current.email.toUpperCase()}  `)],
    ["sync concorrente", async () => {
      for (const result of await Promise.all([sync(current), sync(current)])) must(result, "sync concorrente");
      return { data: true };
    }]
  ]) {
    const before = await snapshot(other);
    await check(`${label} preserva B`, async () => {
      must(await action(), label);
      assert.deepEqual(await snapshot(other), before);
    });
  }
  const beforePayment = await snapshot(other);
  const payment = must(await service.from("payments").insert({ client_id: current.client_id,
    user_id: current.id, status: "pending", amount: 0, plan_slug: "pro",
    external_reference: `synthetic-${runId}` }).select("id").single(), "pagamento sintetico sem gateway");
  await check("evento de pagamento A preserva B", async () => assert.deepEqual(await snapshot(other), beforePayment));
  assert.equal((await snapshot(current)).clients[0].payment_status, "pending");
  must(await service.from("payments").update({ status: "rejected" }).eq("id", payment.id), "rejeicao sintetica");
  assert.equal((await snapshot(current)).clients[0].payment_status, "rejected");
  await check("rejeicao de pagamento A preserva B", async () => assert.deepEqual(await snapshot(other), beforePayment));
  must(await service.from("payments").update({ status: "cancelled" }).eq("id", payment.id), "cancelamento sintetico");
  await check("cancelamento de pagamento A preserva B", async () => assert.deepEqual(await snapshot(other), beforePayment));
  assert.equal((await snapshot(current)).clients[0].payment_status, "cancelled");

  const anonymous = createClient(url, anonKey, options);
  for (const [label, client] of [["anon", anonymous], ["authenticated", current.client]]) {
    await check(`limpeza global negada a ${label}`, async () => {
      assert((await client.rpc("s3d_cleanup_subscription_state")).error);
    });
  }

  for (const [table, key] of [["profiles", "user_id"], ["erp_profiles", "id"]]) {
    for (const field of ["client_id", "company_id"]) {
      const before = must(await service.from(table).select("*").eq(key, current.id).single(), "perfil original");
      await check(`${table}.${field} nao pode ser trocado pelo proprio usuario`, async () => {
        try {
          const result = await current.client.from(table).update({ [field]: other[field] }).eq(key, current.id);
          assert.equal(result.error?.code, "42501");
          assert.deepEqual(must(await service.from(table).select("*").eq(key, current.id).single(), "perfil inalterado"), before);
        } finally {
          // Restore only our synthetic fixture if testing a vulnerable baseline.
          const after = must(await service.from(table).select(field).eq(key, current.id).single(), "reler vinculo");
          if (after[field] !== before[field]) must(await service.from(table).update({ [field]: before[field] })
            .eq(key, current.id), "restaurar vinculo sintetico");
        }
      });
    }
    const original = must(await service.from(table).select("*").eq(key, current.id).single(), "perfil original");
    for (const changes of [{ client_id: null }, { company_id: null }, { id: crypto.randomUUID() },
      ...(table === "profiles" ? [{ user_id: crypto.randomUUID() }] : [])]) {
      await check(`${table}: limpar vinculo ou trocar identidade e negado`, async () => {
        const result = await current.client.from(table).update(changes).eq(key, current.id);
        assert.equal(result.error?.code, "42501");
        assert.deepEqual(must(await service.from(table).select("*").eq(key, current.id).single(), "perfil intacto"), original);
      });
    }
    for (const operation of ["insert", "upsert"]) {
      await check(`${table}: ${operation} nao pode forjar vinculos`, async () => {
        const row = { ...original, client_id: other.client_id, company_id: other.company_id };
        const result = await current.client.from(table)[operation](row);
        assert.equal(result.error?.code, "42501");
        assert.deepEqual(must(await service.from(table).select("*").eq(key, current.id).single(), "perfil intacto"), original);
      });
    }
  }
  must(await current.client.from("profiles").update({ name: current.name, phone: "000000000" })
    .eq("user_id", current.id), "edicao pessoal continua permitida");
  console.log("PASS edicao de nome/telefone preservada");

  // Assert rejection before checking no side effects; do not allow a 200/no-op.
  for (const email of [other.email, ` ${other.email.toUpperCase()} `]) {
    const before = await snapshot(other);
    await check("cadastro com email de B e negado sem efeitos colaterais", async () => {
      const result = await registration(current, email);
      assert.equal(result.error?.code, "42501", "email de outra conta deve ser rejeitado");
      assert.deepEqual(await snapshot(other), before);
    });
  }
  // Malicious metadata cannot replace the server-side Auth email.
  must(await current.client.auth.updateUser({ data: { email: other.email, client_id: other.client_id } }),
    "metadata sintetica");
  await check("cadastro proprio continua ligado ao Auth, nao ao metadata", async () => {
    const result = must(await registration(current), "cadastro proprio");
    assert.equal(result.client_id, current.client_id);
  });
  await check("cadastro sem sessao e negado", async () => {
    assert((await anonymous.rpc("register_saas_client", { p_name: "Sem sessao", p_responsible_name: "Teste",
      p_email: other.email, p_plan_slug: "free", p_trial_days: 0 })).error);
  });

  // Only B's own authenticated sync should clear B's pending payment/cache.
  must(await sync(other), "reconciliar B explicitamente");
  const afterOwnSync = await snapshot(other);
  assert.equal(afterOwnSync.subscriptions[0].payment_status, "none");
  assert.equal(afterOwnSync.subscriptions[0].pending_plan, null);
  assert.equal(afterOwnSync.clients[0].plan_expires_at, afterOwnSync.subscriptions[0].plan_expires_at);
  console.log("PASS reconciliacao do proprio cliente mantida");

  const admin = await register("admin");
  must(await service.from("superadmins").insert({ user_id: admin.id, status: "active" }), "superadmin sintetico");
  for (const [user, plan] of [[other, "START"], [current, "PRO"]]) {
    const until = new Date(Date.now() + 86400000 * 10).toISOString();
    must(await admin.client.rpc("superadmin_update_subscription", { target_user_id: user.id,
      action: "SET_PLAN_MANUAL", plan_code: plan, premium_until: until, reason: `Isolamento ${runId}` }), "concessao sintetica");
    const before = (await snapshot(user)).subscriptions[0];
    must(await sync(user), "sincronizar cliente pago");
    must(await registration(user), "registrar novamente cliente pago");
    const after = (await snapshot(user)).subscriptions[0];
    for (const field of ["active_plan", "plan_code", "plan_id", "premium_until", "manual_override", "billing_variant"])
      assert.deepEqual(after[field], before[field], `${plan}: ${field} preservado`);
    assert.equal(must(await user.client.rpc("get_effective_license"), "licenca reconhecida").active_plan, plan.toLowerCase());
    console.log(`PASS cadastro/login preservam concessao ${plan} e vencimento`);
  }
  must(await admin.client.from("profiles").update({ name: current.name }).eq("user_id", current.id), "edicao superadmin");
  console.log("PASS edicao administrativa preservada");
  if (failures.length) throw new AggregateError(failures, failures.map((error) => error.message).join("\n"));
  console.log(`PASS isolamento por API/Auth real: ${target} ${new URL(url).origin}`);
}
runWithCleanup(main, [() => fixtures.cleanup()]).catch((error) => {
  // Assertion diffs are synthetic, but a concise failure avoids excessive logs.
  console.error(`FAIL reconciliacao: ${error.message}`);
  process.exitCode = 1;
});
