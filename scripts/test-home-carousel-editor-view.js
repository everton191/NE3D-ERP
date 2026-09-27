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

var viewSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "editor", "carousel-editor-view.js"), "utf8");
var editorSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "editor", "carousel-editor-core.js"), "utf8");
var configSrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "config", "home-carousel-config.js"), "utf8");
var registrySrc = readFileSync(path.join(__dirname, "..", "src", "features", "home", "carousel3d", "widgets", "home-carousel-widget-registry.js"), "utf8");

var sharedGlobal = {};
var config = loadModule(configSrc, "SimplificaHomeCarouselConfig", sharedGlobal);
var registryFactory = loadModule(registrySrc, "SimplificaHomeCarouselRegistry", sharedGlobal);
var registry = registryFactory.createRegistry(["producao","pedidos","relatorios","caixa","estoque","clientes","lojaOnline","impressoras","calculadora"]);
var E = loadModule(editorSrc, "SimplificaCarouselEditor");
var V = loadModule(viewSrc, "SimplificaCarouselEditorView");

/* ================================================================
   FAKE DOM
   ================================================================ */

function FakeElement(tag) {
  this.tagName = tag;
  this.className = "";
  this.innerHTML = "";
  this.checked = false;
  this.disabled = false;
  this.value = "";
  this._attrs = {};
  this._children = [];
  this.parentNode = null;
  this._listeners = {};
}

FakeElement.prototype.appendChild = function(child) {
  child.parentNode = this;
  this._children.push(child);
};

FakeElement.prototype.setAttribute = function(key, val) {
  this._attrs[key] = val;
};

FakeElement.prototype.getAttribute = function(key) {
  return this._attrs[key] || null;
};

FakeElement.prototype.addEventListener = function(evt, fn) {
  if (!this._listeners[evt]) this._listeners[evt] = [];
  this._listeners[evt].push(fn);
};

FakeElement.prototype.querySelector = function(sel) {
  if (sel === ".editor-autoplay-toggle") return this._find(".editor-autoplay-toggle");
  if (sel === ".editor-interval-input") return this._find(".editor-interval-input");
  return null;
};

FakeElement.prototype._find = function(sel) {
  var cls = String(sel).charAt(0) === "." ? String(sel).slice(1) : String(sel);
  if (this.className === cls) return this;
  for (var i = 0; i < this._children.length; i++) {
    var found = this._children[i]._find ? this._children[i]._find(cls) : null;
    if (found) return found;
  }
  return null;
};

FakeElement.prototype.querySelectorAll = function(sel) {
  var results = [];
  if (sel.indexOf("[data-action=") === 0) {
    var action = sel.match(/data-action="([^"]+)"/);
    if (action) {
      this._findActions(action[1], results);
    }
  }
  return results;
};

FakeElement.prototype._findActions = function(action, results) {
  if (this._attrs["data-action"] === action) results.push(this);
  for (var i = 0; i < this._children.length; i++) {
    if (this._children[i]._findActions) this._children[i]._findActions(action, results);
  }
};

FakeElement.prototype.createTextNode = function(val) {
  return { _text: val, type: "text" };
};

/* Install fake DOM globally */
var fakeDocument = {
  createElement: function(tag) { return new FakeElement(tag); },
  createTextNode: function(val) { return { _text: val, type: "text" }; },
};

global.document = fakeDocument;
var V2 = loadModule(viewSrc, "SimplificaCarouselEditorView");

/* ================================================================
   TESTS
   ================================================================ */

console.log("=== CAROUSEL EDITOR VIEW TESTS ===\n");

