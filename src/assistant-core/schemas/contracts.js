(function attachAssistantContracts(global) {
  "use strict";

  const ACCESS = Object.freeze({ READ: "READ", NAVIGATION: "NAVIGATION", WRITE: "WRITE", MEDIA: "MEDIA", CALCULATE: "CALCULATE" });
  const TOOL_STATUS = Object.freeze({ SUCCESS: "SUCCESS", AMBIGUOUS: "AMBIGUOUS", NOT_FOUND: "NOT_FOUND", INVALID: "INVALID", BLOCKED: "BLOCKED", FAILURE: "FAILURE" });

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const requiredText = (value, field) => {
    const normalized = String(value || "").trim();
    if (!normalized) throw new Error(`${field} obrigatório.`);
    return normalized;
  };

  function createAppManifest(input = {}) {
    const manifest = {
      version: Number(input.version) || 1,
      appId: requiredText(input.appId, "appId"),
      appName: requiredText(input.appName, "appName"),
      domains: clone(input.domains || []),
      routes: clone(input.routes || []),
      entities: clone(input.entities || []),
      relationships: clone(input.relationships || []),
      capabilities: clone(input.capabilities || [])
    };
    const routeIds = new Set();
    manifest.routes.forEach((route) => {
      route.id = requiredText(route.id, "route.id");
      route.path = requiredText(route.path, "route.path");
      if (routeIds.has(route.id)) throw new Error(`Rota duplicada: ${route.id}`);
      routeIds.add(route.id);
    });
    return Object.freeze(manifest);
  }

  function createScreenContext(input = {}) {
    return Object.freeze({
      screen: String(input.screen || "unknown"),
      routeId: String(input.routeId || ""),
      route: String(input.route || ""),
      entityRefs: Object.freeze((input.entityRefs || []).map((ref) => Object.freeze({ type: String(ref.type || ""), id: String(ref.id || "") })).filter((ref) => ref.type && ref.id)),
      readCapabilities: Object.freeze([...(input.readCapabilities || [])]),
      navigationCapabilities: Object.freeze([...(input.navigationCapabilities || [])]),
      writeCapabilities: Object.freeze([...(input.writeCapabilities || [])]),
      updatedAt: input.updatedAt || new Date().toISOString()
    });
  }

  const api = Object.freeze({ ACCESS, TOOL_STATUS, createAppManifest, createScreenContext, clone });
  global.UniversalAssistantContracts = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
