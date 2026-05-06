(function (global) {
  "use strict";

  const ADS_PRODUCTION_ENABLED = true;
  const ADMOB_REAL_APP_ID = "ca-app-pub-1056970757696623~2135021978";
  const ADMOB_REAL_BANNER_ID = "ca-app-pub-1056970757696623/1101141905";
  const ADMOB_REAL_INTERSTITIAL_ID = "ca-app-pub-1056970757696623/7662680829";
  // TODO: preencher o Rewarded real no AdMob antes de ativar anuncios reais em producao.
  const ADMOB_REAL_REWARDED_ID = "";
  const ADMOB_TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";
  const ADMOB_TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";
  const ADMOB_TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";
  const ADMOB_TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";

  const INTERSTITIAL_MIN_INTERVAL_MINUTES = 20;
  const INTERSTITIAL_MIN_COMPLETED_ACTIONS = 2;
  const INTERSTITIAL_SHOW_PROBABILITY = 0.5;
  const AD_UNLOCK_DURATION_MINUTES = 30;
  const STORAGE_KEY = "simplifica3d:admob-state:v2";
  const BANNER_ALLOWED_SCREENS = new Set(["dashboard", "relatorios", "estoque"]);

  const defaultState = {
    lastInterstitialAt: 0,
    completedActionsSinceInterstitial: 0,
    lastRewardedAt: 0,
    lastRewardedType: "",
    bannerVisible: false,
    bannerScreen: "",
    unlocks: {}
  };

  const config = {
    now: () => Date.now(),
    random: () => Math.random(),
    productionEnabledOverride: null,
    nativePlatformOverride: null,
    getPlugin: () => global.Capacitor?.Plugins?.AdMob || global.AdMob || null,
    getStorage: () => global.localStorage || null,
    isPremiumResolver: null,
    shouldShowAdsResolver: null,
    telemetry: null,
    toast: null,
    logger: null
  };

  let initialized = false;
  let rewardedPrepared = false;
  let interstitialPrepared = false;
  let bannerShowing = false;

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
    const stored = safeJsonParse(storage.getItem(STORAGE_KEY), {});
    return { ...defaultState, ...stored, unlocks: stored.unlocks || {} };
  }

  function saveState(state) {
    const storage = config.getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultState, ...state, unlocks: state.unlocks || {} }));
  }

  function isProductionEnabled() {
    return typeof config.productionEnabledOverride === "boolean" ? config.productionEnabledOverride : ADS_PRODUCTION_ENABLED;
  }

  function getPlatform() {
    if (config.nativePlatformOverride) return config.nativePlatformOverride;
    try {
      if (global.Capacitor?.getPlatform) return global.Capacitor.getPlatform();
    } catch (_) {}
    if (/\bElectron\b/i.test(String(global.navigator?.userAgent || ""))) return "electron";
    return "web";
  }

  function isNativeAndroid() {
    const platform = String(getPlatform() || "").toLowerCase();
    if (platform !== "android") return false;
    try {
      if (global.Capacitor?.isNativePlatform) return global.Capacitor.isNativePlatform() !== false;
    } catch (_) {}
    return true;
  }

  function isWebLike() {
    const platform = String(getPlatform() || "").toLowerCase();
    return platform === "web" || platform === "electron";
  }

  function log(eventKey, metadata = {}) {
    try {
      if (typeof config.logger === "function") config.logger(eventKey, metadata);
      else if (typeof console !== "undefined") console.info("[Simplifica3D][AdMob]", eventKey, metadata);
    } catch (_) {}
  }

  function logEvent(eventKey, metadata = {}) {
    log(eventKey, metadata);
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

  function getTimestamp(value) {
    const timestamp = Date.parse(value || 0);
    return Number.isFinite(timestamp) ? timestamp : 0;
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
    const planState = normalizePlan(user.planState || user.plan_state || "");
    if (["trial", "active", "pago"].includes(planState)) return true;
    if (["pending", "pendente", "free", "gratis", "expired", "blocked"].includes(planState)) return false;
    const planId = normalizePlan(user.activePlan || user.active_plan || user.planId || user.plan_id || user.planSlug || user.plan_slug || user.plano || user.planoAtual);
    const status = normalizePlan(user.subscriptionStatus || user.subscription_status || user.status || user.planStatus || user.statusAssinatura);
    const trialEnd = getTimestamp(user.trialExpiresAt || user.trial_expires_at || user.trialEndAt || user.trial_end_at);
    const planEnd = getTimestamp(user.planExpiresAt || user.plan_expires_at || user.currentPeriodEnd || user.current_period_end || user.expiresAt || user.expires_at);
    if (planId === "premium_trial") return trialEnd > config.now();
    if (planId === "premium") return ["active", "paid", "pago", "approved"].includes(status) && (!planEnd || planEnd > config.now());
    return false;
  }

  function isAdsAllowed(user = {}, context = {}) {
    try {
      if (typeof config.shouldShowAdsResolver === "function") {
        return !!config.shouldShowAdsResolver(user, context);
      }
    } catch (_) {}
    if (isPremiumUser(user)) return false;
    if (user?.bloqueado || user?.blocked || user?.ativo === false) return false;
    const planState = normalizePlan(user.planState || user.plan_state || "");
    if (["trial", "active", "pago", "blocked", "bloqueado"].includes(planState)) return false;
    const planId = normalizePlan(user.planId || user.plan_id || user.planSlug || user.plan_slug || user.activePlan || user.active_plan || user.plano || user.planoAtual);
    if (planId && planId !== "free") return false;
    return true;
  }

  function canUseNativeAds(user = {}) {
    if (isPremiumUser(user)) return { allowed: false, reason: "PREMIUM_USER" };
    if (isWebLike() || !isNativeAndroid()) return { allowed: false, reason: "WEB_OR_ELECTRON" };
    const plugin = config.getPlugin();
    if (!plugin) return { allowed: false, reason: "SDK_UNAVAILABLE" };
    return { allowed: true, plugin };
  }

  function getRewardedUnitId() {
    return isProductionEnabled() ? ADMOB_REAL_REWARDED_ID : ADMOB_TEST_REWARDED_ID;
  }

  function getInterstitialUnitId() {
    return isProductionEnabled() ? ADMOB_REAL_INTERSTITIAL_ID : ADMOB_TEST_INTERSTITIAL_ID;
  }

  function getBannerUnitId() {
    return isProductionEnabled() ? ADMOB_REAL_BANNER_ID : ADMOB_TEST_BANNER_ID;
  }

  async function ensureInitialized(plugin, user = {}) {
    const eligibility = canUseNativeAds(user);
    if (!eligibility.allowed) return false;
    if (initialized || !plugin?.initialize) return true;
    await plugin.initialize({
      requestTrackingAuthorization: false,
      initializeForTesting: !isProductionEnabled()
    });
    initialized = true;
    logEvent("ADMOB_INITIALIZED", { production: isProductionEnabled(), appId: isProductionEnabled() ? ADMOB_REAL_APP_ID : ADMOB_TEST_APP_ID });
    return true;
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

  async function preloadRewardedAd({ user = {}, rewardType = "generic" } = {}) {
    const eligibility = canUseNativeAds(user);
    if (!eligibility.allowed) return { ok: false, reason: eligibility.reason };
    if (!isAdsAllowed(user, { rewardType })) return { ok: false, reason: "ADS_NOT_ALLOWED" };
    if (isProductionEnabled() && !ADMOB_REAL_REWARDED_ID) return { ok: false, reason: "REWARDED_REAL_ID_MISSING" };
    const plugin = eligibility.plugin;
    const type = normalizeRewardType(rewardType);
    try {
      await ensureInitialized(plugin, user);
      const adId = getRewardedUnitId();
      if (plugin.prepareRewardVideoAd) {
        await plugin.prepareRewardVideoAd({ adId, isTesting: !isProductionEnabled() });
      } else if (plugin.prepareRewardedAd) {
        await plugin.prepareRewardedAd({ adId, isTesting: !isProductionEnabled() });
      }
      rewardedPrepared = true;
      logEvent("ADMOB_REWARDED_PRELOADED", { rewardType: type, production: isProductionEnabled() });
      return { ok: true, adId };
    } catch (error) {
      rewardedPrepared = false;
      logEvent("ADMOB_REWARDED_LOAD_FAILED", { rewardType: type, message: String(error?.message || error || "").slice(0, 160) });
      return { ok: false, reason: "LOAD_FAILED", error };
    }
  }

  async function showRewardedAd({ user = {}, rewardType = "generic", onReward, onError } = {}) {
    const type = normalizeRewardType(rewardType);
    if (isPremiumUser(user)) return { ok: false, rewarded: false, reason: "PREMIUM_USER" };
    if (!isAdsAllowed(user, { rewardType: type })) return { ok: false, rewarded: false, reason: "ADS_NOT_ALLOWED" };
    if (isProductionEnabled() && !ADMOB_REAL_REWARDED_ID) {
      const error = new Error("Rewarded real do AdMob nao configurado.");
      logEvent("ADMOB_REWARDED_LOAD_FAILED", { rewardType: type, reason: "REWARDED_REAL_ID_MISSING" });
      notify("Anúncio de recompensa indisponível no momento.");
      return { ok: false, rewarded: false, error, reason: "REWARDED_REAL_ID_MISSING" };
    }

    const eligibility = canUseNativeAds(user);
    if (!eligibility.allowed) {
      const error = new Error("AdMob SDK indisponivel.");
      logEvent("ADMOB_REWARDED_LOAD_FAILED", { rewardType: type, reason: eligibility.reason });
      try {
        if (typeof onError === "function") onError(error);
      } catch (_) {}
      if (eligibility.reason !== "WEB_OR_ELECTRON") notify("Não foi possível carregar o anúncio agora. Tente novamente em alguns instantes.");
      return { ok: false, rewarded: false, error, reason: eligibility.reason };
    }

    const plugin = eligibility.plugin;
    try {
      if (!rewardedPrepared) {
        const preloaded = await preloadRewardedAd({ user, rewardType: type });
        if (!preloaded.ok) throw preloaded.error || new Error(preloaded.reason || "Rewarded nao preparado.");
      }

      const adId = getRewardedUnitId();
      const result = plugin.showRewardVideoAd
        ? await plugin.showRewardVideoAd()
        : plugin.showRewardedAd
          ? await plugin.showRewardedAd()
          : await plugin.showRewarded({ adId });

      rewardedPrepared = false;
      if (!isRewardCompleted(result)) {
        return { ok: true, rewarded: false, cancelled: true };
      }

      registerAdShown("rewarded");
      const unlock = grantTemporaryUnlock(type);
      logEvent("ADMOB_REWARD_GRANTED", { rewardType: type });
      if (typeof onReward === "function") await onReward({ rewardType: type, unlock, adResult: result });
      preloadRewardedAd({ user, rewardType: type }).catch(() => {});
      return { ok: true, rewarded: true, unlock };
    } catch (error) {
      rewardedPrepared = false;
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
    if (context.isEditingOrder || context.isCalculating || context.isExportingPdf || context.isModalOpen || context.isTyping || context.hasError) return true;
    return ["login", "cadastro", "signup", "admin", "superadmin", "pagamento", "payment", "assinatura", "onboarding", "popup", "modal"].includes(screen);
  }

  function canShowInterstitial(user = {}, context = {}) {
    const native = canUseNativeAds(user);
    if (!native.allowed) return { allowed: false, reason: native.reason };
    try {
      if (typeof config.shouldShowAdsResolver === "function" && !config.shouldShowAdsResolver(user, context)) {
        return { allowed: false, reason: "ADS_NOT_ALLOWED" };
      }
    } catch (_) {}
    if (!isAdsAllowed(user, context)) return { allowed: false, reason: "ADS_NOT_ALLOWED" };
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
      interstitialPrepared = false;
    }
    if (type === "rewarded") {
      state.lastRewardedAt = now;
      state.lastRewardedType = type;
    }
    saveState(state);
  }

  async function preloadInterstitial({ user = {}, context = {} } = {}) {
    const eligibility = canShowInterstitial(user, context);
    if (!eligibility.allowed) return { ok: false, reason: eligibility.reason };
    const plugin = config.getPlugin();
    try {
      await ensureInitialized(plugin, user);
      const adId = getInterstitialUnitId();
      if (plugin.prepareInterstitial) await plugin.prepareInterstitial({ adId, isTesting: !isProductionEnabled() });
      interstitialPrepared = true;
      return { ok: true, adId };
    } catch (error) {
      interstitialPrepared = false;
      logEvent("ADMOB_INTERSTITIAL_PRELOAD_FAILED", { actionName: context.actionName || "", message: String(error?.message || error || "").slice(0, 160) });
      return { ok: false, reason: "LOAD_FAILED", error };
    }
  }

  async function maybeShowInterstitialAfterCompletedAction(user = {}, context = {}) {
    registerCompletedAction();
    const eligibility = canShowInterstitial(user, context);
    if (!eligibility.allowed) return { shown: false, reason: eligibility.reason };
    if (config.random() > INTERSTITIAL_SHOW_PROBABILITY) return { shown: false, reason: "PROBABILITY_SKIP" };

    const plugin = config.getPlugin();
    if (!plugin) return { shown: false, reason: "SDK_UNAVAILABLE" };

    try {
      if (!interstitialPrepared) {
        const preloaded = await preloadInterstitial({ user, context });
        if (!preloaded.ok) throw preloaded.error || new Error(preloaded.reason || "Interstitial nao preparado.");
      }
      if (plugin.showInterstitial) await plugin.showInterstitial();
      else if (plugin.showInterstitialAd) await plugin.showInterstitialAd();
      registerAdShown("interstitial");
      logEvent("ADMOB_INTERSTITIAL_SHOWN", { actionName: context.actionName || "", production: isProductionEnabled() });
      preloadInterstitial({ user, context }).catch(() => {});
      return { shown: true };
    } catch (error) {
      interstitialPrepared = false;
      logEvent("ADMOB_INTERSTITIAL_FAILED", { actionName: context.actionName || "", message: String(error?.message || error || "").slice(0, 160) });
      return { shown: false, reason: "SHOW_FAILED", error };
    }
  }

  function canShowBanner(user = {}, context = {}) {
    const native = canUseNativeAds(user);
    if (!native.allowed) return { allowed: false, reason: native.reason };
    if (!isAdsAllowed(user, context)) return { allowed: false, reason: "ADS_NOT_ALLOWED" };
    if (isCriticalContext(context)) return { allowed: false, reason: "CRITICAL_CONTEXT" };
    const screen = normalizePlan(context.screenName || context.screen || "");
    if (!BANNER_ALLOWED_SCREENS.has(screen)) return { allowed: false, reason: "SCREEN_NOT_ALLOWED" };
    return { allowed: true, reason: "ALLOWED" };
  }

  async function showBanner({ user = {}, context = {} } = {}) {
    const eligibility = canShowBanner(user, context);
    if (!eligibility.allowed) {
      await hideBanner();
      return { shown: false, reason: eligibility.reason };
    }
    const plugin = config.getPlugin();
    try {
      await ensureInitialized(plugin, user);
      await plugin.showBanner({
        adId: getBannerUnitId(),
        isTesting: !isProductionEnabled(),
        adSize: "ADAPTIVE_BANNER",
        position: "BOTTOM_CENTER",
        margin: 0
      });
      bannerShowing = true;
      const state = getState();
      state.bannerVisible = true;
      state.bannerScreen = normalizePlan(context.screenName || context.screen || "");
      saveState(state);
      logEvent("ADMOB_BANNER_SHOWN", { screen: state.bannerScreen, production: isProductionEnabled() });
      return { shown: true };
    } catch (error) {
      bannerShowing = false;
      logEvent("ADMOB_BANNER_FAILED", { screen: context.screenName || context.screen || "", message: String(error?.message || error || "").slice(0, 160) });
      return { shown: false, reason: "SHOW_FAILED", error };
    }
  }

  async function hideBanner() {
    const plugin = config.getPlugin();
    const state = getState();
    state.bannerVisible = false;
    state.bannerScreen = "";
    saveState(state);
    if (!plugin || !bannerShowing) return { hidden: false, reason: "NOT_VISIBLE" };
    try {
      if (plugin.hideBanner) await plugin.hideBanner();
      else if (plugin.removeBanner) await plugin.removeBanner();
      bannerShowing = false;
      return { hidden: true };
    } catch (error) {
      bannerShowing = false;
      return { hidden: false, reason: "HIDE_FAILED", error };
    }
  }

  async function syncBannerForScreen(user = {}, context = {}) {
    return canShowBanner(user, context).allowed ? showBanner({ user, context }) : hideBanner();
  }

  function configure(options = {}) {
    Object.assign(config, options || {});
  }

  function resetForTests() {
    const storage = config.getStorage();
    if (storage) storage.removeItem(STORAGE_KEY);
    initialized = false;
    rewardedPrepared = false;
    interstitialPrepared = false;
    bannerShowing = false;
  }

  const api = {
    ADS_PRODUCTION_ENABLED,
    ADMOB_REAL_APP_ID,
    ADMOB_REAL_BANNER_ID,
    ADMOB_REAL_REWARDED_ID,
    ADMOB_REAL_INTERSTITIAL_ID,
    ADMOB_TEST_APP_ID,
    ADMOB_TEST_BANNER_ID,
    ADMOB_TEST_REWARDED_ID,
    ADMOB_TEST_INTERSTITIAL_ID,
    INTERSTITIAL_MIN_INTERVAL_MINUTES,
    INTERSTITIAL_MIN_COMPLETED_ACTIONS,
    INTERSTITIAL_SHOW_PROBABILITY,
    AD_UNLOCK_DURATION_MINUTES,
    configure,
    isProductionEnabled,
    isNativeAndroid,
    isPremiumUser,
    isAdsAllowed,
    shouldShowAds: isAdsAllowed,
    canShowRewarded: (user = {}) => isAdsAllowed(user) && !isPremiumUser(user),
    preloadRewardedAd,
    showRewardedAd,
    canShowInterstitial,
    preloadInterstitial,
    maybeShowInterstitialAfterCompletedAction,
    canShowBanner,
    showBanner,
    hideBanner,
    syncBannerForScreen,
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
