const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260831232811_harden_legacy_saas_rpc_contracts.sql'), 'utf8');
const compatibilityMigration = fs.readFileSync(path.join(root, 'supabase/migrations/20260831234648_normalize_legacy_signup_to_free.sql'), 'utf8');

assert.match(app, /const DEFAULT_TRIAL_DAYS = 0/);
assert.match(app, /p_plan_slug: "free"/);
assert.match(app, /p_trial_days: 0/);
assert.doesNotMatch(app, /id: "premium_trial"/);
assert.match(migration, /Plano inicial invalido/);
assert.match(migration, /Trial nao esta disponivel/);
assert.match(migration, /where slug = 'free'/);
assert.match(migration, /Codigo promocional obrigatorio/);
assert.match(compatibilityMigration, /not in \('free', 'premium', 'premium_trial'\)/);
assert.match(compatibilityMigration, /not in \(0, 7\)/);
assert.match(compatibilityMigration, /sempre grava o estado comercial Free/);
console.log('Contrato de planos: novos cadastros Free e planos legados bloqueados.');
