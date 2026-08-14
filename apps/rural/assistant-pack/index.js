(function attachRuralAssistantPack(global) {
  "use strict";
  const C = global.UniversalAssistantContracts || (typeof require === "function" ? require("../../../src/assistant-core/schemas/contracts.js") : null);
  const manifest = C.createAppManifest({
    appId: "simplifica-rural",
    appName: "Assistente Rural",
    domains: [
      { id: "rural", label: "Atividades rurais", keywords: ["atividade", "produção", "animal", "plantio"] },
      { id: "milk", label: "Caderneta de leite", keywords: ["leite", "ordenha", "litros", "vaca"] },
      { id: "ruralInventory", label: "Estoque rural", keywords: ["estoque", "ração", "insumo", "semente"] }
    ],
    routes: [
      { id: "rural.home", path: "inicio" },
      { id: "rural.activities", path: "atividades" },
      { id: "rural.milkDiary", path: "ordenhas" },
      { id: "rural.herd", path: "rebanho" },
      { id: "rural.inventory", path: "estoque" }
    ],
    entities: [
      { id: "activity", domain: "rural" },
      { id: "animal", domain: "rural" },
      { id: "milkRecord", domain: "milk" },
      { id: "ruralInventoryItem", domain: "ruralInventory" }
    ],
    capabilities: [
      { id: "rural.summary", domain: "rural", access: C.ACCESS.READ },
      { id: "milk.summary", domain: "milk", access: C.ACCESS.READ },
      { id: "rural.inventory.read", domain: "ruralInventory", access: C.ACCESS.READ },
      { id: "app.navigate", access: C.ACCESS.NAVIGATION }
    ]
  });
  const tools = Object.freeze([
    { name: "rural.summary", access: C.ACCESS.READ, adapter: "readRuralSummary" },
    { name: "milk.summary", access: C.ACCESS.READ, adapter: "readMilkSummary" },
    { name: "rural.inventory.read", access: C.ACCESS.READ, adapter: "readInventory" },
    { name: "app.navigate", access: C.ACCESS.NAVIGATION, adapter: "navigate" }
  ]);
  const api = {
    id: "rural",
    modelScope: "simplifica-rural",
    status: "READY_FOR_APP_ADAPTER",
    manifest,
    tools,
    createRuntime(options = {}) {
      return new global.UniversalAssistantAppRuntime.AppAssistantRuntime({ ...options, pack: api });
    }
  };
  Object.freeze(api);
  global.RuralAssistantPack = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
