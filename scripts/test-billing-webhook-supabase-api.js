const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { getTarget, createFixtures, runWithCleanup } = require('./supabase-homolog-test-utils');
const { loadHandler, request } = require('./test-billing-webhook-runtime');

// No environment-file loading, remote Supabase, real provider or production access.
assert(!process.argv[2] || process.argv[2] === 'local', 'Only local integration is permitted');
const { url, anonKey, serviceKey } = getTarget('local');
const runId = crypto.randomBytes(6).toString('hex');
let failFinalization = false;
let failErrorFinalization = false;
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: async (input, init) => {
    const endpoint = new URL(typeof input === 'string' ? input : input.url);
    assert.equal(endpoint.origin, url, 'Database requests must stay on the isolated local API');
    if (failFinalization && endpoint.pathname === '/rest/v1/billing_webhook_events' && init?.method === 'PATCH'
      && JSON.parse(init.body).status === 'processed') {
      failFinalization = false;
      return Response.json({ message: 'Synthetic finalization outage', code: 'TEST' }, { status: 503 });
    }
    if (failErrorFinalization && endpoint.pathname === '/rest/v1/billing_webhook_events' && init?.method === 'PATCH'
      && JSON.parse(init.body).status === 'error') {
      failErrorFinalization = false;
      return Response.json({ message: 'Synthetic error-recording outage', code: 'TEST' }, { status: 503 });
    }
    return fetch(input, init);
  } } };
