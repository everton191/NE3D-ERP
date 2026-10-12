const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const publicSource = fs.readFileSync(path.join(root, 'src/features/storefront/storefront-public.js'), 'utf8');
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260831214710_phase3_storefront_privacy_and_analytics.sql'),
  'utf8',
);

assert.match(app, /STOREFRONT_ANALYTICS_EVENT_TYPES/);
assert.match(app, /"instagram_click"/);
assert.match(app, /"tiktok_click"/);
assert.match(app, /"share"/);
assert.doesNotMatch(app + publicSource, /registrarEventoLojaPublica\("share_click"/);
assert.match(app, /limparPersistenciaPublicaLegadaComPii/);
assert.match(migration, /jsonb_typeof\(metadata_json\) = 'object'/);
assert.match(migration, /product\.store_id = store_events\.store_id/);
assert.match(migration, /char_length\(coalesce\(customer_phone, ''\)\) <= 24/);
assert.match(migration, /public\.storefront_publication_allowed\(store_id\)/);

async function main() {
  const sandbox = { window: {}, console };
  vm.runInNewContext(publicSource, sandbox);
  const api = sandbox.window.SimplificaStorefrontPublic;
  const requests = [];
  const removed = [];
  let localWrites = 0;
  let consent = 'unset';
  const context = {
    STOREFRONT_ANALYTICS_EVENT_TYPES: ['product_view'],
    getStorefrontAnalyticsConsent: () => consent,
    getStorefrontPublicViewModel: () => ({ store: { id: 'public-shop' }, source: 'supabase' }),
    registrarStorefrontDebugLeve: () => {},
    requisicaoSupabase: async (url, options) => { requests.push({ url, options }); },
    localStorage: { setItem: () => { localWrites += 1; },
      removeItem: (key) => removed.push(key) },
    STOREFRONT_PUBLIC_LEADS_KEY: 'leads', STOREFRONT_PUBLIC_EVENTS_KEY: 'events',
    STOREFRONT_PUBLIC_ORDER_DRAFTS_KEY: 'drafts'
  };
  for (consent of ['unset', 'rejected']) {
    await api.registrarEventoLojaPublica('product_view', {}, {}, context);
  }
  assert.equal(requests.length, 0, 'Sem consentimento nao deve enviar analytics');
  consent = 'accepted';
  await api.registrarEventoLojaPublica('invalid', {}, {}, context);
  assert.equal(requests.length, 0, 'Tipo de evento desconhecido deve ser ignorado');
  await api.registrarEventoLojaPublica('product_view', {
    product_id: 'public-product', source: 'test', customer_name: 'Pessoa teste', phone: '123'
  }, {}, context);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.auth, false);
  assert.deepEqual(JSON.parse(requests[0].options.body), { store_id: 'public-shop',
    product_id: 'public-product', event_type: 'product_view', metadata_json: { source: 'test' } });
  context.requisicaoSupabase = async () => { throw new Error('offline'); };
  await api.registrarEventoLojaPublica('product_view', {}, { silent: true }, context);
  assert.equal(localWrites, 0, 'Falha remota nao deve persistir analytics localmente');
  api.limparPersistenciaPublicaLegadaComPii(context);
  assert.deepEqual(removed, ['leads', 'events', 'drafts']);
  console.log('Fase 3 privacidade/telemetria: consentimento, payload minimo, falha offline e limpeza local PASS.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
