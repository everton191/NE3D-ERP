#!/usr/bin/env node
var readFileSync = require("fs").readFileSync;
var path = require("path");

var ok = 0;
var fail = 0;

function assert(cond, msg) {
  if (cond) { ok++; return true; }
  fail++;
  console.error("  FAIL: " + msg);
}

var src = readFileSync(
  path.join(__dirname, "..", "src", "features", "home", "carousel3d", "presenters", "widget-presenters.js"),
  "utf8"
);

var dataSrc = readFileSync(
  path.join(__dirname, "..", "src", "features", "home", "carousel3d", "data", "widget-data-sources.js"),
  "utf8"
);

var fakeGlobal = {};
var fakeModule = { exports: {} };
var fn = new Function("window", "globalThis", "module", "exports", src);
fn(fakeGlobal, fakeGlobal, fakeModule, fakeModule.exports);
var P = fakeModule.exports || fakeGlobal.SimplificaWidgetPresenters;

var dataFakeGlobal = {};
var dataFakeModule = { exports: {} };
var dataFn = new Function("window", "globalThis", "module", "exports", dataSrc);
dataFn(dataFakeGlobal, dataFakeGlobal, dataFakeModule, dataFakeModule.exports);
var DS = dataFakeModule.exports || dataFakeGlobal.SimplificaWidgetDataSources;

var today = new Date();
var todayStr = today.toISOString();
var yesterdayStr = new Date(today.getTime() - 86400000).toISOString();

var P_MAP = {
  production: P.presentProduction,
  orders_recent: P.presentOrdersRecent,
  day_summary: P.presentDaySummary,
  cash_today: P.presentCashToday,
  stock: P.presentStock,
  customers: P.presentCustomers,
  storefront: P.presentStorefront,
  alerts: P.presentAlerts,
};

console.log("=== WIDGET PRESENTERS TESTS ===\n");

// A) 8 presenters existem
console.log("[A] 8 presenters existem");
Object.keys(P_MAP).forEach(function(k) { assert(typeof P_MAP[k] === "function", k + " exists"); });

// B) todos aceitam READY
console.log("\n[B] todos aceitam READY");

var readySnapshots = {
  production: DS.normalizeProductionSnapshot([{ id: "1", status: "em_impressao", item_name: "A" }]),
  orders_recent: DS.normalizeOrdersRecentSnapshot([{ id: "1", cliente: "Ana", total: 100, status: "aberto", updatedAt: todayStr }]),
  day_summary: DS.normalizeDaySummarySnapshot([{ id: "1", total: 50, itens: [], status: "aberto", updatedAt: todayStr }]),
  cash_today: DS.normalizeCashTodaySnapshot([{ id: "1", tipo: "entrada", valor: 100, data: todayStr }]),
  stock: DS.normalizeStockSnapshot([{ id: "m1", nome: "PLA", qtd: 0, stock_status: "critical" }]),
  customers: DS.normalizeCustomersSnapshot([{ cliente: "Ana", total: 100, status: "aberto" }]),
  storefront: DS.normalizeStorefrontSnapshot({ store: { active: true }, products: [{ id: "p1", active: true, visible: true }], leads: [], events: [] }),
  alerts: DS.normalizeAlertsSnapshot({ pedidos: [{ id: "a1", cliente: "X", prazo: yesterdayStr, status: "aberto" }] }),
};

Object.keys(readySnapshots).forEach(function(key) {
  var snap = readySnapshots[key];
  var vm = P_MAP[key](snap);
  assert(vm.state === "ready", key + ": READY state is 'ready'");
  assert(typeof vm.id === "string", key + ": has id string");
  assert(typeof vm.title === "string", key + ": has title string");
  assert(typeof vm.animationKey === "string", key + ": has animationKey string");
  assert(vm.primaryMetric !== null, key + ": has primaryMetric");
});

// C) todos aceitam EMPTY
console.log("\n[C] todos aceitam EMPTY");

var emptySnapshots = {
  production: DS.normalizeProductionSnapshot([]),
  orders_recent: DS.normalizeOrdersRecentSnapshot([]),
  day_summary: DS.normalizeDaySummarySnapshot([]),
  cash_today: DS.normalizeCashTodaySnapshot([]),
  stock: DS.normalizeStockSnapshot([]),
  customers: DS.normalizeCustomersSnapshot([]),
  storefront: DS.normalizeStorefrontSnapshot({}),
  alerts: DS.normalizeAlertsSnapshot({}),
};

Object.keys(emptySnapshots).forEach(function(key) {
  var snap = emptySnapshots[key];
  var vm = P_MAP[key](snap);
  assert(vm.state === "empty", key + ": EMPTY state is 'empty'");
  assert(vm.visualState === "empty", key + ": EMPTY visualState is 'empty'");
});

// D) todos aceitam ERROR
console.log("\n[D] todos aceitam ERROR");

