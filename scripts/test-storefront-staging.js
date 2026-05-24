const {
  MAIN_PROJECT_REF,
  assertNotMainProject,
  getStagingProjectRef,
  loadStagingEnv,
} = require("./storefront-staging-utils");

const USER_A_EMAIL = "storefront-user-a@simplifica3d-staging.local";
const USER_B_EMAIL = "storefront-user-b@simplifica3d-staging.local";
const DEFAULT_PASSWORD = "Simplifica3D-Staging-2026!";

function skip(reason) {
  console.log(`SKIPPED: ${reason}`);
  process.exit(0);
}

function required(env, key) {
  const value = String(env[key] || "").trim();
  if (!value) throw new Error(`${key} nao configurado em .env.staging.`);
  return value;
}

async function request({ url, key, bearer = key, method = "GET", path, body, expected = [200], headers = {} }) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch (_) {
    parsed = text;
  }
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${path} retornou ${response.status}, esperado ${expected.join("/")}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  }
  return { status: response.status, body: parsed };
}

async function listUsers(url, serviceRole) {
  const { body } = await request({
    url,
    key: serviceRole,
    path: "/auth/v1/admin/users?page=1&per_page=200",
  });
  return Array.isArray(body?.users) ? body.users : [];
}

async function ensureUser(url, serviceRole, email, password) {
  const existing = (await listUsers(url, serviceRole)).find((user) => String(user.email || "").toLowerCase() === email.toLowerCase());
  if (existing?.id) return existing.id;
  const { body } = await request({
    url,
    key: serviceRole,
    method: "POST",
    path: "/auth/v1/admin/users",
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: { source: "storefront-phase36-staging-test" },
    },
  });
  if (!body?.id) throw new Error(`Usuario nao criado: ${email}`);
  return body.id;
}

async function signIn(url, anonKey, email, password) {
  const { body } = await request({
    url,
    key: anonKey,
    bearer: anonKey,
    method: "POST",
    path: "/auth/v1/token?grant_type=password",
    body: { email, password },
  });
  if (!body?.access_token) throw new Error(`Login falhou para ${email}`);
  return body.access_token;
}

function firstRow(body, label) {
  if (!Array.isArray(body) || !body[0]) throw new Error(`${label} nao retornou linhas.`);
  return body[0];
}

