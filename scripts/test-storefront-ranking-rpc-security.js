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
const past = new Date(Date.now() - 86400000).toISOString();

function must(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function register(label) {
  const email = `ranking-${runId}-${label}@example.invalid`;
  const created = must(await service.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name: `Ranking ${label}`, business_name: `Ranking ${label} ${runId}` }
  }), `Auth ${label}`);
  fixtures.user(created.user);
  const client = fixtures.session(createClient(url, anonKey, options));
  must(await client.auth.signInWithPassword({ email, password }), `JWT ${label}`);
  const profile = must(await service.from("profiles").select("client_id")
    .eq("user_id", created.user.id).single(), `perfil ${label}`);
  assert(profile.client_id, `cliente sintetico ausente: ${label}`);
  return { id: created.user.id, clientId: profile.client_id, client };
}

async function setLicense(user, plan, expiresAt = future) {
  const rows = must(await service.from("subscriptions").update({
    active_plan: plan,
    subscription_status: plan === "free" ? "free" : "active",
    payment_status: plan === "free" ? "none" : "approved",
    current_period_end: expiresAt,
    plan_expires_at: expiresAt
  }).eq("client_id", user.clientId).select("id"), `licenca ${plan}`);
  assert.equal(rows.length, 1, `assinatura sintetica unica: ${plan}`);
}

async function createStore(user, label) {
  const store = must(await service.from("stores").insert({
    owner_id: user.id, slug: `ranking-${runId}-${label}`, name: `Ranking ${label}`,
    active: true, publication_status: "published"
  }).select("id").single(), `loja ${label}`);
  const product = must(await service.from("store_products").insert({
    store_id: store.id, owner_id: user.id, title: `Produto ${label}`,
    slug: `produto-${label}`, visible: true, price: 10
  }).select("id").single(), `produto ${label}`);
  const types = ["product_view", "whatsapp_click", "add_to_cart", "lead_created", "remove_from_cart"];
  must(await service.from("store_events").insert([
    ...types.map((event_type) => ({ store_id: store.id, product_id: product.id, event_type,
      created_at: new Date().toISOString() })),
    { store_id: store.id, product_id: product.id, event_type: "product_view",
      created_at: new Date(Date.now() - 91 * 86400000).toISOString() }
  ]), `eventos ${label}`);
  return { id: store.id, productId: product.id };
}

async function addProductWithLeads(user, store, label, count) {
  const product = must(await service.from("store_products").insert({
    store_id: store.id, owner_id: user.id, title: `Produto ${label}`,
    slug: `produto-${label}`, visible: true, price: 10
  }).select("id").single(), `produto ${label}`);
  must(await service.from("store_events").insert(Array.from({ length: count }, () => ({
    store_id: store.id, product_id: product.id, event_type: "lead_created",
    created_at: new Date().toISOString()
  }))), `eventos ${label}`);
  return product.id;
}

async function ranking(client, store, label) {
  return must(await client.rpc("get_storefront_product_ranking", { p_store_id: store.id }), label);
}

function allowed(rows, store, label) {
  assert.equal(rows.length, 1, label);
  assert.equal(rows[0].product_id, store.productId, label);
  assert.equal(Number(rows[0].view_count), 1, `${label}: janela de 90 dias`);
  assert.equal(Number(rows[0].click_count), 1, label);
  assert.equal(Number(rows[0].cart_count), 1, label);
  assert.equal(Number(rows[0].lead_count), 1, label);
  assert.equal(Number(rows[0].smart_score), 16, label);
}

function denied(rows, label) {
  assert.deepEqual(rows, [], label);
}

