"use strict";

// Real app catalog merge + real billing/plan normalizers. No Supabase, account,
// subscription, price table, browser or persistence writes are involved.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("app.js");
const clone = (value) => JSON.parse(JSON.stringify(value));

function extractFunction(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `actual function missing: ${name}`);
  const next = /\r?\n(?:async )?function \w+\(/g;
  next.lastIndex = start;
  const end = next.exec(app);
  assert.ok(end, `following declaration missing: ${name}`);
  return app.slice(start, end.index);
}

const context = vm.createContext({ window: {}, saasPlans: [], billingConfig: { planSlug: "free" } });
vm.runInContext(read("src/features/account/plan-normalizers.js"), context);
vm.runInContext(read("src/features/account/billing-commands.js"), context);
const constantStart = app.indexOf("const FREE_BACKUP_LIMIT_MB =");
const constantEnd = app.indexOf("const PLAN_REGISTRY =", constantStart);
const defaultStart = app.indexOf("const DEFAULT_SAAS_PLANS =");
const defaultEnd = app.indexOf("const DEFAULT_TRIAL_DAYS =", defaultStart);
assert.ok(constantStart >= 0 && constantEnd > constantStart && defaultEnd > defaultStart);
vm.runInContext(app.slice(constantStart, constantEnd) + app.slice(defaultStart, defaultEnd), context);
const dependencies = vm.runInContext("({DEFAULT_SAAS_PLANS, FREE_BACKUP_LIMIT_MB, FREE_DEVICE_LIMIT})", context);
context.getBillingCommandsDeps = () => ({ ...dependencies, window: context.window, normalizarSlugPlano: context.normalizarSlugPlano });
vm.runInContext(["normalizarSlugPlano", "normalizarPlanoSaas", "garantirPlanosSaas", "getPlanoSaas", "mesclarListaPorId"].map(extractFunction).join("\n"), context);

function* permutations(rows) {
  if (rows.length === 0) { yield []; return; }
  for (let i = 0; i < rows.length; i += 1) {
    const rest = rows.slice(0, i).concat(rows.slice(i + 1));
    for (const suffix of permutations(rest)) yield [rows[i], ...suffix];
  }
}

function catalog(rows) {
  context.saasPlans = clone(rows);
  const before = JSON.stringify(context.saasPlans);
  const source = context.saasPlans;
  const merged = clone(context.garantirPlanosSaas());
  assert.equal(JSON.stringify(source), before, "merging must not mutate source row objects");
  assert.deepEqual(merged.map((plan) => plan.slug), ["free", "start", "pro"], "canonical catalog/order must remain three plans");
  return merged;
}

const canonical = [
  { id: "db-free", slug: "free", active: true, price: 1234, maxUsers: 999, allowEmployees: true },
  { id: "db-start", slug: "start", active: true, price: 1234, maxUsers: 999 },
  { id: "db-pro", slug: "pro", active: true, price: 1234, maxUsers: 999 }
];
const aliases = [
  { id: "legacy-premium", slug: "premium", active: false },
  { id: "legacy-trial", slug: "premium_trial", active: false },
  { id: "legacy-monthly", slug: "premium_monthly", active: false },
  { id: "legacy-first-month", slug: "premium_first_month", active: false }
];
const expected = canonical.map((row) => clone(context.normalizarPlanoSaas(row)));
assert.equal(context.normalizarSlugPlano("premium"), "pro", "exercise actual legacy normalizer");
assert.equal(context.normalizarSlugPlano("premium_trial"), "pro");
assert.equal(expected[0].price, 0, "existing canonical commercial defaults stay authoritative");
assert.equal(expected[0].maxUsers, 1);
assert.equal(expected[0].allowEmployees, false);

let orders = 0;
for (const rows of permutations([...canonical, ...aliases])) {
  const merged = catalog(rows);
  assert.deepEqual(merged, expected, `persisted canonical rows must win independently of source order ${orders}`);
  assert.deepEqual(clone(context.getPlanoSaas("pro")), expected[2], "getPlanoSaas must preserve canonical ID/active state");
  orders += 1;
}
assert.equal(orders, 5040);

