const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");
const { getTarget, createFixtures, snapshotPlan, runWithCleanup } = require("./supabase-homolog-test-utils");

const { target, url, anonKey, serviceKey } = getTarget(process.argv[2]);

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const service = createClient(url, serviceKey, clientOptions);
const token = crypto.randomBytes(6).toString("hex");
const fixtures = createFixtures(service, token);
let planSnapshot;
const password = crypto.randomBytes(24).toString("base64url");
const users = {};
const events = [];

function must(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function rejected(call, label) {
  const result = await call();
  assert(result.error, `${label}: operacao deveria ser negada`);
  events.push(`NEGADO ${label}`);
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

async function register(role, metadata = {}) {
  const email = `s3d-homolog-${token}-${role}@example.invalid`;
  const created = must(await service.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name: `Homologacao ${role}`, business_name: `Empresa ${role} ${token}`, ...metadata }
  }), `criar Auth ${role}`);
  fixtures.user(created.user);
  const id = created.user.id;
  const client = fixtures.session(createClient(url, anonKey, clientOptions));
  must(await client.auth.signInWithPassword({ email, password }), `login ${role}`);
  const profile = must(await service.from("profiles").select("client_id").eq("user_id", id).single(),
    `perfil ${role}`);
  assert(profile.client_id, `cliente ausente para ${role}`);
  users[role] = { id, email, clientId: profile.client_id, client };
  return users[role];
}

async function license(user) {
  return must(await user.client.rpc("get_effective_license"), `licenca ${user.email}`);
}

async function setPlan(adminClient, user, action, plan, until) {
  return must(await adminClient.rpc("superadmin_update_subscription", {
    target_user_id: user.id, action, plan_code: plan,
    premium_until: until, reason: `Homologacao isolada ${token}`
  }), `plano ${action}`);
}

