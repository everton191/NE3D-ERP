const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260831234150_migrate_legacy_premium_to_pro.sql'),
  'utf8',
);

assert.match(migration, /where slug = 'pro'[\s\S]*active = true/);
assert.match(migration, /active_plan = 'pro'/);
assert.match(migration, /plano_atual = 'pro'/);
assert.match(migration, /plan_id = pro_plan_id/);
assert.match(migration, /subscriptions_active_plan_check check \(active_plan in \('free', 'start', 'pro'\)\)/);
assert.match(migration, /clients_active_plan_check check \(active_plan in \('free', 'start', 'pro'\)\)/);
assert.match(migration, /plan_code in \('FREE', 'START', 'PRO'\)/);
assert.match(migration, /when 'free' then null/);
assert.match(migration, /is_trial_active = false/);
assert.match(migration, /v_active_plan not in \('start', 'pro'\)/);
assert.doesNotMatch(migration, /update public\.payments/);
assert.doesNotMatch(migration, /update public\.erp_payments/);

console.log('Migração Premium -> Pro: estado corrente corrigido e histórico financeiro preservado.');
