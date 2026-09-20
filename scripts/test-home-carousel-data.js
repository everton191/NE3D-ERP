#!/usr/bin/env node
const { readFileSync } = require("fs");
const path = require("path");

let ok = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) { ok++; return true; }
  fail++;
  console.error("  FAIL: " + msg);
}

const src = readFileSync(
  path.join(__dirname, "..", "src", "features", "home", "carousel3d", "data", "widget-data-sources.js"),
  "utf8"
);

const W = {};
const fakeGlobal = { SimplificaWidgetDataSources: null };
const fn = new Function("window", "globalThis", "module", "exports", src);
const fakeModule = { exports: {} };
fn(fakeGlobal, fakeGlobal, fakeModule, fakeModule.exports);
const DS = fakeModule.exports || fakeGlobal.SimplificaWidgetDataSources;

console.log("=== WIDGET DATA SOURCES TESTS ===\n");

const today = new Date();
const todayStr = today.toISOString();

// ============================================================
// A) cash_today respeita o dia atual corretamente
// ============================================================
console.log("[A] cash_today respeita o dia atual corretamente");

const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const todayEnd = new Date(todayStart.getTime() + 86400000);
const yesterdayStr = new Date(today.getTime() - 86400000).toISOString();
const tomorrowStr = new Date(today.getTime() + 86400000).toISOString();

const mixedMovs = [
  { id: "m1", tipo: "entrada", valor: 100, data: todayStr },
  { id: "m2", tipo: "saida", valor: 20, data: todayStr },
  { id: "m3", tipo: "entrada", valor: 500, data: yesterdayStr },
  { id: "m4", tipo: "entrada", valor: 300, data: tomorrowStr },
  { id: "m5", tipo: "saida", valor: 10, data: yesterdayStr },
];

const cashToday = DS.normalizeCashTodaySnapshot(mixedMovs);
assert(cashToday.status === "ready", "Cash today status is ready");
assert(cashToday.data.entradas === 100, "Cash today: only today entries (100), excludes yesterday (500) and tomorrow (300)");
assert(cashToday.data.saidas === 20, "Cash today: only today exits (20), excludes yesterday (10)");
assert(cashToday.data.saldo === 80, "Cash today: saldo = 100 - 20");

const emptyCash = DS.normalizeCashTodaySnapshot([]);
assert(emptyCash.status === "empty", "Cash today: empty array returns empty status");

const errorCash = DS.normalizeCashTodaySnapshot(null, { error: true });
assert(errorCash.status === "error", "Cash today: error option returns error status");

// ============================================================
// B) storefront targetScreen corresponde à navegação real
// ============================================================
console.log("\n[B] storefront targetScreen corresponde à navegação real");

const storeData = {
  store: { active: true },
  products: [{ id: "p1", active: true, visible: true }],
  leads: [],
  events: [],
};

const storeSnap = DS.normalizeStorefrontSnapshot(storeData);
assert(storeSnap.status === "ready", "Storefront status is ready");
assert(storeSnap.data.targetScreen === "lojaOnline", "Storefront targetScreen = 'lojaOnline' (admin hub, mobile-enabled)");

const emptyStore = DS.normalizeStorefrontSnapshot({});
assert(emptyStore.data.targetScreen === "lojaOnline", "Empty storefront still has targetScreen = 'lojaOnline'");

const errorStore = DS.normalizeStorefrontSnapshot(null, { error: true });
assert(errorStore.data.targetScreen === "lojaOnline", "Error storefront still has targetScreen = 'lojaOnline'");

// ============================================================
// C) customers não produz métricas não suportadas
// ============================================================
console.log("\n[C] customers não produz métricas não suportadas");

const custOrders = [
  { cliente: "Ana", total: 100, status: "aberto" },
  { cliente: "Carlos", total: 50, status: "producao" },
];

