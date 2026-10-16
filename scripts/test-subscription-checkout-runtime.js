const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

const root = path.resolve(__dirname, '..');
const clientId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

// Execute the actual checkout and billing helpers; replace only external I/O.
function loadCheckout(client, providerFetch, overrides = {}) {
  const env = { SUPABASE_URL: 'http://127.0.0.1:1', SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
    MERCADOPAGO_ACCESS_TOKEN: 'synthetic', START_PLAN_ENABLED: 'true',
    MERCADO_PAGO_START_PLAN_ID: 'synthetic-start-plan', ...overrides };
  let handler;
  const context = vm.createContext({ Request, Response, URL, TextEncoder, Uint8Array, Error, console,
    Deno: { env: { get: (key) => env[key] } }, createClient: () => client,
    fetch: providerFetch, serve: (callback) => { handler = callback; } });
  const shared = fs.readFileSync(path.join(root, 'supabase/functions/_shared/mercadopago-billing.ts'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'supabase/functions/mercadopago-create-subscription/index.ts'), 'utf8');
  vm.runInContext(stripTypeScriptTypes(shared).replace(/^export /gm, '') + '\n' +
    stripTypeScriptTypes(source.replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, '')), context);
  return handler;
}

function request(body = { plan_id: 'pro' }, token = 'synthetic-token') {
  return new Request('http://localhost/checkout', { method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body) });
}

