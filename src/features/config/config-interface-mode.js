(function attachConfigInterfaceMode(global) {
  "use strict";


function normalizarInterfaceMode(value = "", context = {}) {
  const { INTERFACE_MODES, INTERFACE_MODE_VALUES } = context;
  const mode = String(value || "").trim().toLowerCase();
  return [INTERFACE_MODES.PROFISSIONAL, INTERFACE_MODE_VALUES.ADVANCED].includes(mode)
    ? INTERFACE_MODES.PROFISSIONAL
    : INTERFACE_MODES.SIMPLIFICA;
}

function getInterfaceModeStorageValue(context = {}) {
  const { INTERFACE_MODE_LEGACY_STORAGE_KEY, INTERFACE_MODE_STORAGE_KEY, localStorage } = context;
  return localStorage.getItem(INTERFACE_MODE_STORAGE_KEY)
    || localStorage.getItem(INTERFACE_MODE_LEGACY_STORAGE_KEY)
    || "";
}

function resolverInterfaceModePreferida(fallback, context = {}) {
  const { INTERFACE_MODES, appConfig } = context;
  if (fallback === undefined) fallback = appConfig?.interfaceMode;
  return normalizarInterfaceMode(getInterfaceModeStorageValue(context) || fallback || INTERFACE_MODES.SIMPLIFICA, context);
}

function serializeInterfaceMode(mode, context = {}) {
  const { INTERFACE_MODES, INTERFACE_MODE_VALUES, getInterfaceMode } = context;
  if (mode === undefined) mode = getInterfaceMode();
  return normalizarInterfaceMode(mode, context) === INTERFACE_MODES.PROFISSIONAL
    ? INTERFACE_MODE_VALUES.ADVANCED
    : INTERFACE_MODE_VALUES.SIMPLE;
}


function getInterfaceMode(context = {}) {
  const { INTERFACE_MODES, appConfig, getUsuarioSessaoReal, isModoManutencaoSuperadminAtivo, isSuperAdmin, resolverInterfaceModePreferida } = context;
  if (isSuperAdmin(getUsuarioSessaoReal?.()) && !isModoManutencaoSuperadminAtivo?.()) {
    return INTERFACE_MODES.PROFISSIONAL;
  }
  appConfig.interfaceMode = resolverInterfaceModePreferida(appConfig.interfaceMode);
  return appConfig.interfaceMode;
}

function isSimplificaMode(context = {}) {
  const { INTERFACE_MODES } = context;
  return getInterfaceMode(context) === INTERFACE_MODES.SIMPLIFICA;
}

function isProfissionalMode(context = {}) {
  const { INTERFACE_MODES } = context;
  return getInterfaceMode(context) === INTERFACE_MODES.PROFISSIONAL;
}

function getInterfaceModeLabel(mode, context = {}) {
  const { INTERFACE_MODE_LABELS, normalizarInterfaceMode } = context;
  if (mode === undefined) mode = getInterfaceMode(context);
  return INTERFACE_MODE_LABELS[normalizarInterfaceMode(mode)] || INTERFACE_MODE_LABELS.simplifica;
}

function alternarInterfaceMode(mode, context = {}) {
  const { setInterfaceMode } = context;
  setInterfaceMode(mode);
}


async function salvarPreferenciaModoInterfaceRemota(mode, updatedAt, context = {}) {
  const { INTERFACE_MODE_UPDATED_AT_STORAGE_KEY, estaOnline, getInterfaceMode, getUsuarioAtual, interfaceModePreferenceState, localStorage, registrarDiagnostico, requisicaoSupabase, serializeInterfaceMode, syncConfig } = context;
  if (mode === undefined) mode = getInterfaceMode();
  if (updatedAt === undefined) updatedAt = localStorage.getItem(INTERFACE_MODE_UPDATED_AT_STORAGE_KEY) || new Date().toISOString();
  const userId = String(syncConfig.supabaseUserId || getUsuarioAtual()?.supabaseUserId || "").trim();
  const serializedMode = serializeInterfaceMode(mode);
  if (!userId || !syncConfig.supabaseAccessToken || !estaOnline()) return false;
  if (interfaceModePreferenceState.saving) {
    interfaceModePreferenceState.pendingMode = serializedMode;
    return false;
  }
  interfaceModePreferenceState.saving = true;
  try {
    await requisicaoSupabase("/rest/v1/user_preferences?on_conflict=user_id", {
      method: "POST",
      telemetry: false,
      timeoutMs: 12000,
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        interface_mode: serializedMode,
        updated_at: updatedAt
      })
    });
    interfaceModePreferenceState.loadedUserId = userId;
    return true;
  } catch (erro) {
    registrarDiagnostico("Preferências", "Modo de uso salvo apenas neste aparelho", erro.message, { silent: true });
    return false;
  } finally {
    interfaceModePreferenceState.saving = false;
    const pendingMode = interfaceModePreferenceState.pendingMode;
    interfaceModePreferenceState.pendingMode = "";
    if (pendingMode && pendingMode !== serializedMode) {
      setTimeout(() => salvarPreferenciaModoInterfaceRemota(pendingMode, undefined, context), 0);
    }
  }
}

