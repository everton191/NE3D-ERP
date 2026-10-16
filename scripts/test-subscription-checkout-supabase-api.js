const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { getTarget, createFixtures, runWithCleanup } = require('./supabase-homolog-test-utils');
const { loadCheckout, request } = require('./test-subscription-checkout-runtime');

// Real local Auth/Data API; the gateway always uses this run's fake contracts.
assert(!process.argv[2] || process.argv[2] === 'local', 'Only isolated local integration is permitted');
const { url, anonKey, serviceKey } = getTarget('local');
const runId = crypto.randomBytes(6).toString('hex');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: async (input, init) => {
    const endpoint = new URL(typeof input === 'string' ? input : input.url);
    assert.equal(endpoint.origin, url, 'Database traffic must stay on isolated local API');
    return fetch(input, init);
  } } };
const service = createClient(url, serviceKey, options);
const fixtures = createFixtures(service, runId);
const paymentIds = new Set();
const day = 86400000;
const sourceBase = Date.now() - 4 * 3600000;
const sourceDate = (seconds) => new Date(sourceBase + seconds * 1000).toISOString();
const must = (result, label = 'local API') => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
};
const protectedFields = ['plan_id', 'active_plan', 'plan_code', 'plan_status', 'status', 'status_assinatura',
  'subscription_status', 'plan_price', 'price_locked', 'premium_until', 'plan_expires_at', 'current_period_start',
  'current_period_end', 'expires_at', 'next_billing_at', 'proximo_vencimento', 'manual_override',
  'manual_override_reason', 'manual_override_by', 'manual_override_at', 'blocked_at', 'blocked_reason',
  'cancel_at_period_end', 'cancelled_at'];

async function register(label) {
  const email = `s3d-checkout-${runId}-${label}@example.invalid`;
  const password = crypto.randomBytes(24).toString('base64url');
  const data = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: { name: label, business_name: `Subscription checkout ${label} ${runId}` } }), 'synthetic signup');
  fixtures.user(data.user);
  const session = fixtures.session(createClient(url, anonKey, options));
  const login = must(await session.auth.signInWithPassword({ email, password }), 'synthetic login');
  const profile = must(await service.from('profiles').select('client_id,company_id')
    .eq('user_id', data.user.id).single(), 'signup tenant');
  assert(profile.client_id && profile.company_id);
  // Ordinary active members can purchase their own plan, not cancel somebody's.
  const membership = must(await service.from('company_members').update({ role: 'user', status: 'active' })
    .eq('user_id', data.user.id).eq('company_id', profile.company_id).select('id,role,status').single(), 'synthetic member');
  assert.equal(membership.role, 'user');
  assert.equal(membership.status, 'active');
  must(await service.from('companies').update({ owner_user_id: null })
    .eq('id', profile.company_id).select('id').single(), 'synthetic ordinary-member company');
  return { id: data.user.id, clientId: profile.client_id, companyId: profile.company_id,
    email, password, token: login.session.access_token, session };
}

async function state(user) {
  return {
    sub: must(await service.from('subscriptions').select('*').eq('client_id', user.clientId).single()),
    client: must(await service.from('clients').select('*').eq('id', user.clientId).single()),
    audit: must(await service.from('audit_logs').select('id,details').eq('client_id', user.clientId)
      .eq('action', 'assinatura criada')),
  };
}

function rpcArgs(user, plan, provider = null) {
  return { p_client_id: user.clientId, p_actor_user_id: user.id, p_plan_slug: plan,
    p_billing_variant: `${plan}_monthly`, p_preapproval: provider };
}

function gateway(user, label, { client = service, actor = user, beforeReply = async () => {} } = {}) {
  const calls = [];
  let provider;
  const handler = loadCheckout(client, async (endpoint, init) => {
    assert.equal(endpoint, 'https://api.mercadopago.com/preapproval');
    assert.equal(init.method, 'POST');
    const payload = JSON.parse(init.body);
    assert.equal(payload.metadata.client_id, user.clientId);
    assert.equal(payload.metadata.user_id, actor.id);
    calls.push(payload);
    provider = { id: `synthetic-checkout-${runId}-${label}`, status: 'pending',
      init_point: 'https://www.mercadopago.com.br/subscriptions/checkout?synthetic=true',
      metadata: payload.metadata, external_reference: payload.external_reference,
      last_modified: new Date().toISOString() };
    await beforeReply();
    return Response.json(provider);
  });
  return { calls, handler, provider: () => provider,
    checkout: (plan = 'start', extra = {}) => handler(request({ plan_id: plan, ...extra }, actor.token)) };
}

