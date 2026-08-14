(function attachStoreEditorAssistantPack(global) {
  "use strict";
  const C = global.UniversalAssistantContracts || (typeof require === "function" ? require("../../../src/assistant-core/schemas/contracts.js") : null);
  const manifest = C.createAppManifest({ appId: "simplifica-store-editor", appName: "Assistente da Loja", domains: [{ id: "store", label: "Loja", keywords: ["loja", "produto", "categoria", "banner", "tema", "página"] }], routes: [{ id: "store.editor", path: "loja-editor" }], entities: [{ id: "product", domain: "store" }, { id: "category", domain: "store" }, { id: "banner", domain: "store" }], capabilities: [] });
  const api = Object.freeze({ id: "store-editor", modelScope: "simplifica-store-editor", status: "CONTRACT_ONLY_READ_ONLY", manifest });
  global.StoreEditorAssistantPack = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
