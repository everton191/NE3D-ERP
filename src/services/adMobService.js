(function (global) {
  "use strict";

  const ADS_PRODUCTION_ENABLED = false;
  const ADMOB_REAL_APP_ID = "COLOCAR_APP_ID_REAL_DEPOIS";
  const ADMOB_REAL_REWARDED_ID = "COLOCAR_REWARDED_ID_REAL_DEPOIS";
  const ADMOB_REAL_INTERSTITIAL_ID = "COLOCAR_INTERSTITIAL_ID_REAL_DEPOIS";
  const ADMOB_TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";
  const ADMOB_TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";

  const INTERSTITIAL_MIN_INTERVAL_MINUTES = 20;
  const INTERSTITIAL_MIN_COMPLETED_ACTIONS = 2;
  const INTERSTITIAL_SHOW_PROBABILITY = 0.5;
  const AD_UNLOCK_DURATION_MINUTES = 30;
  const STORAGE_KEY = "simplifica3d:admob-state:v1";

  const defaultState = {
    lastInterstitialAt: 0,
    completedActionsSinceInterstitial: 0,
    lastRewardedAt: 0,
    lastRewardedType: "",
    unlocks: {}
  };

  const config = {
    now: () => Date.now(),
    random: () => Math.random(),
    productionEnabledOverride: null,
    getPlugin: () => global.Capacitor?.Plugins?.AdMob || global.AdMob || null,
    getStorage: () => global.localStorage || null,
    isPremiumResolver: null,
    shouldShowAdsResolver: null,
    telemetry: null,
    toast: null
  };

  let initialized = false;

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function getState() {
    const storage = config.getStorage();
    if (!storage) return { ...defaultState, unlocks: {} };
    return { ...defaultState, ...safeJsonParse(storage.getItem(STORAGE_KEY), {}), unlocks: safeJsonParse(storage.getItem(STORAGE_KEY), {})?.unlocks || {} };
  }

  function saveState(state) {
    const storage = config.getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultState, ...state, unlocks: state.unlocks || {} }));
  }

  function isProductionEnabled() {
    return typeof config.productionEnabledOverride === "boolean" ? config.productionEnabledOverride : ADS_PRODUCTION_ENABLED;
  }

  function logEvent(eventKey, metadata = {}) {
    try {
      if (typeof config.telemetry === "function") {
        config.telemetry(eventKey, metadata);
      }
    } catch (_) {}
  }

  function notify(message) {
    try {
      if (typeof config.toast === "function") config.toast(message, "erro", 5000);
    } catch (_) {}
  }

  function normalizePlan(value = "") {
    return String(value || "").toLowerCase().trim().replace(/-/g, "_");
  }

  function isPremiumUser(user = {}) {
    try {
      if (typeof config.isPremiumResolver === "function") {
        return !!config.isPremiumResolver(user);
      }
    } catch (_) {}
    if (!user) return false;
    if (user.isPremium === true || user.premium === true || user.completo === true) return true;
    if (user.role === "superadmin" || user.papel === "superadmin") return true;
    const planId = normalizePlan(user.activePlan || user.active_plan || user.planId || user.plan_id || user.planSlug || user.plan_slug || user.plano || user.planoAtual);
    const status = normalizePlan(user.subscriptionStatus || user.subscription_status || user.status || user.planStatus || user.statusAssinatura);
    const expiresAt = Date.parse(user.trialExpiresAt || user.trial_expires_at || user.planExpiresAt || user.plan_expires_at || user.currentPeriodEnd || user.current_period_end || user.expiresAt || user.expires_at || 0) || 0;
    if (planId === "premium_trial") return status === "trialing" && expiresAt > config.now();
    if (planId === "premium") return ["active", "paid", "pago"].includes(status) && (!expiresAt || expiresAt > config.now());
    return false;
  }

  function isAdsAllowed(user = {}) {
    try {
      if (typeof config.shouldShowAdsResolver === "function") {
        return !!config.shouldShowAdsResolver(user, {});
      }
    } catch (_) {}
    if (isPremiumUser(user)) return false;
    if (user?.bloqueado || user?.blocked || user?.ativo === false) return false;
    const planId = normalizePlan(user.planId || user.plan_id || user.planSlug || user.plan_slug || user.activePlan || user.active_plan || user.plano || user.planoAtual);
    if (planId && planId !== "free") return false;
    return true;
  }

  function canShowRewarded(user = {}) {
    return isAdsAllowed(user);
  }

  function getRewardedUnitId() {
    return isProductionEnabled() ? ADMOB_REAL_REWARDED_ID : ADMOB_TEST_REWARDED_ID;
  }

  function getInterstitialUnitId() {
    return isProductionEnabled() ? ADMOB_REAL_INTERSTITIAL_ID : ADMOB_TEST_INTERSTITIAL_ID;
  }

  async function ensureInitialized(plugin) {
    if (initialized || !plugin?.initialize) return;
    await plugin.initialize({
      requestTrackingAuthorization: false,
      initializeForTesting: !isProductionEnabled()
    });
    initialized = true;
  }

  function isRewardCompleted(result) {
    if (result?.cancelled === true || result?.dismissed === true) return false;
    if (result?.rewarded === false || result?.completed === false) return false;
    return true;
  }

  function normalizeRewardType(rewardType = "") {
    const value = normalizePlan(rewardType);
    if (["order", "orders", "pedido", "pedidos"].includes(value)) return "orders";
    if (["pdf", "pdf_export", "export_pdf"].includes(value)) return "pdf";
    return value || "generic";
  }

  function grantTemporaryUnlock(rewardType, minutes = AD_UNLOCK_DURATION_MINUTES) {
    const type = normalizeRewardType(rewardType);
    const state = getState();
    const until = config.now() + Math.max(1, Number(minutes) || AD_UNLOCK_DURATION_MINUTES) * 60 * 1000;
    state.unlocks = { ...(state.unlocks || {}), [type]: until };
    saveState(state);
    return { type, until };
  }

  function hasTemporaryUnlock(rewardType) {
    const type = normalizeRewardType(rewardType);
    const state = getState();
    return Number(state.unlocks?.[type] || 0) > config.now();
  }

  async function showRewardedAd({ rewardType = "generic", onReward, onError } = {}) {
    const plugin = config.getPlugin();
    const type = normalizeRewardType(rewardType);
    if (!plugin) {
      const error = new Error("AdMob SDK indisponivel.");
      logEvent("ADMOB_REWARDED_LOAD_FAILED", { rewardType: type, reason: "SDK_UNAVAILABLE" });
      try {
        if (typeof onError === "function") onError(error);
      } catch (_) {}
      notify("Não foi possível carregar o anúncio agora. Tente novamente em alguns instantes.");
      return { ok: false, rewarded: false, error };
    }

    try {
      await ensureInitialized(plugin);
      const adId = getRewardedUnitId();
      if (plugin.prepareRewardVideoAd) {
        await plugin.prepareRewardVideoAd({ adId, isTesting: !isProductionEnabled() });
      } else if (plugin.prepareRewardedAd) {
        await plugin.prepareRewardedAd({ adId, isTesting: !isProductionEnabled() });
      }

      const result = plugin.showRewardVideoAd
        ? await plugin.showRewardVideoAd()
        : plugin.showRewardedAd
          ? await plugin.showRewardedAd()
          : await plugin.showRewarded({ adId });

      if (!isRewardCompleted(result)) {
        return { ok: true, rewarded: false, cancelled: true };
      }

      registerAdShown("rewarded");
      const unlock = grantTemporaryUnlock(type);
      logEvent("ADMOB_REWARD_GRANTED", { rewardType: type });
      if (typeof onReward === "function") await onReward({ rewardType: type, unlock, adResult: result });
      return { ok: true, rewarded: true, unlock };
    } catch (error) {
      logEvent("ADMOB_REWARDED_LOAD_FAILED", { rewardType: type, message: String(error?.message || error || "").slice(0, 160) });
      try {
        if (typeof onError === "function") onError(error);
      } catch (_) {}
      notify("Não foi possível carregar o anúncio agora. Tente novamente em alguns instantes.");
      return { ok: false, rewarded: false, error };
    }
  }

  function isCriticalContext(context = {}) {
    const screen = normalizePlan(context.screenName || context.screen || "");
    if (context.isEditingOrder || context.isCalculating || context.isExportingPdf || context.isModalOpen) return true;
    return ["login", "cadastro", "signup", "admin"].includes(screen);
  }

  function canShowInterstitial(user = {}, context = {}) {
    if (!isProductionEnabled()) return { allowed: false, reason: "PRODUCTION_DISABLED" };
    try {
      if (typeof config.shouldShowAdsResolver === "function" && !config.shouldShowAdsResolver(user, context)) {
        return { allowed: false, reason: "ADS_NOT_ALLOWED" };
      }
    } catch (_) {}
    if (!isAdsAllowed(user)) return { allowed: false, reason: "ADS_NOT_ALLOWED" };
    if (isCriticalContext(context)) return { allowed: false, reason: "CRITICAL_CONTEXT" };

    const state = getState();
    const elapsed = config.now() - Number(state.lastInterstitialAt || 0);
    if (elapsed < INTERSTITIAL_MIN_INTERVAL_MINUTES * 60 * 1000) return { allowed: false, reason: "MIN_INTERVAL" };
    if (Number(state.completedActionsSinceInterstitial || 0) < INTERSTITIAL_MIN_COMPLETED_ACTIONS) {
      return { allowed: false, reason: "MIN_ACTIONS" };
    }
    return { allowed: true, reason: "ALLOWED" };
  }

  function registerCompletedAction() {
    const state = getState();
    state.completedActionsSinceInterstitial = Number(state.completedActionsSinceInterstitial || 0) + 1;
    saveState(state);
    return state.completedActionsSinceInterstitial;
  }

  function registerAdShown(type = "interstitial") {
    const state = getState();
    const now = config.now();
    if (type === "interstitial") {
      state.lastInterstitialAt = now;
      state.completedActionsSinceInterstitial = 0;
    }
    if (type === "rewarded") {
      state.lastRewardedAt = now;
      state.lastRewardedType = type;
    }
    saveState(state);
  }

  async function maybeShowInterstitialAfterCompletedAction(user = {}, context = {}) {
    registerCompletedAction();
    const eligibility = canShowInterstitial(user, context);
    if (!eligibility.allowed) return { shown: false, reason: eligibility.reason };
    if (config.random() > INTERSTITIAL_SHOW_PROBABILITY) return { shown: false, reason: "PROBABILITY_SKIP" };

    const plugin = config.getPlugin();
    if (!plugin) return { shown: false, reason: "SDK_UNAVAILABLE" };

    try {
      await ensureInitialized(plugin);
      const adId = getInterstitialUnitId();
      if (plugin.prepareInterstitial) await plugin.prepareInterstitial({ adId, isTesting: !isProductionEnabled() });
      if (plugin.showInterstitial) await plugin.showInterstitial();
      else if (plugin.showInterstitialAd) await plugin.showInterstitialAd();
      registerAdShown("interstitial");
      logEvent("ADMOB_INTERSTITIAL_SHOWN", { actionName: context.actionName || "" });
      return { shown: true };
    } catch (error) {
      logEvent("ADMOB_INTERSTITIAL_FAILED", { actionName: context.actionName || "", message: String(error?.message || error || "").slice(0, 160) });
      return { shown: false, reason: "SHOW_FAILED", error };
    }
  }

  function configure(options = {}) {
    Object.assign(config, options || {});
  }

  function resetForTests() {
    const storage = config.getStorage();
    if (storage) storage.removeItem(STORAGE_KEY);
    initialized = false;
  }

  const api = {
    ADS_PRODUCTION_ENABLED,
    ADMOB_REAL_APP_ID,
    ADMOB_REAL_REWARDED_ID,
    ADMOB_REAL_INTERSTITIAL_ID,
    ADMOB_TEST_REWARDED_ID,
    ADMOB_TEST_INTERSTITIAL_ID,
    INTERSTITIAL_MIN_INTERVAL_MINUTES,
    INTERSTITIAL_MIN_COMPLETED_ACTIONS,
    INTERSTITIAL_SHOW_PROBABILITY,
    AD_UNLOCK_DURATION_MINUTES,
    configure,
    isPremiumUser,
    isAdsAllowed,
    shouldShowAds: isAdsAllowed,
    canShowRewarded,
    showRewardedAd,
    canShowInterstitial,
    maybeShowInterstitialAfterCompletedAction,
    registerCompletedAction,
    registerAdShown,
    grantTemporaryUnlock,
    hasTemporaryUnlock,
    getState,
    resetForTests
  };

  global.AdMobService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
