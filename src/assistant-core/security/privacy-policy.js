(function attachAssistantPrivacyPolicy(global) {
  "use strict";

  const PROCESSING_MODE = Object.freeze({ LOCAL_ANDROID: "LOCAL_ANDROID", LOCAL_WEB: "LOCAL_WEB", REMOTE: "REMOTE" });
  const DATA_TYPE = Object.freeze({ MESSAGE: "MESSAGE", ERP_CONTEXT: "ERP_CONTEXT", IMAGE: "IMAGE", ATTACHMENT: "ATTACHMENT" });

  class AssistantPrivacyPolicy {
    constructor({ appId = "assistant", allowRemote = false } = {}) {
      this.appId = String(appId || "assistant");
      this.allowRemote = allowRemote === true;
    }
    evaluate({ mode = PROCESSING_MODE.LOCAL_ANDROID, dataTypes = [], explicitConsent = false } = {}) {
      const requested = [...new Set((Array.isArray(dataTypes) ? dataTypes : []).map(String))];
      const local = mode === PROCESSING_MODE.LOCAL_ANDROID || mode === PROCESSING_MODE.LOCAL_WEB;
      if (local) return Object.freeze({ allowed: true, local: true, appId: this.appId, dataTypes: requested, reason: "Processamento restrito ao aplicativo." });
      const allowed = this.allowRemote && explicitConsent === true;
      return Object.freeze({
        allowed,
        local: false,
        appId: this.appId,
        dataTypes: requested,
        reason: allowed ? "Envio remoto autorizado de forma explícita." : "O envio externo não está habilitado para esta assistente."
      });
    }
    assert(request) {
      const decision = this.evaluate(request);
      if (!decision.allowed) throw new Error(decision.reason);
      return decision;
    }
  }

  const api = Object.freeze({ PROCESSING_MODE, DATA_TYPE, AssistantPrivacyPolicy });
  global.UniversalAssistantPrivacy = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
