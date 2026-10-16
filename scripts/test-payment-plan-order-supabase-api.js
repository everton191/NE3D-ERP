const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { getTarget, createFixtures, runWithCleanup } = require('./supabase-homolog-test-utils');
const { loadHandler, request } = require('./test-billing-webhook-runtime');

// Real Auth, Data API and webhook; only this run's synthetic gateway responses.
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
const day = 86400000;
const baseTime = Date.now() - 4 * 3600000;
const version = (seconds) => new Date(baseTime + seconds * 1000).toISOString();
const priceFor = (plan) => plan === 'start' ? 29.9 : 59.9;
const must = (result, label = 'local API') => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
};

async function register(label) {
  const email = `s3d-plan-order-${runId}-${label}@example.invalid`;
  const password = crypto.randomBytes(24).toString('base64url');
  const created = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: { name: label, business_name: `Payment plan order ${label} ${runId}` } }), 'synthetic Auth');
  fixtures.user(created.user);
  const session = fixtures.session(createClient(url, anonKey, options));
  must(await session.auth.signInWithPassword({ email, password }), 'synthetic login');
  const profile = must(await service.from('profiles').select('client_id,company_id')
    .eq('user_id', created.user.id).single(), 'synthetic profile');
  assert(profile.client_id && profile.company_id, 'Signup must create an isolated tenant');
  return { id: created.user.id, clientId: profile.client_id, session };
}

function paymentId(label) {
  const id = `synthetic-plan-order-${runId}-${label}`;
  paymentIds.add(id);
  return id;
}

function snapshot(user, id, plan, approvedAt, changes = {}) {
  assert(paymentIds.has(id), 'Provider ID must belong to this invocation');
  return {
    id, status: 'approved', transaction_amount: priceFor(plan), payment_method_id: 'synthetic',
    date_created: version(approvedAt - 10), date_approved: version(approvedAt),
    date_last_updated: version(approvedAt + 10),
    metadata: { client_id: user.clientId, user_id: user.id, plan_slug: plan, billing_variant: `${plan}_monthly` },
    ...changes,
  };
}

function deliver(payment, label, beforeResponse = async () => {}) {
  assert(paymentIds.has(payment.id), 'Provider ID is outside the synthetic ledger');
  const notification = `synthetic-plan-order-${runId}-${label}`;
  assert(!notifications.has(notification), 'Each scenario needs its own delivery identity');
  notifications.add(notification);
  eventKeys.add(`mercado_pago:${notification}:payment:${payment.id.toLowerCase()}`);
  const captured = structuredClone(payment);
  const handler = loadHandler(service, async (endpoint, init) => {
    assert.equal(endpoint, `https://api.mercadopago.com/v1/payments/${payment.id}`);
    assert(!init?.method || init.method === 'GET', 'Only a synthetic read is allowed');
    await beforeResponse();
    return Response.json(captured);
  });
  return handler(request('payment', true, payment.id, notification));
}

