(function attachStorefrontV3(global) {
  "use strict";



function normalizarTemaLojaOnline(theme = "", context = {}) {
  const { window } = context;
  return window.SimplificaStorefrontPromotionFormatters.normalizarTemaLojaOnline(theme);
}

function getStoreThemeSaved(context = {}) {
  return "light";
}

function isStorefrontAdminContextRoute(pathname, context = {}) {
  const { location, parseStorefrontAdminRoute } = context;
  if (pathname === undefined) pathname = location.pathname;
  return !!parseStorefrontAdminRoute(pathname);
}

function isStorefrontForcedLightContext(pathname, context = {}) {
  const { location } = context;
  if (pathname === undefined) pathname = location.pathname;
  return true;
}

function updateStorefrontThemeColor(theme = "light", context = {}) {
  const { STOREFRONT_THEME_COLORS, document, getEffectiveThemeMode, window } = context;
  if (isStorefrontForcedLightContext(undefined, context)) {
    if (window.SimplificaThemeAuthorityV3?.updateThemeColor) {
      window.SimplificaThemeAuthorityV3.updateThemeColor("light");
    }
    const forcedThemeMeta = document.querySelector("meta[name='theme-color']");
    if (forcedThemeMeta) forcedThemeMeta.setAttribute("content", "#ffffff");
    return "light";
  }
  const resolvedTheme = getEffectiveThemeMode(theme);
  if (window.SimplificaThemeAuthorityV3?.updateThemeColor) {
    return window.SimplificaThemeAuthorityV3.updateThemeColor(resolvedTheme);
  }
  const themeMeta = document.querySelector("meta[name='theme-color']");
  if (themeMeta) themeMeta.setAttribute("content", STOREFRONT_THEME_COLORS[resolvedTheme]);
  return resolvedTheme;
}

function getStorefrontV3PaymentState(context = {}) {
  const { STOREFRONT_V3_PAYMENT_STATE } = context;
  return { ...STOREFRONT_V3_PAYMENT_STATE };
}
  const api = Object.freeze({ normalizarTemaLojaOnline, getStoreThemeSaved, isStorefrontAdminContextRoute, isStorefrontForcedLightContext, updateStorefrontThemeColor, getStorefrontV3PaymentState });
  global.SimplificaStorefrontV3 = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