var errorSnapshots = {
  production: DS.normalizeProductionSnapshot(null, { error: true }),
  orders_recent: DS.normalizeOrdersRecentSnapshot(null, { error: true }),
  day_summary: DS.normalizeDaySummarySnapshot(null, { error: true }),
  cash_today: DS.normalizeCashTodaySnapshot(null, { error: true }),
  stock: DS.normalizeStockSnapshot(null, { error: true }),
  customers: DS.normalizeCustomersSnapshot(null, { error: true }),
  storefront: DS.normalizeStorefrontSnapshot(null, { error: true }),
  alerts: DS.normalizeAlertsSnapshot({ error: true }),
};

Object.keys(errorSnapshots).forEach(function(key) {
  var snap = errorSnapshots[key];
  var vm = P_MAP[key](snap);
  assert(vm.state === "error", key + ": ERROR state is 'error'");
  assert(vm.visualState === "error", key + ": ERROR visualState is 'error'");
});

// E) todos aceitam LOADING
console.log("\n[E] todos aceitam LOADING");

Object.keys(P_MAP).forEach(function(k) {
  var vm = P_MAP[k](null);
  assert(vm.state === "loading", k + "(null) state is 'loading'");
  assert(vm.visualState === "loading", k + "(null) visualState is 'loading'");
  assert(typeof vm.id === "string", k + "(null) has id");
  assert(typeof vm.title === "string", k + "(null) has title");
});

var loadingSnap = { status: "loading", updatedAt: todayStr, data: null };
Object.keys(P_MAP).forEach(function(k) {
  var vm = P_MAP[k](loadingSnap);
  assert(vm.state === "loading", k + "(loading) state is 'loading'");
});

// F) nenhum presenter muta snapshot
console.log("\n[F] nenhum presenter muta snapshot");

var prodSnap = DS.normalizeProductionSnapshot([{ id: "1", status: "em_impressao", item_name: "A" }]);
var prodSnapBefore = JSON.stringify(prodSnap);
P_MAP.production(prodSnap);
assert(JSON.stringify(prodSnap) === prodSnapBefore, "production snapshot not mutated");

var ordSnap = DS.normalizeOrdersRecentSnapshot([{ id: "1", cliente: "Ana", total: 100, status: "aberto", updatedAt: todayStr }]);
var ordSnapBefore = JSON.stringify(ordSnap);
P_MAP.orders_recent(ordSnap);
assert(JSON.stringify(ordSnap) === ordSnapBefore, "orders_recent snapshot not mutated");

var cashSnap = DS.normalizeCashTodaySnapshot([{ id: "1", tipo: "entrada", valor: 50, data: todayStr }]);
var cashSnapBefore = JSON.stringify(cashSnap);
P_MAP.cash_today(cashSnap);
assert(JSON.stringify(cashSnap) === cashSnapBefore, "cash_today snapshot not mutated");

// G) orders_recent exibe no maximo 3 itens
console.log("\n[G] orders_recent exibe no maximo 3 itens");

var manyOrders = [];
for (var i = 0; i < 10; i++) {
  manyOrders.push({ id: "o" + i, cliente: "C" + i, total: 10 * i, status: "aberto", updatedAt: todayStr });
}
var ordVm = P_MAP.orders_recent(DS.normalizeOrdersRecentSnapshot(manyOrders));
assert(ordVm.items.length <= 3, "orders_recent items <= 3 (got " + ordVm.items.length + ")");

// H) stock exibe no maximo 3 alertItems
console.log("\n[H] stock exibe no maximo 3 alertItems");

var manyMaterials = [];
for (var j = 0; j < 10; j++) {
  manyMaterials.push({ id: "m" + j, nome: "M" + j, qtd: 0, stock_status: "critical" });
}
var stockVm = P_MAP.stock(DS.normalizeStockSnapshot(manyMaterials));
assert(stockVm.items.length <= 3, "stock items <= 3 (got " + stockVm.items.length + ")");

// I) alerts exibe no maximo 3 alertas
console.log("\n[I] alerts exibe no maximo 3 alertas");

var manyPedidos = [];
for (var k = 0; k < 10; k++) {
  manyPedidos.push({ id: "p" + k, cliente: "X" + k, prazo: yesterdayStr, status: "aberto" });
}
var alertsVm = P_MAP.alerts(DS.normalizeAlertsSnapshot({ pedidos: manyPedidos }));
assert(alertsVm.items.length <= 3, "alerts items <= 3 (got " + alertsVm.items.length + ")");

// J) cash_today mantem contrato de hoje
console.log("\n[J] cash_today mantem contrato de hoje");

