const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { getTarget, createFixtures, runWithCleanup } = require('./supabase-homolog-test-utils');
const { loadHandler, request } = require('./test-billing-webhook-runtime');

// Only process-provided local credentials and this run's synthetic provider IDs.
// The actual webhook and Data API are exercised; Mercado Pago is never contacted.
assert(!process.argv[2] || process.argv[2] === 'local', 'Only local integration is permitted');
const { url, anonKey, serviceKey } = getTarget('local');
const runId = crypto.randomBytes(6).toString('hex');
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: async (input, init) => {
    const endpoint = new URL(typeof input === 'string' ? input : input.url);
    assert.equal(endpoint.origin, url, 'Database requests must stay on the isolated local API');
    return fetch(input, init);
  } },
};
const service = createClient(url, serviceKey, options);
const fixtures = createFixtures(service, runId);
const notifications = new Set();
const paymentIds = new Set();
const eventKeys = new Set();
const baseTime = Date.now() - 4 * 3600000;
const version = (seconds) => new Date(baseTime + seconds * 1000).toISOString();
const must = (result, label = 'local API') => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
};

async function register(label) {
  const email = `s3d-snapshot-${runId}-${label}@example.invalid`;
  const password = crypto.randomBytes(24).toString('base64url');
  const created = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: { name: label, business_name: `Payment snapshot ${label} ${runId}` } }), 'synthetic Auth');
  fixtures.user(created.user);
  const session = fixtures.session(createClient(url, anonKey, options));
  must(await session.auth.signInWithPassword({ email, password }), 'synthetic login');
  const profile = must(await service.from('profiles').select('client_id,company_id')
    .eq('user_id', created.user.id).single(), 'synthetic profile');
  assert(profile.client_id && profile.company_id, 'Signup must create an isolated tenant');
  return { id: created.user.id, clientId: profile.client_id, session };
}

function paymentId(label) {
  const id = `synthetic-snapshot-${runId}-${label}`;
  paymentIds.add(id);
  return id;
}

function payload(user, id, changes = {}) {
  assert(paymentIds.has(id), 'Provider ID must belong to this invocation');
  return {
    id, status: 'approved', transaction_amount: 59.9, payment_method_id: 'synthetic',
    date_created: version(0), date_approved: version(20), date_last_updated: version(30),
    metadata: { client_id: user.clientId, user_id: user.id, plan_slug: 'pro', billing_variant: 'pro_monthly' },
    ...changes,
  };
}

function delivery(id, label) {
  const notification = `synthetic-snapshot-${runId}-${label}`;
  assert(!notifications.has(notification), 'Each scenario must use its own delivery identity');
  notifications.add(notification);
  eventKeys.add(`mercado_pago:${notification}:payment:${id.toLowerCase()}`);
  return request('payment', true, id, notification);
}

function handlerFor(id, snapshot, beforeResponse = async () => {}) {
  assert(paymentIds.has(id), 'Provider ID is outside the synthetic ledger');
  // Capture before awaiting the barrier: the delayed response really is old.
  const captured = structuredClone(snapshot);
  return loadHandler(service, async (endpoint, init) => {
    assert.equal(endpoint, `https://api.mercadopago.com/v1/payments/${id}`);
    assert(!init?.method || init.method === 'GET', 'Only a synthetic read is allowed');
    await beforeResponse();
    return Response.json(captured);
  });
}

async function deliver(user, id, label, changes = {}) {
  return handlerFor(id, payload(user, id, changes))(delivery(id, label));
}

async function state(user) {
  return {
    client: must(await service.from('clients').select('*').eq('id', user.clientId).single(), 'client snapshot'),
    subscription: must(await service.from('subscriptions').select('*').eq('client_id', user.clientId).single(), 'subscription snapshot'),
    payments: must(await service.from('payments').select('*').eq('client_id', user.clientId).order('id'), 'payment snapshot'),
    erp: must(await service.from('erp_payments').select('*').eq('cliente_id', user.clientId).order('id'), 'ERP snapshot'),
    audits: must(await service.from('audit_logs').select('*').eq('client_id', user.clientId).order('id'), 'audit snapshot'),
  };
}

function rpcArgs(user, snapshot) {
  return { p_client_id: user.clientId, p_user_id: user.id, p_plan_slug: 'pro',
    p_billing_variant: 'pro_monthly', p_payment: snapshot };
}