async function paid(user, plan, manual = false) {
  const planId = must(await service.from('plans').select('id').eq('slug', plan).single()).id;
  const until = new Date(Date.now() + 10 * 86400000).toISOString();
  must(await service.from('subscriptions').update({ plan_id: planId, active_plan: plan,
    plan_code: plan.toUpperCase(), plan_status: 'ACTIVE', status: 'active', status_assinatura: 'active',
    subscription_status: 'active', plan_price: plan === 'pro' ? 59.9 : 29.9, price_locked: true,
    premium_until: until, plan_expires_at: until, current_period_end: until, expires_at: until,
    next_billing_at: until, proximo_vencimento: until, payment_status: 'approved',
    billing_variant: `${plan}_monthly`, manual_override: manual,
    manual_override_reason: manual ? 'synthetic checkout preservation' : null,
    manual_override_at: manual ? new Date().toISOString() : null }).eq('client_id', user.clientId));
  must(await service.from('clients').update({ active_plan: plan, plano_atual: plan,
    subscription_status: 'active', status_assinatura: 'active', plan_price: plan === 'pro' ? 59.9 : 29.9,
    plan_expires_at: until }).eq('id', user.clientId));
}

function paymentSnapshot(user, label, { plan = 'pro', status = 'approved', created = 10,
  approved = 100, updated = 110, contract = null } = {}) {
  const id = `synthetic-checkout-payment-${runId}-${label}`;
  paymentIds.add(id);
  return { id, status, transaction_amount: plan === 'start' ? 29.9 : 59.9,
    payment_method_id: 'synthetic', date_created: sourceDate(created),
    date_approved: status === 'pending' ? null : sourceDate(approved), date_last_updated: sourceDate(updated),
    ...(contract ? { preapproval_id: contract } : {}),
    metadata: { client_id: user.clientId, user_id: user.id, plan_slug: plan, billing_variant: `${plan}_monthly` } };
}

async function applyPayment(user, payment) {
  assert(paymentIds.has(payment.id), 'Financial test must belong to the exact synthetic ledger');
  const applied = must(await service.rpc('apply_mercadopago_payment', { p_client_id: user.clientId,
    p_user_id: user.id, p_plan_slug: payment.metadata.plan_slug,
    p_billing_variant: payment.metadata.billing_variant, p_payment: payment }), 'real synthetic payment ingestion');
  assert.equal(applied.applied, true);
}

async function financialState(user, payment) {
  const financial = must(await service.from('payments').select('*')
    .eq('client_id', user.clientId).eq('mercado_pago_payment_id', payment.id).single());
  const mirror = must(await service.from('erp_payments').select('*')
    .eq('cliente_id', user.clientId).eq('payment_id', payment.id).single());
  assert.equal(financial.status, payment.status);
  assert.equal(mirror.status, payment.status);
  assert.equal(financial.metadata.date_last_updated, payment.date_last_updated);
  assert.equal(mirror.payload.date_last_updated, payment.date_last_updated);
  return financial;
}

function assertCheckoutIntention(before, after, label) {
  for (const field of ['pending_plan', 'pending_started_at', 'payment_status', 'mercado_pago_subscription_id'])
    assert.deepEqual(after.sub[field], before.sub[field], `${label}: subscription ${field}`);
  for (const field of ['pending_plan', 'payment_status'])
    assert.deepEqual(after.client[field], before.client[field], `${label}: client ${field}`);
  assert.deepEqual(after.sub.metadata.checkout, before.sub.metadata.checkout, `${label}: checkout identity`);
}

