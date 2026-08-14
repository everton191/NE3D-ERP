(function attachStoreEditorAssistantPack(global) {
  "use strict";
  const C = global.UniversalAssistantContracts || (typeof require === "function" ? require("../../../src/assistant-core/schemas/contracts.js") : null);
  const manifest = C.createAppManifest({
    appId: "simplifica-store-editor",
    appName: "Assistente da Loja",
    domains: [{ id: "store", label: "Loja", keywords: ["loja", "produto", "categoria", "banner", "tema", "página"] }],
    routes: [
      { id: "store.editor", path: "loja-editor" },
      { id: "store.products", path: "loja-editor/produtos" },
      { id: "store.categories", path: "loja-editor/categorias" },
      { id: "store.appearance", path: "loja-editor/aparencia" },
      { id: "store.banners", path: "loja-editor/banners" }
    ],
    entities: [
      { id: "product", domain: "store" },
      { id: "category", domain: "store" },
      { id: "banner", domain: "store" },
      { id: "storeTheme", domain: "store" }
    ],
    capabilities: [
      { id: "store.products.read", domain: "store", access: C.ACCESS.READ },
      { id: "store.categories.read", domain: "store", access: C.ACCESS.READ },
      { id: "store.appearance.read", domain: "store", access: C.ACCESS.READ },
      { id: "app.navigate", access: C.ACCESS.NAVIGATION }
    ]
  });
  const tools = Object.freeze([
    { name: "store.products.read", access: C.ACCESS.READ, adapter: "readProducts" },
    { name: "store.categories.read", access: C.ACCESS.READ, adapter: "readCategories" },
    { name: "store.appearance.read", access: C.ACCESS.READ, adapter: "readAppearance" },
    { name: "app.navigate", access: C.ACCESS.NAVIGATION, adapter: "navigate" }
  ]);
  const api = {
    id: "store-editor",
    modelScope: "simplifica-store-editor",
    status: "READY_FOR_APP_ADAPTER_READ_ONLY",
    manifest,
    tools,
    createRuntime(options = {}) {
      return new global.UniversalAssistantAppRuntime.AppAssistantRuntime({ ...options, pack: api });
    }
  };
  Object.freeze(api);
  global.StoreEditorAssistantPack = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