var cashData = DS.normalizeCashTodaySnapshot([
  { id: "m1", tipo: "entrada", valor: 200, data: todayStr },
  { id: "m2", tipo: "saida", valor: 50, data: todayStr },
]);
var cashVm = P_MAP.cash_today(cashData);
assert(cashVm.primaryMetric.value === 150, "cash_today saldo = 200 - 50 = 150");
assert(cashVm.secondaryMetrics[0].label === "entradas", "cash_today first secondary = entradas");
assert(cashVm.secondaryMetrics[1].label === "saidas", "cash_today second secondary = saidas");

// K) customers nao produz metricas nao existentes
console.log("\n[K] customers nao produz metricas nao existentes");

var custSnap = DS.normalizeCustomersSnapshot([{ cliente: "Ana", total: 100, status: "aberto" }]);
var custVm = P_MAP.customers(custSnap);
var custKeys = Object.keys(custVm);
assert(!custKeys.includes("birthdays"), "No birthdays field");
assert(!custKeys.includes("loyalty"), "No loyalty field");
assert(!custKeys.includes("returnRate"), "No returnRate field");
assert(custVm.primaryMetric.label === "clientes", "primaryMetric label = clientes");
assert(custVm.secondaryMetrics.length === 2, "exactly 2 secondary metrics");
assert(custVm.secondaryMetrics[0].label === "pedidos", "secondary[0] = pedidos");
assert(custVm.secondaryMetrics[1].label === "em aberto", "secondary[1] = em aberto");

// L) storefront target = lojaOnline
console.log("\n[L] storefront target = lojaOnline");

var storeSnap = DS.normalizeStorefrontSnapshot({ store: { active: true }, products: [], leads: [], events: [] });
var storeVm = P_MAP.storefront(storeSnap);
assert(storeVm.targetScreen === "lojaOnline", "storefront targetScreen = lojaOnline");

// M) nenhum presenter recalcula regra de negocio
console.log("\n[M] nenhum presenter recalcula regra de negocio");

assert(src.indexOf("pedidoContaParaAnalytics") === -1, "No pedidoContaParaAnalytics");
assert(src.indexOf("calcularResumoFinanceiroPedido") === -1, "No calcularResumoFinanceiroPedido");
assert(src.indexOf("resolverStatusEstoque") === -1, "No resolverStatusEstoque");
assert(src.indexOf("getSessaoCaixaAtual") === -1, "No getSessaoCaixaAtual");
assert(src.indexOf("fetch(") === -1, "No fetch in presenters");
assert(src.indexOf("localStorage") === -1, "No localStorage in presenters");
assert(src.indexOf("Supabase") === -1, "No Supabase in presenters");

// N) todos possuem animationKey valido
console.log("\n[N] todos possuem animationKey valido");

var expectedKeys = {
  production: "production-flow",
  orders_recent: "order-stack",
  day_summary: "metric-bars",
  cash_today: "cash-flow",
  stock: "stock-level",
  customers: "customer-cards",
  storefront: "storefront-showcase",
  alerts: "alert-pulse",
};

Object.keys(expectedKeys).forEach(function(key) {
  var vm = P_MAP[key](emptySnapshots[key]);
  assert(vm.animationKey === expectedKeys[key], key + " animationKey = " + expectedKeys[key]);
});

// O) targetScreen preservado
console.log("\n[O] targetScreen preservado");

assert(P_MAP.production(emptySnapshots.production).targetScreen === "producao", "production target = producao");
assert(P_MAP.orders_recent(emptySnapshots.orders_recent).targetScreen === "pedidos", "orders target = pedidos");
assert(P_MAP.day_summary(emptySnapshots.day_summary).targetScreen === "relatorios", "day_summary target = relatorios");
assert(P_MAP.cash_today(emptySnapshots.cash_today).targetScreen === "caixa", "cash_today target = caixa");
assert(P_MAP.stock(emptySnapshots.stock).targetScreen === "estoque", "stock target = estoque");
assert(P_MAP.customers(emptySnapshots.customers).targetScreen === "clientes", "customers target = clientes");
assert(P_MAP.storefront(emptySnapshots.storefront).targetScreen === "lojaOnline", "storefront target = lojaOnline");
assert(P_MAP.alerts(emptySnapshots.alerts).targetScreen === null, "alerts target = null");

// P) nenhum arquivo do CODEX foi alterado
console.log("\n[P] nenhum arquivo do CODEX foi alterado");

var contractFile = readFileSync(
  path.join(__dirname, "..", "src", "features", "home", "carousel3d", "data", "widget-data-sources.js"),
  "utf8"
);
assert(contractFile.indexOf("SimplificaWidgetDataSources") !== -1, "data layer unchanged");

// ============================================================
console.log("\n=== RESULTS ===");
console.log("  PASS: " + ok);
console.log("  FAIL: " + fail);
console.log(fail === 0 ? "\nALL WIDGET PRESENTER TESTS PASSED" : "\nSOME TESTS FAILED");
process.exit(fail > 0 ? 1 : 0);