function assertSingleCredit(before, after, payment, label) {
  const previousEnd = before.subscription.premium_until || before.subscription.plan_expires_at
    || before.subscription.current_period_end || before.subscription.expires_at;
  // created_at and the trigger's now() share the database transaction clock.
  // Do not compare the host clock to PostgreSQL when the tenant starts Free.
  const base = Math.max(Date.parse(payment.created_at), Date.parse(payment.paid_at),
    previousEnd ? Date.parse(previousEnd) : -Infinity);
  assert(Number.isFinite(base), `${label}: credit reference must be finite`);
  assert.equal(Date.parse(after.subscription.premium_until), base + 30 * 86400000,
    `${label}: exactly one 30-day credit is required`);
  assert.equal(after.client.plan_expires_at, after.subscription.premium_until,
    `${label}: client and subscription must agree`);
}

async function main() {
  const current = await register('current');
  const other = await register('other');
  assert.notEqual(current.clientId, other.clientId, 'Independent tenants are required');
  const otherBefore = await state(other);
  const id = paymentId('ordered');
  const approved = payload(current, id);
  const oldPending = payload(current, id, { status: 'pending', date_approved: null, date_last_updated: version(10) });
  let releaseOld;
  let reachedOld;
  const oldGate = new Promise((resolve) => { releaseOld = resolve; });
  const oldReached = new Promise((resolve) => { reachedOld = resolve; });
  const oldResponse = handlerFor(id, oldPending, async () => { reachedOld(); await oldGate; })(delivery(id, 'held-old-pending'));
  let paid;
  try {
    await Promise.race([oldReached, oldResponse.then((response) => {
      throw new Error(`Old delivery returned before reaching the synthetic provider: HTTP ${response.status}`);
    })]);
    const response = await handlerFor(id, approved)(delivery(id, 'new-approved'));
    assert.equal(response.status, 200, 'New approved snapshot must be accepted');
    paid = await state(current);
    assert.equal(paid.subscription.active_plan, 'pro');
    assert.equal(paid.subscription.payment_status, 'approved');
    assert.equal(paid.payments.length, 1);
    assert.equal(paid.erp.length, 1);
    assert.equal(paid.payments[0].status, 'approved');
    assert.equal(paid.erp[0].status, 'approved');
  } finally {
    releaseOld();
    await oldResponse;
  }
  assert.equal((await oldResponse).status, 200, 'Older provider revision may be acknowledged as ignored');
  assert.deepEqual(await state(current), paid, 'Delayed pending snapshot must not overwrite any financial projection');
  console.log('PASS held old pending response finishes after approved without regressing payment, ERP, client or license');

  assert.equal((await handlerFor(id, approved)(delivery(id, 'same-version-approved'))).status, 200);
  assert.deepEqual(await state(current), paid, 'Identical provider revision must not add audit rows or credit days again');
  console.log('PASS equal-version duplicate has no additional financial write, audit or license credit');

  const refunded = payload(current, id, { status: 'refunded', date_last_updated: version(40) });
  assert.equal((await handlerFor(id, refunded)(delivery(id, 'new-refund'))).status, 200);
  const refundState = await state(current);
  for (const field of ['premium_until', 'plan_expires_at', 'current_period_end', 'expires_at'])
    assert.equal(refundState.subscription[field], paid.subscription[field], 'Refund must preserve granted validity');
  assert.equal(refundState.subscription.active_plan, 'pro');
  assert.equal(refundState.payments[0].status, 'refunded');
  assert.equal(refundState.erp[0].status, 'refunded');
  const reviews = refundState.audits.filter((row) => row.action === 'billing_payment_review_required');
  assert.equal(reviews.length, 1, 'Refund requires exactly one review record');
  assert.equal(reviews[0].details.policy, 'preserve_existing_validity');
  assert.equal((await handlerFor(id, approved)(delivery(id, 'old-approved-after-refund'))).status, 200);
  assert.deepEqual(await state(current), refundState, 'Old approval cannot erase refund, review or change validity');
  assert.equal((await handlerFor(id, refunded)(delivery(id, 'same-version-refund'))).status, 200);
  assert.deepEqual(await state(current), refundState, 'Duplicate refund must not add another financial audit/review');
  console.log('PASS refund preserves validity and review; stale approval and duplicate refund cannot mutate accepted state');

  for (const [label, changes] of [
    ['conflicting-status', { status: 'approved', date_last_updated: version(40) }],
    ['conflicting-amount', { status: 'refunded', transaction_amount: 58.9, date_last_updated: version(40) }],
    ['missing-existing-version', { status: 'refunded', date_last_updated: null }],
    ['invalid-existing-version', { status: 'refunded', date_last_updated: 'not-a-timestamp' }],
  ]) {
    assert.equal((await deliver(current, id, label, changes)).status, 500, `${label} must fail closed`);
    assert.deepEqual(await state(current), refundState, `${label} must not partially mutate financial state`);
  }
  console.log('PASS conflicting or missing/invalid existing versions fail without financial mutations');

  for (const [label, changes] of [
    ['missing-new-version', { date_last_updated: null }],
    ['invalid-new-version', { date_last_updated: 'not-a-timestamp' }],
    ['infinite-version', { date_last_updated: 'infinity' }],
    ['missing-approval-date', { date_approved: null }],
    ['invalid-approval-date', { date_approved: 'not-a-timestamp' }],
    ['infinite-approval-date', { date_approved: 'infinity' }],
    ['invalid-creation-date', { date_created: 'not-a-timestamp' }],
  ]) {
    const invalidId = paymentId(label);
    assert.equal((await deliver(current, invalidId, label, changes)).status, 500, `${label} must fail closed`);
    assert.deepEqual(await state(current), refundState, `${label} must not insert a payment, credit or partial ERP row`);
  }
  console.log('PASS malformed/missing provider timestamps cannot create partial payment or license effects');

  const deniedArgs = rpcArgs(current, refunded);
  const anonymous = createClient(url, anonKey, options);
  for (const [label, session] of [['ordinary', current.session], ['anonymous', anonymous]]) {
    assert.equal((await session.rpc('apply_mercadopago_payment', deniedArgs)).error?.code, '42501',
      `${label} cannot invoke service-only payment ingestion`);
  }
  must(await service.from('superadmins').insert({ user_id: current.id, status: 'active' }), 'synthetic superadmin grant');
  try {
    assert.equal((await current.session.rpc('apply_mercadopago_payment', deniedArgs)).error?.code, '42501',
      'A frontend superadmin is not a service-role ingestion worker');
  } finally {
    must(await service.from('superadmins').delete().eq('user_id', current.id), 'synthetic superadmin revoke');
  }
  assert.deepEqual(await state(current), refundState, 'Denied RPCs must not change financial data');
  console.log('PASS anonymous, ordinary and frontend-superadmin sessions cannot call payment ingestion RPC');

  const crossTenant = payload(other, id, { date_last_updated: version(50) });
  assert.equal((await handlerFor(id, crossTenant)(delivery(id, 'cross-tenant-existing-id'))).status, 500,
    'Existing provider payment identity cannot be reassigned to another tenant');
  assert((await service.rpc('apply_mercadopago_payment', rpcArgs(other, crossTenant))).error,
    'Service RPC must independently reject a payment identity owned by another tenant');
  assert.deepEqual(await state(current), refundState, 'Tenant A payment identity and license remain unchanged');
  assert.deepEqual(await state(other), otherBefore, 'Tenant B receives neither another tenant payment nor its license');
  console.log('PASS existing provider payment ID is immutable across tenants through both webhook and RPC');

  const beforeConcurrent = await state(current);
  const concurrentIds = [paymentId('concurrent-a'), paymentId('concurrent-b')];
  const concurrent = await Promise.all(concurrentIds.map((concurrentId, index) =>
    deliver(current, concurrentId, `concurrent-${index}`, { date_approved: version(60), date_last_updated: version(70) })));
  concurrent.forEach((response) => assert.equal(response.status, 200, 'Each independent approved payment must commit'));
  const afterConcurrent = await state(current);
  assert.equal(Date.parse(afterConcurrent.subscription.premium_until) - Date.parse(beforeConcurrent.subscription.premium_until),
    60 * 86400000, 'Two different payments must credit exactly 60 days');
  assert.equal(afterConcurrent.payments.length, beforeConcurrent.payments.length + 2);
  assert.equal(afterConcurrent.erp.length, beforeConcurrent.erp.length + 2);
  assert.equal(afterConcurrent.audits.length, beforeConcurrent.audits.length + 2);
  assert.equal(afterConcurrent.client.active_plan, afterConcurrent.subscription.active_plan);
  assert.equal(afterConcurrent.client.plan_expires_at, afterConcurrent.subscription.premium_until);
  assert.equal(afterConcurrent.client.payment_status, afterConcurrent.subscription.payment_status);
  for (const concurrentId of concurrentIds) {
    assert.equal(afterConcurrent.payments.find((row) => row.mercado_pago_payment_id === concurrentId)?.status, 'approved');
    assert.equal(afterConcurrent.erp.find((row) => row.payment_id === concurrentId)?.status, 'approved');
  }
  assert.deepEqual(await state(other), otherBefore, 'Concurrent ingestion cannot alter an unrelated tenant');
  console.log('PASS two concurrent same-plan payments add exactly 60 days with consistent client and ERP projections');

  const beforeReassignment = await state(current);
  const reassigned = payload(current, id, { status: 'refunded', date_last_updated: version(80),
    metadata: { ...approved.metadata, user_id: other.id } });
  assert.equal((await handlerFor(id, reassigned)(delivery(id, 'same-client-user-reassignment'))).status, 500,
    'A newer provider revision cannot reassign an existing non-null payment user within the same tenant');
  assert((await service.rpc('apply_mercadopago_payment', {
    ...rpcArgs(current, reassigned), p_user_id: other.id,
  })).error, 'The service RPC must independently protect an existing payment user identity');
  assert.deepEqual(await state(current), beforeReassignment, 'Rejected user reassignment must preserve financial state');
  assert.deepEqual(await state(other), otherBefore, 'User reassignment cannot modify the unrelated tenant');
  console.log('PASS a newer revision cannot reassign a persisted non-null user within the same client');

  const raceId = paymentId('cross-tenant-first-insert');
  const raceUsers = [current, other];
  const beforeRace = await Promise.all(raceUsers.map((user) => state(user)));
  const firstInsertResponses = await Promise.all(raceUsers.map((user, index) =>
    deliver(user, raceId, `cross-tenant-first-insert-${index}`,
      { date_approved: version(90), date_last_updated: version(100) })));
  assert.deepEqual(firstInsertResponses.map((response) => response.status).sort(), [200, 500],
    'Exactly one tenant may win the first insertion of a globally unique provider payment');
  const winnerIndex = firstInsertResponses.findIndex((response) => response.status === 200);
  const loserIndex = 1 - winnerIndex;
  const racePayments = must(await service.from('payments').select('*')
    .eq('mercado_pago_payment_id', raceId), 'global first-insert payment identity');
  const raceErp = must(await service.from('erp_payments').select('*')
    .eq('payment_id', raceId), 'global first-insert ERP identity');
  assert.equal(racePayments.length, 1, 'First-insert race must retain one financial payment identity');
  assert.equal(raceErp.length, 1, 'First-insert race must retain one ERP identity');
  assert.equal(racePayments[0].client_id, raceUsers[winnerIndex].clientId);
  assert.equal(racePayments[0].user_id, raceUsers[winnerIndex].id);
  assert.equal(raceErp[0].cliente_id, raceUsers[winnerIndex].clientId);
  const afterRace = await Promise.all(raceUsers.map((user) => state(user)));
  assertSingleCredit(beforeRace[winnerIndex], afterRace[winnerIndex], racePayments[0], 'First-insert race winner');
  assert.equal(afterRace[winnerIndex].payments.length, beforeRace[winnerIndex].payments.length + 1);
  assert.equal(afterRace[winnerIndex].erp.length, beforeRace[winnerIndex].erp.length + 1);
  assert.equal(afterRace[winnerIndex].audits.length, beforeRace[winnerIndex].audits.length + 1);
  assert.deepEqual(afterRace[loserIndex], beforeRace[loserIndex],
    'The losing tenant must receive no payment, ERP row, credit, audit or partial client/subscription write');
  console.log('PASS cross-tenant first-insert race has one winner, one payment/ERP identity and one credit only');

  const onBehalfId = paymentId('superadmin-on-behalf');
  const beforeOnBehalf = await state(other);
  const adminBefore = await state(current);
  const onBehalf = payload(other, onBehalfId, { date_approved: version(110), date_last_updated: version(120),
    metadata: { client_id: other.clientId, user_id: current.id, plan_slug: 'pro', billing_variant: 'pro_monthly' } });
  const onBehalfArgs = { ...rpcArgs(other, onBehalf), p_user_id: current.id };
  must(await service.from('superadmins').insert({ user_id: current.id, status: 'active' }),
    'grant synthetic checkout superadmin');
  try {
    assert.equal((await other.session.rpc('apply_mercadopago_payment', onBehalfArgs)).error?.code, '42501',
      'An ordinary session cannot ingest an on-behalf checkout');
    assert.equal((await current.session.rpc('apply_mercadopago_payment', onBehalfArgs)).error?.code, '42501',
      'Even the checkout superadmin frontend cannot impersonate a service-role webhook');
    assert.deepEqual(await state(other), beforeOnBehalf, 'Denied frontend ingestion cannot pre-credit the checkout');
    assert.equal((await handlerFor(onBehalfId, onBehalf)(delivery(onBehalfId, 'superadmin-on-behalf'))).status, 200,
      'Trusted provider checkout metadata may identify a superadmin paying on behalf of another client');
    const afterOnBehalf = await state(other);
    const onBehalfPayment = afterOnBehalf.payments.find((row) => row.mercado_pago_payment_id === onBehalfId);
    assert(onBehalfPayment, 'The on-behalf payment must be persisted for its beneficiary');
    assert.equal(onBehalfPayment.client_id, other.clientId);
    assert.equal(onBehalfPayment.user_id, current.id, 'Historical checkout actor need not belong to the beneficiary profile');
    assertSingleCredit(beforeOnBehalf, afterOnBehalf, onBehalfPayment, 'On-behalf checkout');
    assert.equal(afterOnBehalf.payments.length, beforeOnBehalf.payments.length + 1);
    assert.equal(afterOnBehalf.erp.length, beforeOnBehalf.erp.length + 1);
    assert.equal(afterOnBehalf.audits.length, beforeOnBehalf.audits.length + 1);
    assert.deepEqual(await state(current), adminBefore, 'The checkout actor must not receive the beneficiary license or financial rows');
  } finally {
    must(await service.from('superadmins').delete().eq('user_id', current.id), 'revoke synthetic checkout superadmin');
  }
  console.log('PASS persisted superadmin on-behalf checkout works through the trusted webhook while frontend RPC access stays denied');
}

