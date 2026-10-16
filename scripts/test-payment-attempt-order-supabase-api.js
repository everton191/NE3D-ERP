const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { getTarget, createFixtures, runWithCleanup } = require('./supabase-homolog-test-utils');
const { loadHandler, request } = require('./test-billing-webhook-runtime');

// Real isolated Auth/Data API and the actual webhook; no provider connection.
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
const negativeStatuses = ['rejected', 'cancelled', 'refunded', 'charged_back'];
const must = (result, label = 'local API') => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
};

async function register(label) {
  const email = `s3d-attempt-${runId}-${label}@example.invalid`;
  const password = crypto.randomBytes(24).toString('base64url');
  const created = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: { name: label, business_name: `Payment attempt ${label} ${runId}` } }), 'synthetic Auth');
  fixtures.user(created.user);
  const session = fixtures.session(createClient(url, anonKey, options));
  must(await session.auth.signInWithPassword({ email, password }), 'synthetic login');
  const profile = must(await service.from('profiles').select('client_id,company_id')
    .eq('user_id', created.user.id).single(), 'synthetic profile');
  assert(profile.client_id && profile.company_id, 'Signup must create an isolated tenant');
  return { id: created.user.id, clientId: profile.client_id, session };
}

function paymentId(label) {
  const id = `synthetic-attempt-${runId}-${label}`;
  paymentIds.add(id);
  return id;
}

function snapshot(user, id, plan, createdAt, status = 'pending', updatedAt = createdAt + 10) {
  assert(paymentIds.has(id), 'Provider ID must belong to this invocation');
  return {
    id, status, transaction_amount: plan === 'start' ? 29.9 : 59.9, payment_method_id: 'synthetic',
    date_created: version(createdAt), date_approved: status === 'approved' ? version(createdAt + 20) : null,
    date_last_updated: version(updatedAt),
    metadata: { client_id: user.clientId, user_id: user.id, plan_slug: plan, billing_variant: `${plan}_monthly` },
  };
}

function deliver(payment, label, beforeResponse = async () => {}) {
  assert(paymentIds.has(payment.id), 'Provider ID is outside the synthetic ledger');
  const notification = `synthetic-attempt-${runId}-${label}`;
  assert(!notifications.has(notification), 'Each scenario needs its own delivery identity');
  notifications.add(notification);
  eventKeys.add(`mercado_pago:${notification}:payment:${payment.id.toLowerCase()}`);
  const captured = structuredClone(payment);
  const handler = loadHandler(service, async (endpoint, init) => {
    assert.equal(endpoint, `https://api.mercadopago.com/v1/payments/${payment.id}`);
    assert(!init?.method || init.method === 'GET', 'Only a synthetic provider read is allowed');
    await beforeResponse();
    return Response.json(captured);
  });
  return handler(request('payment', true, payment.id, notification));
}

