(function attachRuralAssistantPack(global) {
  "use strict";
  const C = global.UniversalAssistantContracts || (typeof require === "function" ? require("../../../src/assistant-core/schemas/contracts.js") : null);
  const manifest = C.createAppManifest({ appId: "simplifica-rural", appName: "Assistente Rural", domains: [{ id: "rural", label: "Atividades rurais", keywords: ["atividade", "produção", "animal", "plantio"] }], routes: [{ id: "rural.home", path: "inicio" }], entities: [{ id: "ruralEntity", domain: "rural" }], capabilities: [] });
  const api = Object.freeze({ id: "rural", modelScope: "simplifica-rural", status: "CONTRACT_ONLY", manifest });
  global.RuralAssistantPack = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