const custSnap = DS.normalizeCustomersSnapshot(custOrders);
const custKeys = Object.keys(custSnap.data);
assert(custSnap.status === "ready", "Customers status is ready");
assert(custKeys.length === 3, "Customers has exactly 3 fields (uniqueCustomers, totalOrders, openOrders)");
assert(custKeys.includes("uniqueCustomers"), "Has uniqueCustomers");
assert(custKeys.includes("totalOrders"), "Has totalOrders");
assert(custKeys.includes("openOrders"), "Has openOrders");
assert(!custKeys.includes("birthdays"), "No birthdays metric");
assert(!custKeys.includes("loyalty"), "No loyalty metric");
assert(!custKeys.includes("returnRate"), "No returnRate metric");
assert(!custKeys.includes("newVsReturning"), "No newVsReturning metric");
assert(!custKeys.includes("averageOrderValue"), "No averageOrderValue metric");
assert(!custKeys.includes("churn"), "No churn metric");

// ============================================================
// D) uniqueCustomers usa chave documentada (nome)
// ============================================================
console.log("\n[D] uniqueCustomers usa chave documentada (nome)");

const sameNameOrders = [
  { cliente: "Maria", total: 100, status: "aberto" },
  { cliente: "Maria", total: 200, status: "producao" },
  { cliente: "João", total: 50, status: "aberto" },
];

const sameNameSnap = DS.normalizeCustomersSnapshot(sameNameOrders);
assert(sameNameSnap.data.uniqueCustomers === 2, "Same name 'Maria' counted once (key = name string)");
assert(sameNameSnap.data.totalOrders === 3, "Total orders = 3 (not affected by name dedup)");
assert(sameNameSnap.data.openOrders === 3, "Open orders = 3 (all non-terminal)");

// Verify normalization uses .trim()
const trimOrders = [
  { cliente: "  Ana  ", total: 10, status: "aberto" },
  { cliente: "Ana", total: 20, status: "aberto" },
];
const trimSnap = DS.normalizeCustomersSnapshot(trimOrders);
assert(trimSnap.data.uniqueCustomers === 1, "Trimmed name 'Ana' counted once (key uses .trim())");

// ============================================================
// E) todos os snapshots suportam EMPTY
// ============================================================
console.log("\n[E] todos os snapshots suportam EMPTY");

const emptyProd = DS.normalizeProductionSnapshot([]);
assert(emptyProd.status === "empty", "Production: empty array → empty status");
assert(emptyProd.data.inProgress === 0, "Production empty: inProgress = 0");

const emptyOrd = DS.normalizeOrdersRecentSnapshot([]);
assert(emptyOrd.status === "empty", "Orders: empty array → empty status");
assert(emptyOrd.data.orders.length === 0, "Orders empty: orders = []");

const emptyDay = DS.normalizeDaySummarySnapshot([]);
assert(emptyDay.status === "empty", "Day summary: empty array → empty status");
assert(emptyDay.data.faturamentoDia === 0, "Day summary empty: faturamento = 0");

const emptyCash2 = DS.normalizeCashTodaySnapshot([]);
assert(emptyCash2.status === "empty", "Cash today: empty array → empty status");
assert(emptyCash2.data.entradas === 0, "Cash today empty: entradas = 0");

const emptyStock = DS.normalizeStockSnapshot([]);
assert(emptyStock.status === "empty", "Stock: empty array → empty status");
assert(emptyStock.data.total === 0, "Stock empty: total = 0");

const emptyCust = DS.normalizeCustomersSnapshot([]);
assert(emptyCust.status === "empty", "Customers: empty array → empty status");
assert(emptyCust.data.uniqueCustomers === 0, "Customers empty: uniqueCustomers = 0");

const emptyStore2 = DS.normalizeStorefrontSnapshot({});
assert(emptyStore2.status === "empty", "Storefront: empty data → empty status");

const emptyAlerts = DS.normalizeAlertsSnapshot({});
assert(emptyAlerts.status === "empty", "Alerts: no conditions → empty status");
assert(emptyAlerts.data.count === 0, "Alerts empty: count = 0");

// ============================================================
// F) todos os snapshots suportam ERROR
// ============================================================
console.log("\n[F] todos os snapshots suportam ERROR");

const errProd = DS.normalizeProductionSnapshot(null, { error: true });
assert(errProd.status === "error", "Production: error → error status");
assert(errProd.data.inProgress === 0, "Production error: data is zeroed");

const errOrd = DS.normalizeOrdersRecentSnapshot(null, { error: true });
assert(errOrd.status === "error", "Orders: error → error status");
assert(errOrd.data.orders.length === 0, "Orders error: orders = []");