async function pendingCheckoutSurvivesOldPayment(status, differentContract) {
  const label = `old-${status}-${differentContract ? 'different' : 'missing'}`;
  const user = await register(label);
  const older = paymentSnapshot(user, `${label}-a`, {
    contract: differentContract ? `synthetic-old-contract-${runId}-${label}` : null });
  await applyPayment(user, older);
  const instance = gateway(user, `${label}-b`);
  assert.equal((await instance.checkout('start')).status, 200);
  const before = await state(user);
  assert.equal(before.sub.payment_status, 'approved', 'Paid checkout does not need a pending financial row');
  assert.equal(before.sub.pending_plan, 'start');
  assert.equal(before.sub.metadata.checkout.provider_id, instance.provider().id);
  const negative = { ...older, status, date_last_updated: sourceDate(9000) };
  await applyPayment(user, negative);
  const afterNegative = await state(user);
  assertCheckoutIntention(before, afterNegative, 'Unrelated refund or chargeback cannot resolve checkout B');
  for (const field of protectedFields) assert.deepEqual(afterNegative.sub[field], before.sub[field], `Refund ${field}`);
  const financial = await financialState(user, negative);
  const review = must(await service.from('audit_logs').select('details').eq('client_id', user.clientId)
    .eq('action', 'billing_payment_review_required'))
    .filter((row) => row.details.mercado_pago_payment_id === negative.id);
  assert.equal(review.length, 1, 'Financial review is retained even when attempt projection is protected');
  assert.equal(review[0].details.policy, 'preserve_existing_validity');
  assert.equal(financial.mercado_pago_subscription_id, older.preapproval_id || null);
  const license = must(await user.session.rpc('get_effective_license', { p_user_id: user.id }),
    'authenticated license after old refund and new pending checkout');
  assert.equal(license.plan_code, 'PRO');
  assert.equal(license.effective_status, 'ACTIVE');
  assert.equal(Date.parse(license.premium_until), Date.parse(before.sub.premium_until));

  const restored = { ...older, date_last_updated: sourceDate(10000) };
  await applyPayment(user, restored);
  const afterRestored = await state(user);
  assertCheckoutIntention(before, afterRestored, 'Repeated approval of A cannot resolve checkout B');
  for (const field of protectedFields) assert.deepEqual(afterRestored.sub[field], before.sub[field], `Reapproval ${field}`);
  await financialState(user, restored);
  assert.equal(must(await service.from('audit_logs').select('id').eq('client_id', user.clientId)
    .eq('action', 'billing_payment_review_required')).length, 1);

  const ownPending = paymentSnapshot(user, `${label}-b`, { plan: 'start', status: 'pending', created: 1000,
    updated: 1100, contract: instance.provider().id });
  await applyPayment(user, ownPending);
  const afterOwnPending = await state(user);
  assert.equal(afterOwnPending.sub.pending_plan, 'start');
  assert.equal(afterOwnPending.sub.payment_status, 'pending', 'Matching B contract projects its own payment normally');
  const ownApproved = { ...ownPending, status: 'approved', date_approved: sourceDate(1200),
    date_last_updated: sourceDate(1300) };
  await applyPayment(user, ownApproved);
  const resolved = await state(user);
  assert.equal(resolved.sub.pending_plan, null);
  assert.equal(resolved.sub.pending_started_at, null);
  assert.equal(resolved.sub.payment_status, 'approved');
  assert.equal(resolved.sub.active_plan, 'start');
  assert.equal(resolved.client.pending_plan, null);
  assert.equal(Date.parse(resolved.sub.premium_until) - Date.parse(before.sub.premium_until), 30 * day,
    'Only B adds one new credit; A reapproval adds nothing');
  await financialState(user, ownApproved);
  console.log(`PASS checkout B survives ${status}/reapproval of A (${differentContract ? 'different' : 'missing'} contract); B resolves normally.`);
}

async function pendingCheckoutSurvivesLateFirstApproval(differentContract) {
  const label = `first-approval-${differentContract ? 'different' : 'missing'}`;
  const user = await register(label);
  const seed = paymentSnapshot(user, `${label}-seed`, { created: 50, approved: 300, updated: 310 });
  await applyPayment(user, seed);
  const instance = gateway(user, `${label}-b`);
  assert.equal((await instance.checkout('start')).status, 200);
  const before = await state(user);
  const older = paymentSnapshot(user, `${label}-a`, { plan: 'start', created: 10, approved: 100,
    updated: 9000, contract: differentContract ? `synthetic-old-contract-${runId}-${label}` : null });
  await applyPayment(user, older);
  const after = await state(user);
  assertCheckoutIntention(before, after, 'First late independent credit cannot resolve checkout B');
  for (const field of ['active_plan', 'plan_code', 'plan_id', 'plan_price', 'billing_variant', 'plan_status'])
    assert.deepEqual(after.sub[field], before.sub[field], `Late older credit ${field}`);
  assert.equal(Date.parse(after.sub.premium_until) - Date.parse(before.sub.premium_until), 30 * day,
    'Independent first approval earns its days without consuming B intention');
  await financialState(user, older);
  console.log(`PASS first late approval A (${differentContract ? 'different' : 'missing'} contract) earns days while preserving B intention.`);
}

