(function (global) {
  "use strict";

  const AI_FEATURE_KEYS = Object.freeze([
    "ai_orders_summary",
    "ai_inventory_summary",
    "ai_cash_summary",
    "ai_pricing_helper",
    "ai_whatsapp_message_helper",
    "ai_client_analysis"
  ]);

  function getDefaultAiFeatureFlags() {
    return AI_FEATURE_KEYS.reduce((flags, key) => {
      flags[key] = false;
      return flags;
    }, {});
  }

  async function getAiFeatureFlags(ownerId) {
    return {
      ownerId: ownerId || "",
      ...getDefaultAiFeatureFlags()
    };
  }

  async function isAiFeatureEnabled({ ownerId, featureKey } = {}) {
    if (!ownerId || !AI_FEATURE_KEYS.includes(String(featureKey || ""))) return false;
    const flags = await getAiFeatureFlags(ownerId);
    return flags[featureKey] === true;
  }

  const api = {
    AI_FEATURE_KEYS,
    getDefaultAiFeatureFlags,
    getAiFeatureFlags,
    isAiFeatureEnabled
  };

  global.SimplificaAiFeatureFlagService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