// A) renderiza cards ativos
console.log("[A] renderiza cards ativos");
var ed1 = E.createEditor(E.buildDefaultState(registry), registry);
var container1 = new FakeElement("div");
var view1 = V2.createView(container1, ed1, registry);
view1.render();
var allText1 = "";
function collectText(node) {
  if (node._text) { allText1 += node._text + " "; return; }
  if (node.tagName) allText1 += (node.className || "") + " ";
  if (node._children) node._children.forEach(collectText);
}
collectText(container1);
assert(allText1.indexOf("production") !== -1, "production card rendered");
assert(allText1.indexOf("orders") !== -1, "orders card rendered");
assert(allText1.indexOf("Editar Carrossel") !== -1, "title rendered");

// B) renderiza o piso
console.log("\n[B] renderiza o piso");
assert(allText1.indexOf("Piso (") !== -1, "floor section rendered");
assert(allText1.indexOf("Carrossel (") !== -1, "active zone rendered");
assert(allText1.indexOf("Em breve") === -1, "no unavailable cards are rendered");

// B2) estrutura do PanelOrganizer (sem lista com setas)
console.log("\n[B2] estrutura do PanelOrganizer");
assert(viewSrc.indexOf("editor-btn-move-up") === -1, "no move-up arrow button in the organizer");
assert(viewSrc.indexOf("editor-btn-move-down") === -1, "no move-down arrow button in the organizer");
assert(viewSrc.indexOf("Salvar altera\u00e7\u00f5es") === -1, "no explicit save button, changes persist immediately");
assert(viewSrc.indexOf("editor-autoplay-toggle") === -1, "organizer has no parallel autoplay flow");
assert(viewSrc.indexOf("editor-interval-input") === -1, "organizer has no parallel interval flow");
assert(allText1.indexOf("organizer-carousel-stage") !== -1, "active carousel stage rendered");
assert(allText1.indexOf("organizer-row-floor") !== -1, "floor row rendered");
assert(container1._find(".organizer-ghost") !== null, "drag ghost rendered");
var cards1 = container1._find(".editor-card editor-card-active organizer-carousel-panel");
assert(cards1 !== null, "active cards rendered");
assert(cards1._attrs["data-organizer-card"] !== undefined, "card exposes the organizer id hook");
assert(cards1.getAttribute("data-card-zone") === "active", "active card exposes its zone");
assert(container1._find(".editor-card editor-card-floor") !== null, "floor cards rendered");

// C) add chama EditorCore
console.log("\n[C] add chama EditorCore");
var ed2 = E.createEditor({ visibleCardIds: ["production"], cardOrder: ["production"], autoplay: true, autoplayInterval: 15000 }, registry);
var container2 = new FakeElement("div");
var view2 = V2.createView(container2, ed2, registry);
view2.render();
var before2 = ed2.getState().visibleCardIds.length;
var addBtns = container2._find(".editor-container");
if (addBtns) {
  var availCards = addBtns._children.filter(function(c) { return c.className && c.className.indexOf("editor-available-section") !== -1; });
}
assert(ed2.canAdd("inventory"), "inventory canAdd before render");
ed2.addCard("inventory");
assert(ed2.getState().visibleCardIds.length > before2, "addCard increased visible count");

// D) remove chama EditorCore
console.log("\n[D] remove chama EditorCore");
var ed3 = E.createEditor({ visibleCardIds: ["production", "orders", "inventory", "cash", "sales", "printers"], cardOrder: ["production", "orders", "inventory", "cash", "sales", "printers"], autoplay: true, autoplayInterval: 15000 }, registry);
var before3 = ed3.getState().visibleCardIds.length;
ed3.removeCard("orders");
assert(ed3.getState().visibleCardIds.length < before3, "removeCard decreased visible count");
assert(ed3.getState().visibleCardIds.indexOf("orders") === -1, "orders removed");

// E) reorder chama EditorCore
console.log("\n[E] reorder chama EditorCore");
var ed4 = E.createEditor({ visibleCardIds: ["production", "orders", "inventory"], cardOrder: ["production", "orders", "inventory"], autoplay: true, autoplayInterval: 15000 }, registry);
var before4 = ed4.getState().visibleCardIds.slice();
ed4.moveCard("inventory", -1);
var after4 = ed4.getState().visibleCardIds;
assert(after4[1] === "inventory", "inventory moved up");
assert(after4[2] === "orders", "orders moved down");

