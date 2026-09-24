(function attachStorefrontGuided(global) {
  "use strict";



function getStorefrontCategoryDraftState(context = {}) {
  const { storefrontCategoryDraftEnsureState } = context;
  return { ...storefrontCategoryDraftEnsureState };
}

function getCampoCategoriaGuiadaDoFormulario(form, name, context = {}) {
  if (!form) return null;
  return form?.elements?.namedItem?.(name) || form?.[name] || form?.querySelector?.(`[name="${name}"]`) || null;
}

function getRascunhoCategoriaGuiadaDoFormulario(form, context = {}) {
  const { document } = context;
  if (form === undefined) form = typeof document !== "undefined" ? document.querySelector(".sfe-form") : null;
  if (!form) return null;
  const valueOf = (name) => getCampoCategoriaGuiadaDoFormulario(form, name, context)?.value ?? "";
  const checkedOf = (name) => !!getCampoCategoriaGuiadaDoFormulario(form, name, context)?.checked;
  return {
    id: String(valueOf("categoryId") || ""),
    name: String(valueOf("categoryName") || "").trim(),
    slug: String(valueOf("categorySlug") || ""),
    icon: String(valueOf("categoryIcon") || valueOf("categoryIconChoice") || ""),
    order_index: valueOf("categoryOrder") === "" ? null : Number(valueOf("categoryOrder")),
    visible: checkedOf("categoryVisible"),
    imageUrl: String(valueOf("categoryImageUrl") || "")
  };
}

function isCategoriaNovaSemIdLojaOnline(context = {}) {
  const { document, getStorefrontAdminCategoriesLocal, getStorefrontGuidedSelection, storefrontAdminIsLocalId } = context;
  const selection = getStorefrontGuidedSelection();
  if (selection.type !== "category") return false;
  const form = typeof document !== "undefined" ? document.querySelector(".sfe-form") : null;
  const formId = String(getRascunhoCategoriaGuiadaDoFormulario(form, context)?.id || selection.id || "");
  if (!formId || storefrontAdminIsLocalId(formId, "cat-")) return true;
  const found = getStorefrontAdminCategoriesLocal().find((item) => String(item.id) === formId);
  if (!found || found.__demo || found.__template) return true;
  return false;
}


function normalizeStorefrontGuidedStep(value = "", context = {}) {
  const key = String(value || "").toLowerCase();
  if (["price", "preco", "preço", "stock", "estoque"].includes(key)) return 2;
  if (["photos", "foto", "fotos", "image", "imagem", "media"].includes(key)) return 3;
  if (["review", "revisao", "revisão", "display", "exibicao", "exibição"].includes(key)) return 4;
  return 1;
}

function normalizeStorefrontGuidedSelection(input = {}, current = { type: "overview", id: "" }, context = {}) {
  const selection = input.selection && typeof input.selection === "object" ? input.selection : input;
  const targetSection = String(selection.targetSection || selection.section || selection.step || current.targetSection || "").trim();
  const explicitStep = selection.currentStep ?? selection.productStep ?? selection.mobileStep ?? "";
  return {
    type: String(selection.type || current.type || "overview"),
    id: String(selection.id ?? current.id ?? ""),
    entityType: String(selection.entityType || selection.type || current.entityType || ""),
    entityId: String(selection.entityId ?? selection.id ?? current.entityId ?? ""),
    targetSection,
    targetField: String(selection.targetField || selection.fieldId || current.targetField || "").trim(),
    currentStep: Math.max(1, Math.min(4, Number(explicitStep || normalizeStorefrontGuidedStep(targetSection, context)) || 1)),
    mode: String(selection.mode || current.mode || (selection.id || current.id ? "edit" : "edit")),
    source: String(selection.source || current.source || "preview")
  };
}

function getStorefrontGuidedSelection(context = {}) {
  const { storefrontGuidedSelection } = context;
  return storefrontGuidedSelection && typeof storefrontGuidedSelection === "object"
    ? storefrontGuidedSelection
    : { type: "overview", id: "" };
}

function getStorefrontGuidedCatalogState(kind = "products", context = {}) {
  const { storefrontGuidedCatalogState } = context;
  const key = kind === "categories" ? "categories" : "products";
  const current = storefrontGuidedCatalogState[key] || {};
  return {
    query: String(current.query || ""),
    scrollTop: Math.max(0, Number(current.scrollTop || 0)),
    highlightId: String(current.highlightId || "")
  };
}

function patchStorefrontGuidedCatalogState(kind = "products", patch = {}, context = {}) {
  const { storefrontGuidedCatalogState } = context;
  const key = kind === "categories" ? "categories" : "products";
  storefrontGuidedCatalogState[key] = {
    ...getStorefrontGuidedCatalogState(key, context),
    ...(patch && typeof patch === "object" ? patch : {})
  };
  return storefrontGuidedCatalogState[key];
}

function captureStorefrontGuidedCatalogState(kind = "products", context = {}) {
  const { document } = context;
  const key = kind === "categories" ? "categories" : "products";
  const list = document.querySelector(`[data-store-guided-list="${key}"]`);
  if (!list) return;
  patchStorefrontGuidedCatalogState(key, { scrollTop: Math.max(0, Number(list.scrollTop || 0)) }, context);
}

function restoreStorefrontGuidedCatalogState(kind = "products", context = {}) {
  const { CSS, document, requestAnimationFrame } = context;
  const key = kind === "categories" ? "categories" : "products";
  const state = getStorefrontGuidedCatalogState(key, context);
  requestAnimationFrame(() => {
    const list = document.querySelector(`[data-store-guided-list="${key}"]`);
    if (!list) return;
    if (state.scrollTop > 0) {
      try {
        list.scrollTo({ top: state.scrollTop, behavior: "auto" });
      } catch (_) {
        list.scrollTop = state.scrollTop;
      }
    }
    if (state.highlightId && typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      const item = list.querySelector(`[data-store-guided-item-id="${CSS.escape(state.highlightId)}"]`);
      item?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    }
  });
}

function destacarAlvoEdicaoGuiadaLoja(context = {}) {
  const { CSS, document } = context;
  document.querySelectorAll(".storefront-guided-editing-target").forEach((node) => {
    node.classList.remove("storefront-guided-editing-target");
    node.removeAttribute("data-store-editing-label");
  });
  const selection = getStorefrontGuidedSelection(context);
  const escapedId = typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(String(selection.id || ""))
    : String(selection.id || "").replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  const candidates = [];
  if (selection.type === "product" && selection.id) candidates.push(`[data-store-product-id="${escapedId}"]`);
  if (selection.type === "category" && selection.id) candidates.push(`[data-store-category-id="${escapedId}"]`);
  if (selection.type === "banner") candidates.push(".sfv3-hero");
  if (selection.type === "identity") candidates.push(".sfv3-brand");
  if (selection.type === "contacts") candidates.push(".sfv3-contact");
  if (selection.type === "products") candidates.push(".sfv3-product-grid");
  if (selection.type === "categories") candidates.push(".sfv3-category-grid", ".sfv3-category-list");
  const target = candidates.length ? document.querySelector(candidates.join(",")) : null;
  if (!target) return;
  target.classList.add("storefront-guided-editing-target");
  target.setAttribute("data-store-editing-label", "Em edicao");
}

function setStorefrontGuidedCatalogQuery(kind = "products", value = "", context = {}) {
  const { renderizarPreservandoScroll } = context;
  patchStorefrontGuidedCatalogState(kind, { query: String(value || ""), scrollTop: 0 }, context);
  renderizarPreservandoScroll();
  restoreStorefrontGuidedCatalogState(kind, context);
}

function returnToStorefrontGuidedCatalog(kind = "products", options = {}, context = {}) {
  const { renderizarPreservandoScroll, setStorefrontContextualEditorState } = context;
  const key = kind === "categories" ? "categories" : "products";
  patchStorefrontGuidedCatalogState(key, {
    highlightId: String(options.highlightId || ""),
    scrollTop: Math.max(0, Number(options.scrollTop ?? getStorefrontGuidedCatalogState(key, context).scrollTop) || 0)
  }, context);
  setStorefrontContextualEditorState({
    selection: {
      ...getStorefrontGuidedSelection(context),
      type: key,
      id: "",
      entityType: key,
      entityId: "",
      targetSection: "",
      targetField: "",
      currentStep: 1,
      mode: "list",
      source: options.source || "guided-catalog"
    },
    panelOpen: true
  }, { flushAutosave: false });
  renderizarPreservandoScroll();
  restoreStorefrontGuidedCatalogState(key, context);
}

function openStorefrontGuidedCatalogItem(kind = "products", id = "", options = {}, context = {}) {
  const key = kind === "categories" ? "categories" : "products";
  const type = key === "categories" ? "category" : "product";
  const field = key === "categories" ? "categoryName" : "productTitle";
  const section = key === "categories" ? "category" : "basic";
  captureStorefrontGuidedCatalogState(key, context);
  selecionarItemLojaVisual(type, id, {
    entityType: type,
    entityId: id,
    targetSection: section,
    targetField: field,
    source: options.source || `${type}-catalog`,
    mode: options.mode || (id ? "edit" : "create")
  }, context);
}

function abrirNovoProdutoGuiadoLoja(context = {}) {
  const { redefinirEstadoRascunhoProdutoLojaOnline } = context;
  captureStorefrontGuidedCatalogState("products", context);
  redefinirEstadoRascunhoProdutoLojaOnline();
  selecionarItemLojaVisual("product", "", {
    entityType: "product",
    mode: "create",
    targetSection: "basic",
    targetField: "productTitle",
    source: "guided-product-create"
  }, context);
}

function abrirNovaCategoriaGuiadaLoja(context = {}) {
  const { redefinirEstadoRascunhoCategoriaLojaOnline } = context;
  captureStorefrontGuidedCatalogState("categories", context);
  redefinirEstadoRascunhoCategoriaLojaOnline();
  selecionarItemLojaVisual("category", "", {
    entityType: "category",
    mode: "create",
    targetSection: "category",
    targetField: "categoryName",
    source: "guided-category-create"
  }, context);
}

function voltarFormularioGuiadoProdutoLoja(context = {}) {
  const { isMobile } = context;
  if (isMobile()) {
    returnToStorefrontGuidedCatalog("products", {
      highlightId: String(getStorefrontGuidedSelection(context).id || ""),
      source: "guided-product-back"
    }, context);
    return;
  }
  fecharPainelEdicaoGuiadaLoja(undefined, context);
}

function voltarFormularioGuiadoCategoriaLoja(context = {}) {
  const { isMobile } = context;
  if (isMobile()) {
    returnToStorefrontGuidedCatalog("categories", {
      highlightId: String(getStorefrontGuidedSelection(context).id || ""),
      source: "guided-category-back"
    }, context);
    return;
  }
  fecharPainelEdicaoGuiadaLoja(undefined, context);
}

function getStorefrontContextualEditorState(context = {}) {
  const { getStorefrontDirtyState, getStorefrontPublicMode, getStorefrontPublicRoute, getStorefrontPublicViewModel, storefrontGuidedPanelOpen } = context;
  const vm = getStorefrontPublicViewModel();
  const mode = getStorefrontPublicMode(vm);
  return {
    route: getStorefrontPublicRoute(),
    mode: mode.admin ? "editor" : mode.requested ? "admin-preview" : "client",
    adminRequested: mode.requested,
    admin: mode.admin,
    readonly: mode.readonly,
    panelOpen: !!storefrontGuidedPanelOpen,
    selection: getStorefrontGuidedSelection(context),
    dirty: getStorefrontDirtyState().dirty
  };
}

function isStorefrontContextualEditorRoute(context = {}) {
  const { telaAtual } = context;
  const state = getStorefrontContextualEditorState(context);
  return telaAtual === "lojaPublica" && state.adminRequested;
}

function validarTextoVisualLoja(value = "", limit = 0, label = "texto", context = {}) {
  const text = String(value || "").trim();
  if (limit > 0 && text.length > limit) {
    throw new Error(`Esse ${label} está grande demais para ficar bonito na loja. Use até ${limit} caracteres.`);
  }
  return text;
}

function atualizarPreviewGuiadoLoja(form, context = {}) {
  const { document, formatarMoeda } = context;
  if (!form) return;
  const setText = (selector, value) => {
    const target = document.querySelector(selector);
    if (target && value !== undefined) target.textContent = String(value || "");
  };
  const selection = getStorefrontGuidedSelection(context);
  if (form.storeName) {
    const name = String(form.storeName.value || "").trim();
    setText(".sfv3-brand strong", name);
  }
  if (form.storeBannerTitle) setText(".sfv3-hero h1", form.storeBannerTitle.value);
  if (form.storeBannerSubtitle) setText(".sfv3-hero p", form.storeBannerSubtitle.value);
  if (form.storeBannerCtaLabel) setText(".sfv3-hero button", form.storeBannerCtaLabel.value);
  if (selection.type === "product" && selection.id) {
    const card = Array.from(document.querySelectorAll("[data-store-product-id]"))
      .find((item) => String(item.dataset.storeProductId || "") === String(selection.id));
    if (card) {
      const titleTarget = card.querySelector(".sfv3-product-card strong");
      const descriptionTarget = card.querySelector("p");
      if (titleTarget && form.productTitle) titleTarget.textContent = form.productTitle.value;
      if (descriptionTarget && form.productDescription) descriptionTarget.textContent = form.productDescription.value;
      if (form.productPrice) {
        const price = Math.max(0, Number(String(form.productPrice.value || "0").replace(",", ".")) || 0);
        const priceTarget = card.querySelector(".sfv3-product-card b");
        if (priceTarget) priceTarget.textContent = formatarMoeda(price);
      }
    }
  }
}

function atualizarFormularioGuiadoLoja(form, detail = "Alterações em edição", context = {}) {
  const { marcarStorefrontAlteracoesPendentes, serializeStorefrontForm, storefrontScheduleAutosave } = context;
  marcarStorefrontAlteracoesPendentes(detail);
  const scope = form?.id === "storefrontProductForm"
    ? "product"
    : form?.id === "storeContactAdminForm"
      ? "contacts"
      : String(detail || "").toLowerCase().includes("categoria")
        ? "category"
        : String(detail || "").toLowerCase().includes("banner")
          ? "banner"
          : "appearance";
  storefrontScheduleAutosave(scope, serializeStorefrontForm(form));
  atualizarPreviewGuiadoLoja(form, context);
}

function resolveStorefrontEditorTarget(target = {}, context = {}) {
  const panel = String(target.panel || target.area || "overview");
  const entityId = String(target.entityId || "");
  const entityType = String(target.entityType || "");
  const meta = {
    targetSection: target.targetSection || target.section || target.step || "",
    targetField: target.targetField || target.fieldId || "",
    currentStep: target.currentStep || target.productStep || "",
    mode: target.mode || (entityId ? "edit" : "edit"),
    source: target.source || "completion"
  };
  if (panel === "identity" || panel === "appearance") return { type: "identity", id: "", entityType: "store", ...meta };
  if (panel === "banner") return { type: "banner", id: "", entityType: "store", ...meta };
  if (panel === "contacts") return { type: "contacts", id: "", entityType: "store", ...meta };
  if (panel === "categories") return entityId ? { type: "category", id: entityId, entityType: "category", entityId, ...meta } : { type: "categories", id: "", entityType: "category", ...meta };
  if (panel === "product" || entityType === "product") return entityId ? { type: "product", id: entityId, entityType: "product", entityId, ...meta } : { type: "product", id: "", entityType: "product", mode: "create", ...meta };
  if (panel === "products") return { type: "product", id: "", entityType: "product", mode: "create", ...meta };
  if (panel === "links" || panel === "publish") return { type: "links", id: "", entityType: "store", ...meta };
  return { type: panel || "overview", id: entityId, entityType, entityId, ...meta };
}

function focusStorefrontEditorTarget(fieldId = "", context = {}) {
  const { CSS, document } = context;
  const safeId = String(fieldId || "").trim();
  if (!safeId) return;
  const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(safeId) : safeId.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  const field = document.querySelector(`#${escaped}, [name="${safeId.replace(/"/g, '\\"')}"]`);
  if (!field) return;
  try {
    field.focus?.({ preventScroll: true });
  } catch (_) {
    field.focus?.();
  }
  field.scrollIntoView?.({ block: "center", behavior: "smooth" });
}

function navigateToStorefrontEditorTarget(target = {}, context = {}) {
  const { window } = context;
  const next = resolveStorefrontEditorTarget(target, context);
  selecionarItemLojaVisual(next.type, next.id, next, context);
  window.setTimeout(() => focusStorefrontEditorTarget(next.targetField || target.fieldId, context), 260);
}

function navigateToStorefrontCompletionItem(itemId = "", context = {}) {
  const { getStorefrontCompletion, getStorefrontPublicViewModel } = context;
  const item = getStorefrontCompletion(getStorefrontPublicViewModel()).items.find((entry) => String(entry.id) === String(itemId));
  if (!item) return selecionarItemLojaVisual("overview", undefined, undefined, context);
  navigateToStorefrontEditorTarget(item.target || { panel: item.area }, context);
}

function abrirChecklistGuiadoLoja(context = {}) {
  selecionarItemLojaVisual("checklist", undefined, undefined, context);
}

function ocultarExemploLojaVisual(id = "", context = {}) {
  const { STOREFRONT_ADMIN_KEYS, limparStorefrontAlteracoesPendentes, mostrarToast, renderApp, setStorefrontContextualEditorState, storefrontAdminRead, storefrontAdminWrite } = context;
  const exampleId = String(id || "").trim();
  if (!exampleId) return;
  const dismissed = new Set(storefrontAdminRead(STOREFRONT_ADMIN_KEYS.dismissedExamples, []));
  dismissed.add(exampleId);
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.dismissedExamples, Array.from(dismissed));
  setStorefrontContextualEditorState({ type: "overview", id: "", panelOpen: false }, { flushAutosave: false });
  limparStorefrontAlteracoesPendentes("Exemplo removido");
  mostrarToast("Item de exemplo removido da sua preparação.", "sucesso", 2600);
  renderApp();
}

function restaurarExemplosLojaVisual(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, mostrarToast, renderApp, setStorefrontContextualEditorState, storefrontAdminStorageRemove } = context;
  storefrontAdminStorageRemove(STOREFRONT_ADMIN_KEYS.dismissedExamples);
  setStorefrontContextualEditorState({ type: "overview", id: "", panelOpen: false }, { flushAutosave: false });
  mostrarToast("Exemplos de Impressão 3D restaurados.", "sucesso", 2600);
  renderApp();
}

