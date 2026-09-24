(function attachStorefrontAdminStorage(global) {
  "use strict";



function storefrontAdminSlugify(value, context = {}) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getStorefrontScopedOwnerId(context = {}) {
  const { getUsuarioAtual, syncConfig, usuarioAtualEmail } = context;
  return storefrontAdminSlugify(syncConfig.supabaseUserId || getUsuarioAtual()?.id || usuarioAtualEmail || "local", context) || "local";
}

function getStorefrontAdminScopedKey(key = "", context = {}) {
  const text = String(key);
  const scopedPrefixes = [
    "simplifica-storefront-admin-",
    "simplifica-storefront-leads-preview-",
    "simplifica-storefront-events-preview-",
    "simplifica-storefront-order-drafts-preview-"
  ];
  if (!scopedPrefixes.some((prefix) => text.startsWith(prefix))) return key;
  return `${key}:${getStorefrontScopedOwnerId(context)}`;
}

function storefrontAdminStorageGet(key, context = {}) {
  const { localStorage } = context;
  try {
    return localStorage.getItem(getStorefrontAdminScopedKey(key, context)) ?? localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function storefrontAdminStorageSet(key, value, context = {}) {
  const { localStorage } = context;
  try {
    localStorage.setItem(getStorefrontAdminScopedKey(key, context), value);
  } catch (_) {}
}

function storefrontAdminStorageRemove(key, context = {}) {
  const { localStorage } = context;
  try {
    localStorage.removeItem(getStorefrontAdminScopedKey(key, context));
    localStorage.removeItem(key);
  } catch (_) {}
}

function storefrontAdminRead(key, fallback, context = {}) {
  try {
    const raw = storefrontAdminStorageGet(key, context);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function storefrontAdminHasStoredValue(key, context = {}) {
  try {
    return storefrontAdminStorageGet(key, context) !== null;
  } catch (_) {
    return false;
  }
}

function storefrontAdminWrite(key, value, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, STOREFRONT_PUBLIC_CACHE_PREFIX, localStorage } = context;
  try {
    let previousStoreSlug = "";
    if (key === STOREFRONT_ADMIN_KEYS.store) {
      try {
        previousStoreSlug = JSON.parse(storefrontAdminStorageGet(key, context) || "null")?.slug || "";
      } catch (_) {}
    }
    storefrontAdminStorageSet(key, JSON.stringify(value), context);
    if ([STOREFRONT_ADMIN_KEYS.store, STOREFRONT_ADMIN_KEYS.categories, STOREFRONT_ADMIN_KEYS.products, STOREFRONT_ADMIN_KEYS.images].includes(key)) {
      const currentStoreSlug = key === STOREFRONT_ADMIN_KEYS.store
        ? value?.slug
        : JSON.parse(storefrontAdminStorageGet(STOREFRONT_ADMIN_KEYS.store, context) || "null")?.slug;
      [previousStoreSlug, currentStoreSlug].filter(Boolean).forEach((slug) => {
        localStorage.removeItem(`${STOREFRONT_PUBLIC_CACHE_PREFIX}${storefrontAdminSlugify(slug, context)}`);
      });
    }
  } catch (_) {}
}

function getStorefrontEditorMode(context = {}) {
  const { STOREFRONT_ADMIN_KEYS } = context;
  const mode = storefrontAdminStorageGet(STOREFRONT_ADMIN_KEYS.editorMode, context) || "simple";
  return mode === "complete" ? "complete" : "simple";
}

function setStorefrontEditorMode(mode = "simple", context = {}) {
  const { STOREFRONT_ADMIN_KEYS, mostrarToast, renderApp } = context;
  const value = mode === "complete" ? "complete" : "simple";
  storefrontAdminStorageSet(STOREFRONT_ADMIN_KEYS.editorMode, value, context);
  mostrarToast(value === "complete" ? "Modo completo ativado." : "Modo simples ativado.", "info", 1800);
  renderApp();
}

function getStorefrontActivityLocal(context = {}) {
  const { STOREFRONT_ADMIN_KEYS } = context;
  const saved = storefrontAdminRead(STOREFRONT_ADMIN_KEYS.activity, [], context);
  return Array.isArray(saved) ? saved : [];
}

function registrarStorefrontActivity(title, description = "", context = {}) {
  const { STOREFRONT_ADMIN_KEYS } = context;
  const item = {
    id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    description,
    created_at: new Date().toISOString()
  };
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.activity, [item, ...getStorefrontActivityLocal(context)].slice(0, 30), context);
}


function getStorefrontDirtyState(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, getStorefrontAutosaveDraft, storefrontAdminStorageGet, storefrontDirtyRuntime } = context;
  try {
    const saved = JSON.parse(storefrontAdminStorageGet(STOREFRONT_ADMIN_KEYS.dirty) || "null");
    if (!saved || typeof saved !== "object") return { dirty: false };
    const recoverableDraft = !!getStorefrontAutosaveDraft();
    return saved.dirty && !storefrontDirtyRuntime && !recoverableDraft
      ? { ...saved, dirty: false, detail: "Nenhuma alteração pendente nesta sessão" }
      : saved;
  } catch (_) {
    return { dirty: false };
  }
}
  const api = Object.freeze({ storefrontAdminSlugify, getStorefrontScopedOwnerId, getStorefrontAdminScopedKey, storefrontAdminStorageGet, storefrontAdminStorageSet, storefrontAdminStorageRemove, storefrontAdminRead, storefrontAdminHasStoredValue, storefrontAdminWrite, getStorefrontEditorMode, setStorefrontEditorMode, getStorefrontActivityLocal, registrarStorefrontActivity, getStorefrontDirtyState });
  global.SimplificaStorefrontAdminStorage = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
