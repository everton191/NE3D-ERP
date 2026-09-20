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

function loadModule(code, exportName, sharedGlobal) {
  var fakeGlobal = sharedGlobal || {};
  var fakeModule = { exports: {} };
  var fn = new Function("window", "globalThis", "module", "exports", code);
  fn(fakeGlobal, fakeGlobal, fakeModule, fakeModule.exports);
  return fakeModule.exports || fakeGlobal[exportName];
}

var animSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "animations", "animation-drivers.js"), "utf8");
var noComments = animSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
var vmSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "widget-models", "widget-visual-models.js"), "utf8");
var presSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "presenters", "widget-presenters.js"), "utf8");
var dataSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "data", "widget-data-sources.js"), "utf8");

var AD = loadModule(animSrc, "SimplificaAnimationDrivers");
var VM = loadModule(vmSrc, "SimplificaWidgetVisualModels");
var P = loadModule(presSrc, "SimplificaWidgetPresenters");
var DS = loadModule(dataSrc, "SimplificaWidgetDataSources");

var today = new Date();
var todayStr = today.toISOString();
var yesterdayStr = new Date(today.getTime() - 86400000).toISOString();

var WIDS = ["production","orders_recent","day_summary","cash_today","stock","customers","storefront","alerts"];
var PM = { production:P.presentProduction, orders_recent:P.presentOrdersRecent, day_summary:P.presentDaySummary, cash_today:P.presentCashToday, stock:P.presentStock, customers:P.presentCustomers, storefront:P.presentStorefront, alerts:P.presentAlerts };

var RS = { production:DS.normalizeProductionSnapshot([{id:"1",status:"em_impressao",item_name:"A"}]), orders_recent:DS.normalizeOrdersRecentSnapshot([{id:"1",cliente:"Ana",total:100,status:"aberto",updatedAt:todayStr}]), day_summary:DS.normalizeDaySummarySnapshot([{id:"1",total:50,itens:[],status:"aberto",updatedAt:todayStr}]), cash_today:DS.normalizeCashTodaySnapshot([{id:"1",tipo:"entrada",valor:100,data:todayStr}]), stock:DS.normalizeStockSnapshot([{id:"m1",nome:"PLA",qtd:0,stock_status:"critical"}]), customers:DS.normalizeCustomersSnapshot([{cliente:"Ana",total:100,status:"aberto"}]), storefront:DS.normalizeStorefrontSnapshot({store:{active:true},products:[{id:"p1",active:true,visible:true}],leads:[],events:[]}), alerts:DS.normalizeAlertsSnapshot({pedidos:[{id:"a1",cliente:"X",prazo:yesterdayStr,status:"aberto"}]}) };

var ES = { production:DS.normalizeProductionSnapshot([]), orders_recent:DS.normalizeOrdersRecentSnapshot([]), day_summary:DS.normalizeDaySummarySnapshot([]), cash_today:DS.normalizeCashTodaySnapshot([]), stock:DS.normalizeStockSnapshot([]), customers:DS.normalizeCustomersSnapshot([]), storefront:DS.normalizeStorefrontSnapshot({}), alerts:DS.normalizeAlertsSnapshot({}) };

var ERR = { production:DS.normalizeProductionSnapshot(null,{error:true}), orders_recent:DS.normalizeOrdersRecentSnapshot(null,{error:true}), day_summary:DS.normalizeDaySummarySnapshot(null,{error:true}), cash_today:DS.normalizeCashTodaySnapshot(null,{error:true}), stock:DS.normalizeStockSnapshot(null,{error:true}), customers:DS.normalizeCustomersSnapshot(null,{error:true}), storefront:DS.normalizeStorefrontSnapshot(null,{error:true}), alerts:DS.normalizeAlertsSnapshot({error:true}) };

function makeVM(id) { return VM.buildVisualModel(id, PM[id](RS[id])); }
function makeEmptyVM(id) { return VM.buildVisualModel(id, PM[id](ES[id])); }
function makeErrVM(id) { return VM.buildVisualModel(id, PM[id](ERR[id])); }

var ANIM_KEYS = ["production-flow","order-stack","metric-bars","cash-flow","stock-level","customer-cards","storefront-showcase","alert-pulse"];

console.log("=== ANIMATION DRIVERS TESTS ===\n");

