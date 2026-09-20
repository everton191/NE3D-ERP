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

function loadModule(code, exportName) {
  var fakeGlobal = {};
  var fakeModule = { exports: {} };
  var fn = new Function("window", "globalThis", "module", "exports", code);
  fn(fakeGlobal, fakeGlobal, fakeModule, fakeModule.exports);
  return fakeModule.exports || fakeGlobal[exportName];
}

var presentersSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "presenters", "widget-presenters.js"), "utf8");
var dataSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "data", "widget-data-sources.js"), "utf8");
var modelsSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "widget-models", "widget-visual-models.js"), "utf8");

var P = loadModule(presentersSrc, "SimplificaWidgetPresenters");
var DS = loadModule(dataSrc, "SimplificaWidgetDataSources");
var VM = loadModule(modelsSrc, "SimplificaWidgetVisualModels");

var today = new Date();
var todayStr = today.toISOString();
var yesterdayStr = new Date(today.getTime() - 86400000).toISOString();

var WIDS = ["production","orders_recent","day_summary","cash_today","stock","customers","storefront","alerts"];
var PM = { production:P.presentProduction, orders_recent:P.presentOrdersRecent, day_summary:P.presentDaySummary, cash_today:P.presentCashToday, stock:P.presentStock, customers:P.presentCustomers, storefront:P.presentStorefront, alerts:P.presentAlerts };

var RS = { production:DS.normalizeProductionSnapshot([{id:"1",status:"em_impressao",item_name:"A"}]), orders_recent:DS.normalizeOrdersRecentSnapshot([{id:"1",cliente:"Ana",total:100,status:"aberto",updatedAt:todayStr}]), day_summary:DS.normalizeDaySummarySnapshot([{id:"1",total:50,itens:[],status:"aberto",updatedAt:todayStr}]), cash_today:DS.normalizeCashTodaySnapshot([{id:"1",tipo:"entrada",valor:100,data:todayStr}]), stock:DS.normalizeStockSnapshot([{id:"m1",nome:"PLA",qtd:0,stock_status:"critical"}]), customers:DS.normalizeCustomersSnapshot([{cliente:"Ana",total:100,status:"aberto"}]), storefront:DS.normalizeStorefrontSnapshot({store:{active:true},products:[{id:"p1",active:true,visible:true}],leads:[],events:[]}), alerts:DS.normalizeAlertsSnapshot({pedidos:[{id:"a1",cliente:"X",prazo:yesterdayStr,status:"aberto"}]}) };

var ES = { production:DS.normalizeProductionSnapshot([]), orders_recent:DS.normalizeOrdersRecentSnapshot([]), day_summary:DS.normalizeDaySummarySnapshot([]), cash_today:DS.normalizeCashTodaySnapshot([]), stock:DS.normalizeStockSnapshot([]), customers:DS.normalizeCustomersSnapshot([]), storefront:DS.normalizeStorefrontSnapshot({}), alerts:DS.normalizeAlertsSnapshot({}) };

var ERR = { production:DS.normalizeProductionSnapshot(null,{error:true}), orders_recent:DS.normalizeOrdersRecentSnapshot(null,{error:true}), day_summary:DS.normalizeDaySummarySnapshot(null,{error:true}), cash_today:DS.normalizeCashTodaySnapshot(null,{error:true}), stock:DS.normalizeStockSnapshot(null,{error:true}), customers:DS.normalizeCustomersSnapshot(null,{error:true}), storefront:DS.normalizeStorefrontSnapshot(null,{error:true}), alerts:DS.normalizeAlertsSnapshot({error:true}) };

console.log("=== WIDGET VISUAL MODELS TESTS ===\n");

console.log("[A] 8 modelos existem");
assert(typeof VM.buildVisualModel === "function", "buildVisualModel exists");
assert(typeof VM._builders === "object", "_builders map exists");
WIDS.forEach(function(id) { assert(typeof VM._builders[id] === "function", "builder for " + id); });