const errDay = DS.normalizeDaySummarySnapshot(null, { error: true });
assert(errDay.status === "error", "Day summary: error → error status");
assert(errDay.data.faturamentoDia === 0, "Day summary error: faturamento = 0");

const errCash = DS.normalizeCashTodaySnapshot(null, { error: true });
assert(errCash.status === "error", "Cash today: error → error status");
assert(errCash.data.entradas === 0, "Cash today error: entradas = 0");

const errStock = DS.normalizeStockSnapshot(null, { error: true });
assert(errStock.status === "error", "Stock: error → error status");
assert(errStock.data.total === 0, "Stock error: total = 0");

const errCust = DS.normalizeCustomersSnapshot(null, { error: true });
assert(errCust.status === "error", "Customers: error → error status");
assert(errCust.data.uniqueCustomers === 0, "Customers error: uniqueCustomers = 0");

const errStore = DS.normalizeStorefrontSnapshot(null, { error: true });
assert(errStore.status === "error", "Storefront: error → error status");
assert(errStore.data.active === false, "Storefront error: active = false");

const errAlerts = DS.normalizeAlertsSnapshot({ error: true });
assert(errAlerts.status === "error", "Alerts: error → error status");
assert(errAlerts.data.count === 0, "Alerts error: count = 0");

// ============================================================
// G) alerts só usam screenIds reais ou null
// ============================================================
console.log("\n[G] alerts só usam screenIds reais ou null");

const REAL_SCREEN_IDS = ["pedidos", "producao", "estoque", "caixa", "lojaOnline", "clientes", "relatorios", "config"];

const yesterday2 = new Date(today.getTime() - 86400000).toISOString();
const alertSnap = DS.normalizeAlertsSnapshot({
  pedidos: [{ id: "a1", cliente: "Ana", prazo: yesterday2, status: "aberto" }],
  productionJobs: [
    { id: "j1", item_name: "Peça A", status: "pausado" },
    { id: "j2", item_name: "Peça B", blocked_reason: "aguardando_material" },
  ],
  materiais: [{ id: "m1", nome: "PLA", qtd: 0, stock_status: "critical" }],
  caixaMovimentos: [{ id: "x1", tipo: "entrada", valor: 10 }],
  session: null,
});

assert(alertSnap.status === "ready", "Alerts with data → ready status");
alertSnap.data.alerts.forEach(function(a) {
  const valid = a.targetScreen === null || REAL_SCREEN_IDS.includes(a.targetScreen);
  assert(valid, "Alert type '" + a.type + "' targetScreen '" + a.targetScreen + "' is real or null");
});

// ============================================================
// H) nenhum card futuro possui data source
// ============================================================
console.log("\n[H] nenhum card futuro possui data source");

const futureWidgets = ["fiscal", "accounts_payable", "accounts_receivable", "purchases", "shipping", "crm", "quality", "maintenance"];
futureWidgets.forEach(function(w) {
  assert(!src.toLowerCase().includes(w), "No data source for future widget: " + w);
});

// ============================================================
// I) nenhum arquivo do Hermes foi alterado
// ============================================================
console.log("\n[I] nenhum arquivo do Hermes foi alterado");

const contractFile = readFileSync(
  path.join(__dirname, "..", "src", "features", "home", "carousel3d", "carousel-contract.js"),
  "utf8"
);
assert(contractFile.includes("SimplificaHomeCarouselContract"), "carousel-contract.js unchanged (Hermes file)");

const homeData = readFileSync(
  path.join(__dirname, "..", "src", "features", "home", "home-data.js"),
  "utf8"
);
assert(homeData.includes("SimplificaHomeData"), "home-data.js unchanged");

const homeController = readFileSync(
  path.join(__dirname, "..", "src", "features", "home", "home-controller.js"),
  "utf8"
);
assert(homeController.includes("SimplificaHomeController"), "home-controller.js unchanged");

// ============================================================
// J) Home não foi alterada
// ============================================================
console.log("\n[J] Home não foi alterada");

assert(!src.includes("renderDashboard"), "Data sources do not reference Home renderers");
assert(!src.includes("renderResumoDia"), "Data sources do not reference day summary renderer");
assert(!src.includes("renderPedidosRecentes"), "Data sources do not reference orders renderer");
assert(!src.includes("renderDashboardSimplifica"), "Data sources do not reference Simplifica dashboard");

