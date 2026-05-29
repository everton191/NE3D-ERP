(function (global) {
  "use strict";

  function getAiPlanAccessState({ plan = "free", subscriptionStatus = "free", isSuperadmin = false } = {}) {
    return {
      allowed: false,
      reason: "AI_DISABLED",
      planRequired: "plus",
      currentPlan: String(plan || "free").toLowerCase(),
      subscriptionStatus: String(subscriptionStatus || "free").toLowerCase(),
      isSuperadmin: isSuperadmin === true
    };
  }

  async function getAiMonthlyUsage(ownerId) {
    return {
      ownerId: ownerId || "",
      used: 0,
      limit: 0,
      period: new Date().toISOString().slice(0, 7)
    };
  }

  async function resetAiMonthlyQuotaIfNeeded(ownerId) {
    return {
      ok: true,
      ownerId: ownerId || "",
      reset: false
    };
  }

  async function getAiAccessState({ ownerId, userId, contextType, plan = "free", subscriptionStatus = "free", isSuperadmin = false } = {}) {
    const planState = getAiPlanAccessState({ plan, subscriptionStatus, isSuperadmin });
    return {
      enabled: false,
      globalEnabled: false,
      ownerEnabled: false,
      planAllowed: false,
      featureAllowed: false,
      quotaAllowed: false,
      providerConfigured: false,
      reason: "AI_DISABLED",
      ownerId: ownerId || "",
      userId: userId || "",
      contextType: contextType || "",
      planState
    };
  }

  async function canUseAi(options = {}) {
    const access = await getAiAccessState(options);
    return { allowed: false, ...access };
  }

  async function registerAiUsage(payload = {}) {
    const entry = {
      owner_id: payload.owner_id || payload.ownerId || "",
      user_id: payload.user_id || payload.userId || null,
      context_type: payload.context_type || payload.contextType || "",
      action_type: payload.action_type || payload.actionType || "ask",
      provider: payload.provider || "disabled",
      model: payload.model || null,
      input_tokens: Math.max(0, Number(payload.input_tokens || payload.inputTokens || 0) || 0),
      output_tokens: Math.max(0, Number(payload.output_tokens || payload.outputTokens || 0) || 0),
      estimated_cost: Math.max(0, Number(payload.estimated_cost || payload.estimatedCost || 0) || 0),
      status: payload.status || "blocked",
      blocked_reason: payload.blocked_reason || payload.blockedReason || "AI_DISABLED",
      error_message: payload.error_message || payload.errorMessage || null,
      metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
      created_at: new Date().toISOString()
    };
    return { ok: true, stored: false, entry };
  }

  const api = {
    getAiPlanAccessState,
    getAiAccessState,
    canUseAi,
    registerAiUsage,
    resetAiMonthlyQuotaIfNeeded,
    getAiMonthlyUsage
  };

  global.SimplificaAiQuotaService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
