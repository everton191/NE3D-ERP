(function attachModelProvider(global) {
  "use strict";
  class ModelProvider {
    constructor({ id, platform } = {}) { this.id = id || "unknown"; this.platform = platform || "unknown"; }
    async capabilities() { return { supportsText: false, supportsVision: false, supportsAudio: false, supportsTools: false }; }
    async status() { return { available: false, enabled: false, state: "UNAVAILABLE" }; }
    async send() { throw new Error("Provider de modelo indisponível."); }
  }
  class RemoteModelProvider extends ModelProvider {
    constructor({ privacyPolicy = null } = {}) {
      super({ id: "remote", platform: "remote" });
      const Policy = global.UniversalAssistantPrivacy?.AssistantPrivacyPolicy;
      this.privacyPolicy = privacyPolicy || (Policy ? new Policy() : null);
    }
    async status() { return { available: false, enabled: false, state: "DISABLED", reason: "O envio remoto não está habilitado nesta fase." }; }
    async send(request = {}) {
      this.privacyPolicy?.assert?.({
        mode: global.UniversalAssistantPrivacy?.PROCESSING_MODE?.REMOTE || "REMOTE",
        dataTypes: request.attachments?.length ? ["MESSAGE", "ERP_CONTEXT", "IMAGE"] : ["MESSAGE", "ERP_CONTEXT"],
        explicitConsent: request.explicitConsent === true
      });
      throw new Error("O envio remoto não está habilitado nesta fase.");
    }
  }
  const api = Object.freeze({ ModelProvider, RemoteModelProvider });
  global.UniversalAssistantModelProvider = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