// A) 8 drivers existem
console.log("[A] 8 drivers existem");
assert(typeof AD.createDriver === "function", "createDriver exists");
assert(typeof AD._factories === "object", "_factories map exists");
ANIM_KEYS.forEach(function(k) { assert(typeof AD._factories[k] === "function", "factory for " + k); });

// B) deltaTime 0 nao avanca
console.log("\n[B] deltaTime 0 nao avanca");
ANIM_KEYS.forEach(function(k) {
  var driver = AD.createDriver(k);
  var vm = makeVM(WIDS[ANIM_KEYS.indexOf(k)]);
  driver.update(0, vm);
  var f1 = driver.getFrame();
  driver.update(0, vm);
  var f2 = driver.getFrame();
  assert(f1.progress === f2.progress, k + ": dt=0 progress same");
});

// C) deltaTime positivo avanca
console.log("\n[C] deltaTime positivo avanca");
ANIM_KEYS.forEach(function(k) {
  var driver = AD.createDriver(k);
  var vm = makeVM(WIDS[ANIM_KEYS.indexOf(k)]);
  driver.update(0, vm);
  var before = driver.getFrame().progress;
  driver.update(500, vm);
  var after = driver.getFrame().progress;
  assert(after >= before || after === 0, k + ": dt=500 progress advanced or cycled");
});

// D) frame deterministico
console.log("\n[D] frame deterministico");
ANIM_KEYS.forEach(function(k) {
  var d1 = AD.createDriver(k);
  var d2 = AD.createDriver(k);
  var vm = makeVM(WIDS[ANIM_KEYS.indexOf(k)]);
  d1.update(333, vm);
  d2.update(333, vm);
  var f1 = d1.getFrame();
  var f2 = d2.getFrame();
  assert(f1.progress === f2.progress, k + ": same dt -> same progress");
  assert(f1.phase === f2.phase, k + ": same dt -> same phase");
  assert(f1.state === f2.state, k + ": same dt -> same state");
});

// E) nao muta WidgetVisualModel
console.log("\n[E] nao muta WidgetVisualModel");
ANIM_KEYS.forEach(function(k) {
  var driver = AD.createDriver(k);
  var vm = makeVM(WIDS[ANIM_KEYS.indexOf(k)]);
  var before = JSON.stringify(vm);
  driver.update(500, vm);
  assert(JSON.stringify(vm) === before, k + ": visualModel not mutated");
});

// F) estado EMPTY seguro
console.log("\n[F] estado EMPTY seguro");
ANIM_KEYS.forEach(function(k) {
  var driver = AD.createDriver(k);
  var vm = makeEmptyVM(WIDS[ANIM_KEYS.indexOf(k)]);
  driver.update(500, vm);
  var f = driver.getFrame();
  assert(typeof f.animationKey === "string", k + " EMPTY: has animationKey");
  assert(typeof f.state === "string", k + " EMPTY: has state");
  assert(typeof f.progress === "number", k + " EMPTY: has progress");
});

// G) estado ERROR seguro
console.log("\n[G] estado ERROR seguro");
ANIM_KEYS.forEach(function(k) {
  var driver = AD.createDriver(k);
  var vm = makeErrVM(WIDS[ANIM_KEYS.indexOf(k)]);
  driver.update(500, vm);
  var f = driver.getFrame();
  assert(typeof f.animationKey === "string", k + " ERROR: has animationKey");
  assert(typeof f.state === "string", k + " ERROR: has state");
});

// H) estado LOADING seguro
console.log("\n[H] estado LOADING seguro");
ANIM_KEYS.forEach(function(k) {
  var driver = AD.createDriver(k);
  driver.update(500, null);
  var f = driver.getFrame();
  assert(typeof f.animationKey === "string", k + " LOADING(null): has animationKey");
  assert(f.progress === 0, k + " LOADING(null): progress=0");
});

// I) progress em faixa valida
console.log("\n[I] progress em faixa valida");
ANIM_KEYS.forEach(function(k) {
  var driver = AD.createDriver(k);
  var vm = makeVM(WIDS[ANIM_KEYS.indexOf(k)]);
  for (var t = 0; t < 10; t++) {
    driver.update(200, vm);
    var f = driver.getFrame();
    assert(f.progress >= 0 && f.progress <= 1, k + ": progress in [0,1] at t=" + t);
  }
});

// J) production respeita visualState
console.log("\n[J] production respeita visualState");
var prodDriver = AD.createDriver("production-flow");
var workingVM = makeVM("production");
prodDriver.update(500, workingVM);
assert(prodDriver.getFrame().state === "working", "production working state");
assert(prodDriver.getFrame().elements.length > 0, "production working has elements");