async function main() {
  const admin = await register("admin");
  must(await service.from("superadmins").insert({ user_id: admin.id, status: "active" }),
    "autorizar superadmin sintetico");
  const free = await register("free");
  const start = await register("start");
  const pro = await register("pro");
  const common = await register("common", { role: "superadmin" });
  const all = [admin, free, start, pro, common];
  assert.equal(new Set(all.map((user) => user.clientId)).size, all.length, "empresas devem ser independentes");
  assert.equal(must(await common.client.rpc("erp_is_superadmin"), "verificar papel comum"), false,
    "metadata de Auth nao pode conceder superadmin");

  for (const user of [free, start, pro, common]) {
    assert.equal((await license(user)).active_plan, "free", `novo cliente ${user.email} deve ser Free`);
  }
  events.push("PASS Auth real, empresas isoladas e licenca inicial Free");

  const future = daysFromNow(10);
  const later = daysFromNow(20);
  await rejected(() => admin.client.rpc("superadmin_update_subscription", {
    target_user_id: start.id, action: "SET_PLAN_MANUAL", plan_code: "START",
    premium_until: null, reason: "sem prazo"
  }), "concessao sem validade");
  await rejected(() => admin.client.rpc("superadmin_update_subscription", {
    target_user_id: pro.id, action: "SET_PLAN_MANUAL", plan_code: "PRO",
    premium_until: "2020-01-01T00:00:00Z", reason: "vencido"
  }), "concessao vencida");
  assert.equal((await setPlan(admin.client, start, "SET_PLAN_MANUAL", "START", future)).active_plan, "start");
  assert.equal((await setPlan(admin.client, pro, "SET_PLAN_MANUAL", "PRO", future)).active_plan, "pro");
  assert.equal((await license(start)).active_plan, "start");
  assert.equal((await license(pro)).active_plan, "pro");
  assert.equal((await license(free)).active_plan, "free");
  events.push("PASS Free/Start/Pro e validade obrigatoria via RPC autenticada");

  const renewed = await setPlan(admin.client, pro, "ACTIVATE_PREMIUM_MANUAL", "PRO", later);
  assert(Date.parse(renewed.premium_until) >= Date.parse(later) - 1000);
  const repeated = await setPlan(admin.client, pro, "ACTIVATE_PREMIUM_MANUAL", "PRO", later);
  assert.equal(Date.parse(repeated.premium_until), Date.parse(renewed.premium_until));
  const concurrentDate = daysFromNow(30);
  const twoCalls = await Promise.all([
    setPlan(admin.client, pro, "ACTIVATE_PREMIUM_MANUAL", "PRO", concurrentDate),
    setPlan(admin.client, pro, "ACTIVATE_PREMIUM_MANUAL", "PRO", concurrentDate)
  ]);
  assert(twoCalls.every((item) => item.active_plan === "pro"));
  const proRows = must(await service.from("subscriptions").select("id,premium_until")
    .eq("client_id", pro.clientId), "assinaturas Pro");
  assert.equal(proRows.length, 1, "concorrencia nao pode duplicar assinatura");
  assert(Date.parse(proRows[0].premium_until) >= Date.parse(concurrentDate) - 1000);
  events.push("PASS renovacao, repeticao e chamadas concorrentes no mesmo cliente");

  must(await service.from("subscriptions")
    .update({ mercado_pago_subscription_id: `synthetic-${token}` })
    .eq("client_id", start.clientId), "marcar vinculo sintetico Mercado Pago");
  await rejected(() => admin.client.rpc("superadmin_update_subscription", {
    target_user_id: start.id, action: "SET_FREE", reason: "tentativa de rebaixamento"
  }), "rebaixar assinatura vinculada ao provedor");
  assert.equal((await license(start)).active_plan, "start");

  await rejected(() => common.client.rpc("superadmin_update_subscription", {
    target_user_id: pro.id, action: "SET_FREE", reason: "sem autorizacao"
  }), "RPC administrativa por usuario comum");
  await rejected(() => common.client.rpc("superadmin_update_plan_presentation", {
    p_slug: "start", p_changes: { name: "Fraude" }
  }), "card por usuario comum");
  await rejected(() => common.client.from("superadmins")
    .insert({ user_id: common.id, status: "active" }), "escalonamento na tabela superadmins");
  await rejected(() => common.client.from("erp_profiles")
    .update({ role: "superadmin" }).eq("id", common.id), "escalonamento de erp_profiles");
  assert.equal(must(await common.client.rpc("erp_is_superadmin"), "rever papel comum"), false);
  const crossCompany = must(await common.client.from("subscriptions").select("id")
    .eq("client_id", pro.clientId), "RLS entre empresas");
  assert.equal(crossCompany.length, 0, "usuario comum nao pode ler outra empresa");
  events.push("PASS protecao Mercado Pago, RPC administrativa e isolamento RLS");

  planSnapshot = await snapshotPlan(service, "start");
  const originalPrice = planSnapshot.original.price;
  await rejected(() => admin.client.rpc("superadmin_update_plan_presentation", {
    p_slug: "start", p_changes: { price: 0 }
  }), "gravar campo comercial proibido");
  const presentation = { name: `Start Homologado ${token}`, headline: "Validacao de homologacao",
    description: "Persistencia entre logins.", priceLabel: "Preco informativo",
    features: ["Beneficio sintetico A", "Beneficio sintetico B"] };
  planSnapshot.prepare(presentation);
  const saved = must(await admin.client.rpc("superadmin_update_plan_presentation", {
    p_slug: "start", p_changes: presentation
  }), "salvar card");
  planSnapshot.saved(saved);
  assert.equal(saved.presentation.name, presentation.name);
  must(await admin.client.auth.signOut(), "logout superadmin");
  const adminAgain = fixtures.session(createClient(url, anonKey, clientOptions));
  must(await adminAgain.auth.signInWithPassword({ email: admin.email, password }), "novo login superadmin");
  const readback = must(await adminAgain.from("plans").select("metadata,price")
    .eq("slug", "start").single(), "card em outra sessao");
  assert.equal(readback.metadata.presentation.name, presentation.name);
  assert.equal(readback.price, originalPrice, "preco cobrado nao pode mudar");
  must(await pro.client.auth.signOut(), "logout cliente Pro");
  const proAgain = fixtures.session(createClient(url, anonKey, clientOptions));
  must(await proAgain.auth.signInWithPassword({ email: pro.email, password }), "novo login Pro");
  pro.client = proAgain;
  assert.equal((await license(pro)).active_plan, "pro", "licenca deve sobreviver a novo login");
  events.push("PASS card persistido entre logins; licenca Pro restaurada; preco comercial intacto");

  const session = must(await adminAgain.auth.getSession(), "sessao para falha de rede").session;
  const offline = createClient(url, anonKey, {
    ...clientOptions,
    global: {
      headers: { Authorization: `Bearer ${session.access_token}` },
      fetch: async () => { throw new Error("rede indisponivel na homologacao"); }
    }
  });
  await rejected(() => offline.rpc("superadmin_update_plan_presentation", {
    p_slug: "start", p_changes: { name: "Alteracao que nao pode gravar" }
  }), "gravar card sem rede");
  const afterNetworkFailure = must(await adminAgain.from("plans").select("metadata")
    .eq("slug", "start").single(), "recuperar card apos falha de rede");
  assert.equal(afterNetworkFailure.metadata.presentation.name, presentation.name);
  events.push("PASS falha de rede sem sucesso falso e recuperacao de leitura");

  const audits = must(await service.from("audit_logs").select("user_id,client_id,action,details")
    .eq("client_id", pro.clientId).eq("action", "superadmin_update_subscription"), "auditoria");
  assert(audits.length >= 4);
  assert(audits.every((row) => row.user_id === admin.id && row.client_id === pro.clientId));
  assert(audits.some((row) => row.details.previous_plan && row.details.new_plan === "pro"));
  events.push("PASS trilha de auditoria com autor, cliente e plano");

  const expiredAt = daysFromNow(-1);
  must(await service.from("subscriptions").update({
    premium_until: expiredAt, plan_expires_at: expiredAt,
    current_period_end: expiredAt, expires_at: expiredAt
  }).eq("client_id", pro.clientId), "simular vencimento em dados sinteticos");
  assert.equal((await license(pro)).active_plan, "free");
  const expiredRow = must(await service.from("subscriptions")
    .select("active_plan,manual_override").eq("client_id", pro.clientId).single(),
  "assinatura apos vencimento");
  assert.equal(expiredRow.active_plan, "free");
  assert.equal(expiredRow.manual_override, false);
  const expiryAudit = () => service.from("audit_logs").select("id")
    .eq("client_id", pro.clientId).eq("action", "manual_plan_expired");
  assert.equal(must(await expiryAudit(), "auditoria do vencimento").length, 1);
  await license(pro);
  assert.equal(must(await expiryAudit(), "auditoria sem duplicacao").length, 1);
  events.push("PASS vencimento, rebaixamento e auditoria unica via RPC autenticada");

  for (const event of events) console.log(event);
  console.log(`Usuarios sinteticos: ${all.length}; alvo ${target}: ${new URL(url).origin}.`);
}

runWithCleanup(main, [() => planSnapshot?.restore(), () => fixtures.cleanup()]).catch((error) => {
  console.error(`FAIL homologacao ${target}: ${error.message}`);
  process.exitCode = 1;
});