async function main() {
  const owner = await register("start");
  const proOwner = await register("pro");
  const freeOwner = await register("free");
  const stranger = await register("stranger");
  assert.equal(new Set([owner, proOwner, freeOwner, stranger].map((u) => u.clientId)).size, 4);
  await setLicense(owner, "start");
  await setLicense(proOwner, "pro");
  await setLicense(freeOwner, "free");
  const startStore = await createStore(owner, "start");
  const proStore = await createStore(proOwner, "pro");
  const freeStore = await createStore(freeOwner, "free");

  allowed(await ranking(anon, startStore, "anon Start publicada"), startStore, "anon Start publicada");
  allowed(await ranking(anon, proStore, "anon Pro publicada"), proStore, "anon Pro publicada");
  denied(await ranking(anon, freeStore, "anon Free"), "plano Free nao publica metricas");
  const visibleStore = must(await anon.from("stores").select("id").eq("id", startStore.id), "vitrine publicada");
  const visibleProduct = must(await anon.from("store_products").select("id").eq("id", startStore.productId), "produto publicado");
  assert.equal(visibleStore.length, 1);
  assert.equal(visibleProduct.length, 1);

  const privacyStore = await createStore(owner, "privacy");
  const visibleId = await addProductWithLeads(owner, privacyStore, "visible", 3);
  const hiddenId = await addProductWithLeads(owner, privacyStore, "hidden", 5);
  must(await service.from("store_products").update({ visible: false }).eq("id", hiddenId), "ocultar produto com historico");
  const unavailableId = await addProductWithLeads(owner, privacyStore, "unavailable", 4);
  must(await service.from("store_products").update({ stock_mode: "unavailable" })
    .eq("id", unavailableId), "indisponibilizar produto com historico");
  const removedId = await addProductWithLeads(owner, privacyStore, "removed", 2);
  must(await service.from("store_products").delete().eq("id", removedId), "remover produto do catalogo");
  must(await service.from("store_events").insert({
    store_id: privacyStore.id, product_id: proStore.productId,
    event_type: "lead_created", created_at: new Date().toISOString()
  }), "evento com UUID de produto de outra loja");
  const publicRanking = await ranking(anon, privacyStore, "ranking publico por produto");
  assert.deepEqual(publicRanking.map((row) => row.product_id), [visibleId, privacyStore.productId],
    "somente produtos publicos da mesma loja, em ordem de smart_score");
  assert.deepEqual(publicRanking.map((row) => Number(row.smart_score)), [27, 16]);
  assert.deepEqual((await ranking(stranger.client, privacyStore, "outro usuario"))
    .map((row) => row.product_id), [visibleId, privacyStore.productId],
  "outro usuario recebe apenas o mesmo ranking publico");
  const ownerRanking = await ranking(owner.client, privacyStore, "historico do proprietario");
  assert.deepEqual(ownerRanking.map((row) => row.product_id),
    [hiddenId, unavailableId, visibleId, privacyStore.productId],
  "proprietario conserva metricas de produtos ocultos/indisponiveis da propria loja");
  assert.deepEqual(ownerRanking.map((row) => Number(row.smart_score)), [45, 36, 27, 16]);
  const publicCatalog = must(await anon.from("store_products").select("id").eq("store_id", privacyStore.id),
    "catalogo publico para comparar RLS");
  assert.deepEqual(new Set(publicCatalog.map((row) => row.id)), new Set([visibleId, privacyStore.productId]));
  denied(await ranking(anon, { id: crypto.randomUUID() }, "UUID de loja aleatorio"), "UUID de loja aleatorio");

  must(await service.from("stores").update({ publication_status: "unpublished" }).eq("id", startStore.id), "despublicar");
  denied(await ranking(anon, startStore, "anon despublicada"), "anon despublicada");
  allowed(await ranking(owner.client, startStore, "dono despublicada"), startStore, "dono despublicada");
  denied(await ranking(stranger.client, startStore, "outro usuario/UUID trocado"), "outro usuario/UUID trocado");
  denied(await ranking(anon, { id: crypto.randomUUID() }, "UUID inexistente"), "UUID inexistente");

  must(await service.from("stores").update({ publication_status: "published" }).eq("id", startStore.id), "republicar");
  await setLicense(owner, "start", past);
  denied(await ranking(anon, startStore, "licenca vencida"), "licenca vencida");
  allowed(await ranking(owner.client, startStore, "dono licenca vencida"), startStore, "dono licenca vencida");
  await setLicense(owner, "start");
  must(await service.from("stores").update({ publication_status: "suspended_plan" }).eq("id", startStore.id), "bloquear publicacao");
  denied(await ranking(anon, startStore, "publicacao suspensa"), "publicacao suspensa");
  must(await service.from("stores").update({ publication_status: "published", active: false }).eq("id", startStore.id), "desativar loja");
  denied(await ranking(anon, startStore, "loja inativa"), "loja inativa");
  allowed(await ranking(owner.client, startStore, "dono loja inativa"), startStore, "dono loja inativa");

  console.log("PASS ranking: Start/Pro, Free, loja privada/vencida/suspensa/inativa, produtos visiveis/ocultos/indisponiveis/removidos, dono/estranho, UUID trocado e inexistente; contagens/score/ordem/90 dias.");
}

runWithCleanup(main, [() => fixtures.cleanup()]).catch((error) => {
  console.error(`FAIL ranking RPC ${target}: ${error.message}`);
  process.exitCode = 1;
});
