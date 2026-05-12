(function (global) {
  "use strict";

  const ADS_PRODUCTION_ENABLED = true;
  const REWARDED_PRODUCTION_ENABLED = true;
  const ADMOB_REAL_APP_ID = "ca-app-pub-1056970757696623~2135021978";
  const ADMOB_REAL_BANNER_ID = "ca-app-pub-1056970757696623/1101141905";
  const ADMOB_REAL_INTERSTITIAL_ID = "ca-app-pub-1056970757696623/7662680829";
  const ADMOB_REAL_REWARDED_ID = "ca-app-pub-1056970757696623/8900022712";
  const ADMOB_TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";
  const ADMOB_TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";
  const ADMOB_TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";
  const ADMOB_TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";
  const REWARDED_EVENTS = {
    Loaded: "onRewardedVideoAdLoaded",
    FailedToLoad: "onRewardedVideoAdFailedToLoad",
    Rewarded: "onRewardedVideoAdReward",
    Dismissed: "onRewardedVideoAdDismissed",
    FailedToShow: "onRewardedVideoAdFailedToShow",
    Showed: "onRewardedVideoAdShowed"
  };

  const INTERSTITIAL_MIN_INTERVAL_MINUTES = 60;
  const INTERSTITIAL_MIN_COMPLETED_ACTIONS = 2;
  const INTERSTITIAL_SHOW_PROBABILITY = 0.5;
  const AD_UNLOCK_DURATION_MINUTES = 30;
  const AD_SESSION_WARMUP_MINUTES = 10;
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
  let sessionStartedAt = Date.now();
  let rewardedState = {
    loaded: false,
    loading: false,
    opened: false,
    rewardEarned: false,
    lastReason: "IDLE",
    lastError: "",
    adId: "",
    rewardType: ""
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
      else if (typeof console !== "undefined") console.info("[ADS]", eventKey, metadata);
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
    if (hasTemporaryUnlock("ad_free")) return false;
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

  function setRewardedState(patch = {}) {
    rewardedState = { ...rewardedState, ...patch };
    return { ...rewardedState };
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
    if (result?.rewarded === true || result?.completed === true || result?.userEarnedReward === true) return true;
    if (result?.reward?.amount !== undefined || result?.amount !== undefined || result?.rewardItem) return true;
    return false;
  }

  async function removeListener(handle) {
    try {
      if (handle?.remove) await handle.remove();
    } catch (_) {}
  }

  async function showRewardedWithLifecycle(plugin, adId, type) {
    const show = () => plugin.showRewardVideoAd
      ? plugin.showRewardVideoAd()
      : plugin.showRewardedAd
        ? plugin.showRewardedAd()
        : plugin.showRewarded({ adId });

    if (!plugin?.addListener) return show();

    const handles = [];
    let settled = false;
    let resolveLifecycle;
    let rejectLifecycle;
    const lifecycle = new Promise((resolve, reject) => {
      resolveLifecycle = resolve;
      rejectLifecycle = reject;
    });

    const settle = (resolver, value) => {
      if (settled) return;
      settled = true;
      resolver(value);
    };

    try {
      handles.push(await plugin.addListener(REWARDED_EVENTS.Showed, () => {
        logEvent("ADMOB_REWARDED_OPENED", { rewardType: type });
      }));
      handles.push(await plugin.addListener(REWARDED_EVENTS.Rewarded, (reward) => {
        logEvent("ADMOB_REWARDED_CALLBACK_REWARD", { rewardType: type, amount: reward?.amount, type: reward?.type });
        settle(resolveLifecycle, { rewarded: true, userEarnedReward: true, ...(reward || {}) });
      }));
      handles.push(await plugin.addListener(REWARDED_EVENTS.Dismissed, () => {
        global.setTimeout?.(() => {
          settle(resolveLifecycle, { rewarded: false, cancelled: true, dismissed: true });
        }, 120);
      }));
      handles.push(await plugin.addListener(REWARDED_EVENTS.FailedToShow, (error) => {
        const message = error?.message || error?.errorMessage || "Falha ao exibir Rewarded.";
        settle(rejectLifecycle, new Error(message));
      }));

      const showPromise = Promise.resolve().then(show);
      return await Promise.race([showPromise, lifecycle]);
    } finally {
      await Promise.all(handles.map(removeListener));
    }
  }

  function normalizeRewardType(rewardType = "") {
    const value = normalizePlan(rewardType);
    if (["order", "orders", "pedido", "pedidos"].includes(value)) return "orders";
    if (["pdf", "pdf_export", "export_pdf"].includes(value)) return "pdf";
    if (["calc", "calculation", "calculations", "calculator", "calculadora"].includes(value)) return "calculator";
    if (["report", "reports", "relatorio", "relatorios"].includes(value)) return "reports";
    if (["ads", "ad_free", "sem_anuncios", "sem_ads"].includes(value)) return "ad_free";
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

  function getRewardedStatus(user = {}, rewardType = "generic") {
    const type = normalizeRewardType(rewardType);
    if (isPremiumUser(user)) {
      return { available: false, loaded: false, loading: rewardedState.loading, canRequestLoad: false, reason: "PREMIUM_USER", rewardType: type };
    }
    if (!isAdsAllowed(user, { rewardType: type })) {
      return { available: false, loaded: false, loading: rewardedState.loading, canRequestLoad: false, reason: "ADS_NOT_ALLOWED", rewardType: type };
    }
    const eligibility = canUseNativeAds(user);
    if (!eligibility.allowed) {
      return { available: false, loaded: false, loading: rewardedState.loading, canRequestLoad: false, reason: eligibility.reason, rewardType: type };
    }
    if (isProductionEnabled() && !REWARDED_PRODUCTION_ENABLED) {
      return { available: false, loaded: false, loading: rewardedState.loading, canRequestLoad: false, reason: "REWARDED_DISABLED_IN_PRODUCTION", rewardType: type };
    }
    if (isProductionEnabled() && !ADMOB_REAL_REWARDED_ID) {
      return { available: false, loaded: false, loading: rewardedState.loading, canRequestLoad: false, reason: "REWARDED_REAL_ID_MISSING", rewardType: type };
    }
    return {
      available: true,
      loaded: rewardedPrepared && rewardedState.loaded === true,
      loading: rewardedState.loading === true,
      canRequestLoad: true,
      reason: rewardedPrepared && rewardedState.loaded === true ? "READY" : "NOT_LOADED",
      adId: getRewardedUnitId(),
      rewardType: type,
      production: isProductionEnabled()
    };
  }

  async function preloadRewardedAd({ user = {}, rewardType = "generic" } = {}) {
    const type = normalizeRewardType(rewardType);
    const status = getRewardedStatus(user, type);
    if (status.loaded) return { ok: true, adId: status.adId, alreadyLoaded: true };
    if (!status.canRequestLoad) {
      rewardedPrepared = false;
      setRewardedState({ loaded: false, loading: false, lastReason: status.reason, rewardType: type });
      logEvent("ADMOB_REWARDED_LOAD_SKIPPED", { rewardType: type, reason: status.reason, production: isProductionEnabled() });
      return { ok: false, reason: status.reason };
    }
    if (status.loading) return { ok: false, reason: "LOAD_IN_PROGRESS" };
    const eligibility = canUseNativeAds(user);
    const plugin = eligibility.plugin;
    try {
      setRewardedState({ loaded: false, loading: true, opened: false, rewardEarned: false, lastReason: "LOADING", lastError: "", rewardType: type });
      await ensureInitialized(plugin, user);
      const adId = getRewardedUnitId();
      logEvent("ADMOB_REWARDED_LOAD_STARTED", { rewardType: type, production: isProductionEnabled(), adId });
      if (plugin.prepareRewardVideoAd) {
        await plugin.prepareRewardVideoAd({ adId, isTesting: !isProductionEnabled() });
      } else if (plugin.prepareRewardedAd) {
        await plugin.prepareRewardedAd({ adId, isTesting: !isProductionEnabled() });
      } else {
        throw new Error("Metodo de preparo Rewarded indisponivel no SDK.");
      }
      rewardedPrepared = true;
      setRewardedState({ loaded: true, loading: false, adId, lastReason: "READY", rewardType: type });
      logEvent("ADMOB_REWARDED_PRELOADED", { rewardType: type, production: isProductionEnabled(), adId });
      return { ok: true, adId };
    } catch (error) {
      rewardedPrepared = false;
      setRewardedState({
        loaded: false,
        loading: false,
        lastReason: "LOAD_FAILED",
        lastError: String(error?.message || error || "").slice(0, 160),
        rewardType: type
      });
      logEvent("ADMOB_REWARDED_LOAD_FAILED", { rewardType: type, message: String(error?.message || error || "").slice(0, 160) });
      return { ok: false, reason: "LOAD_FAILED", error };
    }
  }

  async function showRewardedAd({ user = {}, rewardType = "generic", onReward, onError } = {}) {
    const type = normalizeRewardType(rewardType);
    const status = getRewardedStatus(user, type);
    if (!status.loaded && !status.canRequestLoad) {
      logEvent("ADMOB_REWARDED_SHOW_SKIPPED", { rewardType: type, reason: status.reason, production: isProductionEnabled() });
      return { ok: false, rewarded: false, opened: false, reason: status.reason };
    }

    const eligibility = canUseNativeAds(user);
    const plugin = eligibility.plugin;
    let opened = false;
    try {
      if (!rewardedPrepared) {
        const preloaded = await preloadRewardedAd({ user, rewardType: type });
        if (!preloaded.ok) {
          logEvent("ADMOB_REWARDED_SHOW_SKIPPED", { rewardType: type, reason: preloaded.reason || "NOT_LOADED" });
          return { ok: false, rewarded: false, opened: false, reason: preloaded.reason || "NOT_LOADED", error: preloaded.error };
        }
      }

      const adId = getRewardedUnitId();
      setRewardedState({ opened: true, rewardEarned: false, loaded: false, loading: false, lastReason: "OPENING", rewardType: type });
      logEvent("ADMOB_REWARDED_OPENING", { rewardType: type, production: isProductionEnabled(), adId });
      opened = true;
      const result = await showRewardedWithLifecycle(plugin, adId, type);

      rewardedPrepared = false;
      if (!isRewardCompleted(result)) {
        setRewardedState({ opened: false, rewardEarned: false, loaded: false, lastReason: "CLOSED_WITHOUT_REWARD", rewardType: type });
        logEvent("ADMOB_REWARDED_CLOSED_WITHOUT_REWARD", { rewardType: type });
        return { ok: true, rewarded: false, cancelled: true, opened: true, reason: "NOT_COMPLETED" };
      }

      registerAdShown("rewarded");
      const unlock = grantTemporaryUnlock(type);
      setRewardedState({ opened: false, rewardEarned: true, loaded: false, lastReason: "REWARD_GRANTED", rewardType: type });
      logEvent("ADMOB_REWARD_GRANTED", { rewardType: type, label: "[ADS] rewarded_earned" });
      if (typeof onReward === "function") await onReward({ rewardType: type, unlock, adResult: result });
      return { ok: true, rewarded: true, unlock };
    } catch (error) {
      rewardedPrepared = false;
      setRewardedState({
        opened: false,
        rewardEarned: false,
        loaded: false,
        loading: false,
        lastReason: opened ? "SHOW_FAILED_AFTER_OPEN" : "SHOW_FAILED",
        lastError: String(error?.message || error || "").slice(0, 160),
        rewardType: type
      });
      logEvent("ADMOB_REWARDED_LOAD_FAILED", { rewardType: type, message: String(error?.message || error || "").slice(0, 160) });
      try {
        if (typeof onError === "function") onError(error);
      } catch (_) {}
      return { ok: false, rewarded: false, opened, error, reason: opened ? "SHOW_FAILED_AFTER_OPEN" : "SHOW_FAILED" };
    }
  }

  function isCriticalContext(context = {}) {
    const screen = normalizePlan(context.screenName || context.screen || "");
    if (context.isEditingOrder || context.isCalculating || context.isExportingPdf || context.isModalOpen || context.isTyping || context.hasError || context.isSyncing) return true;
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
    if (config.now() - sessionStartedAt < AD_SESSION_WARMUP_MINUTES * 60 * 1000) return { allowed: false, reason: "SESSION_WARMUP" };
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
    sessionStartedAt = config.now();
    rewardedState = {
      loaded: false,
      loading: false,
      opened: false,
      rewardEarned: false,
      lastReason: "IDLE",
      lastError: "",
      adId: "",
      rewardType: ""
    };
  }

  const api = {
    ADS_PRODUCTION_ENABLED,
    REWARDED_PRODUCTION_ENABLED,
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
    AD_SESSION_WARMUP_MINUTES,
    configure,
    isProductionEnabled,
    isNativeAndroid,
    isPremiumUser,
    isAdsAllowed,
    shouldShowAds: isAdsAllowed,
    canShowRewarded: (user = {}, rewardType = "generic") => getRewardedStatus(user, rewardType).canRequestLoad,
    getRewardedStatus,
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
