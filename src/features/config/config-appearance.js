(function attachConfigAppearance(global) {
  "use strict";

const previewsImagemPersonalizacao = new WeakMap();


function normalizarPdfTheme(valor, context = {}) {
  const { appConfig } = context;
  if (valor === undefined) valor = appConfig.pdfTheme || appConfig.pdfStyle || "clean_white";
  const tema = String(valor || "").trim().toLowerCase();
  if (["brand", "clean", "modern_dark", "neon_dark", "compact_business"].includes(tema)) return "clean_white";
  return "clean_white";
}

function normalizarPreferenciaTemaInterface(mode = "light", context = {}) {
  const normalized = String(mode || "").trim().toLowerCase();
  if (normalized === "auto") return "system";
  return ["light", "system", "dark"].includes(normalized) ? normalized : "light";
}

function getEffectiveThemeMode(mode, context = {}) {
  const { appConfig, window } = context;
  if (mode === undefined) mode = appConfig.theme || "light";
  const preference = normalizarPreferenciaTemaInterface(mode, context);
  if (window.SimplificaThemeAuthorityV3?.resolveTheme) {
    return window.SimplificaThemeAuthorityV3.resolveTheme(preference);
  }
  if (preference === "system" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference === "dark" ? "dark" : "light";
}

function getThemePalettes(mode, context = {}) {
  const { THEME_DARK_PALETTES, THEME_LIGHT_PALETTES, appConfig } = context;
  if (mode === undefined) mode = appConfig.theme || "light";
  return getEffectiveThemeMode(mode, context) === "light" ? THEME_LIGHT_PALETTES : THEME_DARK_PALETTES;
}

function getThemePaletteByColor(color, mode, context = {}) {
  const { appConfig } = context;
  if (mode === undefined) mode = appConfig.theme || "light";
  const normalized = limitarCorPdf(color || "", undefined, context).toUpperCase();
  return getThemePalettes(mode, context).find((palette) => (
    String(palette.primary).toUpperCase() === normalized
    || String(palette.accent).toUpperCase() === normalized
    || String(palette.secondary).toUpperCase() === normalized
  ));
}

function normalizarCorTemaControlado(color, mode, kind = "primary", context = {}) {
  const { appConfig } = context;
  if (mode === undefined) mode = appConfig.theme || "light";
  const palettes = getThemePalettes(mode, context);
  const fallback = palettes.find((palette) => String(palette.primary).toUpperCase() === String(appConfig.accentColor || "").toUpperCase()) || palettes[0];
  const normalized = limitarCorPdf(color || "", fallback[kind] || fallback.primary, context).toUpperCase();
  const allowed = palettes
    .flatMap((palette) => kind === "primary" ? [palette.primary] : [palette[kind], palette.secondary, palette.accent])
    .filter(Boolean)
    .map((item) => String(item).toUpperCase());
  if (allowed.includes(normalized)) return normalized;
  return String((fallback && (fallback[kind] || fallback.primary)) || palettes[0].primary).toUpperCase();
}

function getCurrentControlledPalette(mode, primary, context = {}) {
  const { appConfig } = context;
  if (mode === undefined) mode = appConfig.theme || "light";
  if (primary === undefined) primary = appConfig.accentColor || "";
  const palettes = getThemePalettes(mode, context);
  return palettes.find((palette) => String(palette.primary).toUpperCase() === normalizarCorTemaControlado(primary, mode, "primary", context))
    || palettes[0];
}

function getStorefrontControlledTheme(theme = {}, context = {}) {
  const { STOREFRONT_V3_LIGHT_THEME } = context;
  const preference = "light";
  const mode = "light";
  return {
    ...theme,
    preference,
    mode,
    primary: limitarCorPdf(theme.primary || STOREFRONT_V3_LIGHT_THEME.primary, STOREFRONT_V3_LIGHT_THEME.primary, context),
    primaryHover: limitarCorPdf(theme.primaryHover || STOREFRONT_V3_LIGHT_THEME.primaryHover, STOREFRONT_V3_LIGHT_THEME.primaryHover, context),
    selected: limitarCorPdf(theme.selected || STOREFRONT_V3_LIGHT_THEME.selected, STOREFRONT_V3_LIGHT_THEME.selected, context),
    accent: limitarCorPdf(theme.accent || STOREFRONT_V3_LIGHT_THEME.accent, STOREFRONT_V3_LIGHT_THEME.accent, context)
  };
}

function renderThemePaletteButtons({ mode = appConfig.theme || "light", selected = appConfig.accentColor || "", target = "app" } = {}, context = {}) {
  const { appConfig, escaparAttr, escaparHtml } = context;
  const active = normalizarCorTemaControlado(selected, mode, "primary", context);
  return `
    <div class="theme-palette-grid" data-theme-palette="${escaparAttr(target)}">
      ${getThemePalettes(mode, context).map((palette) => `
        <button class="theme-palette-chip ${String(palette.primary).toUpperCase() === active ? "active" : ""}" type="button"
          style="--palette-primary:${escaparAttr(palette.primary)};--palette-secondary:${escaparAttr(palette.secondary)};--palette-surface:${escaparAttr(palette.surface)}"
          onclick="${target === "storefront" ? `selecionarPaletaStorefront('${escaparAttr(palette.id)}')` : `selecionarPaletaTema('${escaparAttr(palette.id)}')`}"
          title="${escaparAttr(palette.label)}">
          <i><b></b></i><span>${escaparHtml(palette.label)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function limitarCorPdf(valor, fallback = "#00d8c8", context = {}) {
  const texto = String(valor || "").trim();
  return /^#[0-9a-f]{6}$/i.test(texto) ? texto : fallback;
}


async function salvarPersonalizacaoRemotaSilencioso(context = {}) {
  const { appConfig, billingConfig, estaOnline, getUsuarioAtual, normalizarAppearanceSettings, registrarDiagnostico, registrarFluxoSalvamento, requisicaoSupabase, syncConfig } = context;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  const userId = syncConfig.supabaseUserId;
  const companyId = billingConfig.companyId || getUsuarioAtual()?.companyId || userId;
  const settings = normalizarAppearanceSettings();
  try {
    const resultados = await Promise.allSettled([
      requisicaoSupabase("/rest/v1/user_profiles?on_conflict=user_id", {
        method: "POST",
        telemetry: false,
        timeoutMs: 12000,
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          display_name: getUsuarioAtual()?.nome || "",
          profile_photo: appConfig.profilePhotoDataUrl || "",
          updated_at: new Date().toISOString()
        })
      }),
      requisicaoSupabase("/rest/v1/company_profiles?on_conflict=user_id,company_id", {
        method: "POST",
        telemetry: false,
        timeoutMs: 12000,
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          company_id: companyId,
          company_name: appConfig.businessName || "",
          company_logo: appConfig.companyLogoDataUrl || appConfig.brandLogoDataUrl || "",
          custom_message: appConfig.customLoginMessage || "",
          updated_at: new Date().toISOString()
        })
      }),
      requisicaoSupabase("/rest/v1/app_customizations?on_conflict=user_id,company_id", {
        method: "POST",
        telemetry: false,
        timeoutMs: 12000,
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          company_id: companyId,
          theme_color: appConfig.accentColor || "#72E6E8",
          secondary_color: settings.secondary_color || "#ff941c",
          background_image: appConfig.pdfBackgroundDataUrl || "",
          login_background: appConfig.loginBackgroundDataUrl || "",
          pdf_watermark: appConfig.brandLogoDataUrl || "",
          company_logo: appConfig.companyLogoDataUrl || "",
          profile_photo: appConfig.profilePhotoDataUrl || "",
          custom_message: appConfig.customLoginMessage || "",
          settings,
          updated_at: new Date().toISOString()
        })
      })
    ]);
    const falhas = resultados.filter((resultado) => resultado.status === "rejected");
    if (falhas.length) {
      throw new Error(falhas.map((falha) => falha.reason?.message || String(falha.reason || "falha")).join(" | "));
    }
    appConfig.customizationSyncPending = false;
    return true;
  } catch (erro) {
    registrarDiagnostico("Personalização", "Persistência remota indisponível", erro.message);
    registrarFluxoSalvamento("Personalização", "Salvar personalização remota", { userId, companyId, tabelas: ["user_profiles", "company_profiles", "app_customizations"] }, erro);
    return false;
  }
}