async function accept(payment, label) {
  const response = await deliver(payment, label);
  const errors = response.status === 200 ? [] : must(await service.from('erp_webhook_events').select('error')
    .eq('event_id', `synthetic-attempt-${runId}-${label}`).eq('status', 'error'), 'synthetic error detail');
  assert.equal(response.status, 200, `${label}: synthetic payment must commit: ${JSON.stringify(errors)}`);
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

function assertFinancial(actual, payment) {
  const financial = actual.payments.find((row) => row.mercado_pago_payment_id === payment.id);
  const erp = actual.erp.find((row) => row.payment_id === payment.id);
  assert(financial && erp, 'Accepted snapshot must retain both financial records');
  assert.equal(financial.status, payment.status, 'Financial status belongs to this payment');
  assert.equal(erp.status, payment.status, 'ERP status belongs to this payment');
  assert.equal(financial.metadata.date_created, payment.date_created, 'Provider creation is retained');
  assert.equal(erp.payload.date_created, payment.date_created, 'ERP retains provider creation');
}

function assertProjectionUnchanged(before, after, label) {
  for (const field of ['pending_plan', 'payment_status', 'pending_started_at']) {
    assert.equal(after.subscription[field], before.subscription[field], `${label}: subscription ${field}`);
    if (Object.hasOwn(before.client, field))
      assert.equal(after.client[field], before.client[field], `${label}: client ${field}`);
  }
}

function assertPaidAccessUnchanged(before, after, label) {
  for (const field of ['active_plan', 'plan_code', 'plan_id', 'plan_price', 'billing_variant', 'plan_status',
    'premium_until', 'plan_expires_at', 'current_period_end', 'expires_at', 'next_billing_at',
    'subscription_active', 'subscription_status', 'manual_override', 'blocked_at'])
    assert.equal(after.subscription[field], before.subscription[field], `${label}: paid ${field}`);
  for (const field of ['active_plan', 'plano_atual', 'plan_price', 'plan_expires_at', 'blocked_at'])
    assert.equal(after.client[field], before.client[field], `${label}: mirrored ${field}`);
}

function assertResolved(actual, status, label) {
  const projected = ['refunded', 'charged_back'].includes(status) ? 'cancelled' : status;
  for (const target of [actual.subscription, actual.client]) {
    assert.equal(target.payment_status, projected, `${label}: latest attempt status`);
    assert.equal(target.pending_plan, null, `${label}: latest attempt clears its own pending plan`);
  }
  assert.equal(actual.subscription.pending_started_at, null, `${label}: own pending timestamp cleared`);
}

function reviews(actual, action, id) {
  return actual.audits.filter((row) => row.action === action
    && row.details.mercado_pago_payment_id === id);
}

async function seeded(label) {
  const user = await register(label);
  const seed = snapshot(user, paymentId(`${label}-seed`), 'pro', 0, 'approved', 30);
  await accept(seed, `${label}-seed`);
  return user;
}

async function olderNegative(status, newStatus) {
  const label = `old-${status}-${newStatus}`;
  const user = await seeded(label);
  const paidNegative = ['refunded', 'charged_back'].includes(status);
  const older = snapshot(user, paymentId(`${label}-old`), 'start', 100, paidNegative ? 'approved' : 'pending', 130);
  await accept(older, `${label}-old`);
  const newer = snapshot(user, paymentId(`${label}-new`), 'pro', 200, newStatus, 230);
  await accept(newer, `${label}-new`);
  const before = await state(user);
  // A later revision timestamp belongs to A only; it cannot make A a later checkout than B.
  const negative = { ...older, status, date_last_updated: version(1000) };
  await accept(negative, `${label}-negative`);
  const after = await state(user);
  assertProjectionUnchanged(before, after, 'Older distinct negative cannot replace the newer checkout');
  assertPaidAccessUnchanged(before, after, 'Older negative preserves paid validity and plan');
  assertFinancial(after, negative);
  assertFinancial(after, newer);
  assert.equal(reviews(after, 'billing_payment_review_required', older.id).length, paidNegative ? 1 : 0,
    'Refund or chargeback must still flag exactly one review despite skipped status projection');
  if (paidNegative) {
    assert.equal(reviews(after, 'billing_payment_review_required', older.id)[0].details.policy,
      'preserve_existing_validity');
    const license = must(await user.session.rpc('get_effective_license'), 'real licensed access after old refund');
    assert.equal(license.effective_status, 'ACTIVE', 'Refund review must not revoke paid access');
  }
  await accept(negative, `${label}-retry`);
  assert.deepEqual(await state(user), after, 'Identical old negative cannot duplicate review or financial audit');
  console.log(`PASS old ${status} cannot overwrite newer ${newStatus}; financial history and validity retained`);
}

async function latestNegative(status) {
  const label = `latest-${status}`;
  const user = await seeded(label);
  const older = snapshot(user, paymentId(`${label}-old`), 'start', 100);
  const newest = snapshot(user, paymentId(`${label}-new`), 'pro', 200);
  await accept(older, `${label}-old`);
  await accept(newest, `${label}-new`);
  const before = await state(user);
  assert.equal(before.subscription.pending_plan, 'pro');
  const negative = { ...newest, status, date_last_updated: version(300) };
  await accept(negative, `${label}-negative`);
  const after = await state(user);
  assertResolved(after, status, label);
  assertPaidAccessUnchanged(before, after, 'Latest negative cannot revoke previously earned validity');
  assertFinancial(after, negative);
  // A current financial revision of an older pending A is not a new attempt.
  const pendingReplay = { ...older, date_last_updated: version(2000) };
  await accept(pendingReplay, `${label}-old-pending-revision`);
  const replayed = await state(user);
  assertProjectionUnchanged(after, replayed, 'Older pending revision cannot mask resolved latest checkout');
  assertPaidAccessUnchanged(after, replayed, 'Stale pending revision preserves paid access');
  assertFinancial(replayed, pendingReplay);
  console.log(`PASS latest ${status} resolves only its own pending; old pending revision cannot remask it`);
}

async function tiedAttempts() {
  const user = await seeded('tied');
  const first = snapshot(user, paymentId('tied-first'), 'start', 100);
  const second = snapshot(user, paymentId('tied-second'), 'pro', 100);
  await accept(first, 'tied-first');
  const before = await state(user);
  await accept(second, 'tied-second');
  const after = await state(user);
  assertProjectionUnchanged(before, after, 'Equal attempt times cannot invent UUID or plan priority');
  assertPaidAccessUnchanged(before, after, 'Ambiguous attempt preserves current access');
  assertFinancial(after, second);
  const review = reviews(after, 'billing_payment_attempt_review_required', second.id);
  assert.equal(review.length, 1, 'Ambiguous attempt must persist one review');
  assert.equal(review[0].details.reason, 'ambiguous_attempt_time');
  const negative = { ...second, status: 'rejected', date_last_updated: version(1000) };
  await accept(negative, 'tied-negative');
  const rejected = await state(user);
  assertProjectionUnchanged(after, rejected, 'New same-payment revision does not resolve distinct tied attempts');
  assert.equal(reviews(rejected, 'billing_payment_attempt_review_required', second.id).length, 1,
    'Attempt review is once per payment, not once per revision');
  assertFinancial(rejected, negative);
  console.log('PASS tied source creation preserves status/pending and flags one review without arbitrary priority');
}

async function invalidCreationDates() {
  const user = await seeded('invalid-date');
  const valid = snapshot(user, paymentId('invalid-existing'), 'start', 100);
  await accept(valid, 'invalid-existing');
  const before = await state(user);
  for (const [label, changes] of [
    ['missing-existing', { date_created: null }],
    ['malformed-existing', { date_created: 'not-a-timestamp' }],
    ['changed-existing', { date_created: version(900) }],
  ]) {
    const response = await deliver({ ...valid, status: 'rejected', date_last_updated: version(1000), ...changes }, label);
    assert.equal(response.status, 500, `${label}: inconsistent creation must fail closed for retry/review`);
    assert.deepEqual(await state(user), before, `${label}: no financial, license, mirror or audit partial writes`);
  }
  for (const [label, value] of [['missing-new', null], ['malformed-new', 'tomorrow']]) {
    const invalid = { ...snapshot(user, paymentId(label), 'pro', 300), date_created: value };
    const response = await deliver(invalid, label);
    assert.equal(response.status, 500, `${label}: a trusted source creation timestamp is required`);
    assert.deepEqual(await state(user), before, `${label}: invalid new snapshot leaves state untouched`);
  }
  const repaired = { ...valid, status: 'rejected', date_last_updated: version(1100) };
  await accept(repaired, 'valid-after-date-errors');
  const after = await state(user);
  assertResolved(after, 'rejected', 'Valid retry after source-date errors');
  assertPaidAccessUnchanged(before, after, 'Failed source dates cannot damage subsequent recovery');
  console.log('PASS missing, malformed and mutated source creation fail atomically; valid revision recovers');
}

async function concurrentOrder(newFirst) {
  const label = newFirst ? 'overlap-new-first' : 'overlap-old-first';
  const user = await seeded(label);
  const older = snapshot(user, paymentId(`${label}-old`), 'start', 100);
  await accept(older, `${label}-old`);
  const negative = { ...older, status: 'rejected', date_last_updated: version(1000) };
  const newer = snapshot(user, paymentId(`${label}-new`), 'pro', 200);
  let release;
  let reached;
  const gate = new Promise((resolve) => { release = resolve; });
  const entered = new Promise((resolve) => { reached = resolve; });
  const delayed = newFirst ? negative : newer;
  const first = newFirst ? newer : negative;
  const delayedResponse = deliver(delayed, `${label}-delayed`, async () => { reached(); await gate; });
  try {
    await Promise.race([entered, delayedResponse.then((response) => {
      throw new Error(`Delayed synthetic provider returned prematurely: HTTP ${response.status}`);
    })]);
    await accept(first, `${label}-first`);
  } finally {
    release();
  }
  assert.equal((await delayedResponse).status, 200, 'Overlapping delayed handler must commit');
  const after = await state(user);
  assert.equal(after.subscription.payment_status, 'pending', 'Checkout source time wins in either response order');
  assert.equal(after.subscription.pending_plan, 'pro');
  assert.equal(after.client.payment_status, 'pending');
  assert.equal(after.client.pending_plan, 'pro');
  assertFinancial(after, negative);
  assertFinancial(after, newer);

  const stillOlder = { ...negative, status: 'cancelled', date_last_updated: version(2000) };
  const latestResolved = { ...newer, status: 'rejected', date_last_updated: version(400) };
  const responses = await Promise.all([
    deliver(stillOlder, `${label}-competing-old`), deliver(latestResolved, `${label}-competing-new`),
  ]);
  responses.forEach((response) => assert.equal(response.status, 200, 'Competing financial writes must commit'));
  const resolved = await state(user);
  assertResolved(resolved, 'rejected', 'Actual competing RPCs preserve source order');
  assertPaidAccessUnchanged(after, resolved, 'Concurrent negative attempts preserve earned license');
  assertFinancial(resolved, stillOlder);
  assertFinancial(resolved, latestResolved);
  console.log(`PASS ${label}: overlapping handlers and simultaneous RPCs agree with source attempt order`);
}

async function main() {
  // This first case reproduces the pre-fix defect, not only an expected SQL shape.
  for (const status of negativeStatuses) {
    await olderNegative(status, 'pending');
    await olderNegative(status, 'approved');
  }
  for (const status of negativeStatuses) await latestNegative(status);
  await tiedAttempts();
  await invalidCreationDates();
  await concurrentOrder(true);
  await concurrentOrder(false);
}

async function cleanupEvents() {
  const errors = [];
  const attempt = async (action) => { try { await action(); } catch (error) { errors.push(error); } };
  // Exact generated identities only: never delete by broad date/status/tenant query.
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
  console.error(`FAIL local distinct payment attempt order: ${error.message}`);
  process.exitCode = 1;
});
