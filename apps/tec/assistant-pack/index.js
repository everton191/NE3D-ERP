(function attachTecAssistantPack(global) {
  "use strict";
  const C = global.UniversalAssistantContracts || (typeof require === "function" ? require("../../../src/assistant-core/schemas/contracts.js") : null);
  const manifest = C.createAppManifest({
    appId: "simplifica-tec",
    appName: "Assistente Tec",
    domains: [
      { id: "technical", label: "Atendimento técnico", keywords: ["atendimento", "diagnóstico", "rede", "ordem"] },
      { id: "customers", label: "Clientes", keywords: ["cliente", "contato", "endereço"] },
      { id: "inventory", label: "Peças e materiais", keywords: ["estoque", "peça", "material", "equipamento"] }
    ],
    routes: [
      { id: "tec.home", path: "inicio" },
      { id: "tec.serviceOrders", path: "ordens" },
      { id: "tec.diagnostics", path: "diagnosticos" },
      { id: "tec.customers", path: "clientes" },
      { id: "tec.inventory", path: "estoque" }
    ],
    entities: [
      { id: "serviceOrder", domain: "technical" },
      { id: "diagnostic", domain: "technical" },
      { id: "customer", domain: "customers" },
      { id: "technicalInventoryItem", domain: "inventory" }
    ],
    capabilities: [
      { id: "serviceOrders.search", domain: "technical", access: C.ACCESS.READ },
      { id: "diagnostics.read", domain: "technical", access: C.ACCESS.READ },
      { id: "technical.inventory.read", domain: "inventory", access: C.ACCESS.READ },
      { id: "app.navigate", access: C.ACCESS.NAVIGATION }
    ]
  });
  const tools = Object.freeze([
    { name: "serviceOrders.search", access: C.ACCESS.READ, adapter: "searchServiceOrders" },
    { name: "diagnostics.read", access: C.ACCESS.READ, adapter: "readDiagnostics" },
    { name: "technical.inventory.read", access: C.ACCESS.READ, adapter: "readInventory" },
    { name: "app.navigate", access: C.ACCESS.NAVIGATION, adapter: "navigate" }
  ]);
  const api = {
    id: "tec",
    modelScope: "simplifica-tec",
    status: "READY_FOR_APP_ADAPTER",
    manifest,
    tools,
    createRuntime(options = {}) {
      return new global.UniversalAssistantAppRuntime.AppAssistantRuntime({ ...options, pack: api });
    }
  };
  Object.freeze(api);
  global.TecAssistantPack = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