const service = createClient(url, serviceKey, options);
const fixtures = createFixtures(service, runId);
const must = (result) => { if (result.error) throw result.error; return result.data; };
const notifications = [];
const paymentIds = [];
const diagnosticKeys = [];
function delivery(type, id, notification) {
  if (!notifications.includes(notification)) notifications.push(notification);
  const key = `mercado_pago:${notification}:${type}:${id.toLowerCase()}`;
  if (!diagnosticKeys.includes(key)) diagnosticKeys.push(key);
  return request(type, true, id, notification);
}
async function main() {
  for (const plan of ['start', 'pro']) {
    const email = `s3d-webhook-${runId}-${plan}@example.invalid`;
    const password = crypto.randomBytes(24).toString('base64url');
    const created = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
      user_metadata: { name: plan, business_name: `Webhook ${plan} ${runId}` } }));
    fixtures.user(created.user);
    const session = fixtures.session(createClient(url, anonKey, options));
    must(await session.auth.signInWithPassword({ email, password }));
    const profile = must(await service.from('profiles').select('client_id').eq('user_id', created.user.id).single());
    const paymentId = `synthetic-${runId}-${plan}`;
    paymentIds.push(paymentId);
    let providerStatus = 'approved';
    let providerFetches = 0;
    const handler = loadHandler(service, async (endpoint) => {
      assert(['https://api.mercadopago.com/v1/payments/', 'https://api.mercadopago.com/preapproval/']
        .some((prefix) => endpoint === prefix + paymentId), 'Only synthetic provider IDs are accepted');
      providerFetches++;
      return Response.json({ id: paymentId, status: providerStatus, transaction_amount: plan === 'start' ? 29.9 : 59.9,
        metadata: { client_id: profile.client_id, user_id: created.user.id, plan_slug: plan } });
    });
    const subscription = async () => must(await service.from('subscriptions').select('*').eq('client_id', profile.client_id).single());
    const notification = `synthetic-${runId}-${plan}-payment`;
    failFinalization = true;
    assert.equal((await handler(delivery('payment', paymentId, notification))).status, 500);
    assert.equal(failFinalization, false, 'Execution must reach the injected finalization failure');
    const paid = await subscription();
    assert.equal(paid.active_plan, plan, 'Payment persisted before simulated finalization outage');
    const event = must(await service.from('billing_webhook_events').select('status,error')
      .eq('event_key', diagnosticKeys.at(-1)).single());
    assert.equal(event.status, 'error', JSON.stringify(event));
    const beforeRetry = providerFetches;
    const retried = await Promise.all([handler(delivery('payment', paymentId, notification)), handler(delivery('payment', paymentId, notification))]);
    assert(retried.some((response) => response.status === 200), JSON.stringify(must(await service.from('erp_webhook_events').select('error')
      .eq('event_id', notification).eq('status', 'error'))));
    assert.equal(providerFetches - beforeRetry, 1, 'Concurrent retries must have a single owner');
    assert.equal((await subscription()).premium_until, paid.premium_until, 'Retry must not renew twice');
    assert.equal(must(await session.rpc('get_effective_license')).active_plan, plan);
    const duplicates = await Promise.all([handler(delivery('payment', paymentId, notification)), handler(delivery('payment', paymentId, notification))]);
    for (const response of duplicates) assert.equal((await response.json()).duplicate, true);
    assert.equal((await subscription()).premium_until, paid.premium_until);
    assert.equal(must(await service.from('payments').select('id').eq('mercado_pago_payment_id', paymentId)).length, 1);
    assert.equal(must(await service.from('erp_payments').select('payment_id').eq('payment_id', paymentId)).length, 1);
    console.log(`PASS ${plan}: actual SQL trigger, failed finalization, retry, duplicate, license and one payment`);

    // This handler has fully returned and no provider promise remains in flight.
    // Do not infer worker termination from elapsed time in real environments.
    const abandonedNotification = `${notification}-abandoned`;
    failFinalization = true;
    failErrorFinalization = true;
    assert.equal((await handler(delivery('payment', paymentId, abandonedNotification))).status, 500);
    assert.equal(failFinalization || failErrorFinalization, false);
    const abandonedKey = diagnosticKeys.at(-1);
    const readAbandoned = async () => must(await service.from('billing_webhook_events').select('*')
      .eq('provider', 'mercado_pago').eq('event_key', abandonedKey).single());
    const abandoned = await readAbandoned();
    assert.equal(abandoned.status, 'received');
    const recovery = { p_event_key: abandonedKey, p_expected_updated_at: abandoned.updated_at,
      p_reason: `Synthetic interrupted finalization ${runId}`,
      p_quiescence_reference: `awaited handler completion ${runId}`, p_workers_stopped: true };
    const recover = (changes = {}, client = service) => client.rpc('recover_billing_webhook_event', { ...recovery, ...changes });
    const audits = async () => must(await service.from('audit_logs').select('id,details')
      .eq('action', 'billing_webhook_recovered').contains('details', { event_key: abandonedKey }));
    for (const changes of [{ p_workers_stopped: false }, { p_workers_stopped: null },
      { p_quiescence_reference: '' }, { p_reason: '' }, { p_expected_updated_at: null }]) {
      assert.equal((await recover(changes)).error?.code, '22023');
    }
    assert.equal((await recover()).error?.code, '55000', 'recent reservation must not be recovered');
    assert.equal((await recover({}, session)).error?.code, '42501', 'ordinary session cannot recover');
    assert.equal((await recover({}, createClient(url, anonKey, options))).error?.code, '42501', 'anonymous client cannot recover');
    must(await service.from('superadmins').insert({ user_id: created.user.id, status: 'active' }));
    try {
      assert.equal((await recover({}, session)).error?.code, '42501', 'frontend superadmin is not a server operator');
    } finally {
      must(await service.from('superadmins').delete().eq('user_id', created.user.id));
    }
    assert.deepEqual(await readAbandoned(), abandoned, 'denials must not mutate the event');
    assert.equal((await audits()).length, 0);
    const oldTimestamp = new Date(Date.now() - 3600000).toISOString();
    must(await service.from('billing_webhook_events').update({ updated_at: oldTimestamp })
      .eq('event_key', abandonedKey).eq('status', 'received').select('id').single());
    assert.equal((await recover()).error?.code, '40001', 'stale operator snapshot must fail');
    recovery.p_expected_updated_at = (await readAbandoned()).updated_at;
    const beforeBusy = providerFetches;
    assert.equal((await handler(delivery('payment', paymentId, abandonedNotification))).status, 500);
    assert.equal(providerFetches, beforeBusy, 'age alone must not trigger an automatic takeover');
    const recovered = await Promise.all([recover(), recover()]);
    assert.equal(recovered.filter((result) => !result.error).length, 1, 'single concurrent recovery winner');
    assert.equal(recovered.find((result) => result.error).error.code, '40001');
    const result = recovered.find((value) => !value.error).data;
    assert.equal(result.recovered, true);
    assert.equal((await readAbandoned()).status, 'error');
    const audit = await audits();
    assert.equal(audit.length, 1);
    assert.equal(audit[0].id, result.audit_id);
    assert.equal(audit[0].details.previous_status, 'received');
    assert.equal(audit[0].details.new_status, 'error');
    assert.equal(audit[0].details.quiescence_reference, recovery.p_quiescence_reference);
    assert.equal(audit[0].details.workers_stopped, true);
    assert.equal((await recover()).error?.code, '40001', 'repeated operator command must not reset again');
    assert.equal((await handler(delivery('payment', paymentId, abandonedNotification))).status, 200);
    assert.equal((await subscription()).premium_until, paid.premium_until, 'controlled recovery must not renew twice');
    assert.equal((await readAbandoned()).status, 'processed');
    recovery.p_expected_updated_at = (await readAbandoned()).updated_at;
    assert.equal((await recover()).error?.code, '55000', 'terminal events must remain terminal');
    assert.equal((await audits()).length, 1);
    assert.equal((await recover({ p_event_key: `missing-${runId}` })).error?.code, 'P0002');
    for (const status of ['ignored', 'error']) {
      const finalNotification = `${abandonedNotification}-${status}`;
      delivery('payment', paymentId, finalNotification); // Register an exact cleanup target.
      const finalKey = diagnosticKeys.at(-1);
      must(await service.from('billing_webhook_events').insert({ event_key: finalKey, status, updated_at: oldTimestamp }));
      assert.equal((await recover({ p_event_key: finalKey, p_expected_updated_at: oldTimestamp })).error?.code, '55000');
    }
    assert.equal(must(await service.from('payments').select('id').eq('mercado_pago_payment_id', paymentId)).length, 1);
    assert.equal(must(await service.from('erp_payments').select('payment_id').eq('payment_id', paymentId)).length, 1);
    assert.equal((await handler(delivery('payment', paymentId, `${abandonedNotification}-new-provider-id`))).status, 200);
    assert.equal((await subscription()).premium_until, paid.premium_until, 'new notification ID for the same payment must not add days');
    console.log(`PASS ${plan}: abandoned reservation, service-only recovery, atomic audit, concurrency and retry without extra days`);

    providerStatus = 'authorized';
    const authorized = await handler(delivery('preapproval', paymentId, `${notification}-authorized`));
    assert.equal(authorized.status, 200, JSON.stringify(must(await service.from('erp_webhook_events').select('error')
      .eq('event_id', `${notification}-authorized`).eq('status', 'error'))));
    assert.equal((await subscription()).billing_variant, `${plan}_monthly`);
    assert.equal((await subscription()).premium_until, paid.premium_until);
    providerStatus = 'cancelled';
    const cancelled = await handler(delivery('preapproval', paymentId, `${notification}-cancelled`));
    assert.equal(cancelled.status, 200, JSON.stringify(must(await service.from('erp_webhook_events').select('error')
      .eq('event_id', `${notification}-cancelled`).eq('status', 'error'))));
    assert.equal((await subscription()).cancel_at_period_end, true);
    assert.equal((await subscription()).premium_until, paid.premium_until);
    assert.equal(must(await session.rpc('get_effective_license')).active_plan, plan);
    console.log(`PASS ${plan}: preapproval, canonical billing and cancellation preserving existing paid validity`);
  }
}
async function cleanupEvents() {
  // Exact IDs generated by this invocation only; no broad cleanup by date/status.
  for (const key of diagnosticKeys) {
    must(await service.from('billing_webhook_events').delete().eq('provider', 'mercado_pago').eq('event_key', key));
    for (const type of ['webhook_received', 'webhook_ignored_duplicate']) {
      must(await service.from('app_diagnostic_events').delete().eq('fingerprint', `mercadopago:${type}:${key}`.slice(0, 240)));
    }
  }
  for (const id of notifications) must(await service.from('erp_webhook_events').delete().eq('provider', 'mercado_pago').eq('event_id', id));
  for (const id of paymentIds) {
    must(await service.from('erp_payments').delete().eq('payment_id', id));
    must(await service.from('app_diagnostic_events').delete().eq('fingerprint', `mercadopago:webhook_start_plan_resolved:${id}`));
    for (const type of ['webhook_received', 'webhook_ignored_duplicate']) {
      must(await service.from('app_diagnostic_events').delete().eq('fingerprint', `mercadopago:${type}:${id}`));
    }
  }
}
runWithCleanup(main, [cleanupEvents, () => fixtures.cleanup()]).catch((error) => {
  console.error(`FAIL local webhook: ${error.message}`); process.exitCode = 1;
});
