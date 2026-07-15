(function initSimplificaThemeAuthorityV3(global) {
  "use strict";

  const ERP_THEME_KEY = "simplifica3d:erp-theme-preference";
  const LEGACY_ERP_THEME_KEY = "simplifica3d_erp_theme_preference";
  const STORE_THEME_KEY = "simplifica3d_store_theme_preference";
  const LEGACY_STORE_THEME_KEY = "simplifica3d_store_theme";
  const ALLOWED_THEME_PREFERENCES = Object.freeze(["light", "system", "dark"]);
  const THEME_COLORS = Object.freeze({ light: "#ffffff", dark: "#08131d" });

  function normalizePreference(value, fallback = "light") {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "auto") return "system";
    return ALLOWED_THEME_PREFERENCES.includes(normalized) ? normalized : fallback;
  }

  function resolveTheme(preference = "light") {
    const normalized = normalizePreference(preference);
    if (normalized === "light" || normalized === "dark") return normalized;
    try {
      return global.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
    } catch (_) {
      return "light";
    }
  }

  function readStorage(key) {
    try {
      return global.localStorage?.getItem(key) || "";
    } catch (_) {
      return "";
    }
  }

  function writeStorage(key, value) {
    try {
      global.localStorage?.setItem(key, value);
    } catch (_) {}
  }

  function getSavedErpThemePreference() {
    const preference = readStorage(ERP_THEME_KEY) || readStorage(LEGACY_ERP_THEME_KEY);
    if (preference) writeStorage(ERP_THEME_KEY, preference);
    return normalizePreference(preference);
  }

  function getSavedStoreThemePreference() {
    return normalizePreference(readStorage(STORE_THEME_KEY) || readStorage(LEGACY_STORE_THEME_KEY));
  }

  function updateThemeColor(resolvedTheme = "light") {
    const normalized = resolveTheme(resolvedTheme);
    const meta = global.document?.querySelector?.("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", THEME_COLORS[normalized]);
    return normalized;
  }

  function applyErpTheme(preference = getSavedErpThemePreference(), options = {}) {
    const normalized = normalizePreference(preference);
    const resolved = resolveTheme(normalized);
    const root = global.document?.documentElement;
    const body = global.document?.body;
    const target = options.target || global.document?.querySelector?.("#app-shell");
    root?.setAttribute("data-erp-theme", resolved);
    root?.setAttribute("data-erp-theme-preference", normalized);
    root?.classList?.toggle("theme-light", resolved === "light");
    root?.classList?.toggle("theme-dark", resolved === "dark");
    if (root?.style) {
      root.style.colorScheme = resolved;
      root.style.backgroundColor = THEME_COLORS[resolved];
    }
    body?.setAttribute("data-erp-theme", resolved);
    body?.setAttribute("data-erp-theme-preference", normalized);
    body?.classList?.toggle("theme-light", resolved === "light");
    body?.classList?.toggle("theme-dark", resolved === "dark");
    if (body?.style) body.style.colorScheme = resolved;
    target?.classList?.add("erp-theme-v3");
    target?.setAttribute?.("data-erp-theme", resolved);
    target?.setAttribute?.("data-erp-theme-preference", normalized);
    if (options.persist !== false) writeStorage(ERP_THEME_KEY, normalized);
    const publicStorefrontActive = !!global.document?.querySelector?.(".storefront-v3-host:not(.storefront-v3-host--admin) .storefront-v3");
    if (options.updateThemeColor !== false && !publicStorefrontActive) updateThemeColor(resolved);
    return { preference: normalized, resolved };
  }

  function applyStoreTheme(preference = getSavedStoreThemePreference(), options = {}) {
    const normalized = normalizePreference(preference);
    const resolved = resolveTheme(normalized);
    const targets = options.target
      ? [options.target]
      : Array.from(global.document?.querySelectorAll?.(".storefront-root,.store-public-shell,.storefront-theme-v3,.storefront-v3-host,.storefront-v3,.storefront-v3__modal-backdrop,.store-cart-backdrop,.store-lead-backdrop") || []);
    targets.forEach((target) => {
      target?.classList?.add("storefront-root");
      target?.classList?.add("storefront-theme-v3");
      target?.setAttribute?.("data-store-theme", resolved);
      target?.setAttribute?.("data-store-theme-preference", normalized);
    });
    if (options.persist !== false) {
      writeStorage(STORE_THEME_KEY, normalized);
      writeStorage(LEGACY_STORE_THEME_KEY, resolved);
    }
    if (options.updateThemeColor !== false) updateThemeColor(resolved);
    return { preference: normalized, resolved };
  }

  function handleSystemThemeChange() {
    if (getSavedErpThemePreference() === "system") applyErpTheme("system");
    if (getSavedStoreThemePreference() === "system") applyStoreTheme("system");
    global.dispatchEvent?.(new CustomEvent("simplifica-theme-system-change"));
  }

  try {
    const systemThemeQuery = global.matchMedia?.("(prefers-color-scheme: dark)");
    systemThemeQuery?.addEventListener?.("change", handleSystemThemeChange);
  } catch (_) {}

  global.SimplificaThemeAuthorityV3 = Object.freeze({
    ERP_THEME_KEY,
    LEGACY_ERP_THEME_KEY,
    STORE_THEME_KEY,
    LEGACY_STORE_THEME_KEY,
    ALLOWED_THEME_PREFERENCES,
    normalizePreference,
    resolveTheme,
    getSavedErpThemePreference,
    getSavedStoreThemePreference,
    updateThemeColor,
    applyErpTheme,
    applyStoreTheme
  });
})(typeof window !== "undefined" ? window : globalThis);