async function carregarPersonalizacaoRemotaSilencioso(context = {}) {
  const { aplicarLinhaPersonalizacaoRemota, estaOnline, registrarDiagnostico, requisicaoSupabase, syncConfig } = context;
  if (!syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  try {
    const usuarioSolicitante = syncConfig.supabaseUserId;
    const userId = encodeURIComponent(syncConfig.supabaseUserId);
    const linhas = await requisicaoSupabase(`/rest/v1/app_customizations?select=*&user_id=eq.${userId}&order=updated_at.desc&limit=1`, {
      method: "GET",
      telemetry: false
    });
    if (syncConfig.supabaseUserId !== usuarioSolicitante) return false;
    const linha = Array.isArray(linhas) ? linhas[0] : null;
    return aplicarLinhaPersonalizacaoRemota(linha);
  } catch (erro) {
    registrarDiagnostico("Personalização", "Leitura remota indisponível", erro.message);
    return false;
  }
}

async function sincronizarPersonalizacaoInicialSilencioso(context = {}) {
  const { appConfig, salvarDados, salvarPersonalizacaoRemotaSilencioso } = context;
  if (appConfig.customizationSyncPending) {
    const sincronizado = await salvarPersonalizacaoRemotaSilencioso();
    if (sincronizado) {
      appConfig.customizationSyncPending = false;
      salvarDados();
    }
    return false;
  }
  return carregarPersonalizacaoRemotaSilencioso(context);
}

async function salvarPreferenciasBasicasFree(context = {}) {
  const { ERP_THEME_PREFERENCE_STORAGE_KEY, aplicarPersonalizacao, appConfig, document, localStorage, normalizarAppearanceSettings, normalizarPreferenciaTemaInterface, registrarFluxoSalvamento, registrarHistorico, salvarDados, salvarPersonalizacaoRemotaSilencioso } = context;
  appConfig.theme = normalizarPreferenciaTemaInterface(document.getElementById("themeConfig")?.value || appConfig.theme || "light");
  appConfig.motionLevel = document.getElementById("motionLevelConfig")?.value || appConfig.motionLevel || "medium";
  appConfig.compactMode = document.getElementById("compactModeConfig")?.checked ?? !!appConfig.compactMode;
  appConfig.showBrandInHeader = document.getElementById("showBrandInHeaderConfig")?.checked ?? (appConfig.showBrandInHeader !== false);
  appConfig.interfaceDensity = document.getElementById("interfaceDensityConfig")?.value || appConfig.interfaceDensity || "default";
  appConfig.screenFit = document.getElementById("screenFitConfig")?.value || appConfig.screenFit || "auto";
  appConfig.uiScale = Math.max(70, Math.min(140, Number(document.getElementById("uiScaleConfig")?.value || appConfig.uiScale || 100)));
  appConfig.desktopCardMinWidth = Math.max(220, Math.min(560, Number(document.getElementById("desktopCardMinWidthConfig")?.value || appConfig.desktopCardMinWidth || 320)));
  appConfig.desktopMaxWidth = Math.max(900, Math.min(3200, Number(document.getElementById("desktopMaxWidthConfig")?.value || appConfig.desktopMaxWidth || 1480)));
  appConfig.appearanceSettings = normalizarAppearanceSettings({
    ...(appConfig.appearanceSettings || {}),
    theme_mode: appConfig.theme,
    motion_level: appConfig.motionLevel,
    compact_mode: appConfig.compactMode,
    show_brand_in_header: appConfig.showBrandInHeader,
    interface_density: appConfig.interfaceDensity,
    screen_fit: appConfig.screenFit,
    ui_scale: appConfig.uiScale,
    desktop_card_min_width: appConfig.desktopCardMinWidth,
    desktop_max_width: appConfig.desktopMaxWidth
  });
  localStorage.setItem(ERP_THEME_PREFERENCE_STORAGE_KEY, appConfig.theme);
  appConfig.customizationSyncPending = true;
  salvarDados();
  aplicarPersonalizacao();
  const remotoOk = await salvarPersonalizacaoRemotaSilencioso();
  appConfig.customizationSyncPending = !remotoOk;
  salvarDados();
  registrarHistorico("Aparência", "Preferências básicas do Free atualizadas");
  registrarFluxoSalvamento("Aparência", "Salvar preferências básicas", { remotoOk });
  return remotoOk;
}


async function removerLogoMarca(context = {}) {
  const { appConfig, confirm, normalizarAppearanceSettings, registrarFluxoSalvamento, registrarHistorico, renderizarPreservandoScroll, salvarDados, salvarPersonalizacaoRemotaSilencioso } = context;
  if (!confirm("Remover a logo salva do PDF?")) return;
  appConfig.brandLogoDataUrl = "";
  appConfig.appearanceSettings = normalizarAppearanceSettings({
    ...(appConfig.appearanceSettings || {}),
    logo_url: ""
  });
  salvarDados();
  const remotoOk = await salvarPersonalizacaoRemotaSilencioso();
  appConfig.customizationSyncPending = !remotoOk;
  salvarDados();
  registrarHistorico("Personalização", "Logo removida do PDF");
  registrarFluxoSalvamento("Aparência", "Remover logo do PDF", { remotoOk });
  renderizarPreservandoScroll();
}

async function removerFundoPdf(context = {}) {
  const { appConfig, confirm, normalizarAppearanceSettings, registrarFluxoSalvamento, registrarHistorico, renderizarPreservandoScroll, salvarDados, salvarPersonalizacaoRemotaSilencioso } = context;
  if (!confirm("Remover o fundo salvo do PDF?")) return;
  appConfig.pdfBackgroundDataUrl = "";
  appConfig.appearanceSettings = normalizarAppearanceSettings({
    ...(appConfig.appearanceSettings || {}),
    pdf_background: ""
  });
  salvarDados();
  const remotoOk = await salvarPersonalizacaoRemotaSilencioso();
  appConfig.customizationSyncPending = !remotoOk;
  salvarDados();
  registrarHistorico("Personalização", "Fundo do PDF removido");
  registrarFluxoSalvamento("Aparência", "Remover fundo do PDF", { remotoOk });
  renderizarPreservandoScroll();
}


function lerPersonalizacaoCampos(context = {}) {
  const { PlanService, SYSTEM_NAME, appConfig, document, getInterfaceMode, limitarCorPdf, normalizarAppearanceSettings, normalizarCorTemaControlado, normalizarPdfTheme, normalizePhoneBR } = context;
  const acessoMarca = PlanService.podeUsarRecurso("personalizacao");
  const el = (id) => document.getElementById(id);
  const texto = (id, fallback = "") => el(id) ? String(el(id).value || "").trim() : String(fallback || "").trim();
  const textoLivre = (id, fallback = "") => el(id) ? String(el(id).value || "") : String(fallback || "");
  const numero = (id, fallback = 0, { min = -Infinity, max = Infinity, inteiro = false } = {}) => {
    const bruto = el(id) ? el(id).value : fallback;
    const valor = inteiro ? parseInt(bruto, 10) : parseFloat(bruto);
    const normalizado = Number.isFinite(valor) ? valor : Number(fallback) || 0;
    return Math.min(max, Math.max(min, normalizado));
  };
  const marcado = (id, fallback = false) => el(id) ? !!el(id).checked : !!fallback;
  const theme = texto("themeConfig", appConfig.theme || "light") || "light";
  const accentColor = acessoMarca
    ? normalizarCorTemaControlado(texto("accentColorConfig", appConfig.accentColor || "#00BFA6") || "#00BFA6", theme, "primary")
    : normalizarCorTemaControlado(appConfig.accentColor || "#00BFA6", theme, "primary");
  const pdfTheme = normalizarPdfTheme(texto("pdfThemeConfig", appConfig.pdfTheme || appConfig.pdfStyle));
  const pdfHeaderText = acessoMarca
    ? texto("pdfHeaderTextConfig", appConfig.pdfHeaderText || "")
    : (appConfig.pdfHeaderText || "");
  const brandWatermarkEnabled = appConfig.brandWatermarkEnabled !== false;
  const customLoginMessage = acessoMarca
    ? texto("customLoginMessageConfig", appConfig.customLoginMessage || "")
    : (appConfig.customLoginMessage || "");
  const assinaturaPdf = texto("pdfSignatureConfig", appConfig.pdfSignature || appConfig.documentFooter || "");
  const pdfSecondaryColor = limitarCorPdf(texto("pdfSecondaryColorConfig", appConfig.pdfSecondaryColor || "#00d8c8"));
  const quoteValidityDays = numero("quoteValidityDaysConfig", appConfig.quoteValidityDays || 7, { min: 1, max: 90, inteiro: true });
  return {
    appName: texto("appNameConfig", appConfig.appName || SYSTEM_NAME) || SYSTEM_NAME,
    businessName: texto("businessNameConfig", appConfig.businessName || "Minha empresa 3D") || "Minha empresa 3D",
    whatsappNumber: el("whatsappNumberConfig") ? normalizePhoneBR(el("whatsappNumberConfig").value || "") : (appConfig.whatsappNumber || ""),
    companyPhone: texto("companyPhoneConfig", appConfig.companyPhone || ""),
    companyEmail: texto("companyEmailConfig", appConfig.companyEmail || ""),
    companyInstagram: texto("companyInstagramConfig", appConfig.companyInstagram || ""),
    companyCnpj: texto("companyCnpjConfig", appConfig.companyCnpj || ""),
    companyAddress: texto("companyAddressConfig", appConfig.companyAddress || ""),
    companyCityState: texto("companyCityStateConfig", appConfig.companyCityState || ""),
    companyWebsite: texto("companyWebsiteConfig", appConfig.companyWebsite || ""),
    quoteValidityDays,
    paymentTerms: texto("paymentTermsConfig", appConfig.paymentTerms || ""),
    productionDeadlineText: texto("productionDeadlineTextConfig", appConfig.productionDeadlineText || ""),
    pdfDefaultMessage: textoLivre("pdfDefaultMessageConfig", appConfig.pdfDefaultMessage || "").trim(),
    pdfDefaultNotes: textoLivre("pdfDefaultNotesConfig", appConfig.pdfDefaultNotes || "").trim(),
    pdfSignature: assinaturaPdf,
    documentFooter: assinaturaPdf,
    pixKey: texto("pixKeyConfig", appConfig.pixKey || ""),
    pixReceiverName: texto("pixReceiverNameConfig", appConfig.pixReceiverName || ""),
    pixCity: texto("pixCityConfig", appConfig.pixCity || ""),
    pixDescription: texto("pixDescriptionConfig", appConfig.pixDescription || "Pedido Simplifica 3D") || "Pedido Simplifica 3D",
    pixInstruction: texto("pixInstructionConfig", appConfig.pixInstruction || ""),
    brandWatermarkEnabled,
    theme,
    accentColor,
    pdfTheme,
    pdfStyle: pdfTheme,
    pdfSecondaryColor,
    pdfHeaderText,
    customLoginMessage,
    motionLevel: texto("motionLevelConfig", appConfig.motionLevel || "medium") || "medium",
    interfaceMode: getInterfaceMode(),
    appearanceSettings: normalizarAppearanceSettings({
      ...(appConfig.appearanceSettings || {}),
      primary_color: accentColor,
      secondary_color: pdfSecondaryColor,
      pdf_theme: pdfTheme,
      company_phone: texto("companyPhoneConfig", appConfig.companyPhone || ""),
      company_email: texto("companyEmailConfig", appConfig.companyEmail || ""),
      company_instagram: texto("companyInstagramConfig", appConfig.companyInstagram || ""),
      company_cnpj: texto("companyCnpjConfig", appConfig.companyCnpj || ""),
      company_address: texto("companyAddressConfig", appConfig.companyAddress || ""),
      company_city_state: texto("companyCityStateConfig", appConfig.companyCityState || ""),
      company_website: texto("companyWebsiteConfig", appConfig.companyWebsite || ""),
      quote_validity_days: quoteValidityDays,
      payment_terms: texto("paymentTermsConfig", appConfig.paymentTerms || ""),
      production_deadline: texto("productionDeadlineTextConfig", appConfig.productionDeadlineText || ""),
      pdf_default_message: textoLivre("pdfDefaultMessageConfig", appConfig.pdfDefaultMessage || ""),
      pdf_default_notes: textoLivre("pdfDefaultNotesConfig", appConfig.pdfDefaultNotes || ""),
      pdf_signature: assinaturaPdf,
      pix_key: texto("pixKeyConfig", appConfig.pixKey || ""),
      pix_receiver_name: texto("pixReceiverNameConfig", appConfig.pixReceiverName || ""),
      pix_city: texto("pixCityConfig", appConfig.pixCity || ""),
      pix_description: texto("pixDescriptionConfig", appConfig.pixDescription || "Pedido Simplifica 3D"),
      pix_instruction: texto("pixInstructionConfig", appConfig.pixInstruction || ""),
      pdf_background: appConfig.pdfBackgroundDataUrl || "",
      logo_url: appConfig.brandLogoDataUrl || "",
      profile_photo: appConfig.profilePhotoDataUrl || "",
      company_logo: appConfig.companyLogoDataUrl || "",
      login_background: appConfig.loginBackgroundDataUrl || "",
      theme_mode: theme,
      motion_level: texto("motionLevelConfig", appConfig.motionLevel || "medium") || "medium",
      compact_mode: marcado("compactModeConfig", !!appConfig.compactMode),
      show_brand_in_header: marcado("showBrandInHeaderConfig", appConfig.showBrandInHeader !== false),
      interface_density: ["compact", "comfortable"].includes(texto("interfaceDensityConfig", appConfig.interfaceDensity || "default"))
        ? texto("interfaceDensityConfig", appConfig.interfaceDensity || "default")
        : "default",
      screen_fit: texto("screenFitConfig", appConfig.screenFit || "auto") === "manual" ? "manual" : "auto",
      ui_scale: numero("uiScaleConfig", appConfig.uiScale || 100, { min: 70, max: 140 }),
      desktop_card_min_width: numero("desktopCardMinWidthConfig", appConfig.desktopCardMinWidth || 320, { min: 220, max: 560 }),
      desktop_max_width: numero("desktopMaxWidthConfig", appConfig.desktopMaxWidth || 1480, { min: 900, max: 3200 }),
      custom_pdf_enabled: acessoMarca
    }),
    compactMode: marcado("compactModeConfig", !!appConfig.compactMode),
    interfaceDensity: ["compact", "comfortable"].includes(texto("interfaceDensityConfig", appConfig.interfaceDensity || "default"))
      ? texto("interfaceDensityConfig", appConfig.interfaceDensity || "default")
      : "default",
    smartSuggestionsEnabled: marcado("smartSuggestionsEnabledConfig", appConfig.smartSuggestionsEnabled !== false),
    showBrandInHeader: marcado("showBrandInHeaderConfig", !!appConfig.showBrandInHeader),
    defaultMargin: numero("defaultMarginConfig", appConfig.defaultMargin || 100, { min: 0 }),
    defaultEnergy: numero("defaultEnergyConfig", appConfig.defaultEnergy || 0.85, { min: 0 }),
    defaultFilamentCost: numero("defaultFilamentCostConfig", appConfig.defaultFilamentCost || 150, { min: 0 }),
    defaultExtraFee: numero("defaultExtraFeeConfig", appConfig.defaultExtraFee || 0, { min: 0 }),
    defaultPrinterType: texto("defaultPrinterTypeConfig", appConfig.defaultPrinterType || "FDM") || "FDM",
    defaultPrinterModel: texto("defaultPrinterModelConfig", appConfig.defaultPrinterModel || "Ender 3") || "Ender 3",
    defaultMaterial: texto("defaultMaterialConfig", appConfig.defaultMaterial || ""),
    defaultResinCost: numero("defaultResinCostConfig", appConfig.defaultResinCost || 180, { min: 0 }),
    minimumRecommendedMargin: numero("minimumRecommendedMarginConfig", appConfig.minimumRecommendedMargin || 60, { min: 0 }),
    minimumChargedHours: numero("minimumChargedHoursConfig", appConfig.minimumChargedHours || 0, { min: 0 }),
    priceRounding: numero("priceRoundingConfig", appConfig.priceRounding || 0, { min: 0 }),
    defaultLayerHeight: texto("defaultLayerHeightConfig", appConfig.defaultLayerHeight || "0.20mm") || "0.20mm",
    defaultNozzle: texto("defaultNozzleConfig", appConfig.defaultNozzle || "0.4mm") || "0.4mm",
    defaultQualityPreset: texto("defaultQualityPresetConfig", appConfig.defaultQualityPreset || "0.20mm padrão") || "0.20mm padrão",
    calculatorDefaults: {
      ...(appConfig.calculatorDefaults || {}),
      printerType: texto("defaultPrinterTypeConfig", appConfig.defaultPrinterType || appConfig.calculatorDefaults?.printerType || "FDM") || "FDM",
      printerModel: texto("defaultPrinterModelConfig", appConfig.defaultPrinterModel || appConfig.calculatorDefaults?.printerModel || "Ender 3") || "Ender 3",
      materialId: texto("defaultMaterialConfig", appConfig.defaultMaterial || appConfig.calculatorDefaults?.materialId || "")
    },
    screenFit: texto("screenFitConfig", appConfig.screenFit || "auto") === "manual" ? "manual" : "auto",
    uiScale: numero("uiScaleConfig", appConfig.uiScale || 100, { min: 70, max: 140 }),
    desktopCardMinWidth: numero("desktopCardMinWidthConfig", appConfig.desktopCardMinWidth || 320, { min: 220, max: 560 }),
    desktopMaxWidth: numero("desktopMaxWidthConfig", appConfig.desktopMaxWidth || 1480, { min: 900, max: 3200 })
  };
}


function canvasSuportaMime(mime = "image/webp", context = {}) {
  const { document } = context;
  try {
    const canvas = document.createElement("canvas");
    return canvas.toDataURL(mime).startsWith(`data:${mime}`);
  } catch (_) {
    return false;
  }
}

function tamanhoDataUrlBytes(dataUrl = "", context = {}) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Math.round(base64.length * 0.75);
}