// Explicit deactivation of a canonical record must not be repaired to true by
// local defaults or by any active legacy alias (including a trial alias).
const disabled = canonical.map((row) => ({ ...row, active: false }));
const activeAliases = aliases.map((row) => ({ ...row, active: true }));
for (const rows of [disabled.concat(activeAliases), activeAliases.concat(disabled), [...disabled, ...activeAliases].reverse()]) {
  const merged = catalog(rows);
  assert.deepEqual(merged.map((plan) => plan.active), [false, false, false]);
  for (const slug of ["free", "start", "pro"]) {
    assert.equal(context.getPlanoSaas(slug).active, false, `canonical ${slug} deactivation must survive repeated reads`);
  }
}

// If there is no persisted canonical Pro, retain the previous legacy fallback
// semantics: accepted legacy records still override defaults, in input order.
for (const legacyRows of [
  [{ id: "only-premium", slug: "premium", active: false }],
  [{ id: "only-trial", slug: "premium-trial", active: true }],
  [{ id: "old-one", slug: "premium", active: true }, { id: "old-two", slug: "premium_trial", active: false }],
  [{ id: "old-two", slug: "premium_trial", active: false }, { id: "old-one", slug: "premium", active: true }]
]) {
  catalog(legacyRows);
  const last = legacyRows[legacyRows.length - 1];
  const pro = clone(context.getPlanoSaas("premium"));
  assert.equal(pro.id, last.id, "legacy-only catalog must retain its accepted legacy identifier");
  assert.equal(pro.active, last.active, "legacy-only activation/deactivation fallback must remain unchanged");
  assert.equal(pro.slug, "pro", "legacy names are read-compatible without adding a Premium product");
}

// Case/space normalization and the former ID fallback remain compatible.
for (const rows of [
  [{ id: "canonical-spaced", slug: " PRO ", active: false }, { id: "old", slug: "premium", active: true }],
  [{ id: "old", slug: "premium", active: true }, { id: "pro", active: false }]
]) {
  catalog(rows);
  assert.equal(context.getPlanoSaas("pro").active, false);
}
const defaults = catalog([]);
assert.deepEqual(defaults, clone(dependencies.DEFAULT_SAAS_PLANS.map((row) => context.normalizarPlanoSaas(row))));
catalog([{ id: "unknown", slug: "unrelated", active: false }]);
assert.equal(context.getPlanoSaas("free").active, true, "unknown rows must not overwrite defaults");

