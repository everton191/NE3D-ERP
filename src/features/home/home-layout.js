(function initHomeLayout(globalScope) {
  "use strict";

  const STORAGE_KEY = "simplifica3d.homeLayout";
  const DEFAULT_LAYOUT = "simple";
  const LAYOUTS = Object.freeze(["simple", "carousel"]);

  function normalize(value) {
    return LAYOUTS.includes(String(value || "").trim().toLowerCase())
      ? String(value).trim().toLowerCase()
      : DEFAULT_LAYOUT;
  }

  function read(storage) {
    try {
      const value = storage?.getItem?.(STORAGE_KEY);
      return LAYOUTS.includes(value) ? value : "";
    } catch (_) {
      return "";
    }
  }

  function resolve({ storedValue = "", configValue = "" } = {}) {
    return LAYOUTS.includes(storedValue) ? storedValue : normalize(configValue);
  }

  function persist(layout, { storage, config, save } = {}) {
    const normalized = normalize(layout);
    if (config && typeof config === "object") config.homeLayout = normalized;
    try { storage?.setItem?.(STORAGE_KEY, normalized); } catch (_) {}
    if (typeof save === "function") save();
    return normalized;
  }

  const api = Object.freeze({ STORAGE_KEY, DEFAULT_LAYOUT, LAYOUTS, normalize, read, resolve, persist });
  globalScope.SimplificaHomeLayout = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
