// Local-only synthetic fixtures for a human-visible browser homologation.
// Generated credentials stay in an ignored artifact, never in console output.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { getTarget, createFixtures } = require('./supabase-homolog-test-utils');

const ledgerPath = path.resolve(__dirname, '../artifacts/licensing-browser-local-fixtures.json');
const { url, anonKey, serviceKey } = getTarget('local');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => {
    assert.equal(new URL(typeof input === 'string' ? input : input.url).origin, url);
    return fetch(input, init);
  } } };
const service = createClient(url, serviceKey, options);
const must = (result, label) => { if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data; };
const save = (ledger) => {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), { mode: 0o600 });
};

async function setup() {
  assert(!fs.existsSync(ledgerPath), 'Existing fixture ledger must be cleaned up, never overwritten');
  const runId = crypto.randomBytes(6).toString('hex');
  const ledger = { runId, url, users: {}, createdAt: new Date().toISOString(),
    originalStart: must(await service.from('plans').select('id,metadata,price').eq('slug', 'start').single(), 'snapshot card') };
  save(ledger);
  for (const role of ['admin', 'free', 'start', 'pro']) {
    const password = crypto.randomBytes(24).toString('base64url');
    const email = `s3d-browser-${runId}-${role}@example.invalid`;
    const created = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
      user_metadata: { name: `Navegador ${role} ${runId}`, business_name: `Browser ${role} ${runId}` } }), 'create synthetic user');
    ledger.users[role] = { id: created.user.id, email, password };
    save(ledger);
    const profile = must(await service.from('profiles').select('client_id,company_id')
      .eq('user_id', created.user.id).single(), 'synthetic tenant');
    assert(profile.client_id && profile.company_id);
    Object.assign(ledger.users[role], { clientId: profile.client_id, companyId: profile.company_id });
    save(ledger);
  }
  const admin = ledger.users.admin;
  must(await service.from('superadmins').insert({ user_id: admin.id, status: 'active' }), 'authorize local fixture admin');
  const adminSession = createClient(url, anonKey, options);
  must(await adminSession.auth.signInWithPassword(admin), 'fixture admin login');
  try {
    for (const role of ['start', 'pro']) {
      const result = must(await adminSession.rpc('superadmin_update_subscription', {
        target_user_id: ledger.users[role].id, action: 'SET_PLAN_MANUAL', plan_code: role.toUpperCase(),
        premium_until: new Date(Date.now() + 10 * 86400000).toISOString(), reason: `Browser fixture ${runId}`,
      }), 'fixture plan');
      assert.equal(result.active_plan, role);
    }
  } finally { must(await adminSession.auth.signOut({ scope: 'global' }), 'fixture admin setup logout'); }
  console.log(`PASS local browser fixtures ready: ${Object.keys(ledger.users).length} synthetic accounts; credentials not printed.`);
  console.log(`Fixture ledger: ${ledgerPath}`);
  console.log(`Presentation marker: Start Browser ${runId}`);
}

function load() {
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  assert.equal(ledger.url, url, 'Fixture must remain on the same isolated API');
  assert(/^[a-f0-9]{12}$/.test(ledger.runId));
  for (const [role, user] of Object.entries(ledger.users))
    assert.equal(user.email, `s3d-browser-${ledger.runId}-${role}@example.invalid`);
  return ledger;
}

async function verify() {
  const ledger = load();
  const observations = [];
  const record = (value) => { observations.push(value); console.log(JSON.stringify(value)); };
  for (const [role, user] of Object.entries(ledger.users)) {
    const session = createClient(url, anonKey, options);
    must(await session.auth.signInWithPassword(user), 'independent verification login');
    try {
      const license = must(await session.rpc('get_effective_license'), 'independent license read');
      record({ fixture: role, activePlan: license.active_plan,
        effectiveStatus: license.effective_status, until: license.premium_until || license.expires_at || null });
      if (role === 'free') {
        const subscription = must(await session.from('subscriptions')
          .select('active_plan,premium_until,plan_expires_at,current_period_end,expires_at')
          .eq('client_id', user.clientId).single(), 'synthetic subscription date verification');
        const client = must(await session.from('clients').select('active_plan,plan_expires_at')
          .eq('id', user.clientId).single(), 'synthetic client date verification');
        record({ fixture: role, subscriptionDates: subscription, clientDates: client });
      }
    } finally { must(await session.auth.signOut({ scope: 'local' }), 'verification logout'); }
  }
  const card = must(await service.from('plans').select('metadata,price').eq('id', ledger.originalStart.id).single(), 'read browser card');
  assert.equal(card.price, ledger.originalStart.price, 'Displayed price cannot change actual billing price');
  record({ startPresentation: card.metadata?.presentation, actualPriceUnchanged: true });
  const evidenceDir = path.resolve(__dirname, '../artifacts/browser-licensing-20261016');
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(path.join(evidenceDir, 'authenticated-api-observations.json'),
    JSON.stringify({ runId: ledger.runId, capturedAt: new Date().toISOString(), observations }, null, 2));
}

async function cleanup() {
  const ledger = load();
  const original = ledger.originalStart;
  const current = must(await service.from('plans').select('metadata,price').eq('id', original.id).single(), 'read card before restore');
  assert.equal(current.price, original.price, 'Billing price changed; investigate instead of overwriting');
  if (JSON.stringify(current.metadata) !== JSON.stringify(original.metadata)) {
    assert.equal(current.metadata?.presentation?.name, `Start Browser ${ledger.runId}`, 'Unexpected card editor; preserve concurrent changes');
    const withoutPresentation = ({ presentation, ...rest } = {}) => rest;
    assert.deepEqual(withoutPresentation(current.metadata), withoutPresentation(original.metadata));
    const rows = must(await service.from('plans').update({ metadata: original.metadata }).eq('id', original.id)
      .eq('price', original.price).eq('metadata', JSON.stringify(current.metadata)).select('id'), 'restore local card with CAS');
    assert.equal(rows.length, 1);
  }
  const restored = must(await service.from('plans').select('metadata,price').eq('id', original.id).single(), 'confirm restored card');
  assert.deepEqual(restored.metadata, original.metadata);
  assert.equal(restored.price, original.price);
  const fixtures = createFixtures(service, ledger.runId);
  for (const user of Object.values(ledger.users)) {
    const auth = must(await service.auth.admin.getUserById(user.id), 'verify exact fixture identity');
    assert.equal(auth.user.email, user.email);
    fixtures.user(auth.user);
    const session = fixtures.session(createClient(url, anonKey, options));
    must(await session.auth.signInWithPassword(user), 'session revocation login');
  }
  await fixtures.cleanup();
  fs.rmSync(ledgerPath);
  console.log('PASS original card/price restored; only exact synthetic accounts and their generated credential ledger removed.');
}

const action = process.argv[2];
assert(['setup', 'verify', 'cleanup'].includes(action), 'Use setup, verify or cleanup');
({ setup, verify, cleanup }[action])().catch((error) => { console.error(`FAIL browser fixtures: ${error.message}`); process.exitCode = 1; });
