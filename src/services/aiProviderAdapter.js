(function (global) {
  "use strict";

  const AI_PROVIDERS = Object.freeze(["disabled", "openai", "groq", "gemini", "anthropic", "local"]);
  const DISABLED_RESPONSE = Object.freeze({
    ok: false,
    reason: "AI_DISABLED",
    message: "Recurso de IA ainda não disponível."
  });

  function normalizeProvider(provider = "disabled") {
    const value = String(provider || "disabled").toLowerCase().trim();
    return AI_PROVIDERS.includes(value) ? value : "disabled";
  }

  function getAvailableAiProviders() {
    return AI_PROVIDERS.map((provider) => ({
      provider,
      enabled: provider === "disabled",
      configured: provider === "disabled"
    }));
  }

  function validateAiProviderConfig(provider = "disabled") {
    const normalized = normalizeProvider(provider);
    if (normalized === "disabled") {
      return { ok: true, provider: "disabled", configured: true };
    }
    return {
      ok: false,
      reason: "AI_PROVIDER_NOT_CONFIGURED",
      provider: normalized,
      message: "Provider de IA ainda não configurado nesta versão."
    };
  }

  function estimateAiCost(payload = {}) {
    return {
      provider: normalizeProvider(payload.provider),
      model: payload.model || null,
      inputTokens: Math.max(0, Number(payload.inputTokens || 0) || 0),
      outputTokens: Math.max(0, Number(payload.outputTokens || 0) || 0),
      estimatedCost: 0
    };
  }

  async function generateAiResponse(payload = {}) {
    const provider = normalizeProvider(payload.provider);
    const validation = validateAiProviderConfig(provider);
    if (!validation.ok) return validation;
    return { ...DISABLED_RESPONSE, provider: "disabled" };
  }

  const api = {
    AI_PROVIDERS,
    DISABLED_RESPONSE,
    normalizeProvider,
    generateAiResponse,
    estimateAiCost,
    validateAiProviderConfig,
    getAvailableAiProviders
  };

  global.SimplificaAiProviderAdapter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