function gerarDataUrlOtimizado(canvas, mime, qualidade = 0.82, maxBytes = 500 * 1024, context = {}) {
  const { document } = context;
  let atualCanvas = canvas;
  let atual = "";
  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const q = Math.max(0.55, qualidade - tentativa * 0.05);
    atual = atualCanvas.toDataURL(mime, q);
    if (mime === "image/png" || tamanhoDataUrlBytes(atual, context) <= maxBytes) break;
    if (tentativa >= 4) {
      const menor = document.createElement("canvas");
      menor.width = Math.max(1, Math.round(atualCanvas.width * 0.86));
      menor.height = Math.max(1, Math.round(atualCanvas.height * 0.86));
      menor.getContext("2d")?.drawImage(atualCanvas, 0, 0, menor.width, menor.height);
      atualCanvas = menor;
    }
  }
  return atual;
}

function carregarImagemArquivo(arquivo, context = {}) {
  const { Image } = context;
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();
    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagem inválida"));
    };
    imagem.src = url;
  });
}



async function otimizarImagemPersonalizacao(arquivo, tipo = "brand-logo", context = {}) {
  const { IMAGE_PERSONALIZATION_PRESETS, canvasSuportaMime, carregarImagemArquivo, document, gerarDataUrlOtimizado, tamanhoDataUrlBytes } = context;
  const preset = IMAGE_PERSONALIZATION_PRESETS[tipo] || IMAGE_PERSONALIZATION_PRESETS["brand-logo"];
  if (!arquivo || !String(arquivo.type || "").startsWith("image/")) {
    throw new Error("Escolha uma imagem válida.");
  }
  const imagem = await carregarImagemArquivo(arquivo);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem neste aparelho.");

  if (preset.mode === "contain") {
    const escala = Math.min(preset.width / imagem.naturalWidth, preset.height / imagem.naturalHeight, 1);
    canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  } else {
    canvas.width = preset.width;
    canvas.height = preset.height;
    const escala = Math.max(canvas.width / imagem.naturalWidth, canvas.height / imagem.naturalHeight);
    const sw = canvas.width / escala;
    const sh = canvas.height / escala;
    const sx = Math.max(0, (imagem.naturalWidth - sw) / 2);
    const sy = Math.max(0, (imagem.naturalHeight - sh) / 2);
    ctx.drawImage(imagem, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }

  const originalPng = String(arquivo.type || "").toLowerCase().includes("png");
  const webpOk = canvasSuportaMime("image/webp");
  const mime = webpOk ? "image/webp" : (preset.preserveAlpha && originalPng ? "image/png" : "image/jpeg");
  const dataUrl = gerarDataUrlOtimizado(canvas, mime, preset.quality);
  return {
    dataUrl,
    mime,
    width: canvas.width,
    height: canvas.height,
    sizeKb: Math.max(1, Math.round(tamanhoDataUrlBytes(dataUrl) / 1024)),
    label: preset.label
  };
}

async function prepararPreviewImagemPersonalizacao(input, tipo = "brand-logo", context = {}) {
  const { document, escaparAttr, mostrarToast, temAcessoCompleto, window } = context;
  if (!input) return;
  const request = {};
  previewsImagemPersonalizacao.set(input, request);
  const arquivo = input?.files?.[0];
  const selecaoAtual = () => previewsImagemPersonalizacao.get(input) === request
    && input.files?.[0] === arquivo
    && (!input.id || document.getElementById(input.id) === input);
  if (window.__personalizationImageCache) delete window.__personalizationImageCache[input.id];
  if (!arquivo) {
    delete input.dataset.optimizing;
    previewsImagemPersonalizacao.delete(input);
    return;
  }
  if (!temAcessoCompleto()) {
    mostrarToast("Recurso PRO", "warning", 4200);
    input.value = "";
    delete input.dataset.optimizing;
    previewsImagemPersonalizacao.delete(input);
    return;
  }
  try {
    input.dataset.optimizing = "1";
    const otimizada = await otimizarImagemPersonalizacao(arquivo, tipo, context);
    if (!selecaoAtual()) return;
    window.__personalizationImageCache = window.__personalizationImageCache || {};
    window.__personalizationImageCache[input.id] = { file: arquivo, fileName: arquivo.name, lastModified: arquivo.lastModified, tipo, ...otimizada };
    const dica = document.getElementById("personalizationImageHint");
    if (dica) {
      dica.hidden = false;
      dica.textContent = `Imagem ajustada automaticamente para o melhor tamanho (${otimizada.width}x${otimizada.height}, ${otimizada.sizeKb} KB).`;
    }
    if (tipo === "profile-photo") {
      const preview = document.getElementById("profilePhotoPreview");
      if (preview) preview.innerHTML = `<img src="${escaparAttr(otimizada.dataUrl)}" alt="Foto do usuário">`;
    }
    if (tipo === "company-logo") {
      const preview = document.getElementById("companyLogoPreview");
      if (preview) preview.src = otimizada.dataUrl;
    }
    if (tipo === "brand-logo") {
      const preview = document.getElementById("brandLogoPreview");
      if (preview) preview.src = otimizada.dataUrl;
    }
    mostrarToast("Imagem ajustada automaticamente para o melhor tamanho.", "sucesso", 2600);
  } catch (erro) {
    if (!selecaoAtual()) return;
    console.warn("[Personalização] Falha ao otimizar imagem", erro);
    mostrarToast("Não foi possível usar esta imagem. Escolha outra foto ou arquivo.", "erro", 5200);
    input.value = "";
  } finally {
    if (previewsImagemPersonalizacao.get(input) === request) {
      delete input.dataset.optimizing;
      previewsImagemPersonalizacao.delete(input);
    }
  }
}

async function lerImagemConfiguracao(idInput, valorAtual = "", tipo = "brand-logo", context = {}) {
  const { document, mostrarToast, temAcessoCompleto, window } = context;
  const input = document.getElementById(idInput);
  const arquivo = input?.files?.[0];
  if (!arquivo) return valorAtual || "";
  if (!temAcessoCompleto()) {
    mostrarToast("Recurso PRO", "warning", 4200);
    return valorAtual || "";
  }
  const cache = window.__personalizationImageCache?.[idInput];
  if (cache && cache.file === arquivo && cache.tipo === tipo) {
    return cache.dataUrl || valorAtual || "";
  }
  try {
    const otimizada = await otimizarImagemPersonalizacao(arquivo, tipo, context);
    window.__personalizationImageCache = window.__personalizationImageCache || {};
    window.__personalizationImageCache[idInput] = { file: arquivo, fileName: arquivo.name, lastModified: arquivo.lastModified, tipo, ...otimizada };
    return otimizada.dataUrl || valorAtual || "";
  } catch (erro) {
    mostrarToast("Não foi possível usar esta imagem. Escolha outra foto ou arquivo.", "erro", 5200);
    return valorAtual || "";
  }
}
  const api = Object.freeze({ normalizarPdfTheme, normalizarPreferenciaTemaInterface, getEffectiveThemeMode, getThemePalettes, getThemePaletteByColor, normalizarCorTemaControlado, getCurrentControlledPalette, getStorefrontControlledTheme, renderThemePaletteButtons, limitarCorPdf, salvarPersonalizacaoRemotaSilencioso, carregarPersonalizacaoRemotaSilencioso, sincronizarPersonalizacaoInicialSilencioso, salvarPreferenciasBasicasFree, removerLogoMarca, removerFundoPdf, lerPersonalizacaoCampos, canvasSuportaMime, tamanhoDataUrlBytes, gerarDataUrlOtimizado, carregarImagemArquivo, otimizarImagemPersonalizacao, prepararPreviewImagemPersonalizacao, lerImagemConfiguracao });
  global.SimplificaConfigAppearance = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