function alinharSelecaoLojaVisual(context = {}) {
  const { APP_LAYER_IDS, document, isMobile, storefrontGuidedPanelOpen } = context;
  const scroller = document.getElementById(APP_LAYER_IDS.content);
  const candidates = Array.from(document.querySelectorAll(".sfv3 [data-store-product-id],.sfv3-hero,.sfv3-category-card"));
  if (!scroller || !candidates.length) return;

  const scrollerRect = scroller.getBoundingClientRect();
  const visibleCenter = scrollerRect.top + (scroller.clientHeight / 2);
  const target = candidates.reduce((closest, candidate) => {
    const rect = candidate.getBoundingClientRect();
    const distance = Math.abs((rect.top + (rect.height / 2)) - visibleCenter);
    return !closest || distance < closest.distance ? { candidate, distance } : closest;
  }, null)?.candidate;
  if (!target) return;

  const targetRect = target.getBoundingClientRect();
  const topbar = document.querySelector(".sfe-desktop-topbar");
  const topbarHeight = Math.max(0, Number(topbar?.getBoundingClientRect().height) || 0);
  const mobilePanel = isMobile() && storefrontGuidedPanelOpen
    ? document.querySelector(".sfe-shell--mobile")
    : null;
  const mobileActions = isMobile() ? document.querySelector(".sfe-mobile-actions") : null;
  const mobilePanelHeight = Math.min(scroller.clientHeight * 0.72, Number(mobilePanel?.getBoundingClientRect().height) || 0);
  const mobileActionsHeight = Math.min(scroller.clientHeight * 0.18, Number(mobileActions?.getBoundingClientRect().height) || 0);
  const visibleTop = scrollerRect.top + topbarHeight;
  const visibleHeight = Math.max(132, scroller.clientHeight - topbarHeight - mobilePanelHeight - mobileActionsHeight - 14);
  const targetHeight = Math.min(targetRect.height, visibleHeight * 0.78);
  const desiredTop = visibleTop + Math.max(12, (visibleHeight - targetHeight) / 2);
  const nextTop = Math.max(0, Math.min(
    scroller.scrollHeight - scroller.clientHeight,
    scroller.scrollTop + targetRect.top - desiredTop
  ));

  try {
    scroller.scrollTo({ top: nextTop, behavior: "smooth" });
  } catch (_) {
    scroller.scrollTop = nextTop;
  }
}