// ============================================================
// K) Production snapshot usa somente status reais
// ============================================================
console.log("\n[K] Production snapshot usa somente status reais");

const fakeJobs = [
  { id: "1", status: "em_impressao", item_name: "Peça A" },
  { id: "2", status: "na_fila", item_name: "Peça B" },
  { id: "3", status: "pronto_para_entrega", item_name: "Peça C" },
  { id: "4", status: "pendente", item_name: "Peça D" },
  { id: "5", status: "pausado", item_name: "Peça E" },
  { id: "6", status: "falhou", item_name: "Peça F" },
];

const prodSnap = DS.normalizeProductionSnapshot(fakeJobs);
assert(prodSnap.status === "ready", "Production status is ready");
assert(prodSnap.data.inProgress === 3, "inProgress = 2 active + 1 queue");
assert(prodSnap.data.active === 2, "active = em_impressao + pausado");
assert(prodSnap.data.inQueue === 1, "inQueue = na_fila");
assert(prodSnap.data.pending === 2, "pending = pendente + falhou");
assert(prodSnap.data.ready === 1, "ready = pronto_para_entrega");

// ============================================================
// L) Orders_recent preserva valores da Home atual
// ============================================================
console.log("\n[L] Orders_recent preserva valores da Home atual");

const fakeOrders = [
  { id: "101", cliente: "Ana", numeroPedido: "001", itens: [{}, {}], prazo: "20/09/2026", total: 150.50, status: "aberto", updatedAt: "2026-09-18T10:00:00Z" },
  { id: "102", cliente: "Carlos", numeroPedido: "002", itens: [{}], total: 89.90, status: "producao", updatedAt: "2026-09-17T15:00:00Z" },
  { id: "103", cliente: "Maria", numeroPedido: "003", itens: [{}, {}, {}], total: 320.00, status: "pronto", updatedAt: "2026-09-16T08:00:00Z" },
  { id: "104", cliente: "", numeroPedido: "004", itens: [], total: 0, status: "aberto", updatedAt: "2026-09-15T12:00:00Z" },
  { id: "105", cliente: "Pedro", numeroPedido: "005", itens: [{}], valor: 45.00, status: "entregue", updatedAt: "2026-09-14T09:00:00Z" },
];

const ordersSnap = DS.normalizeOrdersRecentSnapshot(fakeOrders, { limit: 4 });
assert(ordersSnap.status === "ready", "Orders status is ready");
assert(ordersSnap.data.orders.length === 4, "Returns exactly 4 orders");
assert(ordersSnap.data.total === 5, "Total reflects all orders");

const first = ordersSnap.data.orders[0];
assert(first.id === "101", "First order has correct id");
assert(first.client === "Ana", "First order has client name");
assert(first.itemCount === 2, "First order has 2 items");
assert(first.deadline === "20/09/2026", "First order preserves deadline");
assert(first.total === 150.50, "First order preserves total value");

// ============================================================
// M) Day_summary preserva valores da Home atual
// ============================================================
console.log("\n[M] Day_summary preserva valores da Home atual");

const todayOrders = [
  { id: "201", total: 100.00, itens: [{ custoTotal: 30 }], status: "aberto", updatedAt: todayStr },
  { id: "202", total: 250.50, itens: [{ custoTotal: 80 }, { custoTotal: 20 }], status: "producao", updatedAt: todayStr },
  { id: "203", total: 75.00, itens: [], status: "entregue", updatedAt: todayStr },
  { id: "204", total: 50.00, itens: [{ custoTotal: 15 }], status: "cancelado", updatedAt: todayStr },
];

const daySnap = DS.normalizeDaySummarySnapshot(todayOrders);
assert(daySnap.status === "ready", "Day summary status is ready");
assert(daySnap.data.faturamentoDia === 425.50, "Revenue = 100 + 250.50 + 75 (exclui cancelado)");
assert(daySnap.data.lucroDiaEstimado === 295.50, "Profit = (100-30) + (250.50-100) + (75-0)");
assert(daySnap.data.pedidosHoje === 3, "Order count = 3 (exclui cancelado)");

