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

var editorSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "editor", "carousel-editor-core.js"), "utf8");
var configSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "config", "home-carousel-config.js"), "utf8");
var registrySrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "widgets", "home-carousel-widget-registry.js"), "utf8");

var sharedGlobal = {};
var config = loadModule(configSrc, "SimplificaHomeCarouselConfig", sharedGlobal);
var registryFactory = loadModule(registrySrc, "SimplificaHomeCarouselRegistry", sharedGlobal);
var registry = registryFactory.createRegistry(["producao","pedidos","relatorios","caixa","estoque","clientes","lojaOnline","impressoras","calculadora"]);

var E = loadModule(editorSrc, "SimplificaCarouselEditor");

console.log("=== CAROUSEL EDITOR CORE TESTS ===\n");

// A) add available card
console.log("[A] add available card");
var ed1 = E.createEditor(null, registry);
assert(ed1.canAdd("production"), "production canAdd");
assert(ed1.addCard("production") === true, "production added");
assert(ed1.getState().visibleCardIds.indexOf("production") !== -1, "production in visible");

// B) remove card
console.log("\n[B] remove card");
var ed2 = E.createEditor({ visibleCardIds: ["production","orders","inventory","cash","sales","printers"], cardOrder: ["production","orders","inventory","cash","sales","printers"], autoplay: true, autoplayInterval: 15000 }, registry);
assert(ed2.removeCard("production") === true, "production removed");
assert(ed2.getState().visibleCardIds.indexOf("production") === -1, "production not in visible");
assert(ed2.getState().visibleCardIds.indexOf("orders") !== -1, "orders still there");

// C) remove card does NOT remove feature/route
console.log("\n[C] remove card does NOT remove feature/route");
var ed3 = E.createEditor({ visibleCardIds: ["production","orders","inventory","cash","sales","printers"], cardOrder: ["production","orders","inventory","cash","sales","printers"], autoplay: true, autoplayInterval: 15000 }, registry);
ed3.removeCard("production");
assert(registry.get("production") !== null, "production still in registry");
assert(config.active.find(function(c){ return c.id === "production"; }) !== undefined, "production still in config.active");

// D) reorder
console.log("\n[D] reorder");
var ed4 = E.createEditor({ visibleCardIds: ["production","orders_recent","stock"], cardOrder: ["production","orders_recent","stock"], autoplay: true, autoplayInterval: 15000 }, registry);
assert(ed4.moveCard("stock", -1) === true, "stock moved up");
var s4 = ed4.getState();
assert(s4.visibleCardIds[1] === "stock", "stock is now at index 1");
assert(s4.visibleCardIds[2] === "orders_recent", "orders now at index 2");

// E) no duplicate
console.log("\n[E] no duplicate");
var ed5 = E.createEditor({ visibleCardIds: ["production"], cardOrder: ["production"], autoplay: true, autoplayInterval: 15000 }, registry);
assert(ed5.addCard("production") === false, "cannot add duplicate");
assert(ed5.getState().visibleCardIds.length === 1, "still only 1");

// F) invalid ID rejected
console.log("\n[F] invalid ID rejected");
var ed6 = E.createEditor(null, registry);
assert(ed6.canAdd("nonexistent") === false, "nonexistent cannotAdd");
assert(ed6.addCard("nonexistent") === false, "nonexistent add rejected");

// G) future card rejected
console.log("\n[G] future card rejected");
var ed7 = E.createEditor(null, registry);
assert(ed7.canAdd("fiscal") === false, "fiscal cannotAdd (future)");
assert(ed7.addCard("fiscal") === false, "fiscal add rejected");

// H) available=false rejected
console.log("\n[H] available=false rejected");
var futureCards = ["fiscal","accounts_payable","accounts_receivable","purchases","shipping","crm","quality","maintenance"];
futureCards.forEach(function(id) {
  assert(ed7.canAdd(id) === false, id + " cannotAdd");
  assert(ed7.addCard(id) === false, id + " add rejected");
});

// I) restore defaults
console.log("\n[I] restore defaults");
var ed8 = E.createEditor({ visibleCardIds: [], cardOrder: [], autoplay: false, autoplayInterval: 5000 }, registry);
ed8.restoreDefaults();
var s8 = ed8.getState();
assert(s8.autoplay === true, "autoplay restored to true");
assert(s8.autoplayInterval === 15000, "interval restored to 15000");
assert(s8.visibleCardIds.length > 0, "visible cards restored");

// J) autoplay on/off
console.log("\n[J] autoplay on/off");
var ed9 = E.createEditor(null, registry);
assert(ed9.getState().autoplay === true, "default autoplay true");
ed9.setAutoplay(false);
assert(ed9.getState().autoplay === false, "autoplay set to false");
ed9.setAutoplay(true);
assert(ed9.getState().autoplay === true, "autoplay set back to true");

// K) interval valid
console.log("\n[K] interval valid");
var ed10 = E.createEditor(null, registry);
ed10.setAutoplayInterval(5000);
assert(ed10.getState().autoplayInterval === 5000, "interval set to 5000");
ed10.setAutoplayInterval(1000);
assert(ed10.getState().autoplayInterval === E.MIN_INTERVAL, "interval clamped min");
ed10.setAutoplayInterval(999999);
assert(ed10.getState().autoplayInterval === E.MAX_INTERVAL, "interval clamped max");
ed10.setAutoplayInterval(-500);
assert(ed10.getState().autoplayInterval === E.MIN_INTERVAL, "negative interval clamped");