async function sincronizarPreferenciaModoInterface(context = {}) {
  const { INTERFACE_MODE_UPDATED_AT_STORAGE_KEY, estaOnline, getInterfaceMode, getUsuarioAtual, interfaceModePreferenceState, localStorage, registrarDiagnostico, requisicaoSupabase, serializeInterfaceMode, setInterfaceMode, syncConfig } = context;
  const userId = String(syncConfig.supabaseUserId || getUsuarioAtual()?.supabaseUserId || "").trim();
  if (!userId || !syncConfig.supabaseAccessToken || !estaOnline()) return false;
  if (interfaceModePreferenceState.loading || interfaceModePreferenceState.loadedUserId === userId) return true;
  interfaceModePreferenceState.loading = true;
  try {
    const rows = await requisicaoSupabase(`/rest/v1/user_preferences?select=interface_mode,updated_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`, {
      method: "GET",
      telemetry: false,
      timeoutMs: 12000
    });
    const remoteMode = rows?.[0]?.interface_mode;
    const remoteUpdatedAt = String(rows?.[0]?.updated_at || "");
    const localUpdatedAt = String(localStorage.getItem(INTERFACE_MODE_UPDATED_AT_STORAGE_KEY) || "");
    const remoteTime = Date.parse(remoteUpdatedAt) || 0;
    const localTime = Date.parse(localUpdatedAt) || 0;
    if (remoteMode && serializeInterfaceMode(getInterfaceMode()) !== remoteMode) {
      if (localTime > remoteTime) {
        await salvarPreferenciaModoInterfaceRemota(getInterfaceMode(), localUpdatedAt, context);
      } else {
        setInterfaceMode(remoteMode, {
          render: true,
          notify: false,
          persistRemote: false,
          updatedAt: remoteUpdatedAt || new Date().toISOString()
        });
      }
    } else if (remoteMode && remoteUpdatedAt && remoteTime > localTime) {
      localStorage.setItem(INTERFACE_MODE_UPDATED_AT_STORAGE_KEY, remoteUpdatedAt);
    } else if (!remoteMode) {
      const nextUpdatedAt = localUpdatedAt || new Date().toISOString();
      localStorage.setItem(INTERFACE_MODE_UPDATED_AT_STORAGE_KEY, nextUpdatedAt);
      await salvarPreferenciaModoInterfaceRemota(getInterfaceMode(), nextUpdatedAt, context);
    }
    interfaceModePreferenceState.loadedUserId = userId;
    return true;
  } catch (erro) {
    registrarDiagnostico("Preferências", "Modo de uso remoto indisponível", erro.message, { silent: true });
    return false;
  } finally {
    interfaceModePreferenceState.loading = false;
  }
}

function abrirSeletorModoInterface(context = {}) {
  const { getInterfaceMode, renderUiIcon, window } = context;
  const mode = getInterfaceMode();
  if (window.UiV3?.Dialog) {
    window.UiV3.Dialog({ title: "Escolher versão da interface", content: `
        <p>Escolha entre a versão simples e a completa. Isso não altera seu plano nem suas permissões.</p>
        <div class="ui3-settings-list" role="radiogroup" aria-label="Modo da interface">
          <button class="interface-mode-option ${mode === "simplifica" ? "active" : ""}" type="button" role="radio" aria-checked="${mode === "simplifica"}" onclick="selecionarModoInterface('simple')">
            <span class="interface-mode-option-icon" aria-hidden="true">${renderUiIcon("home")}</span>
            <span><strong>Versão simples</strong><small>Menus reduzidos e fluxos diretos</small></span>
            <span class="interface-mode-option-check" aria-hidden="true">✓</span>
          </button>
          <button class="interface-mode-option ${mode === "profissional" ? "active" : ""}" type="button" role="radio" aria-checked="${mode === "profissional"}" onclick="selecionarModoInterface('advanced')">
            <span class="interface-mode-option-icon" aria-hidden="true">${renderUiIcon("config")}</span>
            <span><strong>Versão completa</strong><small>Mais filtros, detalhes e ações permitidas</small></span>
            <span class="interface-mode-option-check" aria-hidden="true">✓</span>
          </button>
        </div>
    ` });
  }
}

function selecionarModoInterface(mode, context = {}) {
  const { setInterfaceMode, window } = context;
  window.UiV3?.closeOverlay?.();
  setInterfaceMode(mode);
}