async function main() {
  for (const plan of ['start', 'pro']) {
    const user = await register(`free-${plan}`);
    const before = await state(user);
    const gatewayState = gateway(user, `free-${plan}`);
    const response = await gatewayState.checkout(plan);
    assert.equal(response.status, 200, await response.text());
    const after = await state(user);
    for (const field of protectedFields) assert.deepEqual(after.sub[field], before.sub[field], `Free field ${field}`);
    assert.equal(after.sub.active_plan, 'free');
    assert.equal(after.sub.pending_plan, plan);
    assert.equal(after.sub.billing_variant, `${plan}_monthly`);
    assert.equal(after.audit.length, 1);
    assert.equal(after.sub.metadata.preapproval.metadata.plan_slug, plan === 'pro' ? 'premium' : 'start');
    const repeated = must(await service.rpc('persist_mercadopago_checkout', rpcArgs(user, plan, gatewayState.provider())));
    assert.equal(repeated.duplicate, true);
    assert.equal((await state(user)).audit.length, 1);
    assert.equal((await gatewayState.checkout(plan)).status, 409, 'Linked contract must not be replaced');
    assert.equal(gatewayState.calls.length, 1, 'Second checkout must not contact the provider');
    const second = fixtures.session(createClient(url, anonKey, options));
    must(await second.auth.signInWithPassword({ email: user.email, password: user.password }));
    const persisted = must(await second.from('subscriptions').select('mercado_pago_subscription_id,pending_plan')
      .eq('client_id', user.clientId).single(), 'second session persistence');
    assert.equal(persisted.mercado_pago_subscription_id, gatewayState.provider().id);
    assert.equal(persisted.pending_plan, plan);
    assert((await user.session.rpc('persist_mercadopago_checkout', rpcArgs(user, plan))).error,
      'Authenticated browser cannot invoke service RPC');
    console.log(`PASS real local checkout ${plan}: Free preserved, canonical pending, duplicate safe and second session persistence.`);
  }
  for (const [plan, manual] of [['pro', false], ['start', true]]) {
    const user = await register(`paid-${plan}`);
    await paid(user, plan, manual);
    const before = await state(user);
    const instance = gateway(user, `paid-${plan}`);
    assert.equal((await instance.checkout(plan === 'pro' ? 'start' : 'pro')).status, 200);
    const after = await state(user);
    for (const field of [...protectedFields, 'billing_variant', 'payment_status'])
      assert.deepEqual(after.sub[field], before.sub[field], `Paid/manual field ${field}`);
    for (const field of ['active_plan', 'plano_atual', 'subscription_status', 'status_assinatura', 'plan_expires_at', 'plan_price'])
      assert.deepEqual(after.client[field], before.client[field], `Paid client ${field}`);
    const license = must(await user.session.rpc('get_effective_license', { p_user_id: user.id }));
    assert.equal(license.plan_code, plan.toUpperCase());
    assert.equal(license.effective_status, 'ACTIVE');
    console.log(`PASS existing ${plan} ${manual ? 'manual ' : ''}validity, price and access unchanged by pending checkout.`);
  }
  {
    const user = await register('new-subscription');
    must(await service.from('subscriptions').delete().eq('client_id', user.clientId));
    assert.equal((await gateway(user, 'new-subscription').checkout('pro')).status, 200);
    const after = await state(user);
    assert.equal(after.sub.plan_code, 'FREE');
    assert.equal(after.sub.active_plan, 'free');
    assert.equal(after.sub.pending_plan, 'pro');
    assert.equal(after.sub.billing_variant, 'pro_monthly');
    assert.equal(after.sub.premium_until, null);
  }
  {
    const user = await register('scope');
    const other = await register('other');
    const instance = gateway(user, 'scope');
    assert.notEqual((await instance.checkout('start', { clientId: other.clientId })).status, 200);
    assert.equal(instance.calls.length, 0);
    assert((await service.rpc('persist_mercadopago_checkout', { ...rpcArgs(user, 'start'),
      p_client_id: other.clientId })).error, 'Service wrapper must recheck actor tenant too');
    const anonymous = createClient(url, anonKey, options);
    assert((await anonymous.rpc('persist_mercadopago_checkout', rpcArgs(user, 'start'))).error);
    const before = await state(user);
    must(await service.from('companies').update({ owner_user_id: null }).eq('id', user.companyId));
    must(await service.from('company_members').update({ status: 'inactive' })
      .eq('company_id', user.companyId).eq('user_id', user.id));
    assert.notEqual((await instance.checkout()).status, 200);
    assert.equal(instance.calls.length, 0);
    assert.deepEqual(await state(user), before);
    console.log('PASS other-company, anonymous, ordinary direct RPC and revoked membership are denied before gateway.');
  }
  {
    const admin = await register('superadmin');
    const target = await register('superadmin-target');
    assert.notEqual(admin.companyId, target.companyId);
    const instance = gateway(target, 'superadmin-target', { actor: admin });
    // The registry is authoritative even when both profiles retain normal roles.
    must(await service.from('superadmins').insert({ user_id: admin.id, status: 'active' }));
    assert.equal((await instance.checkout('pro', { clientId: target.clientId })).status, 200,
      'Active registered superadmin must retain authorized cross-company checkout');
    const after = await state(target);
    assert.equal(after.sub.active_plan, 'free');
    assert.equal(after.sub.pending_plan, 'pro');
    assert.equal(after.sub.metadata.checkout.actor_user_id, admin.id);
    must(await service.from('superadmins').update({ status: 'inactive' }).eq('user_id', admin.id));
    must(await service.from('profiles').update({ role: 'superadmin' }).eq('user_id', admin.id));
    assert.notEqual((await instance.checkout('pro', { clientId: target.clientId })).status, 200,
      'Inactive registry plus public-profile label cannot authorize another company');
    assert.equal(instance.calls.length, 1);
    assert((await service.rpc('persist_mercadopago_checkout', { ...rpcArgs(target, 'pro'),
      p_actor_user_id: admin.id })).error, 'RPC must independently reject inactive administrative authority');
    assert.deepEqual(await state(target), after);
    console.log('PASS persisted active superadmin cross-company; revoked authority/profile-label escalation denied.');
  }
  {
    const user = await register('failed-persistence');
    const before = await state(user);
    const failing = new Proxy(service, { get(target, key) {
      if (key === 'rpc') return (name, args) => args.p_preapproval == null
        ? target.rpc(name, args) : Promise.resolve({ data: null, error: { message: 'Synthetic commit outage' } });
      const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
    } });
    const instance = gateway(user, 'failed-persistence', { client: failing });
    const response = await instance.checkout();
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.providerCreated, true);
    assert.equal(body.retryable, false);
    assert.deepEqual(await state(user), before);
    assert.equal(instance.calls.length, 1);
  }
  {
    const user = await register('lost-provider-response');
    const before = await state(user);
    const instance = gateway(user, 'lost-provider-response', { beforeReply: async () => {
      throw new Error('Synthetic provider accepted the POST but its reply was lost');
    } });
    const response = await instance.checkout();
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error, 'CHECKOUT_PROVIDER_REVIEW_REQUIRED');
    assert.equal(body.providerCreated, null);
    assert.equal(body.retryable, false);
    assert.equal(body.subscriptionId, null);
    assert.equal(instance.calls.length, 1);
    assert.deepEqual(await state(user), before);
    console.log('PASS ambiguous provider timeout: no local write, no false success or automatic retry.');
  }
  {
    const user = await register('concurrent');
    let count = 0, release, timer;
    const barrier = new Promise((resolve, reject) => {
      release = resolve;
      timer = setTimeout(() => reject(new Error('Both synthetic concurrent checkouts must reach the provider')), 15000);
    });
    const beforeReply = async () => { if (++count === 2) release(); await barrier; };
    const one = gateway(user, 'concurrent-one', { beforeReply });
    const two = gateway(user, 'concurrent-two', { beforeReply });
    let responses;
    try { responses = await Promise.all([one.checkout('start'), two.checkout('pro')]); }
    finally { clearTimeout(timer); }
    assert.deepEqual(responses.map((r) => r.status).sort(), [200, 503]);
    const after = await state(user);
    const winner = responses[0].status === 200 ? one : two;
    assert.equal(after.sub.mercado_pago_subscription_id, winner.provider().id);
    assert.equal(after.audit.length, 1);
    assert.equal(after.sub.active_plan, 'free');
    const loser = await responses.find((r) => r.status === 503).json();
    assert.equal(loser.providerCreated, true);
    assert.notEqual(loser.subscriptionId, winner.provider().id);
    console.log('PASS concurrent checkout: one committed contract; loser explicitly requires external reconciliation.');
  }
  for (const status of ['refunded', 'charged_back'])
    for (const differentContract of [false, true]) await pendingCheckoutSurvivesOldPayment(status, differentContract);
  for (const differentContract of [false, true]) await pendingCheckoutSurvivesLateFirstApproval(differentContract);
  console.log('PASS subscription checkout real local integration; no real gateway call.');
}

async function cleanupPayments() {
  const errors = [];
  for (const id of paymentIds) {
    assert(id.startsWith(`synthetic-checkout-payment-${runId}-`), 'Never clean financial rows outside this invocation');
    try { must(await service.from('erp_payments').delete().eq('payment_id', id)); }
    catch (error) { errors.push(error); }
  }
  if (errors.length) throw new AggregateError(errors, errors.map((error) => error.message).join('; '));
}

runWithCleanup(main, [cleanupPayments, () => fixtures.cleanup()]).catch((error) => {
  console.error(`FAIL local subscription checkout: ${error.message}`);
  process.exitCode = 1;
});