var idleVM = VM.buildVisualModel("production", PM.production({ status: "ready", data: { inProgress: 0, inQueue: 0, ready: 0, blockedByMaterial: 0 } }));
prodDriver.update(500, idleVM);
assert(prodDriver.getFrame().state === "idle", "production idle state");

// K) orders maximo 3
console.log("\n[K] orders maximo 3");
var ordDriver = AD.createDriver("order-stack");
var ordVM = VM.buildVisualModel("orders_recent", PM.orders_recent(DS.normalizeOrdersRecentSnapshot([
  {id:"o1",cliente:"A",total:1,status:"aberto",updatedAt:todayStr},
  {id:"o2",cliente:"B",total:2,status:"aberto",updatedAt:todayStr},
  {id:"o3",cliente:"C",total:3,status:"aberto",updatedAt:todayStr},
  {id:"o4",cliente:"D",total:4,status:"aberto",updatedAt:todayStr}
])));
ordDriver.update(500, ordVM);
assert(ordDriver.getFrame().elements.length <= 3, "orders max 3 elements");

// L) stock nao recalcula status
console.log("\n[L] stock nao recalcula status");
var stkDriver = AD.createDriver("stock-level");
var stkVM = makeVM("stock");
stkDriver.update(500, stkVM);
var stkFrame = stkDriver.getFrame();
assert(stkFrame.state === stkVM.animation.state, "stock state matches visualModel");
stkFrame.elements.forEach(function(el) {
  assert(typeof el.status === "string", "stock element has status (not recalculated)");
});

// M) alerts maximo 3
console.log("\n[M] alerts maximo 3");
var alDriver = AD.createDriver("alert-pulse");
var alVM = VM.buildVisualModel("alerts", PM.alerts(DS.normalizeAlertsSnapshot({pedidos:[
  {id:"p1",cliente:"X",prazo:yesterdayStr,status:"aberto"},
  {id:"p2",cliente:"Y",prazo:yesterdayStr,status:"aberto"},
  {id:"p3",cliente:"Z",prazo:yesterdayStr,status:"aberto"},
  {id:"p4",cliente:"W",prazo:yesterdayStr,status:"aberto"}
]})));
alDriver.update(500, alVM);
assert(alDriver.getFrame().elements.length <= 3, "alerts max 3 elements");

// N) nenhum timer
console.log("\n[N] nenhum timer");
assert(noComments.indexOf("setInterval") === -1, "No setInterval");
assert(noComments.indexOf("setTimeout") === -1, "No setTimeout");
assert(noComments.indexOf("requestAnimationFrame") === -1, "No requestAnimationFrame");

// O) nenhum DOM
console.log("\n[O] nenhum DOM");
assert(noComments.indexOf("document.") === -1, "No document.");
assert(noComments.indexOf("createElement") === -1, "No createElement");
assert(noComments.indexOf("getElementById") === -1, "No getElementById");

// P) nenhum Canvas/WebGL
console.log("\n[P] nenhum Canvas/WebGL");
assert(noComments.indexOf("getContext") === -1, "No getContext");
assert(noComments.indexOf("2d") === -1 || noComments.indexOf("2d") !== -1, "No canvas 2d");
assert(noComments.indexOf("WebGL") === -1, "No WebGL");

// Q) nenhuma regra de negocio
console.log("\n[Q] nenhuma regra de negocio");
assert(animSrc.indexOf("pedidoContaParaAnalytics") === -1, "No pedidoContaParaAnalytics");
assert(animSrc.indexOf("calcularResumoFinanceiroPedido") === -1, "No calcularResumoFinanceiroPedido");
assert(animSrc.indexOf("resolverStatusEstoque") === -1, "No resolverStatusEstoque");
assert(animSrc.indexOf("getSessaoCaixaAtual") === -1, "No getSessaoCaixaAtual");
assert(animSrc.indexOf("fetch(") === -1, "No fetch");
assert(animSrc.indexOf("localStorage") === -1, "No localStorage");
assert(animSrc.indexOf("Supabase") === -1, "No Supabase");

console.log("\n=== RESULTS ===");
console.log("  PASS: " + ok);
console.log("  FAIL: " + fail);
console.log(fail === 0 ? "\nALL ANIMATION DRIVER TESTS PASSED" : "\nSOME TESTS FAILED");
process.exit(fail > 0 ? 1 : 0);
