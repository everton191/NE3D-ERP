(function (global) {
  "use strict";

  function estimateTokensFromText(text = "") {
    const clean = String(text || "").trim();
    if (!clean) return 0;
    return Math.ceil(clean.length / 4);
  }

  function normalizeAiUsageCost(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount < 0) return 0;
    return Number(amount.toFixed(6));
  }

  function estimateAiCost({ provider = "disabled", model = null, inputTokens = 0, outputTokens = 0 } = {}) {
    return {
      provider: String(provider || "disabled"),
      model,
      inputTokens: Math.max(0, Number(inputTokens || 0) || 0),
      outputTokens: Math.max(0, Number(outputTokens || 0) || 0),
      estimatedCost: 0
    };
  }

  const api = {
    estimateTokensFromText,
    estimateAiCost,
    normalizeAiUsageCost
  };

  global.SimplificaAiCostService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