function selecionarItemLojaVisual(type = "overview", id = "", options = {}, context = {}) {
  const { document, isMobile, mostrarToast, renderizarPreservandoScroll, requestAnimationFrame, setStorefrontContextualEditorState, window } = context;
  const select = () => {
    const nextSelection = normalizeStorefrontGuidedSelection({ type, id, ...options }, getStorefrontGuidedSelection(context), context);
    setStorefrontContextualEditorState({ selection: nextSelection, panelOpen: true });
    if (getStorefrontGuidedSelection(context).type === "overview" && isMobile()) {
      mostrarToast("Toque em uma parte da loja para editar.", "info", 2400);
    }
    renderizarPreservandoScroll();
    requestAnimationFrame(() => {
      const panel = document.querySelector(".sfe-scroll");
      try {
        panel?.focus?.({ preventScroll: true });
      } catch (_) {
        panel?.focus?.();
      }
      const selection = getStorefrontGuidedSelection(context);
      if (selection.targetField) window.setTimeout(() => focusStorefrontEditorTarget(selection.targetField, context), 80);
      requestAnimationFrame(() => requestAnimationFrame((...__args) => alinharSelecaoLojaVisual(context)));
      requestAnimationFrame(() => requestAnimationFrame((...__args) => destacarAlvoEdicaoGuiadaLoja(context)));
      window.setTimeout((...__args) => alinharSelecaoLojaVisual(context), 180);
      window.setTimeout((...__args) => destacarAlvoEdicaoGuiadaLoja(context), 180);
    });
  };
  select();
}