async function accept(payment, label) {
  const response = await deliver(payment, label);
  assert.equal(response.status, 200, `${label}: synthetic payment must commit`);
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

function assertProjection(actual, plan, amount = priceFor(plan), label = 'commercial projection') {
  assert.equal(actual.subscription.active_plan, plan, `${label}: subscription plan`);
  assert.equal(actual.subscription.plan_code, plan.toUpperCase(), `${label}: canonical plan code`);
  assert.equal(Number(actual.subscription.plan_price), amount, `${label}: subscription price`);
  assert.equal(actual.subscription.billing_variant, `${plan}_monthly`, `${label}: billing variant`);
  assert.equal(actual.client.active_plan, plan, `${label}: client plan`);
  assert.equal(actual.client.plano_atual, plan, `${label}: legacy client projection`);
  assert.equal(Number(actual.client.plan_price), amount, `${label}: client price`);
  assert.equal(actual.client.plan_expires_at, actual.subscription.premium_until, `${label}: mirrored expiry`);
}

function assertFinancialRows(actual, payment) {
  const financial = actual.payments.find((row) => row.mercado_pago_payment_id === payment.id);
  const erp = actual.erp.find((row) => row.payment_id === payment.id);
  assert(financial && erp, 'Each accepted payment must retain its own financial and ERP rows');
  // The existing checkout normalizer intentionally writes Pro as the legacy
  // backend slug "premium". The canonical license is Pro, but this test must
  // not demand that unrelated financial history normalization be changed.
  const expectedBackendPlan = payment.metadata.plan_slug === 'pro' ? 'premium' : payment.metadata.plan_slug;
  for (const [label, plan, amount, status] of [
    ['payment', financial.plan_slug, financial.amount, financial.status],
    ['ERP', erp.plano, erp.valor, erp.status],
  ]) {
    assert.equal(plan, expectedBackendPlan, `${label}: normalizer's own financial plan retained`);
    assert.equal(Number(amount), payment.transaction_amount, `${label}: original amount retained`);
    assert.equal(status, payment.status, `${label}: original financial status retained`);
  }
  return financial;
}

function assertSingleCredit(before, after, payment, label) {
  const financial = assertFinancialRows(after, payment);
  const previousEnd = before.subscription.premium_until || before.subscription.plan_expires_at
    || before.subscription.current_period_end || before.subscription.expires_at;
  // First insertion and trigger now() use the same database transaction clock.
  const base = Math.max(Date.parse(financial.created_at), Date.parse(financial.paid_at),
    previousEnd ? Date.parse(previousEnd) : -Infinity);
  assert(Number.isFinite(base), `${label}: finite credit reference`);
  assert.equal(Date.parse(after.subscription.premium_until), base + 30 * day,
    `${label}: exactly one 30-day credit`);
  for (const field of ['plan_expires_at', 'current_period_end', 'expires_at'])
    assert.equal(after.subscription[field], after.subscription.premium_until, `${label}: ${field} agrees`);
  assert.equal(after.client.plan_expires_at, after.subscription.premium_until, `${label}: mirrored expiry`);
}

async function outOfOrder(newPlan, oldPlan, label) {
  const user = await register(label);
  const newer = snapshot(user, paymentId(`${label}-new`), newPlan, 200);
  const older = snapshot(user, paymentId(`${label}-old`), oldPlan, 100);
  let before = await state(user);
  await accept(newer, `${label}-new`);
  const first = await state(user);
  assertSingleCredit(before, first, newer, `${label}: first credit`);
  assertProjection(first, newPlan);
  before = first;
  await accept(older, `${label}-old`);
  const after = await state(user);
  assertSingleCredit(before, after, older, `${label}: delayed credit`);
  assertProjection(after, newPlan, priceFor(newPlan), 'Delayed old payment must not replace newer paid plan');
  assertFinancialRows(after, newer);
  assert.equal((await deliver(older, `${label}-old-retry`)).status, 200);
  assert.deepEqual(await state(user), after, 'Identical delayed approval must not add days, reviews or audit rows');
  console.log(`PASS ${label}: delayed ${oldPlan} cannot overwrite newer ${newPlan}; both credited once`);
}

async function ascending() {
  const user = await register('ascending');
  for (const [index, plan] of ['start', 'pro'].entries()) {
    const payment = snapshot(user, paymentId(`ascending-${plan}`), plan, 100 + index * 100);
    const before = await state(user);
    await accept(payment, `ascending-${plan}`);
    const after = await state(user);
    assertSingleCredit(before, after, payment, `Ascending ${plan}`);
    assertProjection(after, plan);
  }
  console.log('PASS a genuinely later approval updates the commercial plan and price without losing earlier credit');
}

async function equalApprovalTime(conflicting) {
  const label = conflicting ? 'conflicting-tie' : 'equivalent-tie';
  const user = await register(label);
  const first = snapshot(user, paymentId(`${label}-first`), 'pro', 200);
  const second = snapshot(user, paymentId(`${label}-second`), conflicting ? 'start' : 'pro', 200);
  await accept(first, `${label}-first`);
  const before = await state(user);
  await accept(second, `${label}-second`);
  const after = await state(user);
  assertSingleCredit(before, after, second, label);
  assertProjection(after, 'pro', priceFor('pro'), 'A tie must not invent an arbitrary plan priority');
  assertFinancialRows(after, first);
  const beforeReviews = before.audits.filter((row) => row.action === 'billing_payment_projection_review_required');
  const reviews = after.audits.filter((row) => row.action === 'billing_payment_projection_review_required');
  assert.equal(reviews.length - beforeReviews.length, conflicting ? 1 : 0,
    'Only conflicting commercial tuples at equal approval time require a new review');
  if (conflicting) assert.equal(reviews.at(-1).details.reason, 'ambiguous_approval_time');
  assert.equal((await deliver(second, `${label}-retry`)).status, 200);
  assert.deepEqual(await state(user), after, 'Retry of a tied payment cannot duplicate credit or review');
  console.log(`PASS ${label}: both distinct payments receive one credit; ${conflicting ? 'conflict preserved and reviewed' : 'equivalent tuple needs no review'}`);
}

async function newerManualGrant() {
  const user = await register('manual');
  const seed = snapshot(user, paymentId('manual-seed'), 'pro', 200);
  await accept(seed, 'manual-seed');
  const seeded = await state(user);
  const databaseTime = assertFinancialRows(seeded, seed).created_at;
  assert(Date.parse(databaseTime) > Date.parse(version(100)), 'Manual authority must be newer than the old approval');
  const startPlan = must(await service.from('plans').select('id').eq('slug', 'start').single(), 'synthetic manual catalog');
  const manualEnd = new Date(Date.parse(seeded.subscription.premium_until) + 20 * day).toISOString();
  must(await service.from('subscriptions').update({
    plan_id: startPlan.id, plan_code: 'START', active_plan: 'start', plan_status: 'ACTIVE',
    plan_price: 41.2, billing_variant: 'start_monthly', price_locked: true,
    manual_override: true, manual_override_reason: `synthetic ${runId}`, manual_override_by: user.id,
    manual_override_at: databaseTime, premium_until: manualEnd, plan_expires_at: manualEnd,
    current_period_end: manualEnd, expires_at: manualEnd,
  }).eq('id', seeded.subscription.id).eq('client_id', user.clientId), 'set own synthetic manual fixture');
  must(await service.from('clients').update({ active_plan: 'start', plano_atual: 'start',
    plan_price: 41.2, price_locked: true, plan_expires_at: manualEnd }).eq('id', user.clientId),
  'mirror own synthetic manual fixture');
  const before = await state(user);
  const delayed = snapshot(user, paymentId('manual-old-payment'), 'pro', 100);
  await accept(delayed, 'manual-old-payment');
  const after = await state(user);
  assertSingleCredit(before, after, delayed, 'Older approval after manual grant');
  assertProjection(after, 'start', 41.2, 'Newer manual authority preserved');
  for (const field of ['manual_override', 'manual_override_reason', 'manual_override_by', 'manual_override_at', 'price_locked'])
    assert.equal(after.subscription[field], before.subscription[field], `Manual ${field} must not be cleared by an older payment`);
  console.log('PASS approval older than a manual grant adds its one credit without replacing manual plan, price or authority');
}

async function equivalentApprovalResolvesOwnPending() {
  const user = await register('own-pending');
  const first = snapshot(user, paymentId('own-pending-first'), 'pro', 200);
  await accept(first, 'own-pending-first');
  const id = paymentId('own-pending-second');
  const pending = snapshot(user, id, 'pro', 200, { status: 'pending',
    date_created: version(195), date_approved: null, date_last_updated: version(198) });
  await accept(pending, 'own-pending-second-pending');
  const before = await state(user);
  assert.equal(before.subscription.pending_plan, 'pro');
  assert.equal(before.subscription.payment_status, 'pending');
  const approved = snapshot(user, id, 'pro', 200, { date_created: version(195) });
  await accept(approved, 'own-pending-second-approved');
  const after = await state(user);
  assertSingleCredit(before, after, approved, 'Equivalent tied approval resolves its own checkout');
  assertProjection(after, 'pro');
  for (const target of [after.subscription, after.client]) {
    assert.equal(target.pending_plan, null, 'A completed checkout must not retain its own pending plan');
    assert.equal(target.payment_status, 'approved', 'Its own approved payment must resolve the pending status');
    if (Object.hasOwn(target, 'pending_started_at'))
      assert.equal(target.pending_started_at, null, 'Its own pending timestamp must be cleared');
  }
  assert.equal(after.audits.filter((row) => row.action === 'billing_payment_projection_review_required').length, 0,
    'Equivalent commercial facts do not require conflict review');
  console.log('PASS an equivalent tied approval resolves its own pending checkout while adding one paid period');
}

async function latestApprovalPreservesNewerAttempt() {
  const user = await register('late-latest');
  const seed = snapshot(user, paymentId('late-latest-seed'), 'pro', 200);
  await accept(seed, 'late-latest-seed');
  const newerAttempt = snapshot(user, paymentId('late-latest-new-attempt'), 'pro', 300,
    { status: 'pending', date_created: version(300), date_approved: null, date_last_updated: version(310) });
  await accept(newerAttempt, 'late-latest-new-attempt');
  const before = await state(user);
  assert.equal(before.subscription.payment_status, 'pending');
  const lateApproval = snapshot(user, paymentId('late-latest-old-attempt'), 'start', 400,
    { date_created: version(100) });
  await accept(lateApproval, 'late-latest-old-attempt-approved');
  const after = await state(user);
  assertSingleCredit(before, after, lateApproval, 'Latest approval from an older checkout');
  assertProjection(after, 'start', priceFor('start'), 'Latest approval must still control paid commercial facts');
  for (const field of ['pending_plan', 'payment_status', 'pending_started_at']) {
    assert.equal(after.subscription[field], before.subscription[field],
      `Latest paid approval cannot resolve a distinct later checkout's ${field}`);
    if (Object.hasOwn(before.client, field))
      assert.equal(after.client[field], before.client[field], `Client must preserve newer checkout ${field}`);
  }
  assertFinancialRows(after, newerAttempt);
  console.log('PASS latest paid approval updates plan and price while a distinct newer-created checkout stays pending');
}

async function forgedPublicAuditHasNoAuthority() {
  const target = await register('forged-audit-target');
  const ordinary = await register('forged-audit-ordinary');
  assert.notEqual(target.clientId, ordinary.clientId, 'The forged audit must cross two isolated synthetic tenants');
  const seed = snapshot(target, paymentId('forged-audit-seed'), 'pro', 200);
  await accept(seed, 'forged-audit-seed');
  const ordinaryBefore = await state(ordinary);
  const forgedId = crypto.randomUUID();
  const future = new Date(baseTime + 365 * day).toISOString();
  const forgedInsert = await ordinary.session.from('audit_logs').insert({
    id: forgedId, user_id: ordinary.id, client_id: target.clientId,
    action: 'superadmin_update_subscription', created_at: future,
    details: { action: 'SET_FREE', actor_user_id: ordinary.id, synthetic_run_id: runId,
      reason: 'Synthetic forged public audit must never become plan authority' },
  });
  must(forgedInsert, 'prove ordinary session can insert the synthetic forged audit');
  assert.equal(forgedInsert.status, 201, 'Test requires a real successful INSERT, not assumed rejection');
  // Read back as service rather than requiring unrelated frontend SELECT
  // privileges on the audit table in order to demonstrate its INSERT policy.
  const persisted = must(await service.from('audit_logs').select('id,user_id,client_id,action,created_at')
    .eq('id', forgedId).single(), 'read persisted synthetic forged audit independently');
  assert.equal(persisted.id, forgedId);
  assert.equal(persisted.user_id, ordinary.id);
  assert.equal(persisted.action, 'superadmin_update_subscription');
  assert.equal(Date.parse(persisted.created_at), Date.parse(future));
  assert.equal(persisted.client_id, target.clientId, 'Cross-tenant forged audit really reached the isolated database');
  const before = await state(target);
  const later = snapshot(target, paymentId('forged-audit-later-paid'), 'start', 300);
  await accept(later, 'forged-audit-later-paid');
  const after = await state(target);
  assertSingleCredit(before, after, later, 'New approval after forged public audit');
  assertProjection(after, 'start', priceFor('start'), 'User-controlled audit cannot freeze another tenant paid plan');
  assert.equal(after.audits.filter((row) => row.action === 'billing_payment_projection_review_required').length,
    before.audits.filter((row) => row.action === 'billing_payment_projection_review_required').length,
    'A forged public audit must not create a false administrative-authority review');
  assert.deepEqual(await state(ordinary), ordinaryBefore, 'The ordinary tenant receives no target payment or license changes');
  console.log('PASS a real cross-tenant ordinary audit INSERT has no authority over paid plan projection');
}

async function authorizedFreeDecisionHasPrivateAuthority() {
  const admin = await register('authorized-free-admin');
  const target = await register('authorized-free-target');
  const seed = snapshot(target, paymentId('authorized-free-seed'), 'pro', 200);
  await accept(seed, 'authorized-free-seed');
  must(await service.from('superadmins').insert({ user_id: admin.id, status: 'active' }), 'grant own synthetic persisted superadmin');
  try {
    const result = must(await admin.session.rpc('superadmin_update_subscription', {
      target_user_id: target.id, action: 'SET_FREE', plan_code: 'FREE', premium_until: null,
      reason: `Synthetic authorized Free decision ${runId}`,
    }), 'authorized real superadmin Free RPC');
    assert.equal(result.active_plan, 'free', 'Real authenticated administrative RPC must confirm Free');
    const before = await state(target);
    assert.equal(before.subscription.active_plan, 'free');
    assert.equal(before.subscription.plan_code, 'FREE');
    assert.equal(before.subscription.subscription_active, false);
    assert.equal(before.subscription.manual_override, false,
      'Free has no manual paid flag; its authority must survive independently');
    const paidAuthority = before.audits.filter((row) => row.action === 'superadmin_update_subscription'
      && row.user_id === admin.id && row.details.action === 'SET_FREE');
    assert.equal(paidAuthority.length, 1, 'Successful Free RPC must retain its genuine audit evidence');
    const delayed = snapshot(target, paymentId('authorized-free-delayed'), 'start', 100);
    await accept(delayed, 'authorized-free-delayed');
    const after = await state(target);
    assertSingleCredit(before, after, delayed, 'Delayed receipt after authorized Free decision');
    for (const field of ['active_plan', 'plan_code', 'plan_id', 'plan_price', 'plan_status',
      'subscription_active', 'manual_override', 'subscription_status', 'billing_variant'])
      assert.equal(after.subscription[field], before.subscription[field], `Authorized Free ${field} must not be reactivated`);
    assert.equal(after.client.active_plan, 'free');
    assert.equal(after.client.plano_atual, 'free');
    const reviews = after.audits.filter((row) => row.action === 'billing_payment_projection_review_required'
      && row.details.mercado_pago_payment_id === delayed.id);
    assert.equal(reviews.length, 1, 'One delayed receipt requires exactly one administrative-authority review');
    assert.equal(reviews[0].details.reason, 'newer_manual_override');
    const license = must(await target.session.rpc('get_effective_license'), 'license after protected Free decision');
    assert.equal(license.active_plan, 'free', 'An extended date alone must not reactivate paid access');
    assert.equal(license.has_full_access, false);
    console.log('PASS real authorized Free RPC remains authoritative over delayed payment without granting paid access');
  } finally {
    must(await service.from('superadmins').delete().eq('user_id', admin.id), 'revoke own synthetic superadmin');
  }
}

async function delayedFirstCreditReactivatesExpiredPaidLicense() {
  const user = await register('expired-late-renewal');
  const newer = snapshot(user, paymentId('expired-late-renewal-newer'), 'pro', 200);
  await accept(newer, 'expired-late-renewal-newer');
  const paid = await state(user);
  const expiredAt = version(50);
  // Only this run's own synthetic subscription is expired. Keep its proven
  // paid tuple and immutable receipt, with no manual decision or block.
  must(await service.from('subscriptions').update({
    premium_until: expiredAt, plan_expires_at: expiredAt, current_period_end: expiredAt,
    expires_at: expiredAt, next_billing_at: expiredAt, proximo_vencimento: expiredAt,
    plan_status: 'EXPIRED', subscription_status: 'expired', status: 'expired',
    status_assinatura: 'expired', subscription_active: false,
  }).eq('id', paid.subscription.id).eq('client_id', user.clientId), 'expire own synthetic paid subscription');
  const expiredLicense = must(await user.session.rpc('get_effective_license'), 'read truly expired synthetic license');
  assert.notEqual(expiredLicense.active_plan, 'pro', 'Fixture must not still grant licensed Pro');
  assert.notEqual(expiredLicense.effective_status, 'ACTIVE', 'Fixture must really be inactive before renewal');
  const before = await state(user);
  assert.equal(before.subscription.active_plan, 'pro', 'Expired subscription retains its known commercial tuple');
  assert.equal(Number(before.subscription.plan_price), priceFor('pro'));
  assert.equal(before.subscription.manual_override, false);
  assert.equal(before.subscription.blocked_at, null);
  const older = snapshot(user, paymentId('expired-late-renewal-older'), 'start', 100);
  await accept(older, 'expired-late-renewal-older');
  const after = await state(user);
  assertSingleCredit(before, after, older, 'Delayed genuine first credit renews expired access');
  assertProjection(after, 'pro', priceFor('pro'), 'Expired renewal must retain the newer paid commercial tuple');
  const renewedLicense = must(await user.session.rpc('get_effective_license'), 'read renewed effective license');
  assert.equal(renewedLicense.active_plan, 'pro', 'A genuine new paid period must reactivate actual licensed Pro');
  assert.equal(renewedLicense.effective_status, 'ACTIVE', 'New paid validity must not remain logically expired');
  assert.equal(renewedLicense.has_full_access, true, 'Renewed Pro must grant its conventional paid permissions');
  assert.equal(after.subscription.plan_status, 'ACTIVE');
  assert.equal(after.subscription.subscription_status, 'active');
  assert.equal(after.subscription.status, 'active');
  assert.equal(after.subscription.subscription_active, true);
  assert.equal(after.audits.filter((row) => row.action === 'billing_payment_projection_review_required').length,
    before.audits.filter((row) => row.action === 'billing_payment_projection_review_required').length,
    'An unambiguous, unblocked late renewal needs no administrative or ambiguity review');
  console.log('PASS a delayed first credit renews expired licensed Pro while preserving its newer paid plan and price');
}

async function newerPending() {
  const user = await register('pending');
  const newerPaid = snapshot(user, paymentId('pending-paid'), 'pro', 200);
  await accept(newerPaid, 'pending-paid');
  const pending = snapshot(user, paymentId('pending-new-checkout'), 'start', 300,
    { status: 'pending', date_created: version(300), date_approved: null, date_last_updated: version(310) });
  await accept(pending, 'pending-new-checkout');
  const before = await state(user);
  assert.equal(before.subscription.pending_plan, 'start');
  assert.equal(before.subscription.payment_status, 'pending');
  const older = snapshot(user, paymentId('pending-old-approved'), 'start', 100);
  await accept(older, 'pending-old-approved');
  const after = await state(user);
  assertSingleCredit(before, after, older, 'Old approval with a newer pending checkout');
  assertProjection(after, 'pro');
  for (const field of ['pending_plan', 'payment_status', 'pending_started_at']) {
    assert.equal(after.subscription[field], before.subscription[field], `Unrelated delayed approval must preserve subscription ${field}`);
    if (Object.hasOwn(before.client, field))
      assert.equal(after.client[field], before.client[field], `Unrelated delayed approval must preserve client ${field}`);
  }
  assertFinancialRows(after, pending);
  console.log('PASS older first approval cannot clear a newer pending checkout or replace a newer paid plan');
}

async function concurrentApprovals(newFirst) {
  const label = newFirst ? 'concurrent-new-first' : 'concurrent-old-first';
  const user = await register(label);
  const older = snapshot(user, paymentId(`${label}-old`), 'start', 100);
  const newer = snapshot(user, paymentId(`${label}-new`), 'pro', 200);
  let releaseDelayed;
  let reachedDelayed;
  const gate = new Promise((resolve) => { releaseDelayed = resolve; });
  const reached = new Promise((resolve) => { reachedDelayed = resolve; });
  const first = newFirst ? newer : older;
  const delayed = newFirst ? older : newer;
  const delayedResponse = deliver(delayed, `${label}-delayed`, async () => { reachedDelayed(); await gate; });
  let firstState;
  try {
    await Promise.race([reached, delayedResponse.then((response) => {
      throw new Error(`Delayed synthetic provider returned early: HTTP ${response.status}`);
    })]);
    await accept(first, `${label}-first`);
    firstState = await state(user);
  } finally {
    releaseDelayed();
  }
  assert.equal((await delayedResponse).status, 200, 'Delayed concurrent invocation must commit');
  const after = await state(user);
  assertSingleCredit(firstState, after, delayed, label);
  assertProjection(after, 'pro', priceFor('pro'), 'Final projection must follow approval time, not worker order');
  assertFinancialRows(after, older);
  assertFinancialRows(after, newer);
  assert.equal(after.payments.length, 2);
  assert.equal(after.erp.length, 2);
  console.log(`PASS ${label}: overlapping handlers preserve two credits and the newest commercial approval`);

  // Unlike the controlled provider barrier above, these two RPCs may compete
  // for the client/subscription locks at the same time and in either order.
  const simultaneous = [
    snapshot(user, paymentId(`${label}-simultaneous-old`), 'start', 300),
    snapshot(user, paymentId(`${label}-simultaneous-new`), 'pro', 400),
  ];
  const responses = await Promise.all(simultaneous.map((payment, index) =>
    deliver(payment, `${label}-simultaneous-${index}`)));
  responses.forEach((response) => assert.equal(response.status, 200, 'Both competing distinct approvals must commit'));
  const afterSimultaneous = await state(user);
  assert.equal(Date.parse(afterSimultaneous.subscription.premium_until) - Date.parse(after.subscription.premium_until),
    60 * day, 'Concurrent distinct approvals must credit exactly 60 additional days');
  assertProjection(afterSimultaneous, 'pro', priceFor('pro'), 'Concurrent commercial authority follows newest approval');
  simultaneous.forEach((payment) => assertFinancialRows(afterSimultaneous, payment));
  assert.equal(afterSimultaneous.payments.length, 4);
  assert.equal(afterSimultaneous.erp.length, 4);
  console.log(`PASS ${label}: simultaneous distinct RPCs credit both IDs and retain the newest paid plan`);
}

async function main() {
  await outOfOrder('pro', 'start', 'older-start');
  await outOfOrder('start', 'pro', 'older-pro');
  await ascending();
  await equalApprovalTime(false);
  await equivalentApprovalResolvesOwnPending();
  await latestApprovalPreservesNewerAttempt();
  await equalApprovalTime(true);
  await newerManualGrant();
  await forgedPublicAuditHasNoAuthority();
  await authorizedFreeDecisionHasPrivateAuthority();
  await delayedFirstCreditReactivatesExpiredPaidLicense();
  await newerPending();
  await concurrentApprovals(true);
  await concurrentApprovals(false);
}

async function cleanupEvents() {
  const errors = [];
  const attempt = async (action) => { try { await action(); } catch (error) { errors.push(error); } };
  // Exact generated identities only; no date, status, wildcard or real-client cleanup.
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
  console.error(`FAIL local distinct payment plan order: ${error.message}`);
  process.exitCode = 1;
});