console.log("\n[B] READY produces valid visual model");
WIDS.forEach(function(id) {
  var vm = PM[id](RS[id]); var m = VM.buildVisualModel(id, vm);
  assert(m !== null, id + ": model not null"); assert(m.id === id, id + ": model.id matches");
  assert(typeof m.state === "string", id + ": has state"); assert(typeof m.title === "string", id + ": has title");
  assert(m.visual && typeof m.visual.emphasis === "string", id + ": visual.emphasis");
  assert(typeof m.visual.iconKey === "string", id + ": visual.iconKey");
  assert(typeof m.visual.textureKey === "string", id + ": visual.textureKey");
  assert(typeof m.visual.layoutKey === "string", id + ": visual.layoutKey");
  assert(m.animation && typeof m.animation.key === "string", id + ": animation.key");
  assert(typeof m.animation.state === "string", id + ": animation.state");
  assert(typeof m.animation.intensity === "number", id + ": animation.intensity");
  assert(typeof m.animation.progress === "number", id + ": animation.progress");
  assert(m.navigation && (typeof m.navigation.targetScreen === "string" || m.navigation.targetScreen === null), id + ": navigation.targetScreen");
});

console.log("\n[C] EMPTY produces valid model");
WIDS.forEach(function(id) {
  var vm = PM[id](ES[id]); var m = VM.buildVisualModel(id, vm);
  assert(m !== null, id + " EMPTY: not null"); assert(m.state === "empty", id + " EMPTY: state=empty");
  assert(m.visual.emphasis === "low", id + " EMPTY: emphasis=low"); assert(m.animation.intensity === 0, id + " EMPTY: intensity=0");
});

console.log("\n[D] ERROR produces valid model");
WIDS.forEach(function(id) {
  var vm = PM[id](ERR[id]); var m = VM.buildVisualModel(id, vm);
  assert(m !== null, id + " ERROR: not null"); assert(m.state === "error", id + " ERROR: state=error");
  assert(m.animation.intensity === 0, id + " ERROR: intensity=0");
});

console.log("\n[E] LOADING produces valid model");
WIDS.forEach(function(id) {
  var vm = PM[id](null); var m = VM.buildVisualModel(id, vm);
  assert(m !== null, id + " LOADING: not null"); assert(m.state === "loading", id + " LOADING: state=loading");
  assert(m.animation.intensity === 0, id + " LOADING: intensity=0");
});

console.log("\n[F] null viewModel returns null");
assert(VM.buildVisualModel("production", null) === null, "null vm -> null");
assert(VM.buildVisualModel("unknown", RS.production) === null, "unknown id -> null");

console.log("\n[G] models do not mutate viewModel");
var vm1 = PM.production(RS.production); var before = JSON.stringify(vm1);
VM.buildVisualModel("production", vm1); assert(JSON.stringify(vm1) === before, "production vm not mutated");
var vm2 = PM.orders_recent(RS.orders_recent); var before2 = JSON.stringify(vm2);
VM.buildVisualModel("orders_recent", vm2); assert(JSON.stringify(vm2) === before2, "orders vm not mutated");

console.log("\n[H] no business logic recalculation");
assert(modelsSrc.indexOf("pedidoContaParaAnalytics") === -1, "No pedidoContaParaAnalytics");
assert(modelsSrc.indexOf("calcularResumoFinanceiroPedido") === -1, "No calcularResumoFinanceiroPedido");
assert(modelsSrc.indexOf("resolverStatusEstoque") === -1, "No resolverStatusEstoque");
assert(modelsSrc.indexOf("getSessaoCaixaAtual") === -1, "No getSessaoCaixaAtual");
assert(modelsSrc.indexOf("fetch(") === -1, "No fetch");
assert(modelsSrc.indexOf("localStorage") === -1, "No localStorage");
assert(modelsSrc.indexOf("Supabase") === -1, "No Supabase");