// L) state immutability
console.log("\n[L] state immutability");
var ed11 = E.createEditor({ visibleCardIds: ["production"], cardOrder: ["production"], autoplay: true, autoplayInterval: 15000 }, registry);
var s11 = ed11.getState();
var before = JSON.stringify(s11);
s11.visibleCardIds.push("hacked");
assert(JSON.stringify(ed11.getState()) === before, "getState not affected by external mutation");

// M) no DOM access
console.log("\n[M] no DOM access");
var noComments = editorSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
assert(noComments.indexOf("document.") === -1, "No document.");
assert(noComments.indexOf("createElement") === -1, "No createElement");
assert(noComments.indexOf("getElementById") === -1, "No getElementById");
assert(noComments.indexOf("querySelector") === -1, "No querySelector");

// N) no Supabase
console.log("\n[N] no Supabase");
assert(noComments.indexOf("Supabase") === -1, "No Supabase");
assert(noComments.indexOf("supabase") === -1, "No supabase");

// O) no app.js
console.log("\n[O] no app.js");
assert(noComments.indexOf("pedidoContaParaAnalytics") === -1, "No pedidoContaParaAnalytics");
assert(noComments.indexOf("calcularResumoFinanceiroPedido") === -1, "No calcularResumoFinanceiroPedido");

// P) moveCard on non-visible returns false
console.log("\n[P] moveCard on non-visible returns false");
var ed12 = E.createEditor({ visibleCardIds: ["production"], cardOrder: ["production"], autoplay: true, autoplayInterval: 15000 }, registry);
assert(ed12.moveCard("orders_recent", 1) === false, "non-visible moveCard returns false");

// Q) moveCard at boundaries returns false
console.log("\n[Q] moveCard at boundaries returns false");
var ed13 = E.createEditor({ visibleCardIds: ["production","orders_recent"], cardOrder: ["production","orders_recent"], autoplay: true, autoplayInterval: 15000 }, registry);
assert(ed13.moveCard("production", -1) === false, "move first up returns false");
assert(ed13.moveCard("orders_recent", 1) === false, "move last down returns false");

// R) persistence adapter
console.log("\n[R] persistence adapter");
var pers = E.createMemoryPersistence(null);
assert(pers.load() === null, "empty persistence returns null");
pers.save({ visibleCardIds: ["production"], autoplay: false });
var loaded = pers.load();
assert(loaded.visibleCardIds[0] === "production", "saved card persisted");
assert(loaded.autoplay === false, "saved autoplay persisted");
pers.clear();
assert(pers.load() === null, "cleared persistence returns null");

// S) all catalog cards can be added
console.log("\n[S] all catalog cards can be added");
var ed14 = E.createEditor(null, registry);
config.active.forEach(function(card) {
  assert(ed14.canAdd(card.id), card.id + " canAdd from config.active");
  assert(ed14.addCard(card.id) === true, card.id + " added successfully");
});
assert(ed14.getState().visibleCardIds.length === 10, "all 10 visible");
assert(ed14.getState().cardOrder.length === 10, "all 10 cardOrder entries preserved");

// T) future cards cannot be added
console.log("\n[T] future cards cannot be added");
assert(ed14.canAdd("fiscal") === false, "fiscal blocked");
assert(ed14.canAdd("accounts_payable") === false, "accounts_payable blocked");
assert(ed14.addCard("fiscal") === false, "fiscal add blocked");

// U) move to index and initial-state isolation
console.log("\n[U] move to index and input isolation");
var originalState = { visibleCardIds: ["production", "orders_recent", "stock"], cardOrder: ["production", "orders_recent", "stock"], autoplay: true, autoplayInterval: 15000 };
var ed15 = E.createEditor(originalState, registry);
assert(ed15.moveCardToIndex("stock", 0) === true, "stock moves to index zero");
assert(ed15.getState().visibleCardIds[0] === "stock", "stock is first after indexed move");
assert(ed15.getState().cardOrder[0] === "stock", "cardOrder follows indexed move");
assert(originalState.visibleCardIds[0] === "production", "initial visible state is not mutated");
assert(ed15.moveCardToIndex("stock", 99) === false, "out-of-range index rejected");

// V) saved preference normalization
console.log("\n[V] saved preference normalization");
var ed16 = E.createEditor({ visibleCardIds: ["production", "orders", "production"], cardOrder: ["orders", "orders", "unknown"] }, registry);
var s16 = ed16.getState();
assert(JSON.stringify(s16.visibleCardIds) === JSON.stringify(["production", "orders"]), "saved visible cards are deduplicated");
assert(JSON.stringify(s16.cardOrder) === JSON.stringify(["orders", "production"]), "saved order is deduplicated and completed");

// W) named preference adapter contract
console.log("\n[W] named preference adapter contract");
var namedPersistence = E.createMemoryPersistence(null);
namedPersistence.savePreferences({ visibleCardIds: ["stock"] });
assert(namedPersistence.loadPreferences().visibleCardIds[0] === "stock", "named load/save preference adapter works");

console.log("\n=== RESULTS ===");
console.log("  PASS: " + ok);
console.log("  FAIL: " + fail);
console.log(fail === 0 ? "\nALL EDITOR CORE TESTS PASSED" : "\nSOME TESTS FAILED");
process.exit(fail > 0 ? 1 : 0);