async function cleanupEvents() {
  const errors = [];
  const attempt = async (action) => { try { await action(); } catch (error) { errors.push(error); } };
  // Exact identities generated above; never clean by broad status/date filters.
  for (const key of eventKeys) {
    await attempt(async () => must(await service.from('billing_webhook_events').delete()
      .eq('provider', 'mercado_pago').eq('event_key', key), 'remove synthetic reservation'));
    for (const type of ['webhook_received', 'webhook_ignored_duplicate'])
      await attempt(async () => must(await service.from('app_diagnostic_events').delete()
        .eq('fingerprint', `mercadopago:${type}:${key}`.slice(0, 240)), 'remove synthetic diagnostic'));
  }
  for (const notification of notifications)
    await attempt(async () => must(await service.from('erp_webhook_events').delete()
      .eq('provider', 'mercado_pago').eq('event_id', notification), 'remove synthetic delivery'));
  for (const id of paymentIds) {
    await attempt(async () => must(await service.from('erp_payments').delete().eq('payment_id', id), 'remove synthetic ERP payment'));
    for (const type of ['webhook_received', 'webhook_ignored_duplicate', 'webhook_start_plan_resolved', 'webhook_start_plan_resolution_failed'])
      await attempt(async () => must(await service.from('app_diagnostic_events').delete()
        .eq('fingerprint', `mercadopago:${type}:${id}`.slice(0, 240)), 'remove synthetic payment diagnostic'));
  }
  if (errors.length) throw new AggregateError(errors, errors.map((error) => error.message).join('; '));
}

runWithCleanup(main, [cleanupEvents, () => fixtures.cleanup()]).catch((error) => {
  console.error(`FAIL local payment snapshots: ${error.message}`);
  process.exitCode = 1;
});
