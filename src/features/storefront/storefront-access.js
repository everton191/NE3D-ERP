(function attachStorefrontAccess(global) {
  "use strict";



function isStorefrontTruthy(value, context = {}) {
  const { STOREFRONT_TRUE_VALUES } = context;
  return STOREFRONT_TRUE_VALUES.has(String(value ?? "").trim().toLowerCase());
}

function getStorefrontBetaAccessCache(context = {}) {
  const { STOREFRONT_BETA_ACCESS_KEY, localStorage } = context;
  try {
    const cache = JSON.parse(localStorage.getItem(STOREFRONT_BETA_ACCESS_KEY) || "{}");
    return cache && typeof cache === "object" ? cache : {};
  } catch (_) {
    return {};
  }
}

function setStorefrontBetaAccessCache(access, context = {}) {
  const { STOREFRONT_BETA_ACCESS_KEY, localStorage } = context;
  try {
    localStorage.setItem(STOREFRONT_BETA_ACCESS_KEY, JSON.stringify({
      ...access,
      updatedAt: new Date().toISOString()
    }));
  } catch (_) {}
}

function isStorefrontDevOverrideEnabled(context = {}) {
  const { isAmbienteLocal, localStorage } = context;
  if (!isAmbienteLocal()) return false;
  try {
    return isStorefrontTruthy(localStorage.getItem("STORE_FRONT_ENABLED"), context)
      || isStorefrontTruthy(localStorage.getItem("simplifica3d:storefront-enabled"), context);
  } catch (_) {
    return false;
  }
}

function getStorefrontRuntimeFlags(context = {}) {
  const { STOREFRONT_PUBLIC_RELEASE, window } = context;
  const valorGlobal = String(window.STORE_FRONT_ENABLED ?? window.__STORE_FRONT_ENABLED__ ?? "").toLowerCase();
  const beta = getStorefrontBetaAccessCache(context);
  const devOverride = isStorefrontDevOverrideEnabled(context);
  return {
    publicRelease: STOREFRONT_PUBLIC_RELEASE,
    enabledByEnv: isStorefrontTruthy(valorGlobal, context),
    enabledByRemote: beta.enabled === true,
    betaAllowedByRemote: beta.allowed === true,
    devOverride,
    checkedAt: beta.updatedAt || ""
  };
}

function isStorefrontFeatureEnabled(flags, context = {}) {
  if (flags === undefined) flags = getStorefrontRuntimeFlags(context);
  return flags.publicRelease === true || flags.enabledByEnv || flags.enabledByRemote || flags.devOverride;
}

function registrarStorefrontDebugLeve(evento, detalhe = "", extra = {}, context = {}) {
  const { localStorage, telaAtual } = context;
  try {
    const payload = {
      evento,
      detalhe,
      extra,
      tela: telaAtual || "",
      at: new Date().toISOString()
    };
    console.warn(`[Storefront] ${evento}: ${detalhe}`, extra || "");
    const key = "simplifica-storefront-debug-v1";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.unshift(payload);
    localStorage.setItem(key, JSON.stringify(current.slice(0, 40)));
  } catch (_) {}
}

function setStorefrontUploadStatus(status = {}, context = {}) {
  const { STOREFRONT_UPLOAD_STATUS_KEY, localStorage } = context;
  try {
    localStorage.setItem(STOREFRONT_UPLOAD_STATUS_KEY, JSON.stringify({
      type: status.type || "info",
      title: status.title || "",
      message: status.message || "",
      detail: status.detail || "",
      at: new Date().toISOString()
    }));
  } catch (_) {}
}

function clearStorefrontUploadStatus(context = {}) {
  const { STOREFRONT_UPLOAD_STATUS_KEY, localStorage } = context;
  try {
    localStorage.removeItem(STOREFRONT_UPLOAD_STATUS_KEY);
  } catch (_) {}
}

function getStorefrontUploadStatus(context = {}) {
  const { STOREFRONT_UPLOAD_STATUS_KEY, localStorage } = context;
  try {
    const saved = JSON.parse(localStorage.getItem(STOREFRONT_UPLOAD_STATUS_KEY) || "null");
    return saved && typeof saved === "object" ? saved : null;
  } catch (_) {
    return null;
  }
}

function renderStorefrontUploadStatus(context = {}) {
  const { escaparAttr, escaparHtml } = context;
  const status = getStorefrontUploadStatus(context);
  if (!status?.title && !status?.message) return "";
  return `
    <div class="storefront-upload-status ${escaparAttr(status.type || "info")}" data-storefront-upload-status>
      <strong>${escaparHtml(status.title || "Status do upload")}</strong>
      ${status.message ? `<span>${escaparHtml(status.message)}</span>` : ""}
      ${status.detail ? `<small>${escaparHtml(status.detail)}</small>` : ""}
    </div>
  `;
}

function isStorefrontAllowedTestUser(usuario, flags, context = {}) {
  const { getUsuarioAtual, isSuperAdmin, normalizarEmail, syncConfig, usuarioAtualEmail } = context;
  if (usuario === undefined) usuario = getUsuarioAtual();
  if (flags === undefined) flags = getStorefrontRuntimeFlags(context);
  const email = normalizarEmail(usuario?.email || usuarioAtualEmail || syncConfig.supabaseEmail || "");
  const permitidos = new Set([
    "neprintshop9790@gmail.com",
    "teste@simplifica3d.local",
    "storefront@simplifica3d.local"
  ]);
  if (isSuperAdmin(usuario)) return true;
  if (flags.betaAllowedByRemote) return true;
  return (flags.enabledByEnv || flags.devOverride) && permitidos.has(email);
}

function aplicarRegraPublicacaoLojaLocal({ silent = true } = {}, context = {}) {
  const { STOREFRONT_PUBLICATION_STATUS, getStorefrontAdminStoreLocal, getStorefrontPublicationAccess, getStorefrontPublicationStatus, isStorefrontPubliclyAccessible, mostrarToast, registrarStorefrontActivity, storefrontAdminSaveStore } = context;
  const store = getStorefrontAdminStoreLocal();
  const access = getStorefrontPublicationAccess();
  const currentStatus = getStorefrontPublicationStatus(store, access);
  if (store.active !== true || isStorefrontPubliclyAccessible(store, access)) {
    if (currentStatus && store.publication_status !== currentStatus && !store.__demo) {
      storefrontAdminSaveStore({ ...store, publication_status: currentStatus });
    }
    return { changed: false, store, access, status: currentStatus };
  }
  const suspendedAt = new Date().toISOString();
  const next = {
    ...store,
    active: false,
    publication_status: access.status,
    publicationSuspendedReason: access.reason,
    publication_suspended_reason: access.reason,
    publicationSuspendedAt: suspendedAt,
    publication_suspended_at: suspendedAt
  };
  storefrontAdminSaveStore(next);
  registrarStorefrontActivity(
    access.status === STOREFRONT_PUBLICATION_STATUS.SUSPENDED_PAYMENT
      ? "Loja desativada por assinatura inativa"
      : "Loja desativada por alteração de plano",
    next.slug || "loja"
  );
  if (!silent) mostrarToast(access.internalMessage, "info", 5200);
  return { changed: true, store: next, access, status: access.status };
}

function canAccessStorefrontAdmin(usuario, plan, flags, context = {}) {
  const { getPlanoAtual, getUsuarioAtual } = context;
  if (usuario === undefined) usuario = getUsuarioAtual();
  if (plan === undefined) plan = getPlanoAtual(usuario);
  if (flags === undefined) flags = getStorefrontRuntimeFlags(context);
  if (!usuario) {
    registrarStorefrontDebugLeve("sessao_perdida", "Acesso ao admin da loja sem usuário autenticado.", undefined, context);
    return false;
  }
  // Fase atual: editor liberado para qualquer usuário autenticado.
  return true;
}

function canUseStorefrontLocal(usuario, context = {}) {
  const { getPlanoAtual, getUsuarioAtual } = context;
  if (usuario === undefined) usuario = getUsuarioAtual();
  return canAccessStorefrontAdmin(usuario, getPlanoAtual(usuario), getStorefrontRuntimeFlags(context), context);
}

async function sincronizarStorefrontBetaAccessRemoto(force = false, context = {}) {
  const { getUsuarioAtual, mostrarToast, normalizarEmail, renderApp, storefrontAdminRemoteReady, storefrontAdminRequest, syncConfig, telaAtual } = context;
  const usuario = getUsuarioAtual();
  if (!usuario || !storefrontAdminRemoteReady()) return;
  const cache = getStorefrontBetaAccessCache(context);
  if (!force && cache.updatedAt && Date.now() - Date.parse(cache.updatedAt) < 180000) return;
  try {
    const userId = encodeURIComponent(syncConfig.supabaseUserId || "");
    const email = encodeURIComponent(normalizarEmail(usuario.email || syncConfig.supabaseEmail || ""));
    if (!userId && !email) return;
    const query = `/rest/v1/storefront_beta_users?select=id,user_id,email,enabled&enabled=eq.true&or=(user_id.eq.${userId},email.eq.${email})&limit=1`;
    const rows = await storefrontAdminRequest(query, { timeoutMs: 7000 });
    const allowed = Array.isArray(rows) && rows.some((row) => row?.enabled === true);
    setStorefrontBetaAccessCache({ enabled: allowed, allowed }, context);
    if (allowed && telaAtual !== "lojaOnline") renderApp();
  } catch (error) {
    if (/storefront_beta_users|schema cache|PGRST205/i.test(String(error?.message || error))) {
      setStorefrontBetaAccessCache({ enabled: false, allowed: false, schemaMissing: true }, context);
      return;
    }
    if (force) mostrarToast("Não foi possível validar o acesso da Loja Online agora.", "erro", 3600);
    console.warn("[Storefront admin] beta access check failed", error);
  }
}
  const api = Object.freeze({ isStorefrontTruthy, getStorefrontBetaAccessCache, setStorefrontBetaAccessCache, isStorefrontDevOverrideEnabled, getStorefrontRuntimeFlags, isStorefrontFeatureEnabled, registrarStorefrontDebugLeve, setStorefrontUploadStatus, clearStorefrontUploadStatus, getStorefrontUploadStatus, renderStorefrontUploadStatus, isStorefrontAllowedTestUser, aplicarRegraPublicacaoLojaLocal, canAccessStorefrontAdmin, canUseStorefrontLocal, sincronizarStorefrontBetaAccessRemoto });
  global.SimplificaStorefrontAccess = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
