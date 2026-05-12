(function (global) {
  "use strict";

  const ALLOWED_SCREENS = new Set(["dashboard", "relatorios", "estoque"]);
  const DEFAULT_CONTAINER_ID = "webAdSenseSlot";

  const config = {
    enabled: false,
    publisherId: "",
    bannerSlot: "",
    containerId: DEFAULT_CONTAINER_ID,
    shouldShowAdsResolver: null,
    isPremiumResolver: null,
    telemetry: null,
    logger: null
  };

  let scriptPromise = null;
  let renderedKey = "";
  let lastRenderAt = 0;

  function getPlatform() {
    try {
      if (global.Capacitor?.getPlatform) return String(global.Capacitor.getPlatform() || "").toLowerCase();
    } catch (_) {}
    if (/\bElectron\b/i.test(String(global.navigator?.userAgent || ""))) return "electron";
    return "web";
  }

  function isNativeRuntime() {
    const platform = getPlatform();
    if (platform !== "android" && platform !== "ios") return false;
    try {
      if (global.Capacitor?.isNativePlatform) return global.Capacitor.isNativePlatform() !== false;
    } catch (_) {}
    return true;
  }

  function sanitizePublisherId(value) {
    const text = String(value || "").trim();
    const normalized = text.startsWith("pub-") ? `ca-${text}` : text;
    return /^ca-pub-\d{10,}$/.test(normalized) ? normalized : "";
  }

  function sanitizeSlot(value) {
    const text = String(value || "").trim();
    return /^\d{6,}$/.test(text) ? text : "";
  }

  function log(eventKey, metadata = {}) {
    try {
      if (typeof config.logger === "function") config.logger(eventKey, metadata);
      else if (typeof console !== "undefined") console.info("[Simplifica3D][AdSense]", eventKey, metadata);
    } catch (_) {}
  }

  function report(eventKey, metadata = {}) {
    log(eventKey, metadata);
    try {
      if (typeof config.telemetry === "function") config.telemetry(eventKey, metadata);
    } catch (_) {}
  }

  function getContainer() {
    const id = config.containerId || DEFAULT_CONTAINER_ID;
    let container = global.document?.getElementById(id);
    if (container) return container;
    container = global.document?.createElement("div");
    if (!container) return null;
    container.id = id;
    container.className = "web-adsense-slot";
    container.setAttribute("aria-hidden", "true");
    global.document.body.appendChild(container);
    return container;
  }

  function hideBanner(reason = "hidden") {
    const container = global.document?.getElementById(config.containerId || DEFAULT_CONTAINER_ID);
    const wasVisible = container?.classList.contains("visible") === true;
    if (container) {
      container.classList.remove("visible");
      container.innerHTML = "";
      container.setAttribute("aria-hidden", "true");
    }
    renderedKey = "";
    if (wasVisible) log("BANNER_HIDDEN", { reason });
  }

  function canRunInCurrentRuntime() {
    if (isNativeRuntime()) return false;
    const platform = getPlatform();
    return platform === "web";
  }

  function isEligible(user, context = {}) {
    const screenName = String(context.screenName || "").toLowerCase();
    if (!config.enabled) return { ok: false, reason: "DISABLED" };
    if (!canRunInCurrentRuntime()) return { ok: false, reason: "UNSUPPORTED_RUNTIME" };
    if (!sanitizePublisherId(config.publisherId)) return { ok: false, reason: "MISSING_PUBLISHER" };
    if (!sanitizeSlot(config.bannerSlot)) return { ok: false, reason: "MISSING_SLOT" };
    if (!ALLOWED_SCREENS.has(screenName)) return { ok: false, reason: "SCREEN_NOT_ALLOWED" };
    if (context.isAuthScreen || context.isEditingOrder || context.isCalculating || context.isExportingPdf || context.isModalOpen || context.isTyping || context.hasError) {
      return { ok: false, reason: "UNSAFE_CONTEXT" };
    }
    try {
      if (typeof config.isPremiumResolver === "function" && config.isPremiumResolver(user, context)) {
        return { ok: false, reason: "PREMIUM_USER" };
      }
    } catch (_) {
      return { ok: false, reason: "PREMIUM_CHECK_FAILED" };
    }
    try {
      if (typeof config.shouldShowAdsResolver === "function" && !config.shouldShowAdsResolver(user, context)) {
        return { ok: false, reason: "APP_RULES_BLOCKED" };
      }
    } catch (_) {
      return { ok: false, reason: "APP_RULES_FAILED" };
    }
    return { ok: true, reason: "OK" };
  }

  function ensureScript() {
    if (scriptPromise) return scriptPromise;
    const publisherId = sanitizePublisherId(config.publisherId);
    scriptPromise = new Promise((resolve, reject) => {
      if (!publisherId) {
        reject(new Error("AdSense publisher id ausente"));
        return;
      }
      const existing = global.document?.querySelector("script[data-simplifica-adsense='true']");
      if (existing) {
        resolve(existing);
        return;
      }
      const script = global.document?.createElement("script");
      if (!script) {
        reject(new Error("DOM indisponivel para AdSense"));
        return;
      }
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.simplificaAdsense = "true";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error("Falha ao carregar AdSense"));
      global.document.head.appendChild(script);
    }).catch((error) => {
      scriptPromise = null;
      throw error;
    });
    return scriptPromise;
  }

  async function syncBannerForScreen(user = null, context = {}) {
    const eligibility = isEligible(user, context);
    if (!eligibility.ok) {
      hideBanner(eligibility.reason);
      return { shown: false, reason: eligibility.reason };
    }

    const now = Date.now();
    const publisherId = sanitizePublisherId(config.publisherId);
    const slot = sanitizeSlot(config.bannerSlot);
    const key = `${String(context.screenName || "").toLowerCase()}:${publisherId}:${slot}`;
    const container = getContainer();
    if (!container) return { shown: false, reason: "NO_CONTAINER" };
    if (renderedKey === key && now - lastRenderAt < 30000) {
      container.classList.add("visible");
      container.setAttribute("aria-hidden", "false");
      return { shown: true, reason: "UNCHANGED" };
    }

    container.className = "web-adsense-slot";
    container.setAttribute("aria-hidden", "false");
    container.innerHTML = `
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${publisherId}"
        data-ad-slot="${slot}"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
    `;

    try {
      await ensureScript();
      global.adsbygoogle = global.adsbygoogle || [];
      global.adsbygoogle.push({});
      renderedKey = key;
      lastRenderAt = now;
      container.classList.add("visible");
      return { shown: true, reason: "RENDERED" };
    } catch (error) {
      hideBanner("SCRIPT_ERROR");
      report("ADSENSE_BANNER_FAILED", { message: error?.message || String(error), screenName: context.screenName || "" });
      return { shown: false, reason: "SCRIPT_ERROR" };
    }
  }

  function configure(options = {}) {
    Object.assign(config, options || {});
    config.publisherId = sanitizePublisherId(config.publisherId || global.__ADSENSE_PUBLISHER_ID__ || "");
    config.bannerSlot = sanitizeSlot(config.bannerSlot || global.__ADSENSE_BANNER_SLOT__ || "");
    return { ...config };
  }

  global.AdSenseService = {
    ALLOWED_SCREENS,
    configure,
    hideBanner,
    isEligible,
    syncBannerForScreen,
    sanitizePublisherId,
    sanitizeSlot
  };
})(window);
