(function (global) {
  "use strict";

  const quota = typeof require === "function" ? require("./aiQuotaService.js") : global.SimplificaAiQuotaService;
  const providerAdapter = typeof require === "function" ? require("./aiProviderAdapter.js") : global.SimplificaAiProviderAdapter;
  const contextService = typeof require === "function" ? require("./aiContextService.js") : global.SimplificaAiContextService;

  const AI_DISABLED_RESPONSE = Object.freeze({
    ok: false,
    reason: "AI_DISABLED",
    message: "Recurso de IA ainda não disponível."
  });

  function validateAiPayload(payload = {}) {
    if (!payload.ownerId || !payload.userId) {
      return {
        ok: false,
        reason: "AI_INVALID_PAYLOAD",
        message: "ownerId e userId são obrigatórios para recursos futuros de IA."
      };
    }
    return { ok: true };
  }

  async function askAi(payload = {}) {
    const validation = validateAiPayload(payload);
    if (!validation.ok) return validation;

    const requestedProvider = payload.provider || payload.metadata?.provider || "disabled";
    const providerValidation = providerAdapter.validateAiProviderConfig(requestedProvider);
    if (!providerValidation.ok) {
      await quota.registerAiUsage({
        ownerId: payload.ownerId,
        userId: payload.userId,
        contextType: payload.contextType,
        actionType: payload.actionType || "ask",
        provider: providerValidation.provider,
        status: "blocked",
        blockedReason: providerValidation.reason,
        metadata: { phase: "5B", provider: providerValidation.provider }
      });
      return providerValidation;
    }

    const access = await quota.getAiAccessState({
      ownerId: payload.ownerId,
      userId: payload.userId,
      contextType: payload.contextType,
      plan: payload.plan,
      subscriptionStatus: payload.subscriptionStatus,
      isSuperadmin: payload.isSuperadmin === true
    });
    if (!access.enabled) {
      await quota.registerAiUsage({
        ownerId: payload.ownerId,
        userId: payload.userId,
        contextType: payload.contextType,
        actionType: payload.actionType || "ask",
        provider: "disabled",
        status: "blocked",
        blockedReason: access.reason || "AI_DISABLED",
        metadata: { phase: "5B" }
      });
      return { ...AI_DISABLED_RESPONSE, access };
    }

    await contextService.buildAiContextByType({
      ownerId: payload.ownerId,
      userId: payload.userId,
      contextType: payload.contextType,
      filters: payload.filters,
      input: payload.input
    });
    return { ...AI_DISABLED_RESPONSE, access };
  }

  const api = {
    AI_DISABLED_RESPONSE,
    askAi,
    validateAiPayload
  };

  global.SimplificaAiService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
