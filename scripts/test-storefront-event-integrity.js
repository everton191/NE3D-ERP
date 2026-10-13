const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");
const { getTarget, createFixtures, runWithCleanup } = require("./supabase-homolog-test-utils");

const { target, url, anonKey, serviceKey } = getTarget(process.argv[2]);

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const service = createClient(url, serviceKey, options);
const anon = createClient(url, anonKey, options);
const runId = crypto.randomBytes(6).toString("hex");
const fixtures = createFixtures(service, runId);
const password = crypto.randomBytes(24).toString("base64url");
const future = new Date(Date.now() + 30 * 86400000).toISOString();

function must(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function denied(result, label) {
  assert(result.error, `${label}: insercao indevida foi aceita`);
  assert.equal(result.error.code, "42501", `${label}: erro deve ser de RLS`);
}

async function createOwner(label) {
  const email = `events-${runId}-${label}@example.invalid`;
  const created = must(await service.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name: `Events ${label}`, business_name: `Events ${label} ${runId}` }
  }), `Auth ${label}`);
  fixtures.user(created.user);
  const client = fixtures.session(createClient(url, anonKey, options));
  must(await client.auth.signInWithPassword({ email, password }), `JWT ${label}`);
  const profile = must(await service.from("profiles").select("client_id")
    .eq("user_id", created.user.id).single(), `perfil ${label}`);
  const subscription = must(await service.from("subscriptions").update({
    active_plan: "start", subscription_status: "active", payment_status: "approved",
    current_period_end: future, plan_expires_at: future
  }).eq("client_id", profile.client_id).select("id"), `assinatura ${label}`);
  assert.equal(subscription.length, 1);
  const store = must(await service.from("stores").insert({
    owner_id: created.user.id, slug: `events-${runId}-${label}`,
    name: `Events ${label}`, active: true, publication_status: "published"
  }).select("id").single(), `loja ${label}`);
  const product = must(await service.from("store_products").insert({
    store_id: store.id, owner_id: created.user.id, title: `Product ${label}`,
    slug: `product-${label}`, visible: true, price: 10
  }).select("id").single(), `produto ${label}`);
  return { client, storeId: store.id, productId: product.id };
}

async function insertEvent(client, storeId, productId) {
  return client.from("store_events").insert({ store_id: storeId,
    product_id: productId, event_type: "product_view" });
}

async function insertVisit(client, storeId, productId) {
  return client.from("store_visits").insert({ store_id: storeId,
    product_id: productId, event_type: "product_view", session_id: `test-${runId}` });
}

async function main() {
  const a = await createOwner("a");
  const b = await createOwner("b");
  for (const [label, client] of [["anon", anon], ["proprietario", a.client], ["outra loja", b.client]]) {
    must(await insertEvent(client, a.storeId, a.productId), `${label}: evento legitimo`);
    must(await insertVisit(client, a.storeId, a.productId), `${label}: visita legitima`);
    must(await client.from("store_visits").insert({ store_id: a.storeId,
      product_id: null, event_type: "store_view", session_id: `test-${runId}` }),
    `${label}: visita de loja sem produto`);
    denied(await insertEvent(client, a.storeId, b.productId), `${label}: evento entre lojas`);
    denied(await insertVisit(client, a.storeId, b.productId), `${label}: visita entre lojas`);
  }
  must(await service.from("store_products").update({ visible: false }).eq("id", a.productId),
    "ocultar produto da loja A");
  denied(await insertVisit(anon, a.storeId, a.productId), "anon: produto oculto");
  must(await service.from("store_products").update({ visible: true, stock_mode: "unavailable" })
    .eq("id", a.productId), "indisponibilizar produto da loja A");
  denied(await insertVisit(a.client, a.storeId, a.productId), "proprietario: produto indisponivel");
  must(await insertEvent(service, a.storeId, b.productId), "service_role: evento sintetico privilegiado");
  must(await insertVisit(service, a.storeId, b.productId), "service_role: visita sintetica privilegiada");
  console.log("PASS integridade: anon/JWTs bloqueados entre lojas; controles legitimos e service_role preservados.");
}

runWithCleanup(main, [() => fixtures.cleanup()]).catch((error) => {
  console.error(`FAIL integridade dos eventos ${target}: ${error.message}`);
  process.exitCode = 1;
});