// ============================================================
// N) Stock usa regra/threshold existente
// ============================================================
console.log("\n[N] Stock usa regra/threshold existente");

const fakeMaterials = [
  { id: "mat1", nome: "PLA Branco", qtd: 2.5, unidade: "kg", stock_status: "normal" },
  { id: "mat2", nome: "PLA Preto", qtd: 0.05, unidade: "kg", stock_status: "low" },
  { id: "mat3", nome: "Resina", qtd: 0, unidade: "l", stock_status: "critical" },
  { id: "mat4", nome: "PETG Verde", qtd: 1.0, unidade: "kg", stock_status: "normal" },
];

const stockSnap = DS.normalizeStockSnapshot(fakeMaterials);
assert(stockSnap.status === "ready", "Stock status is ready");
assert(stockSnap.data.total === 4, "Total materials = 4");
assert(stockSnap.data.critical === 1, "Critical count = 1");
assert(stockSnap.data.low === 1, "Low count = 1");
assert(stockSnap.data.alertCount === 2, "Alert count = low + critical");

// ============================================================
// O) Storefront usa somente métricas existentes
// ============================================================
console.log("\n[O] Storefront usa somente métricas existentes");

const fakeStorefront = {
  store: { active: true },
  products: [
    { id: "p1", active: true, visible: true },
    { id: "p2", active: true, visible: false },
    { id: "p3", active: false },
  ],
  leads: [
    { id: "l1", status: "novo" },
    { id: "l2", status: "convertido" },
    { id: "l3", status: "novo" },
  ],
  events: [
    { event_type: "store_view" },
    { event_type: "store_view" },
    { event_type: "product_view" },
    { event_type: "whatsapp_click" },
  ],
};

const storeSnap2 = DS.normalizeStorefrontSnapshot(fakeStorefront);
assert(storeSnap2.status === "ready", "Storefront status is ready");
assert(storeSnap2.data.active === true, "Store is active");
assert(storeSnap2.data.publishedProducts === 1, "Published products = 1");
assert(storeSnap2.data.visits === 2, "Visits = 2 store_view events");
assert(storeSnap2.data.newLeads === 2, "New leads = 2");

// ============================================================
// P) Funções são puras (sem efeitos colaterais)
// ============================================================
console.log("\n[P] Funções são puras (sem efeitos colaterais)");

assert(!src.includes("localStorage"), "No localStorage access");
assert(!src.includes("fetch("), "No fetch calls");
assert(!src.includes("XMLHttpRequest"), "No XHR");
assert(!src.includes("window.location"), "No location access");
assert(!src.includes("document.getElementById"), "No getElementById");
assert(!src.includes("document.querySelector"), "No querySelector");
assert(!src.includes("innerHTML"), "No innerHTML");
assert(!src.includes("canvas"), "No canvas");
assert(!src.includes("WebGL"), "No WebGL");

// ============================================================
// Q) Snapshot contract: all have status, updatedAt, data
// ============================================================
console.log("\n[Q] Snapshot contract: todos têm status, updatedAt, data");

const allSnapshots = [
  DS.normalizeProductionSnapshot([]),
  DS.normalizeOrdersRecentSnapshot([]),
  DS.normalizeDaySummarySnapshot([]),
  DS.normalizeCashTodaySnapshot([]),
  DS.normalizeStockSnapshot([]),
  DS.normalizeCustomersSnapshot([]),
  DS.normalizeStorefrontSnapshot({}),
  DS.normalizeAlertsSnapshot({}),
];

allSnapshots.forEach(function(s, i) {
  assert(typeof s.status === "string", "Snapshot " + i + " has status string");
  assert(typeof s.updatedAt === "string", "Snapshot " + i + " has updatedAt string");
  assert(s.updatedAt.includes("T"), "Snapshot " + i + " updatedAt is ISO");
  assert(typeof s.data === "object" && s.data !== null, "Snapshot " + i + " has data object");
});

// ============================================================
// SUMMARY
// ============================================================
console.log("\n=== RESULTS ===");
console.log("  PASS: " + ok);
console.log("  FAIL: " + fail);
console.log(fail === 0 ? "\n✅ ALL WIDGET DATA SOURCE TESTS PASSED" : "\n❌ SOME TESTS FAILED");
process.exit(fail > 0 ? 1 : 0);
