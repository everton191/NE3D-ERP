const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260831214710_phase3_storefront_privacy_and_analytics.sql'),
  'utf8',
);

assert.match(app, /getStorefrontAnalyticsConsent\(\) !== "accepted"/);
assert.match(app, /STOREFRONT_ANALYTICS_EVENT_TYPES/);
assert.match(app, /"instagram_click"/);
assert.match(app, /"tiktok_click"/);
assert.match(app, /"share"/);
assert.doesNotMatch(app, /registrarEventoLojaPublica\("share_click"/);
assert.match(app, /limparPersistenciaPublicaLegadaComPii/);
assert.match(app, /localStorage\.removeItem\(STOREFRONT_PUBLIC_LEADS_KEY\)/);
assert.match(app, /localStorage\.removeItem\(STOREFRONT_PUBLIC_EVENTS_KEY\)/);
assert.match(app, /localStorage\.removeItem\(STOREFRONT_PUBLIC_ORDER_DRAFTS_KEY\)/);
assert.match(migration, /jsonb_typeof\(metadata_json\) = 'object'/);
assert.match(migration, /product\.store_id = store_events\.store_id/);
assert.match(migration, /char_length\(coalesce\(customer_phone, ''\)\) <= 24/);
assert.match(migration, /public\.storefront_publication_allowed\(store_id\)/);

console.log('Fase 3 privacidade/telemetria: consentimento, minimizacao local e RLS validados.');
