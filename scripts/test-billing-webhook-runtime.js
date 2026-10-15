const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const { createHmac, webcrypto } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const clientId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

// Execute the actual handler and signature verifier, replacing only network boundaries.
function loadHandler(client, providerFetch) {
  const env = { SUPABASE_URL: 'http://127.0.0.1:1', SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
    MERCADOPAGO_ACCESS_TOKEN: 'synthetic', MERCADOPAGO_WEBHOOK_SECRET: 'synthetic-secret', START_PLAN_ENABLED: 'true' };
  let handler;
  const context = vm.createContext({ Request, Response, URL, TextEncoder, Uint8Array, Error,
    crypto: webcrypto, Deno: { env: { get: (key) => env[key] } }, console,
    createClient: () => client, fetch: providerFetch, serve: (callback) => { handler = callback; } });
  const shared = fs.readFileSync(path.join(root, 'supabase/functions/_shared/mercadopago-billing.ts'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'supabase/functions/mercadopago-webhook/index.ts'), 'utf8');
  vm.runInContext(stripTypeScriptTypes(shared).replace(/^export /gm, '') + '\n' +
    stripTypeScriptTypes(source.replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, '')), context);
  return handler;
}

function request(type = 'payment', valid = true, dataId = '123', notification = 'notification-1') {
  const ts = Date.now();
  const signature = createHmac('sha256', 'synthetic-secret')
    .update(`id:${dataId.toLowerCase()};request-id:synthetic-request;ts:${ts};`).digest('hex');
  return new Request(`http://localhost/webhook?data.id=${encodeURIComponent(dataId)}&type=${type}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-request-id': 'synthetic-request',
      'x-signature': `ts=${ts},v1=${valid ? signature : '00'}` },
    body: JSON.stringify({ id: notification, type, data: { id: dataId } }),
  });
}

function fixture() {
  const rows = { clients: [{ id: clientId, client_code: 'SYNTHETIC' }], plans: [{ id: 'plan-id', slug: 'premium' }, { id: 'pro-id', slug: 'pro' }],
    subscriptions: [{ id: 'subscription-id', client_id: clientId, active_plan: 'pro', plan_code: 'PRO', plan_status: 'ACTIVE' }],
    payments: [], erp_payments: [], billing_webhook_events: [], erp_webhook_events: [], audit_logs: [], app_diagnostic_events: [] };
  const state = { rows, operations: [], fail: null, fetches: 0, onFetch: null,
    provider: { id: '123', status: 'approved', transaction_amount: 59.9,
      metadata: { client_id: clientId, user_id: userId, plan_slug: 'pro' } } };
  const client = { from(table) {
    let operation = 'select', payload, conflict, single = false, optional = false, throwing = false;
    const filters = [];
    const query = {
      select() { return query; }, eq(key, value) { filters.push([key, value]); return query; },
      order() { return query; }, limit() { return query; },
      maybeSingle() { single = true; optional = true; return query; }, single() { single = true; return query; },
      throwOnError() { throwing = true; return query; },
      insert(value) { operation = 'insert'; payload = value; return query; },
      update(value) { operation = 'update'; payload = value; return query; },
      upsert(value, options) { operation = 'upsert'; payload = value; conflict = options.onConflict; return query; },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          state.operations.push({ table, operation, payload });
          let error = state.fail?.({ table, operation, payload }) ? { message: 'Synthetic database failure', code: 'TEST' } : null;
          let data = rows[table].filter((row) => filters.every(([key, value]) => row[key] === value));
          if (!error && operation === 'insert' && table === 'billing_webhook_events' && rows[table].some((row) => row.event_key === payload.event_key)) {
            error = { code: '23505', message: 'duplicate' };
          }
          if (!error) {
            if (operation === 'insert') { data = [{ id: 'synthetic-id', ...payload }]; rows[table].push(...data); }
            if (operation === 'update') data.forEach((row) => Object.assign(row, payload));
            if (operation === 'upsert') {
              let row = rows[table].find((item) => item[conflict] === payload[conflict]);
              if (!row) { row = {}; rows[table].push(row); }
              Object.assign(row, payload); data = [row];
            }
            if (single && data.length !== 1 && !(optional && data.length === 0)) error = { code: 'PGRST116', message: 'Expected one row' };
          }
          if (error && throwing) throw error;
          return { data: error ? null : single ? data[0] || null : data, error };
        }).then(resolve, reject);
      },
    };
    return query;
  } };
  const handler = loadHandler(client, async (url) => {
    assert.match(url, /^https:\/\/api\.mercadopago\.com\/(v1\/payments|preapproval)\/123$/);
    state.fetches++;
    if (state.onFetch) await state.onFetch();
    return Response.json(state.provider);
  });
  return { ...state, state, handler };
}

async function main() {
  for (const [table, operation, status] of [
    ['clients', 'select'], ['plans', 'select'], ['subscriptions', 'select'],
    ['payments', 'upsert'], ['erp_payments', 'upsert'], ['clients', 'update'],
    ['audit_logs', 'insert'], ['erp_webhook_events', 'insert', 'processed'],
    ['billing_webhook_events', 'update', 'processed'],
  ]) {
    const test = fixture();
    test.state.fail = (call) => call.table === table && call.operation === operation && (!status || call.payload?.status === status);
    assert.equal((await test.handler(request())).status, 500, `${table}/${operation}: database failure must not be acknowledged`);
    assert.notEqual(test.rows.billing_webhook_events[0]?.status, 'processed');
    test.state.fail = null;
    assert.equal((await test.handler(request())).status, 200, `${table}: retry must recover: ${JSON.stringify(test.rows.erp_webhook_events.filter((row) => row.status === 'error'))}`);
    assert.equal(test.rows.payments.length, 1, 'retry must keep one payment identity');
    assert.equal(test.rows.erp_payments.length, 1);
    assert.equal(test.rows.billing_webhook_events[0].status, 'processed');
    const fetches = test.state.fetches;
    assert.equal((await (await test.handler(request())).json()).duplicate, true);
    assert.equal(test.state.fetches, fetches, 'processed duplicate must not call provider');
    console.log(`PASS failure/recovery/duplicate: ${table}/${operation}`);
  }
  const missing = fixture(); missing.rows.clients.length = 0;
  assert.equal((await missing.handler(request())).status, 500, 'unresolved client must not be acknowledged');
  const noPlan = fixture(); noPlan.rows.plans.length = 0;
  assert.equal((await noPlan.handler(request())).status, 500, 'missing plan must fail closed');
  const zeroRows = fixture();
  zeroRows.state.fail = ({ table, operation }) => {
    if (table === 'clients' && operation === 'update') zeroRows.rows.clients.length = 0;
    return false;
  };
  assert.equal((await zeroRows.handler(request())).status, 500, 'zero-row update is not a confirmed write');
  for (const id of ['', 'not-a-uuid', '22222222-2222-4222-8222222222222']) {
    const malformed = fixture(); malformed.state.provider.metadata.user_id = id;
    assert.equal((await malformed.handler(request())).status, 500, 'malformed user UUID must remain rejected');
    assert.equal(malformed.rows.payments.length, 0);
  }
  const invalid = fixture(); invalid.state.fail = () => true;
  assert.equal((await invalid.handler(request('payment', false))).status, 401);
  assert.equal(invalid.state.fetches, 0);
  console.log('PASS missing client/plan, zero-row write, malformed UUID and invalid signature');

  for (const status of ['authorized', 'cancelled']) {
    for (const table of ['subscriptions', ...(status === 'cancelled' ? ['clients'] : []), 'audit_logs']) {
      const test = fixture(); test.state.provider.status = status;
      test.state.fail = (call) => call.table === table && call.operation === (table === 'audit_logs' ? 'insert' : 'update');
      assert.equal((await test.handler(request('preapproval'))).status, 500);
      test.state.fail = null;
      assert.equal((await test.handler(request('preapproval'))).status, 200);
    }
  }
  console.log('PASS preapproval/cancellation write failures and recovery');

  const concurrent = fixture();
  let release, reached;
  const ready = new Promise((resolve) => { reached = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  concurrent.state.onFetch = async () => { reached(); await gate; };
  const first = concurrent.handler(request());
  await ready;
  assert.equal((await concurrent.handler(request())).status, 500, 'in-flight event must not be acknowledged');
  assert.equal(concurrent.rows.billing_webhook_events[0].status, 'received', 'non-owner must not release reservation');
  release();
  assert.equal((await first).status, 200);
  assert.equal(concurrent.state.fetches, 1);
  const race = fixture(); race.state.fail = (call) => call.table === 'payments';
  assert.equal((await race.handler(request())).status, 500);
  race.state.fail = null;
  const responses = await Promise.all([race.handler(request()), race.handler(request())]);
  assert(responses.some((response) => response.status === 200));
  assert.equal(race.state.fetches, 2, 'only one retry may acquire the failed event');
  assert.equal(race.rows.billing_webhook_events[0].status, 'processed');
  console.log('PASS concurrent delivery and compare-and-swap retry ownership');

  const stuck = fixture();
  stuck.state.fail = (call) => call.table === 'payments' || (call.table === 'billing_webhook_events' && call.operation === 'update');
  assert.equal((await stuck.handler(request())).status, 500);
  stuck.state.fail = null;
  assert.equal((await stuck.handler(request())).status, 500, 'unresolved reservation requires reconciliation, never false success');
  const ignored = fixture();
  assert.equal((await (await ignored.handler(request('unknown'))).json()).ignored, true);
  assert.equal((await (await ignored.handler(request('unknown'))).json()).duplicate, true);
  assert.equal(ignored.state.fetches, 0);
  console.log('PASS unresolved reservation remains retryable and unknown events are ignored');
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { loadHandler, request };