// Exercise the actual remote-sync entry point as well: normalizing each remote
// row before canonical resolution erases the alias slug and poisons the cache.
// Only unrelated data/API/persistence boundaries are mocked; no requests leave
// this process and no subscription or commercial-price writes are permitted.
vm.runInContext(read("src/features/security/security-audit-commands.js"), context);
async function verifyRemoteSync() {
  const unknown = { id: "legacy-unknown", slug: "retired-demo", active: false, price: 777 };
  const subscriptions = [{ id: "synthetic-subscription", client_id: "synthetic-client", plan_id: "db-pro", status: "active", plans: { id: "db-pro", slug: "pro", price: 59.9 } }];
  const payments = [{ id: "synthetic-payment", subscription_id: "synthetic-subscription", amount: 59.9, status: "approved" }];
  const originalBilling = JSON.stringify(context.billingConfig);
  let syncRuns = 0;
  for (const enabled of [true, false]) {
    const remoteCanonical = canonical.map((row) => ({ ...row, active: enabled }));
    const remoteAliases = aliases.map((row) => ({ ...row, active: !enabled }));
    const expectedCatalog = remoteCanonical.map((row) => clone(context.normalizarPlanoSaas(row)));
    for (const canonicalFirst of [true, false]) {
      // Recreate a cache poisoned by the previous per-row normalizer, with
      // canonical-looking slugs on legacy IDs but no true canonical IDs.
      context.saasPlans = clone([...remoteAliases, unknown].map((row) => context.normalizarPlanoSaas(row)));
      let remoteRows = canonicalFirst
        ? [...remoteCanonical, ...remoteAliases, unknown]
        : [unknown, ...remoteAliases, ...remoteCanonical];
      const unchangedRows = JSON.stringify(remoteRows);
      let localSubscriptions = clone(subscriptions);
      let localPayments = clone(payments);
      const requests = [];
      const savedCatalogs = [];
      let saves = 0;
      const deps = {
        String, Number, Object, Array, Date, Promise, JSON,
        syncConfig: { supabaseAccessToken: "synthetic-only", supabaseUrl: "https://example.invalid" },
        SUPERADMIN_PAGE_SIZE: 200,
        isSuperAdmin: () => true,
        definirEstadoClientesSaasRemoto() {}, logSuperadminSupabaseDebug() {},
        registrarDiagnostico() {}, registrarErroAplicacaoSilencioso() {}, mostrarToast() {},
        classificarFalhaClientesSaasRemoto: (error) => ({ status: "error", detail: error.message, message: error.message, log: {} }),
        requisicaoSupabase: async (url, request = {}) => {
          assert.equal(request.method || "GET", "GET", "catalog sync must not write subscriptions, prices or other data");
          requests.push(url);
          if (url.startsWith("/rest/v1/plans?")) return clone(remoteRows);
          if (url.startsWith("/rest/v1/subscriptions?")) return clone(subscriptions);
          if (url.startsWith("/rest/v1/payments?")) return clone(payments);
          assert.ok(["clients", "profiles", "erp_profiles", "saas_sessions"].some((table) => url.startsWith(`/rest/v1/${table}?`)), `unexpected sync route: ${url}`);
          return [];
        },
        mesclarListaPorId: context.mesclarListaPorId,
        garantirPlanosSaas: context.garantirPlanosSaas,
        normalizarPlanoSaas: context.normalizarPlanoSaas,
        normalizarClienteSaas: (row) => row,
        normalizarPagamentoSaas: (row) => row,
        normalizarSessaoSaas: (row) => row,
        getSaasClients: () => [], setSaasClients() {},
        getSaasPlans: () => context.saasPlans,
        setSaasPlans: (rows) => { context.saasPlans = rows; },
        getSaasSubscriptions: () => localSubscriptions,
        setSaasSubscriptions: (rows) => { localSubscriptions = rows; },
        mesclarAssinaturasPorCliente: (current, online) => {
          assert.deepEqual(current, subscriptions);
          assert.deepEqual(online, subscriptions);
          return current;
        },
        getSaasPayments: () => localPayments,
        setSaasPayments: (rows) => { localPayments = rows; },
        getSaasSessions: () => [], setSaasSessions() {},
        getUsuarios: () => [], setUsuarios() {}, mesclarUsuariosSupabase: () => [],
        restringirDadosSaasAoEscopoAtual() {}, StateStore: { set() {} },
        salvarDados: () => { saves += 1; savedCatalogs.push(clone(context.saasPlans)); }
      };
      for (let repetition = 0; repetition < 2; repetition += 1) {
        const result = await context.window.SimplificaSecurityAudit.carregarSaasSupabaseSilencioso({}, deps);
        assert.equal(result.ok, true, `actual sync must complete: ${result.code || ""}`);
        assert.deepEqual(clone(context.saasPlans), expectedCatalog, `sync must repair poisoned cache before saving (active=${enabled}, canonicalFirst=${canonicalFirst}, repeat=${repetition})`);
        assert.deepEqual(savedCatalogs[repetition], expectedCatalog, "persistence boundary must receive only the resolved canonical catalog");
        for (const slug of ["free", "start", "pro"]) {
          const expectedPlan = expectedCatalog.find((row) => row.slug === slug);
          for (let readIndex = 0; readIndex < 3; readIndex += 1) {
            assert.deepEqual(clone(context.getPlanoSaas(slug)), expectedPlan, "repeated reads must preserve canonical ID, availability, price and capabilities");
          }
        }
        assert.deepEqual(localSubscriptions, subscriptions, "catalog repair must not rewrite subscription data or embedded prices");
        assert.deepEqual(clone(localPayments), payments, "catalog repair must not rewrite payment values");
        assert.equal(JSON.stringify(context.billingConfig), originalBilling, "catalog repair must not change the current license");
        remoteRows = [...remoteRows].reverse();
        syncRuns += 1;
      }
      assert.equal(saves, 2, "each successful sync must persist its resolved canonical catalog once");
      assert.equal(requests.length, 14, "both real sync passes must retain their seven read-only routes");
      assert.equal(JSON.stringify(remoteRows), unchangedRows, "remote plan IDs, slugs and raw commercial prices must remain unchanged");
    }
  }
  console.log(`PASS canonical plan catalog: ${orders} input orders and ${syncRuns} actual sync passes; poisoned cache recovery, canonical deactivation, legacy fallback, IDs, prices/capabilities and repeated reads preserved.`);
}
verifyRemoteSync().catch((error) => { console.error(error); process.exitCode = 1; });