function fixture() {
  const state = { calls: [], providerCalls: [], profileError: null, authError: null,
    profile: { client_id: clientId, company_id: 'company-id', role: 'operador', status: 'active' },
    erpProfile: { client_id: clientId, company_id: 'company-id', role: 'user', status: 'active' },
    superadmin: null, superadminError: null,
    ready: true, persistError: null, emptyPersist: false, providerError: false,
    provider: { id: 'synthetic-contract', status: 'pending',
      init_point: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=synthetic-contract' } };
  const client = { auth: { getUser: async () => ({ data: state.authError ? null : { user: { id: userId } },
    error: state.authError }) },
  from(table) {
    const query = { select() { return query; }, eq() { return query; }, async maybeSingle() {
      return { data: table === 'profiles' ? state.profile : table === 'superadmins' ? state.superadmin : state.erpProfile,
        error: table === 'superadmins' ? state.superadminError : state.profileError };
    } };
    return query;
  },
  async rpc(name, args) {
    assert.equal(name, 'persist_mercadopago_checkout');
    state.calls.push(JSON.parse(JSON.stringify(args)));
    if (args.p_preapproval == null) return { data: { ready: state.ready,
      reason: 'MERCADOPAGO_SUBSCRIPTION_ALREADY_LINKED',
      client: { id: args.p_client_id, client_code: 'SYNTHETIC', email: 'checkout@example.invalid' } }, error: state.preflightError || null };
    return { data: state.emptyPersist ? null : { persisted: true, subscription_id: 'row-id' }, error: state.persistError };
  } };
  const handler = loadCheckout(client, async (url, init) => {
    assert.equal(url, 'https://api.mercadopago.com/preapproval');
    assert.equal(init.method, 'POST');
    state.providerCalls.push(JSON.parse(init.body));
    if (state.providerTimeout) throw new Error('Synthetic provider response lost');
    if (state.providerMalformed) return new Response('not json', { status: 200 });
    return Response.json(state.provider, { status: state.providerError ? 500 : state.providerRefusal ? 422 : 200 });
  });
  return { state, handler };
}

async function main() {
  for (const [requested, canonical, external] of [['pro', 'pro', 'premium'], ['premium', 'pro', 'premium'], ['start', 'start', 'start']]) {
    const { state, handler } = fixture();
    const response = await handler(request({ plan_id: requested }));
    assert.equal(response.status, 200, requested);
    assert.equal((await response.json()).ok, true);
    assert.equal(state.calls.length, 2);
    assert(state.calls.every((call) => call.p_plan_slug === canonical
      && call.p_billing_variant === `${canonical}_monthly`));
    assert.equal(state.providerCalls[0].metadata.plan_slug, external, 'Keep compatible provider metadata');
    assert.equal(state.providerCalls[0].auto_recurring.transaction_amount, canonical === 'start' ? 29.9 : 59.9);
    assert.equal(state.providerCalls[0].metadata.user_id, userId);
  }
  for (const configure of [
    (s) => { s.authError = { message: 'invalid session' }; },
    (s) => { s.profileError = { message: 'database unavailable' }; },
    (s) => { s.superadminError = { message: 'authority unavailable' }; },
    (s) => { s.profile = null; s.erpProfile = null; },
    (s) => { s.profile.status = 'blocked'; s.erpProfile.status = 'inactive'; },
    (s) => { s.erpProfile.client_id = 'another-client'; },
    (s) => { s.preflightError = { message: 'missing RPC or authorization denied' }; },
    (s) => { s.ready = false; },
  ]) {
    const { state, handler } = fixture(); configure(state);
    const response = await handler(request());
    assert.notEqual(response.status, 200);
    assert.equal(state.providerCalls.length, 0, 'Never create external contract on failed preflight');
  }
  for (const body of [{ plan_id: 'free' }, { plan_id: 'pro', clientId: 'another-company-client' }]) {
    const { state, handler } = fixture();
    assert.notEqual((await handler(request(body))).status, 200);
    assert.equal(state.providerCalls.length, 0);
  }
  {
    const { state, handler } = fixture();
    state.superadmin = { user_id: userId };
    const response = await handler(request({ plan_id: 'start', clientId: 'another-company-client' }));
    assert.equal(response.status, 200, 'Persisted active superadmin can purchase for another tenant');
    assert.equal(state.calls[0].p_client_id, 'another-company-client');
    assert.equal(state.providerCalls[0].metadata.client_id, 'another-company-client');
  }
  {
    const { state, handler } = fixture();
    state.profile.role = 'superadmin';
    assert.notEqual((await handler(request({ plan_id: 'pro', clientId: 'another-company-client' }))).status, 200,
      'Public profile label alone must not expand administrative authority');
    assert.equal(state.providerCalls.length, 0);
  }
  {
    const { state, handler } = fixture();
    assert.notEqual((await handler(request(undefined, ''))).status, 200);
    assert.equal(state.providerCalls.length, 0);
  }
  for (const configure of [
    (s) => { s.persistError = { message: 'Synthetic transaction rollback' }; },
    (s) => { s.emptyPersist = true; },
    (s) => { s.provider.init_point = 'https://mercadopago.com.br.attacker.invalid/'; },
    (s) => { s.provider.status = 'authorized'; },
  ]) {
    const { state, handler } = fixture(); configure(state);
    const response = await handler(request());
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, 'CHECKOUT_PERSISTENCE_REVIEW_REQUIRED');
    assert.equal(body.providerCreated, true);
    assert.equal(body.retryable, false);
    assert.equal(body.subscriptionId, 'synthetic-contract');
    assert.equal(state.providerCalls.length, 1, 'Never retry/cancel a contract automatically');
  }
  for (const configure of [
    (s) => { s.providerError = true; },
    (s) => { s.providerTimeout = true; },
    (s) => { s.providerMalformed = true; },
    (s) => { delete s.provider.id; },
  ]) {
    const { state, handler } = fixture(); configure(state);
    const response = await handler(request());
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error, 'CHECKOUT_PROVIDER_REVIEW_REQUIRED');
    assert.equal(body.providerCreated, null, 'Without a confirmed ID, creation remains unknown');
    assert.equal(body.providerRequestAttempted, true);
    assert.equal(body.retryable, false);
    assert.equal(body.subscriptionId, null);
    assert.equal(state.calls.length, 1, 'Ambiguous provider response must not persist a checkout');
    assert.equal(state.providerCalls.length, 1, 'Do not automatically retry a lost provider response');
  }
  {
    const { state, handler } = fixture(); state.providerRefusal = true;
    assert.equal((await handler(request())).status, 400);
    assert.equal(state.calls.length, 1, 'Definite provider rejection must not persist a checkout');
  }
  console.log('PASS checkout runtime: canonical Start/Pro, member purchase, authorization, preflight, provider errors and no false persistence success.');
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { loadCheckout, request };