function setStorefrontGuidedProductStep(step = 1, context = {}) {
  const { STOREFRONT_V3_PRODUCT_STEPS, garantirRascunhoProdutoLojaOnline, isProdutoNovoSemIdLojaOnline, preservarRascunhoProdutoGuiadoAtual, renderizarPreservandoScroll, requestAnimationFrame, setStorefrontContextualEditorState, validarEtapaProdutoLojaOnline } = context;
  const current = getStorefrontGuidedSelection(context);
  const nextStep = Math.max(1, Math.min(4, Number(step) || 1));
  const targetSection = STOREFRONT_V3_PRODUCT_STEPS.find((item) => item.step === nextStep)?.key || "basic";
  if (current.type === "product") preservarRascunhoProdutoGuiadoAtual();
  const needsProductDraft = nextStep === 3 && isProdutoNovoSemIdLojaOnline();
  if (needsProductDraft && !validarEtapaProdutoLojaOnline(1)) return;
  setStorefrontContextualEditorState({
    selection: {
      ...current,
      type: current.type === "product" ? "product" : current.type,
      currentStep: nextStep,
      targetSection,
      targetField: nextStep === 2 ? "productPrice" : nextStep === 3 ? "productPhoto" : nextStep === 4 ? "productVisible" : "productTitle"
    },
    panelOpen: true
  }, { flushAutosave: false });
  renderizarPreservandoScroll();
  requestAnimationFrame(() => {
    focusStorefrontEditorTarget(nextStep === 2 ? "productPrice" : nextStep === 3 ? "productPhoto" : nextStep === 4 ? "productVisible" : "productTitle", context);
    requestAnimationFrame((...__args) => alinharSelecaoLojaVisual(context));
    requestAnimationFrame((...__args) => destacarAlvoEdicaoGuiadaLoja(context));
  });
  if (needsProductDraft) garantirRascunhoProdutoLojaOnline().catch(() => {});
}