async function main() {
  const env = loadStagingEnv();
  const stagingRef = getStagingProjectRef(env);
  const url = String(env.VITE_SUPABASE_URL_STAGING || "").replace(/\/+$/, "");
  const anonKey = String(env.VITE_SUPABASE_ANON_KEY_STAGING || "");
  const serviceRole = String(env.SUPABASE_SERVICE_ROLE_STAGING || "");
  const confirmed = String(env.STAGING_CONFIRM || "").toLowerCase() === "true";

  if (!stagingRef || !url || !anonKey || !serviceRole || !confirmed) {
    skip("staging nao configurado/confirmado. Preencha .env.staging e use STAGING_CONFIRM=true para testes reais.");
  }

  assertNotMainProject(stagingRef);
  if (url.includes(MAIN_PROJECT_REF)) {
    throw new Error(`Bloqueado: VITE_SUPABASE_URL_STAGING aponta para o projeto principal ${MAIN_PROJECT_REF}.`);
  }

  const passwordA = String(env.STAGING_USER_A_PASSWORD || DEFAULT_PASSWORD);
  const passwordB = String(env.STAGING_USER_B_PASSWORD || DEFAULT_PASSWORD);
  const userAId = await ensureUser(url, serviceRole, USER_A_EMAIL, passwordA);
  const userBId = await ensureUser(url, serviceRole, USER_B_EMAIL, passwordB);
  const tokenA = await signIn(url, anonKey, USER_A_EMAIL, passwordA);
  const tokenB = await signIn(url, anonKey, USER_B_EMAIL, passwordB);

  const publicStore = firstRow(
    (await request({
      url,
      key: anonKey,
      path: "/rest/v1/stores?select=id,owner_id,slug,active&slug=eq.ne3d-teste&active=eq.true",
    })).body,
    "loja publica",
  );

  if (publicStore.owner_id !== userAId) {
    throw new Error("Seed staging nao esta vinculado ao user-a esperado. Rode npm run supabase:staging:seed.");
  }

  const publicProducts = (await request({
    url,
    key: anonKey,
    path: `/rest/v1/store_products?select=id,title,visible,stock_mode&store_id=eq.${publicStore.id}&visible=eq.true`,
  })).body;
  if (!Array.isArray(publicProducts) || publicProducts.length < 8) {
    throw new Error("Produtos publicos insuficientes no staging.");
  }

  const publicCategories = (await request({
    url,
    key: anonKey,
    path: `/rest/v1/store_categories?select=id,name,visible&store_id=eq.${publicStore.id}&visible=eq.true&order=order_index.asc`,
  })).body;
  if (!Array.isArray(publicCategories) || publicCategories.length < 6) {
    throw new Error("Categorias publicas insuficientes no staging.");
  }

  const publicLeadsAttempt = await request({
    url,
    key: anonKey,
    path: `/rest/v1/store_cart_leads?select=id&store_id=eq.${publicStore.id}`,
    expected: [200, 401, 403],
  });
  if (publicLeadsAttempt.status === 200 && Array.isArray(publicLeadsAttempt.body) && publicLeadsAttempt.body.length > 0) {
    throw new Error("Publico conseguiu listar leads privados.");
  }

  const leadPayload = {
    store_id: publicStore.id,
    owner_id: userAId,
    customer_name: "Cliente RLS staging",
    customer_phone: null,
    customer_note: "Lead real criado pelo teste de staging.",
    items_json: [{ product_id: publicProducts[0].id, title: publicProducts[0].title, quantity: 1, unit_price: 39.9, subtotal: 39.9 }],
    subtotal: 39.9,
    whatsapp_message: "Ola! Tenho interesse em 1x produto da loja NE 3D Teste.",
    status: "novo",
    source: "storefront-staging-test",
  };

  await request({
    url,
    key: anonKey,
    method: "POST",
    path: "/rest/v1/store_cart_leads",
    body: leadPayload,
    headers: { Prefer: "return=minimal" },
    expected: [201],
  });

  await request({
    url,
    key: anonKey,
    method: "POST",
    path: "/rest/v1/store_visits",
    body: { store_id: publicStore.id, product_id: null, event_type: "store_view", session_id: `phase36-${Date.now()}` },
    headers: { Prefer: "return=minimal" },
    expected: [201],
  });

  const eventPayloads = [
    { store_id: publicStore.id, product_id: publicProducts[0].id, event_type: "add_to_cart", metadata_json: { source: "staging-test" } },
    { store_id: publicStore.id, product_id: null, event_type: "whatsapp_click", metadata_json: { source: "staging-test" } },
    { store_id: publicStore.id, product_id: null, event_type: "lead_created", metadata_json: { source: "staging-test" } },
  ];

  for (const eventPayload of eventPayloads) {
    await request({
      url,
      key: anonKey,
      method: "POST",
      path: "/rest/v1/store_events",
      body: eventPayload,
      headers: { Prefer: "return=minimal" },
      expected: [201],
    });
  }

  const eventRows = (await request({
    url,
    key: anonKey,
    bearer: tokenA,
    path: `/rest/v1/store_events?select=event_type&store_id=eq.${publicStore.id}&metadata_json=cs.${encodeURIComponent(JSON.stringify({ source: "staging-test" }))}`,
  })).body;
  for (const eventType of ["add_to_cart", "whatsapp_click", "lead_created"]) {
    if (!Array.isArray(eventRows) || !eventRows.some((event) => event.event_type === eventType)) {
      throw new Error(`Evento de analytics nao encontrado no staging: ${eventType}`);
    }
  }

  const userALeads = (await request({
    url,
    key: anonKey,
    bearer: tokenA,
    path: `/rest/v1/store_cart_leads?select=id,owner_id,status,customer_name,customer_phone,items_json,subtotal&store_id=eq.${publicStore.id}&source=eq.storefront-staging-test&order=created_at.desc&limit=1`,
  })).body;
  const createdLead = firstRow(userALeads, "lead criado e listado pelo owner");
  if (createdLead.owner_id !== userAId) {
    throw new Error("user-a nao conseguiu listar o proprio lead.");
  }

  const userBLeads = (await request({
    url,
    key: anonKey,
    bearer: tokenB,
    path: `/rest/v1/store_cart_leads?select=id,owner_id,status&store_id=eq.${publicStore.id}`,
  })).body;
  if (Array.isArray(userBLeads) && userBLeads.some((lead) => lead.owner_id === userAId)) {
    throw new Error("user-b acessou leads privados do user-a.");
  }

  const patchAttempt = (await request({
    url,
    key: anonKey,
    bearer: tokenB,
    method: "PATCH",
    path: `/rest/v1/store_products?id=eq.${publicProducts[0].id}`,
    body: { title: "Alteracao indevida" },
    headers: { Prefer: "return=representation" },
    expected: [200],
  })).body;
  if (Array.isArray(patchAttempt) && patchAttempt.length > 0) {
    throw new Error("user-b conseguiu alterar produto do user-a.");
  }

  const orderDraft = firstRow(
    (await request({
      url,
      key: anonKey,
      bearer: tokenA,
      method: "POST",
      path: "/rest/v1/store_order_drafts",
      body: {
        store_id: publicStore.id,
        owner_id: userAId,
        lead_id: createdLead.id,
        customer_name: createdLead.customer_name,
        customer_phone: createdLead.customer_phone,
        items_json: createdLead.items_json,
        subtotal: createdLead.subtotal,
        status: "rascunho",
        erp_order_id: null,
      },
      headers: { Prefer: "return=representation" },
      expected: [201],
    })).body,
    "order draft",
  );

  await request({
    url,
    key: anonKey,
    bearer: tokenA,
    method: "PATCH",
    path: `/rest/v1/store_cart_leads?id=eq.${createdLead.id}`,
    body: { status: "convertido" },
    headers: { Prefer: "return=minimal" },
    expected: [204],
  });

  console.log("OK: Storefront staging validado com RLS real, lead real e order_draft.", {
    stagingRef,
    userAId,
    userBId,
    leadId: createdLead.id,
    orderDraftId: orderDraft.id,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
