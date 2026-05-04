(function (global) {
  "use strict";

  const FREE_ORDER_LIMIT = 5;
  const FREE_DAILY_PDF_LIMIT = 1;
  const AD_UNLOCK_DURATION_MINUTES = 30;
  const STORAGE_KEY = "simplifica3d:monetization-limits:v1";

  const config = {
    now: () => Date.now(),
    getStorage: () => global.localStorage || null,
    getOrderCount: null,
    isPremiumResolver: null
  };

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function getState() {
    const storage = config.getStorage();
    if (!storage) return { pdfUsage: {}, unlocks: {} };
    return { pdfUsage: {}, unlocks: {}, ...safeJsonParse(storage.getItem(STORAGE_KEY), {}) };
  }

  function saveState(state) {
    const storage = config.getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify({ pdfUsage: {}, unlocks: {}, ...state }));
  }

  function normalize(value = "") {
    return String(value || "").toLowerCase().trim().replace(/-/g, "_");
  }

  function getUserKey(user = {}) {
    return normalize(user.id || user.userId || user.user_id || user.email || user.userEmail || "local");
  }

  function todayKey() {
    return new Date(config.now()).toISOString().slice(0, 10);
  }

  function isPremium(user = {}) {
    try {
      if (typeof config.isPremiumResolver === "function") return !!config.isPremiumResolver(user);
    } catch (_) {}
    if (global.AdMobService?.isPremiumUser) return global.AdMobService.isPremiumUser(user);
    if (user?.isPremium === true || user?.premium === true || user?.completo === true) return true;
    const planId = normalize(user?.planId || user?.plan_id || user?.planSlug || user?.plan_slug || user?.plano || user?.planoAtual);
    const status = normalize(user?.status || user?.planStatus || user?.statusAssinatura || user?.subscriptionStatus);
    const expiresAt = Date.parse(user?.currentPeriodEnd || user?.current_period_end || user?.expiresAt || user?.expires_at || 0) || 0;
    if (planId === "premium_trial") return status === "trialing" && expiresAt > config.now();
    if (planId === "premium") return status === "active" && (!expiresAt || expiresAt > config.now());
    return false;
  }

  function getOrderCount(user = {}) {
    if (typeof config.getOrderCount === "function") {
      return Math.max(0, Number(config.getOrderCount(user)) || 0);
    }
    return Math.max(0, Number(user.orderCount || user.activeOrderCount || 0) || 0);
  }

  function getUnlockUntil(type, user = {}) {
    if (global.AdMobService?.hasTemporaryUnlock?.(type)) return config.now() + 1;
    const state = getState();
    return Number(state.unlocks?.[`${getUserKey(user)}:${type}`] || 0);
  }

  function hasUnlock(type, user = {}) {
    return getUnlockUntil(type, user) > config.now();
  }

  function canCreateOrder(user = {}) {
    if (isPremium(user)) return true;
    if (hasUnlock("orders", user)) return true;
    return getOrderCount(user) < FREE_ORDER_LIMIT;
  }

  function getRemainingFreeOrders(user = {}) {
    if (isPremium(user) || hasUnlock("orders", user)) return Number.POSITIVE_INFINITY;
    return Math.max(0, FREE_ORDER_LIMIT - getOrderCount(user));
  }

  function resetDailyPdfLimitIfNeeded(user = {}) {
    const state = getState();
    const key = getUserKey(user);
    const today = todayKey();
    const current = state.pdfUsage?.[key];
    if (!current || current.date !== today) {
      state.pdfUsage = { ...(state.pdfUsage || {}), [key]: { date: today, count: 0 } };
      saveState(state);
    }
    return state.pdfUsage[key];
  }

  function getPdfUsage(user = {}) {
    return resetDailyPdfLimitIfNeeded(user);
  }

  function canExportPDF(user = {}) {
    if (isPremium(user)) return true;
    if (hasUnlock("pdf", user)) return true;
    return getPdfUsage(user).count < FREE_DAILY_PDF_LIMIT;
  }

  function getRemainingFreePdfExports(user = {}) {
    if (isPremium(user) || hasUnlock("pdf", user)) return Number.POSITIVE_INFINITY;
    return Math.max(0, FREE_DAILY_PDF_LIMIT - getPdfUsage(user).count);
  }

  function registerPdfExport(user = {}) {
    if (isPremium(user) || hasUnlock("pdf", user)) return getPdfUsage(user);
    const state = getState();
    const key = getUserKey(user);
    const usage = resetDailyPdfLimitIfNeeded(user);
    state.pdfUsage = { ...(state.pdfUsage || {}), [key]: { date: usage.date, count: Number(usage.count || 0) + 1 } };
    saveState(state);
    return state.pdfUsage[key];
  }

  function unlockByAd(type, user = {}) {
    if (global.AdMobService?.grantTemporaryUnlock) {
      return global.AdMobService.grantTemporaryUnlock(type, AD_UNLOCK_DURATION_MINUTES);
    }
    const state = getState();
    const until = config.now() + AD_UNLOCK_DURATION_MINUTES * 60 * 1000;
    state.unlocks = { ...(state.unlocks || {}), [`${getUserKey(user)}:${type}`]: until };
    saveState(state);
    return { type, until };
  }

  function unlockOrdersByAd(user = {}) {
    return unlockByAd("orders", user);
  }

  function unlockPdfByAd(user = {}) {
    return unlockByAd("pdf", user);
  }

  function configure(options = {}) {
    Object.assign(config, options || {});
  }

  function resetForTests() {
    const storage = config.getStorage();
    if (storage) storage.removeItem(STORAGE_KEY);
  }

  const api = {
    FREE_ORDER_LIMIT,
    FREE_DAILY_PDF_LIMIT,
    AD_UNLOCK_DURATION_MINUTES,
    configure,
    canCreateOrder,
    canExportPDF,
    unlockOrdersByAd,
    unlockPdfByAd,
    resetDailyPdfLimitIfNeeded,
    getRemainingFreeOrders,
    getRemainingFreePdfExports,
    registerPdfExport,
    getState,
    resetForTests
  };

  global.MonetizationLimits = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