function manterCampoEditorGuiadoVisivel(event, context = {}) {
  const { window } = context;
  const field = event?.target;
  if (!field?.closest?.(".sfe-form")) return;
  window.setTimeout(() => {
    const scroller = field.closest(".sfe-fields") || field.closest(".sfe-scroll");
    if (!scroller) return;
    try {
      field.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    } catch (_) {
      const fieldRect = field.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      scroller.scrollTop += fieldRect.top - scrollRect.top - Math.max(24, scrollRect.height * 0.32);
    }
  }, 90);
}

function fecharPainelEdicaoGuiadaLoja(options = {}, context = {}) {
  const { renderApp, setStorefrontContextualEditorState, solicitarNavegacaoSeguraLoja } = context;
  solicitarNavegacaoSeguraLoja(() => {
    setStorefrontContextualEditorState({
      selection: { type: "overview", id: "", entityType: "store", entityId: "", targetSection: "", targetField: "" },
      panelOpen: false
    }, {
      flushAutosave: false,
      syncHistory: options.syncHistory !== false
    });
    renderApp();
  });
}

function voltarPainelLojaVisual(event = null, context = {}) {
  const { solicitarNavegacaoSeguraLoja, storefrontGuidedPanelOpen, trocarTela } = context;
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (isStorefrontContextualEditorRoute(context) && storefrontGuidedPanelOpen) {
    fecharPainelEdicaoGuiadaLoja(undefined, context);
    return;
  }
  solicitarNavegacaoSeguraLoja(() => trocarTela("lojaOnline"));
}