// F) restore chama EditorCore
console.log("\n[F] restore chama EditorCore");
var ed5 = E.createEditor({ visibleCardIds: [], cardOrder: [], autoplay: false, autoplayInterval: 5000 }, registry);
ed5.restoreDefaults();
assert(ed5.getState().autoplay === true, "autoplay restored");
assert(ed5.getState().autoplayInterval === 15000, "interval restored");

// G) autoplay chama EditorCore
console.log("\n[G] autoplay chama EditorCore");
var ed6 = E.createEditor(null, registry);
assert(ed6.getState().autoplay === true, "default autoplay true");
ed6.setAutoplay(false);
assert(ed6.getState().autoplay === false, "autoplay set to false");

// H) interval chama EditorCore
console.log("\n[H] interval chama EditorCore");
var ed7 = E.createEditor(null, registry);
ed7.setAutoplayInterval(8000);
assert(ed7.getState().autoplayInterval === 8000, "interval set to 8000");

// I) future nao pode adicionar
console.log("\n[I] future nao pode adicionar");
var ed8 = E.createEditor(null, registry);
assert(ed8.canAdd("fiscal") === false, "fiscal cannotAdd");
assert(ed8.addCard("fiscal") === false, "fiscal add rejected");

// J) available=false nao pode adicionar
console.log("\n[J] available=false nao pode adicionar");
["fiscal","accounts_payable","accounts_receivable","purchases","shipping","crm","quality","maintenance"].forEach(function(id) {
  assert(ed8.canAdd(id) === false, id + " cannotAdd");
});

// K) nao altera feature/route
console.log("\n[K] nao altera feature/route");
var ed9 = E.createEditor({ visibleCardIds: ["production"], cardOrder: ["production"], autoplay: true, autoplayInterval: 15000 }, registry);
ed9.removeCard("production");
assert(registry.get("production") !== null, "production still in registry");
assert(config.active.find(function(c){ return c.id === "production"; }) !== undefined, "production still in config.active");

// L) sem app.js
console.log("\n[L] sem app.js");
var noComments = viewSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
assert(noComments.indexOf("pedidoContaParaAnalytics") === -1, "No pedidoContaParaAnalytics");
assert(noComments.indexOf("calcularResumoFinanceiroPedido") === -1, "No calcularResumoFinanceiroPedido");

// M) sem Supabase
console.log("\n[M] sem Supabase");
assert(noComments.indexOf("Supabase") === -1, "No Supabase");
assert(noComments.indexOf("supabase") === -1, "No supabase");

// N) sem persistencia real
console.log("\n[N] sem persistencia real");
assert(noComments.indexOf("localStorage") === -1, "No localStorage");

// O) sem Home
console.log("\n[O] sem Home");
assert(noComments.indexOf("home-screen") === -1, "No home-screen");
assert(noComments.indexOf("HomeScreen") === -1, "No HomeScreen");

// P) labels usam "remover do carrossel"
console.log("\n[P] labels usam 'remover do carrossel'");
assert(viewSrc.indexOf("Remover do carrossel") !== -1, "Has 'Remover do carrossel'");
var noCommentsForLabels = viewSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
assert(noCommentsForLabels.indexOf("Excluir") === -1, "No 'Excluir' in code");
assert(noCommentsForLabels.indexOf("Desativar") === -1, "No 'Desativar' in code");

console.log("\n=== RESULTS ===");
console.log("  PASS: " + ok);
console.log("  FAIL: " + fail);
console.log(fail === 0 ? "\nALL EDITOR VIEW TESTS PASSED" : "\nSOME TESTS FAILED");
process.exit(fail > 0 ? 1 : 0);