function getFeatureEntry(featureKey = "", context = {}) {
  const { FEATURE_MATRIX } = context;
  return FEATURE_MATRIX[String(featureKey || "")] || null;
}

function getFeatureEntryForScreen(screen = "", context = {}) {
  const { FEATURE_MATRIX } = context;
  return Object.values(FEATURE_MATRIX).find((entry) => Array.isArray(entry.screens) && entry.screens.includes(screen)) || null;
}

function getCurrentPlanSlug(usuario, context = {}) {
  const { billingConfig, getAssinaturaSaas, getUsuarioAtual, normalizarSlugPlano } = context;
  if (usuario === undefined) usuario = getUsuarioAtual();
  const assinatura = getAssinaturaSaas?.(usuario?.clientId || billingConfig.clientId || "") || {};
  return normalizarSlugPlano(assinatura.activePlan || assinatura.planSlug || billingConfig.activePlan || billingConfig.planSlug || usuario?.planSlug || "free");
}

function isPlanAtLeast(current = "free", required = "free", context = {}) {
  const { PLAN_RANK, normalizarSlugPlano } = context;
  const atual = PLAN_RANK[normalizarSlugPlano(current)] ?? 0;
  const necessario = PLAN_RANK[normalizarSlugPlano(required)] ?? 0;
  return atual >= necessario;
}

function isFeatureVisibleByMode(featureKey = "", mode, context = {}) {
  const { getInterfaceMode, normalizarInterfaceMode } = context;
  if (mode === undefined) mode = getInterfaceMode();
  const entry = getFeatureEntry(featureKey, context);
  if (!entry) return true;
  return entry[normalizarInterfaceMode(mode)] !== false;
}

function isFeatureLockedByPlan(featureKey = "", usuario, context = {}) {
  const { getUsuarioAtual, isSuperAdmin } = context;
  if (usuario === undefined) usuario = getUsuarioAtual();
  const entry = getFeatureEntry(featureKey, context);
  if (!entry || !entry.requiredPlan || entry.requiredPlan === "free" || isSuperAdmin(usuario)) return false;
  return !isPlanAtLeast(getCurrentPlanSlug(usuario, context), entry.requiredPlan, context);
}

function isAdvancedFeatureVisible(featureKey = "", options = {}, context = {}) {
  const { getInterfaceMode, getUsuarioAtual } = context;
  return isFeatureVisibleByMode(featureKey, options.mode || getInterfaceMode(), context) && !isFeatureLockedByPlan(featureKey, options.usuario || getUsuarioAtual(), context);
}

function isScreenVisibleInCurrentMode(screen = "", mode, context = {}) {
  const { getInterfaceMode, normalizarInterfaceMode } = context;
  if (mode === undefined) mode = getInterfaceMode();
  const entry = getFeatureEntryForScreen(screen, context);
  if (!entry) return true;
  return entry[normalizarInterfaceMode(mode)] !== false;
}

function showInSimplifica(screenOrFeature = "", context = {}) {
  const entry = getFeatureEntry(screenOrFeature, context) || getFeatureEntryForScreen(screenOrFeature, context);
  return entry ? entry.simplifica !== false : true;
}

function showInProfissional(screenOrFeature = "", context = {}) {
  const entry = getFeatureEntry(screenOrFeature, context) || getFeatureEntryForScreen(screenOrFeature, context);
  return entry ? entry.profissional !== false : true;
}

function shouldShowMenuItem(item = {}, mode, context = {}) {
  const { PRINTER_FEATURE_ENABLED, getInterfaceMode } = context;
  if (mode === undefined) mode = getInterfaceMode();
  if (!item?.tela) return true;
  if (item.tela === "impressoras" && !PRINTER_FEATURE_ENABLED) return false;
  if (item.alwaysVisible) return true;
  if (!isScreenVisibleInCurrentMode(item.tela, mode, context)) return false;
  return true;
}
  const api = Object.freeze({ normalizarInterfaceMode, getInterfaceModeStorageValue, resolverInterfaceModePreferida, serializeInterfaceMode, getInterfaceMode, isSimplificaMode, isProfissionalMode, getInterfaceModeLabel, alternarInterfaceMode, salvarPreferenciaModoInterfaceRemota, sincronizarPreferenciaModoInterface, abrirSeletorModoInterface, selecionarModoInterface, getFeatureEntry, getFeatureEntryForScreen, getCurrentPlanSlug, isPlanAtLeast, isFeatureVisibleByMode, isFeatureLockedByPlan, isAdvancedFeatureVisible, isScreenVisibleInCurrentMode, showInSimplifica, showInProfissional, shouldShowMenuItem });
  global.SimplificaConfigInterfaceMode = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
