(function attachAssistantContext(global) {
  "use strict";
  const contracts = global.UniversalAssistantContracts || (typeof require === "function" ? require("../schemas/contracts.js") : null);

  class AssistantContextProvider {
    constructor({ manifest, contextWindow = 8192 } = {}) {
      if (!manifest) throw new Error("AppManifest obrigatório.");
      this.manifest = manifest;
      this.contextWindow = contextWindow;
      this.current = contracts.createScreenContext();
      this.explicitRefs = [];
    }
    register(input) { this.current = contracts.createScreenContext(input); return this.snapshot(); }
    addEntityRef(ref) {
      const normalized = { type: String(ref?.type || ""), id: String(ref?.id || "") };
      if (!normalized.type || !normalized.id) return this.snapshot();
      if (!this.explicitRefs.some((item) => item.type === normalized.type && item.id === normalized.id)) this.explicitRefs.push(normalized);
      return this.snapshot();
    }
    removeEntityRef(type, id) {
      const normalizedId = String(id);
      this.explicitRefs = this.explicitRefs.filter((ref) => ref.type !== type || ref.id !== normalizedId);
      this.current = { ...this.current, entityRefs: this.current.entityRefs.filter((ref) => ref.type !== type || String(ref.id) !== normalizedId) };
      return this.snapshot();
    }
    selectManifest(question = "") {
      const value = String(question).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const domains = this.manifest.domains.filter((domain) => (domain.keywords || []).some((keyword) => value.includes(String(keyword).toLowerCase())));
      const domainIds = new Set(domains.map((domain) => domain.id));
      return { domains, entities: this.manifest.entities.filter((entity) => domainIds.has(entity.domain)), capabilities: this.manifest.capabilities.filter((capability) => !capability.domain || domainIds.has(capability.domain)) };
    }
    snapshot() { return { ...this.current, entityRefs: [...this.current.entityRefs, ...this.explicitRefs], contextWindow: this.contextWindow }; }
  }

  const api = Object.freeze({ AssistantContextProvider });
  global.UniversalAssistantContext = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
