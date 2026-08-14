(function attachTecAssistantPack(global) {
  "use strict";
  const C = global.UniversalAssistantContracts || (typeof require === "function" ? require("../../../src/assistant-core/schemas/contracts.js") : null);
  const manifest = C.createAppManifest({ appId: "simplifica-tec", appName: "Assistente Tec", domains: [{ id: "technical", label: "Atendimento técnico", keywords: ["atendimento", "diagnóstico", "rede", "ordem"] }], routes: [{ id: "tec.home", path: "inicio" }], entities: [{ id: "serviceOrder", domain: "technical" }], capabilities: [] });
  const api = Object.freeze({ id: "tec", modelScope: "simplifica-tec", status: "CONTRACT_ONLY", manifest });
  global.TecAssistantPack = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
