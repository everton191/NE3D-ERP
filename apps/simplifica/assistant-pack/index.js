(function attachSimplificaAssistantPack(global) {
  "use strict";
  const C = global.UniversalAssistantContracts || (typeof require === "function" ? require("../../../src/assistant-core/schemas/contracts.js") : null);
  const manifest = C.createAppManifest({
    appId: "simplifica-3d", appName: "Simplifica IA",
    domains: [
      { id: "orders", label: "Pedidos", keywords: ["pedido", "pedidos", "atrasado", "cliente"] },
      { id: "inventory", label: "Estoque", keywords: ["estoque", "material", "filamento", "pla", "petg", "resina", "rolo"] },
      { id: "cash", label: "Caixa", keywords: ["caixa", "entrada", "saída", "receita", "despesa"] },
      { id: "production", label: "Produção", keywords: ["produção", "impressão", "impressora", "fila"] },
      { id: "customers", label: "Clientes", keywords: ["cliente", "clientes", "contato"] },
      { id: "store", label: "Loja", keywords: ["loja", "produto", "categoria", "banner", "tema"] }
    ],
    routes: [
      { id: "dashboard", path: "dashboard" }, { id: "orders.list", path: "pedidos" }, { id: "orders.new", path: "pedido" },
      { id: "inventory.list", path: "estoque" }, { id: "cash.home", path: "caixa" }, { id: "production.home", path: "producao" },
      { id: "customers.list", path: "clientes" }, { id: "calculator", path: "calculadora" }, { id: "reports", path: "relatorios" },
      { id: "settings", path: "config" }, { id: "store.editor", path: "lojaAdmin" }
    ],
    entities: [
      { id: "order", domain: "orders" }, { id: "customer", domain: "customers" }, { id: "inventoryItem", domain: "inventory" },
      { id: "cashEntry", domain: "cash" }, { id: "productionJob", domain: "production" }, { id: "storeProduct", domain: "store" }
    ],
    relationships: [{ from: "order", to: "customer", type: "belongs_to" }, { from: "order", to: "productionJob", type: "has_many" }],
    capabilities: [
      { id: "orders.search", domain: "orders", access: C.ACCESS.READ }, { id: "orders.get", domain: "orders", access: C.ACCESS.READ },
      { id: "inventory.search", domain: "inventory", access: C.ACCESS.READ }, { id: "cash.summary", domain: "cash", access: C.ACCESS.READ },
      { id: "production.status", domain: "production", access: C.ACCESS.READ }, { id: "app.navigate", access: C.ACCESS.NAVIGATION },
      { id: "orders.prepareCreate", domain: "orders", access: C.ACCESS.WRITE, gate: "WriteCapabilityGate" }
    ]
  });
  const tools = Object.freeze([
    { name: "orders.search", access: C.ACCESS.READ, adapter: "searchOrders" },
    { name: "orders.get", access: C.ACCESS.READ, adapter: "getOrder" },
    { name: "inventory.search", access: C.ACCESS.READ, adapter: "searchInventory" },
    { name: "cash.summary", access: C.ACCESS.READ, adapter: "readCashSummary" },
    { name: "production.status", access: C.ACCESS.READ, adapter: "readProductionStatus" },
    { name: "app.navigate", access: C.ACCESS.NAVIGATION, adapter: "navigate" },
    { name: "orders.prepareCreate", access: C.ACCESS.WRITE, adapter: "prepareOrder" }
  ]);
  const api = {
    id: "simplifica",
    modelScope: "simplifica-3d",
    status: "ACTIVE",
    manifest,
    tools,
    createRuntime(options = {}) {
      return new global.UniversalAssistantAppRuntime.AppAssistantRuntime({ ...options, pack: api });
    }
  };
  Object.freeze(api);
  global.SimplificaAssistantPack = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
