(function (global) {
  "use strict";

  const FREE_ACTION_CREDIT_LIMIT = 5;
  const FREE_ACTION_AD_BONUS_LIMIT = 5;
  const FREE_ACTION_DAILY_MAX = FREE_ACTION_CREDIT_LIMIT + FREE_ACTION_AD_BONUS_LIMIT;
  const FALLBACK_UNLOCK_MINUTES = 30;
  const AD_FREE_UNLOCK_DURATION_MINUTES = 10;
  // v3 descarta contadores v2 inflados por edicoes e operacoes internas.
  const STORAGE_KEY = "simplifica3d:monetization-limits:v3";
  const LEGACY_STORAGE_KEY = "simplifica3d:monetization-limits:v1";
  // A cota comercial do plano Free e por pedido criado, nao por cada etapa
  // interna do pedido. Edicao, itens, PDF e mudanca de status nao podem
  // consumir novamente a mesma cota.
  const CREDIT_ACTIONS = new Set(["criar_pedido"]);

  const config = {
    now: () => Date.now(),
    getStorage: () => global.localStorage || null,
    isPremiumResolver: null,
    getOrderCount: null
  };

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function normalize(value = "") {
    return String(value || "").toLowerCase().trim().replace(/-/g, "_");
  }

  function getUserKey(user = {}) {
    return normalize(user.id || user.userId || user.user_id || user.email || user.userEmail || "local");
  }

  function baseState() {
    return {
      actionUsage: {},
      actionResets: {},
      fallbackUnlocks: {},
      unlocks: {},
      pdfUsage: {},
      calculationUsage: {},
      calculationBonus: {},
      orderBonus: {}
    };
  }

  function getState() {
    const storage = config.getStorage();
    if (!storage) return baseState();
    return { ...baseState(), ...safeJsonParse(storage.getItem(STORAGE_KEY), {}) };
  }

  function saveState(state) {
    const storage = config.getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...baseState(), ...state }));
  }

  function isPremium(user = {}) {
    try {
      if (typeof config.isPremiumResolver === "function") return !!config.isPremiumResolver(user);
    } catch (_) {}
    if (global.AdMobService?.isPremiumUser?.(user)) return true;
    if (user?.isPremium === true || user?.premium === true || user?.completo === true) return true;
    const planState = normalize(user?.planState || user?.plan_state || "");
    if (["trial", "active", "pago"].includes(planState)) return true;
    if (["pending", "pendente", "free", "gratis", "expired", "blocked"].includes(planState)) return false;
    const planId = normalize(user?.activePlan || user?.active_plan || user?.planId || user?.plan_id || user?.planSlug || user?.plan_slug || user?.plano || user?.planoAtual);
    const status = normalize(user?.subscriptionStatus || user?.subscription_status || user?.status || user?.planStatus || user?.statusAssinatura);
    const expiresAt = Date.parse(user?.trialExpiresAt || user?.trial_expires_at || user?.planExpiresAt || user?.plan_expires_at || user?.currentPeriodEnd || user?.current_period_end || user?.expiresAt || user?.expires_at || 0) || 0;
    if (planId === "premium_trial") return status === "trialing" && expiresAt > config.now();
    if (["start", "pro", "premium"].includes(planId)) return status === "active" && (!expiresAt || expiresAt > config.now());
    return false;
  }

  function actionKey(user = {}) {
    const day = new Date(config.now()).toISOString().slice(0, 10);
    return `${getUserKey(user)}:${day}`;
  }

  function sanitizeActionUsage(current) {
    const count = Math.max(0, Math.floor(Number(current?.count || 0) || 0));
    return {
      count,
      limit: Math.max(FREE_ACTION_CREDIT_LIMIT, Math.min(FREE_ACTION_DAILY_MAX, Math.floor(Number(current?.limit || FREE_ACTION_CREDIT_LIMIT) || FREE_ACTION_CREDIT_LIMIT))),
      updatedAt: Number(current?.updatedAt || 0) || 0
    };
  }

  function consumeFallbackIfReady(state, key) {
    const availableAt = Number(state.fallbackUnlocks?.[key] || 0) || 0;
    if (!availableAt || availableAt > config.now()) return false;
    state.fallbackUnlocks = { ...(state.fallbackUnlocks || {}) };
    delete state.fallbackUnlocks[key];
    state.actionUsage = {
      ...(state.actionUsage || {}),
      [key]: { count: 0, limit: FREE_ACTION_CREDIT_LIMIT, updatedAt: config.now() }
    };
    state.actionResets = { ...(state.actionResets || {}), [key]: config.now() };
    return true;
  }

  function getActionUsage(user = {}) {
    const state = getState();
    const key = actionKey(user);
    if (consumeFallbackIfReady(state, key)) saveState(state);
    const current = sanitizeActionUsage(state.actionUsage?.[key]);
    if (!state.actionUsage?.[key] || state.actionUsage[key].count !== current.count || state.actionUsage[key].limit !== current.limit) {
      state.actionUsage = { ...(state.actionUsage || {}), [key]: current };
      saveState(state);
    }
    return current;
  }

  function getRemainingFreeActions(user = {}) {
    if (isPremium(user)) return Number.POSITIVE_INFINITY;
    const usage = getActionUsage(user);
    return Math.max(0, Number(usage.limit || FREE_ACTION_CREDIT_LIMIT) - Number(usage.count || 0));
  }

  function canUseAction(user = {}) {
    if (isPremium(user)) return true;
    return getRemainingFreeActions(user) > 0;
  }

  function shouldCountAction(actionType = "") {
    return CREDIT_ACTIONS.has(normalize(actionType));
  }

  function registerAction(user = {}, actionType = "acao_importante") {
    if (isPremium(user) || !shouldCountAction(actionType)) return getActionUsage(user);
    const state = getState();
    const key = actionKey(user);
    if (consumeFallbackIfReady(state, key)) {
      saveState(state);
      return state.actionUsage[key];
    }
    const current = sanitizeActionUsage(state.actionUsage?.[key]);
    state.actionUsage = {
      ...(state.actionUsage || {}),
      [key]: {
        count: Math.min(current.limit || FREE_ACTION_CREDIT_LIMIT, current.count + 1),
        limit: current.limit || FREE_ACTION_CREDIT_LIMIT,
        updatedAt: config.now()
      }
    };
    saveState(state);
    return state.actionUsage[key];
  }

  function resetActionsAfterAd(user = {}) {
    const state = getState();
    const key = actionKey(user);
    state.actionUsage = {
      ...(state.actionUsage || {}),
      [key]: { count: Math.min(FREE_ACTION_CREDIT_LIMIT, getActionUsage(user).count || FREE_ACTION_CREDIT_LIMIT), limit: FREE_ACTION_DAILY_MAX, updatedAt: config.now() }
    };
    state.actionResets = { ...(state.actionResets || {}), [key]: config.now() };
    if (state.fallbackUnlocks?.[key]) {
      state.fallbackUnlocks = { ...(state.fallbackUnlocks || {}) };
      delete state.fallbackUnlocks[key];
    }
    saveState(state);
    return { type: "actions", count: FREE_ACTION_AD_BONUS_LIMIT, remaining: getRemainingFreeActions(user), limit: FREE_ACTION_DAILY_MAX };
  }

  function scheduleFallbackUnlock(user = {}, minutes = FALLBACK_UNLOCK_MINUTES) {
    const state = getState();
    const key = actionKey(user);
    const availableAt = config.now() + Math.max(1, Number(minutes) || FALLBACK_UNLOCK_MINUTES) * 60 * 1000;
    state.fallbackUnlocks = { ...(state.fallbackUnlocks || {}), [key]: availableAt };
    saveState(state);
    return { type: "actions", availableAt, minutes: Math.max(1, Number(minutes) || FALLBACK_UNLOCK_MINUTES) };
  }

  function getFallbackUnlock(user = {}) {
    const state = getState();
    return Number(state.fallbackUnlocks?.[actionKey(user)] || 0) || 0;
  }

  function getUnlockUntil(type, user = {}) {
    if (global.AdMobService?.hasTemporaryUnlock?.(type)) return config.now() + 1;
    const state = getState();
    return Number(state.unlocks?.[`${getUserKey(user)}:${type}`] || 0);
  }

  function hasUnlock(type, user = {}) {
    return getUnlockUntil(type, user) > config.now();
  }

  function unlockByAd(type, user = {}, minutes = FALLBACK_UNLOCK_MINUTES) {
    if (type === "actions" || type === "orders") return resetActionsAfterAd(user);
    if (global.AdMobService?.grantTemporaryUnlock) {
      return global.AdMobService.grantTemporaryUnlock(type, minutes);
    }
    const state = getState();
    const until = config.now() + Math.max(1, Number(minutes) || FALLBACK_UNLOCK_MINUTES) * 60 * 1000;
    state.unlocks = { ...(state.unlocks || {}), [`${getUserKey(user)}:${type}`]: until };
    saveState(state);
    return { type, until };
  }

  function getBackupUsageSummary({ usedBytes = 0, plan = "free" } = {}) {
    const normalizedPlan = normalize(plan);
    const limitMb = normalizedPlan === "premium" || normalizedPlan === "pro" ? 1024 : normalizedPlan === "start" ? 256 : 50;
    const limitBytes = limitMb * 1024 * 1024;
    const used = Math.max(0, Number(usedBytes) || 0);
    return {
      usedBytes: used,
      limitBytes,
      limitMb,
      remainingBytes: Math.max(0, limitBytes - used),
      percent: limitBytes ? Math.min(100, Math.round((used / limitBytes) * 100)) : 0,
      full: used >= limitBytes
    };
  }

  function enforceSessionLimit(sessions = [], limit = 2, nowIso = new Date(config.now()).toISOString()) {
    const max = Math.max(1, Number(limit) || 2);
    const normalized = (Array.isArray(sessions) ? sessions : [])
      .map((session) => ({ ...session, active: session?.active !== false }))
      .sort((a, b) => (Date.parse(a.lastSeenAt || a.updatedAt || a.startedAt || 0) || 0) - (Date.parse(b.lastSeenAt || b.updatedAt || b.startedAt || 0) || 0));
    const active = normalized.filter((session) => session.active);
    const toClose = Math.max(0, active.length - max);
    const closing = new Set(active.slice(0, toClose).map((session) => session.id || session.deviceId || session.device_id));
    return normalized.map((session) => {
      const id = session.id || session.deviceId || session.device_id;
      return closing.has(id) ? { ...session, active: false, endedAt: session.endedAt || nowIso } : session;
    });
  }

  function canCreateOrder(user = {}) {
    return canUseAction(user);
  }

  function getRemainingFreeOrders(user = {}) {
    return getRemainingFreeActions(user);
  }

  function unlockOrdersByAd(user = {}) {
    return resetActionsAfterAd(user);
  }

  function canUseCalculator() {
    return true;
  }

  function getRemainingFreeCalculations() {
    return Number.POSITIVE_INFINITY;
  }

  function registerCalculation(user = {}) {
    return getActionUsage(user);
  }

  function unlockCalculationsByAd(user = {}) {
    return resetActionsAfterAd(user);
  }

  function canExportPDF(user = {}) {
    return canUseAction(user);
  }

  function getRemainingFreePdfExports(user = {}) {
    return getRemainingFreeActions(user);
  }

  function registerPdfExport(user = {}) {
    return registerAction(user, "gerar_orcamento");
  }

  function unlockPdfByAd(user = {}) {
    return resetActionsAfterAd(user);
  }

  function unlockAdsByAd(user = {}) {
    return unlockByAd("ad_free", user, AD_FREE_UNLOCK_DURATION_MINUTES);
  }

  function unlockReportsByAd(user = {}) {
    return unlockByAd("reports", user);
  }

  function resetDailyCalculationLimitIfNeeded(user = {}) {
    return { usage: getActionUsage(user), bonus: { date: "", count: 0 } };
  }

  function resetDailyPdfLimitIfNeeded(user = {}) {
    return getActionUsage(user);
  }

  function configure(options = {}) {
    Object.assign(config, options || {});
  }

  function resetForTests() {
    const storage = config.getStorage();
    if (!storage) return;
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);
  }

  const api = {
    FREE_ACTION_CREDIT_LIMIT,
    FREE_ACTION_AD_BONUS_LIMIT,
    FREE_ACTION_DAILY_MAX,
    FALLBACK_UNLOCK_MINUTES,
    AD_UNLOCK_DURATION_MINUTES: FALLBACK_UNLOCK_MINUTES,
    AD_FREE_UNLOCK_DURATION_MINUTES,
    CREDIT_ACTIONS: Array.from(CREDIT_ACTIONS),
    configure,
    canUseAction,
    registerAction,
    resetActionsAfterAd,
    scheduleFallbackUnlock,
    getFallbackUnlock,
    getRemainingFreeActions,
    shouldCountAction,
    getActionUsage,
    getBackupUsageSummary,
    enforceSessionLimit,
    canCreateOrder,
    canUseCalculator,
    canExportPDF,
    unlockOrdersByAd,
    unlockPdfByAd,
    unlockAdsByAd,
    unlockReportsByAd,
    unlockCalculationsByAd,
    resetDailyCalculationLimitIfNeeded,
    resetDailyPdfLimitIfNeeded,
    getRemainingFreeOrders,
    getRemainingFreeCalculations,
    getRemainingFreePdfExports,
    registerCalculation,
    registerPdfExport,
    hasUnlock,
    getState,
    resetForTests
  };

  global.MonetizationLimits = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
