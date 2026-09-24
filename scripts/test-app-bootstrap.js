"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class FakeTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    const registered = this.listeners.get(type) || [];
    registered.push(listener);
    this.listeners.set(type, registered);
  }
  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) listener(event);
  }
  count(type) { return (this.listeners.get(type) || []).length; }
}

const windowRef = new FakeTarget();
const documentRef = new FakeTarget();
documentRef.visibilityState = "visible";
documentRef.title = "Simplifica";
windowRef.document = documentRef;
windowRef.screen = { orientation: new FakeTarget() };
windowRef.setTimeout = (fn) => { fn(); return 1; };
windowRef.clearTimeout = () => {};
windowRef.UiV3Dev = null;

const source = fs.readFileSync(path.join(__dirname, "..", "src", "app", "bootstrap.js"), "utf8");
vm.runInNewContext(source, { window: windowRef });

let persisted = 0;
let diagnostics = 0;
const noop = () => {};
const context = new Proxy({
  document: documentRef,
  clearTimeout: noop,
  setTimeout: windowRef.setTimeout,
  getResizeTimer: () => null,
  setResizeTimer: noop,
  getTelaAtual: () => "dashboard",
  setTelaAtual: noop,
  getAdminLogado: () => false,
  getUsuarioAtual: () => ({ id: "test" }),
  getSyncConfig: () => ({}),
  getStorefrontAutosaveDraft: () => false,
  getStorefrontSessionRecoveryState: () => ({}),
  estaOnline: () => true,
  monitorPromocoes3dPrecisaAtualizar: () => false,
  salvarDados: () => { persisted += 1; },
  registrarDiagnostico: () => { diagnostics += 1; },
  processarRetornoOAuthSupabase: async () => true,
  sincronizarRelayNotificacoesAndroid: async () => {},
  carregarNotificacoesMensagensRemotas: async () => {},
  sincronizarLicencaEfetivaSePossivel: async () => {},
  sincronizarAlteracoesLocaisSilencioso: async () => {},
  storefrontFlushPendingQueue: async () => ({ pending: true })
}, { get(target, property) { return property in target ? target[property] : noop; } });

assert.equal(windowRef.SimplificaAppBootstrap.start(context), true, "bootstrap deve iniciar uma vez");
assert.equal(windowRef.SimplificaAppBootstrap.start(context), false, "bootstrap não pode registrar listeners duplicados");
for (const event of ["resize", "orientationchange", "pagehide", "online", "offline", "error", "unhandledrejection"]) {
  assert.equal(windowRef.count(event), 1, `listener global único esperado: ${event}`);
}
for (const event of ["visibilitychange", "DOMContentLoaded"]) {
  assert.equal(documentRef.count(event), 1, `listener de documento único esperado: ${event}`);
}
windowRef.dispatch("pagehide");
assert.equal(persisted, 1, "pagehide deve preservar dados locais");
windowRef.dispatch("error", { message: "erro", filename: "x.js", lineno: 1, colno: 2 });
windowRef.dispatch("unhandledrejection", { reason: new Error("rejeitada") });
assert.equal(diagnostics, 2, "erros globais devem continuar registrados");
console.log("APP BOOTSTRAP: inicialização única e listeners globais preservados.");
// HERMES_PHASE0_TEST 

// HERMES_PHASE0_WRITE_TEST_1790210360 — MARKER ONLY

// HERMES_PHASE0_WRITE_TEST_1790210373