console.log("\n[I] targetScreen preserved");
assert(VM.buildVisualModel("production", PM.production(RS.production)).navigation.targetScreen === "producao", "prod target");
assert(VM.buildVisualModel("orders_recent", PM.orders_recent(RS.orders_recent)).navigation.targetScreen === "pedidos", "orders target");
assert(VM.buildVisualModel("day_summary", PM.day_summary(RS.day_summary)).navigation.targetScreen === "relatorios", "day target");
assert(VM.buildVisualModel("cash_today", PM.cash_today(RS.cash_today)).navigation.targetScreen === "caixa", "cash target");
assert(VM.buildVisualModel("stock", PM.stock(RS.stock)).navigation.targetScreen === "estoque", "stock target");
assert(VM.buildVisualModel("customers", PM.customers(RS.customers)).navigation.targetScreen === "clientes", "cust target");
assert(VM.buildVisualModel("storefront", PM.storefront(RS.storefront)).navigation.targetScreen === "lojaOnline", "store target");
assert(VM.buildVisualModel("alerts", PM.alerts(RS.alerts)).navigation.targetScreen === null, "alerts target null");

console.log("\n[J] animationKey preserved");
assert(VM.buildVisualModel("production", PM.production(RS.production)).animation.key === "production-flow", "prod anim key");
assert(VM.buildVisualModel("orders_recent", PM.orders_recent(RS.orders_recent)).animation.key === "order-stack", "orders anim key");
assert(VM.buildVisualModel("day_summary", PM.day_summary(RS.day_summary)).animation.key === "metric-bars", "day anim key");
assert(VM.buildVisualModel("cash_today", PM.cash_today(RS.cash_today)).animation.key === "cash-flow", "cash anim key");
assert(VM.buildVisualModel("stock", PM.stock(RS.stock)).animation.key === "stock-level", "stock anim key");
assert(VM.buildVisualModel("customers", PM.customers(RS.customers)).animation.key === "customer-cards", "cust anim key");
assert(VM.buildVisualModel("storefront", PM.storefront(RS.storefront)).animation.key === "storefront-showcase", "store anim key");
assert(VM.buildVisualModel("alerts", PM.alerts(RS.alerts)).animation.key === "alert-pulse", "alerts anim key");

console.log("\n[K] textureKeys valid");
WIDS.forEach(function(id) {
  var vm = PM[id](RS[id]); var m = VM.buildVisualModel(id, vm);
  assert(typeof m.visual.textureKey === "string" && m.visual.textureKey.length > 0, id + " textureKey non-empty");
});

console.log("\n[L] max 3 items where applicable");
var ordVM = PM.orders_recent(DS.normalizeOrdersRecentSnapshot([{id:"o1",cliente:"A",total:1,status:"aberto",updatedAt:todayStr},{id:"o2",cliente:"B",total:2,status:"aberto",updatedAt:todayStr},{id:"o3",cliente:"C",total:3,status:"aberto",updatedAt:todayStr},{id:"o4",cliente:"D",total:4,status:"aberto",updatedAt:todayStr}]));
var ordM = VM.buildVisualModel("orders_recent", ordVM); assert(ordM.items.length <= 3, "orders max 3");

var stkVM = PM.stock(DS.normalizeStockSnapshot([{id:"m1",nome:"A",qtd:0,stock_status:"critical"},{id:"m2",nome:"B",qtd:0,stock_status:"critical"},{id:"m3",nome:"C",qtd:0,stock_status:"critical"},{id:"m4",nome:"D",qtd:0,stock_status:"critical"}]));
var stkM = VM.buildVisualModel("stock", stkVM); assert(stkM.items.length <= 3, "stock max 3");

var alVM = PM.alerts(DS.normalizeAlertsSnapshot({pedidos:[{id:"p1",cliente:"X",prazo:yesterdayStr,status:"aberto"},{id:"p2",cliente:"Y",prazo:yesterdayStr,status:"aberto"},{id:"p3",cliente:"Z",prazo:yesterdayStr,status:"aberto"},{id:"p4",cliente:"W",prazo:yesterdayStr,status:"aberto"}]}));
var alM = VM.buildVisualModel("alerts", alVM); assert(alM.items.length <= 3, "alerts max 3");

console.log("\n=== RESULTS ===");
console.log("  PASS: " + ok);
console.log("  FAIL: " + fail);
console.log(fail === 0 ? "\nALL WIDGET VISUAL MODEL TESTS PASSED" : "\nSOME TESTS FAILED");
process.exit(fail > 0 ? 1 : 0);
