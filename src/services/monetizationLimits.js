(function (global) {
  "use strict";

  const FREE_ORDER_LIMIT = null;
  const FREE_DAILY_CALCULATION_LIMIT = 30;
  const REWARDED_CALCULATION_BONUS = 20;
  const FREE_DAILY_PDF_LIMIT = 1;
  const AD_UNLOCK_DURATION_MINUTES = 30;
  const AD_FREE_UNLOCK_DURATION_MINUTES = 10;
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
    if (!storage) return { pdfUsage: {}, calculationUsage: {}, calculationBonus: {}, unlocks: {} };
    return { pdfUsage: {}, calculationUsage: {}, calculationBonus: {}, unlocks: {}, ...safeJsonParse(storage.getItem(STORAGE_KEY), {}) };
  }

  function saveState(state) {
    const storage = config.getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify({ pdfUsage: {}, calculationUsage: {}, calculationBonus: {}, unlocks: {}, ...state }));
  }

  function normalize(value = "") {
    return String(value || "").toLowerCase().trim().replace(/-/g, "_");
  }

  function getUserKey(user = {}) {
    return normalize(user.id || user.userId || user.user_id || user.email || user.userEmail || "local");
  }

  function todayKey() {
    const data = new Date(config.now());
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function sanitizeDailyCounter(current, today) {
    if (!current || current.date !== today) return { date: today, count: 0 };
    const count = Number(current.count || 0);
    if (!Number.isFinite(count) || count < 0) return { date: today, count: 0 };
    return { date: today, count: Math.floor(count) };
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
    return true;
  }

  function getRemainingFreeOrders(user = {}) {
    return Number.POSITIVE_INFINITY;
  }

  function resetDailyPdfLimitIfNeeded(user = {}) {
    const state = getState();
    const key = getUserKey(user);
    const today = todayKey();
    const current = sanitizeDailyCounter(state.pdfUsage?.[key], today);
    if (!state.pdfUsage?.[key] || state.pdfUsage[key].date !== current.date || state.pdfUsage[key].count !== current.count) {
      state.pdfUsage = { ...(state.pdfUsage || {}), [key]: current };
      saveState(state);
    }
    return state.pdfUsage[key];
  }

  function getPdfUsage(user = {}) {
    return resetDailyPdfLimitIfNeeded(user);
  }

  function resetDailyCalculationLimitIfNeeded(user = {}) {
    const state = getState();
    const key = getUserKey(user);
    const today = todayKey();
    const current = sanitizeDailyCounter(state.calculationUsage?.[key], today);
    const bonusCurrent = sanitizeDailyCounter(state.calculationBonus?.[key], today);
    if (!state.calculationUsage?.[key] || state.calculationUsage[key].date !== current.date || state.calculationUsage[key].count !== current.count) {
      state.calculationUsage = { ...(state.calculationUsage || {}), [key]: current };
      saveState(state);
    }
    if (!state.calculationBonus?.[key] || state.calculationBonus[key].date !== bonusCurrent.date || state.calculationBonus[key].count !== bonusCurrent.count) {
      state.calculationBonus = { ...(state.calculationBonus || {}), [key]: bonusCurrent };
      saveState(state);
    }
    return {
      usage: state.calculationUsage[key] || { date: today, count: 0 },
      bonus: state.calculationBonus?.[key] || { date: today, count: 0 }
    };
  }

  function getCalculationUsage(user = {}) {
    return resetDailyCalculationLimitIfNeeded(user).usage;
  }

  function getCalculationBonus(user = {}) {
    return resetDailyCalculationLimitIfNeeded(user).bonus;
  }

  function getDailyCalculationLimit(user = {}) {
    if (isPremium(user)) return Number.POSITIVE_INFINITY;
    const bonus = getCalculationBonus(user);
    return FREE_DAILY_CALCULATION_LIMIT + Math.max(0, Number(bonus.count || 0) || 0);
  }

  function canUseCalculator(user = {}) {
    if (isPremium(user)) return true;
    if (hasUnlock("calculator_unlimited", user)) return true;
    const usage = getCalculationUsage(user);
    return Number(usage.count || 0) < getDailyCalculationLimit(user);
  }

  function getRemainingFreeCalculations(user = {}) {
    if (isPremium(user) || hasUnlock("calculator_unlimited", user)) return Number.POSITIVE_INFINITY;
    const usage = getCalculationUsage(user);
    return Math.max(0, getDailyCalculationLimit(user) - Number(usage.count || 0));
  }

  function registerCalculation(user = {}) {
    if (isPremium(user) || hasUnlock("calculator_unlimited", user)) return getCalculationUsage(user);
    const state = getState();
    const key = getUserKey(user);
    const usage = resetDailyCalculationLimitIfNeeded(user).usage;
    state.calculationUsage = { ...(state.calculationUsage || {}), [key]: { date: usage.date, count: Number(usage.count || 0) + 1 } };
    saveState(state);
    return state.calculationUsage[key];
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

  function unlockByAd(type, user = {}, minutes = AD_UNLOCK_DURATION_MINUTES) {
    if (global.AdMobService?.grantTemporaryUnlock) {
      return global.AdMobService.grantTemporaryUnlock(type, minutes);
    }
    const state = getState();
    const until = config.now() + Math.max(1, Number(minutes) || AD_UNLOCK_DURATION_MINUTES) * 60 * 1000;
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

  function unlockAdsByAd(user = {}) {
    return unlockByAd("ad_free", user, AD_FREE_UNLOCK_DURATION_MINUTES);
  }

  function unlockReportsByAd(user = {}) {
    return unlockByAd("reports", user);
  }

  function unlockCalculationsByAd(user = {}) {
    const state = getState();
    const key = getUserKey(user);
    const { bonus } = resetDailyCalculationLimitIfNeeded(user);
    state.calculationBonus = {
      ...(state.calculationBonus || {}),
      [key]: { date: todayKey(), count: Number(bonus.count || 0) + REWARDED_CALCULATION_BONUS }
    };
    saveState(state);
    return { type: "calculator", bonus: REWARDED_CALCULATION_BONUS, totalBonus: state.calculationBonus[key].count };
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
    FREE_DAILY_CALCULATION_LIMIT,
    REWARDED_CALCULATION_BONUS,
    FREE_DAILY_PDF_LIMIT,
    AD_UNLOCK_DURATION_MINUTES,
    AD_FREE_UNLOCK_DURATION_MINUTES,
    configure,
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