function configurarTecladoEditorLojaV3(context = {}) {
  const { document, elementoEditavelOperacional, window } = context;
  if (window.__storefrontEditorKeyboardV3Configured) return;
  window.__storefrontEditorKeyboardV3Configured = true;
  document.addEventListener("keydown", (event) => {
    const editorAtivo = document.querySelector(".sfe-shell, .sfe-form, .storefront-editor");
    if (!editorAtivo) return;
    const alvoEditavel = elementoEditavelOperacional(event.target);
    const voltar = event.key === "Escape" || (event.altKey && event.key === "ArrowLeft");
    if (!voltar || (alvoEditavel && event.key !== "Escape")) return;
    event.preventDefault();
    event.stopPropagation();
    voltarPainelLojaVisual(event, context);
  }, true);
}
  const api = Object.freeze({ getStorefrontCategoryDraftState, getCampoCategoriaGuiadaDoFormulario, getRascunhoCategoriaGuiadaDoFormulario, isCategoriaNovaSemIdLojaOnline, normalizeStorefrontGuidedStep, normalizeStorefrontGuidedSelection, getStorefrontGuidedSelection, getStorefrontGuidedCatalogState, patchStorefrontGuidedCatalogState, captureStorefrontGuidedCatalogState, restoreStorefrontGuidedCatalogState, destacarAlvoEdicaoGuiadaLoja, setStorefrontGuidedCatalogQuery, returnToStorefrontGuidedCatalog, openStorefrontGuidedCatalogItem, abrirNovoProdutoGuiadoLoja, abrirNovaCategoriaGuiadaLoja, voltarFormularioGuiadoProdutoLoja, voltarFormularioGuiadoCategoriaLoja, getStorefrontContextualEditorState, isStorefrontContextualEditorRoute, validarTextoVisualLoja, atualizarPreviewGuiadoLoja, atualizarFormularioGuiadoLoja, resolveStorefrontEditorTarget, focusStorefrontEditorTarget, navigateToStorefrontEditorTarget, navigateToStorefrontCompletionItem, abrirChecklistGuiadoLoja, ocultarExemploLojaVisual, restaurarExemplosLojaVisual, alinharSelecaoLojaVisual, selecionarItemLojaVisual, setStorefrontGuidedProductStep, manterCampoEditorGuiadoVisivel, fecharPainelEdicaoGuiadaLoja, voltarPainelLojaVisual, configurarTecladoEditorLojaV3 });
  global.SimplificaStorefrontGuided = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
