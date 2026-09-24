(function attachStorefrontEditor(global) {
  "use strict";



function serializeStorefrontForm(form, context = {}) {
  const data = {};
  if (!form?.elements) return data;
  Array.from(form.elements).forEach((field) => {
    if (!field?.name || field.type === "file" || field.disabled) return;
    if (field.type === "checkbox") data[field.name] = !!field.checked;
    else if (field.type === "radio") {
      if (field.checked) data[field.name] = field.value;
    } else {
      data[field.name] = field.value;
    }
  });
  return data;
}

function getStorefrontSessionRecoveryState(context = {}) {
  const { APP_VERSION, STOREFRONT_ADMIN_KEYS, getStorefrontEditorMode, storefrontAdminStorageGet, window } = context;
  return {
    tab: storefrontAdminStorageGet(STOREFRONT_ADMIN_KEYS.tab) || "overview",
    editorMode: getStorefrontEditorMode(),
    path: window.location.pathname,
    search: window.location.search,
    scrollY: Math.max(0, Math.round(window.scrollY || 0)),
    savedAt: new Date().toISOString(),
    appVersion: APP_VERSION
  };
}

function storefrontFlushAutosaveNow(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, document, getStorefrontDirtyState, location, parseStorefrontAdminRoute, parseStorefrontPublicRoute, storefrontAdminStorageGet, storefrontAdminWrite, telaAtual } = context;
  const form = document.querySelector("#storefrontAppearanceForm, .storefront-form-card form, form.app-form, .sfe-form");
  if (!form) return;
  if (!getStorefrontDirtyState().dirty) return;
  const route = parseStorefrontPublicRoute(location.pathname);
  const adminRoute = parseStorefrontAdminRoute(location.pathname);
  if (!route && !adminRoute && telaAtual !== "lojaAdmin" && telaAtual !== "lojaOnline") return;
  const draft = {
    scope: storefrontAdminStorageGet(STOREFRONT_ADMIN_KEYS.tab) || "general",
    payload: serializeStorefrontForm(form, context),
    recovery: getStorefrontSessionRecoveryState(context)
  };
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.autosave, draft);
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.recovery, draft.recovery);
}

function getStorefrontAutosaveDraft(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, storefrontAdminRead } = context;
  const draft = storefrontAdminRead(STOREFRONT_ADMIN_KEYS.autosave, null);
  if (!draft || typeof draft !== "object" || !draft.recovery?.savedAt) return null;
  return draft;
}

function aplicarStorefrontAutosavePayload(draft, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, getStorefrontAdminStoreLocal, getStorefrontDefaultSlugLocal, normalizarCorTemaControlado, storefrontAdminSaveStore, storefrontAdminStorageRemove, storefrontAdminStorageSet, storefrontAdminWrite } = context;
  if (!draft?.payload || typeof draft.payload !== "object") return false;
  const payload = draft.payload;
  const store = getStorefrontAdminStoreLocal();
  if (draft.scope === "appearance" || draft.scope === "banner") {
    const next = {
      ...store,
      name: payload.storeName?.trim?.() || store.name,
      slug: store.slug || getStorefrontDefaultSlugLocal(),
      description: payload.storeDescription ?? store.description,
      whatsapp: String(payload.storeWhatsApp || store.whatsapp || "").replace(/\D/g, ""),
      instagram: payload.storeInstagram ?? store.instagram,
      logo_url: payload.storeLogoUrl || store.logo_url,
      banner_url: payload.storeBannerUrl || store.banner_url,
      theme_config: {
        ...(store.theme_config || {}),
        primary: normalizarCorTemaControlado(payload.storePrimary || store.theme_config?.primary || "#147F78", "light", "primary"),
        accent: normalizarCorTemaControlado(payload.storeAccent || store.theme_config?.accent || "#4D9CA2", "light", "secondary"),
        mode: "light"
      }
    };
    storefrontAdminSaveStore(next);
    return true;
  }
  if (draft.scope === "product") {
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.editingProductSeed, {
      id: payload.productId || "",
      title: payload.productTitle || "",
      short_description: payload.productShortDescription || "",
      slug: payload.productSlug || "",
      erp_product_id: payload.erpProductId || "",
      category_id: payload.productCategory || "",
      price: payload.productPrice || "",
      compare_price: payload.productComparePrice || "",
      price_mode: payload.productPriceMode || "fixed",
      estimated_production_time: payload.productTime || "",
      stock_mode: payload.productStockMode || "unlimited",
      stock_quantity: payload.productStockQuantity || "",
      show_price: payload.productShowPrice !== false,
      visible: payload.productVisible !== false,
      featured: !!payload.productFeatured,
      is_customizable: payload.productCustomizable !== false,
      description: payload.productDescription || "",
      public_observations: payload.productObservations || ""
    });
    storefrontAdminStorageRemove(STOREFRONT_ADMIN_KEYS.editingProduct);
    return true;
  }
  if (draft.scope === "category") {
    storefrontAdminStorageSet(STOREFRONT_ADMIN_KEYS.editingCategory, payload.categoryId || "");
    return true;
  }
  return false;
}

function restaurarStorefrontAutosaveLocal(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, marcarStorefrontAlteracoesPendentes, mostrarToast, renderApp, storefrontAdminStorageSet, window } = context;
  const draft = getStorefrontAutosaveDraft(context);
  if (!draft) {
    mostrarToast("Nenhum rascunho local encontrado.", "info", 2200);
    return;
  }
  const restored = aplicarStorefrontAutosavePayload(draft, context);
  if (draft.recovery?.tab) storefrontAdminStorageSet(STOREFRONT_ADMIN_KEYS.tab, draft.recovery.tab);
  if (draft.recovery?.editorMode) storefrontAdminStorageSet(STOREFRONT_ADMIN_KEYS.editorMode, draft.recovery.editorMode);
  marcarStorefrontAlteracoesPendentes("Rascunho local recuperado");
  mostrarToast(restored ? "Rascunho local recuperado." : "Sessão de edição recuperada.", "sucesso", 2600);
  renderApp();
  setTimeout(() => window.scrollTo({ top: Number(draft.recovery?.scrollY || 0), behavior: "smooth" }), 80);
}

function descartarStorefrontAutosaveLocal(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, limparStorefrontAlteracoesPendentes, mostrarToast, renderApp, storefrontAdminStorageRemove } = context;
  storefrontAdminStorageRemove(STOREFRONT_ADMIN_KEYS.autosave);
  storefrontAdminStorageRemove(STOREFRONT_ADMIN_KEYS.recovery);
  limparStorefrontAlteracoesPendentes("Rascunho local descartado");
  mostrarToast("Rascunho local descartado.", "info", 2200);
  renderApp();
}

function renderStorefrontRecoveryNotice(context = {}) {
  const { escaparHtml } = context;
  const draft = getStorefrontAutosaveDraft(context);
  if (!draft) return "";
  const when = new Date(draft.recovery.savedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `
    <div class="storefront-recovery-card">
      <strong>Rascunho local encontrado</strong>
      <small>${escaparHtml(when)} • ${escaparHtml(draft.scope || "edição")}</small>
      <div>
        <button type="button" onclick="restaurarStorefrontAutosaveLocal()">Retomar</button>
        <button type="button" onclick="descartarStorefrontAutosaveLocal()">Descartar</button>
      </div>
    </div>
  `;
}

function storefrontQueuePendingAction(type = "draft", payload = {}, context = {}) {
  const { APP_VERSION, STOREFRONT_ADMIN_KEYS, getStorefrontAdminImagesLocal, getStorefrontAdminProductsLocal, getStorefrontAdminStoreLocal, navigator, storefrontAdminIsLocalId, storefrontAdminRead, storefrontAdminWrite } = context;
  if (["category-upsert", "category-order", "product-upsert", "product-image-upload", "store-image-upload"].includes(type)) {
    const store = getStorefrontAdminStoreLocal();
    if (storefrontAdminIsLocalId(store.id, "store-")) storefrontQueuePendingAction("store-upsert", store, context);
  }
  if (type === "product-image-upload") {
    const image = getStorefrontAdminImagesLocal().find((entry) => String(entry.id) === String(payload?.id));
    const product = image ? getStorefrontAdminProductsLocal().find((entry) => String(entry.id) === String(image.product_id)) : null;
    if (product && storefrontAdminIsLocalId(product.id, "prod-")) storefrontQueuePendingAction("product-upsert", product, context);
  }
  const queue = storefrontAdminRead(STOREFRONT_ADMIN_KEYS.offlineQueue, []);
  const next = Array.isArray(queue) ? queue : [];
  const entityId = String(payload?.id || payload?.store_id || payload?.entityId || "");
  const dedupeKey = `${type}:${entityId}`;
  const counterpart = type === "category-delete"
    ? `category-upsert:${entityId}`
    : type === "product-delete"
      ? `product-upsert:${entityId}`
      : type === "image-delete"
        ? `product-image-upload:${entityId}`
        : "";
  const filtered = next.filter((item) => ![dedupeKey, counterpart].includes(String(item?.dedupeKey || "")));
  if ((type === "category-delete" && storefrontAdminIsLocalId(entityId, "cat-")) || (type === "product-delete" && storefrontAdminIsLocalId(entityId, "prod-"))) {
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.offlineQueue, filtered.slice(0, 60));
    return;
  }
  if (type === "image-delete" && storefrontAdminIsLocalId(entityId, "img-")) {
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.offlineQueue, filtered.slice(0, 60));
    return;
  }
  filtered.unshift({
    id: `store-queue-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    payload,
    dedupeKey,
    status: navigator.onLine ? "pending" : "offline",
    createdAt: new Date().toISOString(),
    appVersion: APP_VERSION
  });
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.offlineQueue, filtered.slice(0, 60));
}

function getStorefrontPendingQueue(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, storefrontAdminRead } = context;
  const queue = storefrontAdminRead(STOREFRONT_ADMIN_KEYS.offlineQueue, []);
  return Array.isArray(queue) ? queue.filter((item) => item?.status !== "completed") : [];
}


function renderStorefrontUnsavedChangesModal(context = {}) {
  return `
    <div class="modal-backdrop store-unsaved-backdrop store-editor-v3-portal" data-store-editor-theme="light" role="dialog" aria-modal="true" aria-labelledby="store-unsaved-title">
      <section class="modal-card store-unsaved-modal">
        <div class="modal-header">
          <div>
            <span class="status-badge badge-warning">Alterações não salvas</span>
            <h2 id="store-unsaved-title">Deseja sair sem salvar?</h2>
            <p class="muted">Você tem alterações não salvas nesta parte da loja.</p>
          </div>
          <button class="icon-button" type="button" onclick="cancelarNavegacaoPendenteLoja()" title="Fechar">✕</button>
        </div>
        <div class="store-unsaved-actions">
          <button class="btn secondary" type="button" onclick="cancelarNavegacaoPendenteLoja()">Continuar editando</button>
          <button class="btn" type="button" onclick="salvarENavegarLoja()">Salvar e sair</button>
          <button class="btn ghost danger" type="button" onclick="descartarENavegarLoja()">Sair sem salvar</button>
        </div>
      </section>
    </div>
  `;
}

function descartarENavegarLoja(context = {}) {
  const { concluirNavegacaoPendenteLoja, fecharPopup, limparStorefrontAlteracoesPendentes } = context;
  limparStorefrontAlteracoesPendentes("Alterações descartadas");
  fecharPopup();
  concluirNavegacaoPendenteLoja();
}

function salvarEdicaoVisualAtualLoja(context = {}) {
  const { document, mostrarToast } = context;
  const form = document.querySelector(".sfe-scroll .sfe-form");
  if (form?.requestSubmit) {
    form.requestSubmit();
    return true;
  }
  mostrarToast("Abra uma parte editável da loja antes de salvar.", "aviso", 2600);
  return false;
}

function salvarENavegarLoja(context = {}) {
  const { concluirNavegacaoPendenteLoja, fecharPopup, getStorefrontDirtyState } = context;
  fecharPopup();
  if (!salvarEdicaoVisualAtualLoja(context) && !getStorefrontDirtyState().dirty) concluirNavegacaoPendenteLoja();
}

function abrirContatosProdutoLoja(context = {}) {
  const { abrirStoreVisualPanel, solicitarNavegacaoSeguraLoja } = context;
  return solicitarNavegacaoSeguraLoja(() => abrirStoreVisualPanel("contacts"));
}

function salvarRascunhoProdutoGuiadoLoja(form, context = {}) {
  const { document, getStorefrontProductFormField, salvarProdutoLojaOnline } = context;
  const target = form || document.getElementById("storefrontProductForm");
  if (!target) return false;
  const visible = getStorefrontProductFormField(target, "productVisible");
  const featuredVisible = getStorefrontProductFormField(target, "productFeaturedVisible");
  const featured = getStorefrontProductFormField(target, "productFeatured");
  if (visible) visible.checked = false;
  if (featuredVisible) featuredVisible.checked = false;
  if (featured) featured.checked = false;
  if (target.requestSubmit) target.requestSubmit();
  else salvarProdutoLojaOnline({ preventDefault() {}, target });
  return true;
}

function getRascunhoProdutoGuiadoDoFormulario(form, context = {}) {
  const { document, getStorefrontProductFormField } = context;
  if (form === undefined) form = document.getElementById("storefrontProductForm");
  if (!form) return null;
  const get = (name) => getStorefrontProductFormField(form, name);
  const selectedPriceMode = get("productPriceMode")?.value || "fixed";
  const price = Math.max(0, Number(String(get("productPrice")?.value || "0").replace(",", ".")) || 0);
  const compare = Math.max(0, Number(String((get("productComparePrice")?.value || get("productComparePriceVisible")?.value || "0")).replace(",", ".")) || 0);
  const stockMode = get("productStockMode")?.value || "unlimited";
  const stockQuantityValue = get("productStockQuantity")?.value || get("productStockQuantityVisible")?.value || "";
  const priceMode = selectedPriceMode === "quote" ? "quote" : compare > price ? "promo" : "fixed";
  return {
    id: get("productId")?.value || "",
    title: String(get("productTitle")?.value || "").trim(),
    short_description: String(get("productShortDescription")?.value || "").trim(),
    description: String(get("productDescription")?.value || "").trim(),
    slug: get("productSlug")?.value || "",
    erp_product_id: String(get("erpProductId")?.value || "").trim() || null,
    category_id: get("productCategory")?.value || null,
    price,
    compare_price: priceMode === "promo" && compare > price ? compare : null,
    price_mode: priceMode,
    show_price: !!get("productShowPrice")?.checked,
    visible: !!get("productVisible")?.checked,
    featured: !!(get("productFeaturedVisible")?.checked || get("productFeatured")?.checked),
    is_customizable: !!get("productCustomizable")?.checked,
    estimated_production_time: String(get("productTime")?.value || "").trim(),
    public_observations: String((get("productObservations")?.value || get("productObservationsVisible")?.value || "")).trim(),
    stock_mode: ["unlimited", "manual", "unavailable"].includes(stockMode) ? stockMode : "unlimited",
    stock_quantity: stockMode === "manual" && stockQuantityValue !== "" ? Math.max(0, Number(stockQuantityValue) || 0) : null
  };
}

function preservarRascunhoProdutoGuiadoAtual(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, document, serializeStorefrontForm, storefrontAdminWrite, storefrontScheduleAutosave } = context;
  const draft = getRascunhoProdutoGuiadoDoFormulario(undefined, context);
  if (!draft) return null;
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.editingProductSeed, draft);
  storefrontScheduleAutosave("product", serializeStorefrontForm(document.getElementById("storefrontProductForm")));
  return draft;
}


function salvarStorefrontMobileRapido(context = {}) {
  const { limparStorefrontAlteracoesPendentes, mostrarToast, registrarStorefrontActivity, renderApp } = context;
  limparStorefrontAlteracoesPendentes("Alterações salvas");
  registrarStorefrontActivity("Edição mobile salva", "Ações rápidas do editor mobile confirmadas.");
  mostrarToast("Alterações salvas.", "sucesso", 2200);
  renderApp();
}

function destacarSecaoLojaVisual(section = "", context = {}) {
  const { document, mostrarToast } = context;
  const id = String(section || "").trim();
  document.querySelectorAll(".store-section-editing").forEach((node) => node.classList.remove("store-section-editing"));
  const target = Array.from(document.querySelectorAll("[data-store-section]")).find((node) => String(node.dataset.storeSection || "") === id);
  if (target) {
    target.classList.add("store-section-editing");
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    mostrarToast(`Editando seção: ${id}`, "info", 1800);
  } else {
    mostrarToast("Esta seção ainda está preparada como bloco futuro.", "info", 2400);
  }
}

function setStoreVisualViewport(mode = "desktop", context = {}) {
  const { document } = context;
  const allowed = new Set(["desktop", "tablet", "mobile"]);
  const value = allowed.has(mode) ? mode : "desktop";
  const canvas = document.querySelector(".sfe-workspace__preview");
  if (!canvas) return;
  canvas.dataset.previewSize = value;
  document.querySelectorAll(".sfe-device-switcher button").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewport === value);
  });
}

function informarRecursoFuturoLoja(label = "Este recurso", context = {}) {
  const { mostrarToast } = context;
  mostrarToast(`${label} sera liberado em uma fase futura.`, "info", 2600);
}

function getStorefrontContactConfig(store = {}, context = {}) {
  const contact = store?.theme_config?.contact || {};
  return {
    whatsapp: contact.whatsapp || store.whatsapp || "",
    instagram: contact.instagram || store.instagram || "",
    tiktok: contact.tiktok || "",
    facebook: contact.facebook || "",
    email: contact.email || "",
    address: contact.address || "",
    hours: contact.hours || "",
    whatsapp_message: contact.whatsapp_message || ""
  };
}

async function salvarStorefrontContatos(event, context = {}) {
  const { concluirNavegacaoPendenteLoja, confirmarStorefrontSalvamentoLocal, document, fecharPopup, getStorefrontAdminStoreLocal, limparStorefrontAlteracoesPendentes, mostrarToast, normalizarTelefoneWhatsapp, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, requestSensitiveActionConfirmation, setBotaoLoading, storefrontAdminPersistStoreRemote, storefrontAdminRemoteReady, storefrontAdminSaveStore, storefrontBeginOperation, storefrontEndOperation, storefrontQueuePendingAction } = context;
  event?.preventDefault?.();
  const form = event?.target || document.getElementById("storeContactAdminForm");
  if (!form) return;
  if (!storefrontBeginOperation("storefront-contacts-save")) return;
  const botao = form.querySelector("button[type='submit']");
  try {
    const store = getStorefrontAdminStoreLocal();
    const whatsapp = normalizarTelefoneWhatsapp(form.whatsapp?.value || "");
    if (whatsapp && whatsapp.length < 10) throw new Error("Informe um WhatsApp válido com DDD.");
    const contact = {
      whatsapp,
      instagram: String(form.instagram?.value || "").trim(),
      tiktok: String(form.tiktok?.value || "").trim(),
      facebook: String(form.facebook?.value || "").trim(),
      email: String(form.email?.value || "").trim(),
      address: String(form.address?.value || "").trim(),
      hours: String(form.hours?.value || "").trim(),
      whatsapp_message: String(form.whatsappMessage?.value || "").trim()
    };
    const next = {
      ...store,
      whatsapp: contact.whatsapp,
      instagram: contact.instagram,
      theme_config: {
        ...(store.theme_config || {}),
        contact
      }
    };
    if (!await requestSensitiveActionConfirmation({
      actionLabel: "alterar canais de contato da loja",
      titulo: "Autorizar contatos da loja",
      mensagem: "Confirme sua senha antes de alterar WhatsApp, e-mail, redes sociais ou links públicos da loja.",
      confirmar: "Autorizar contatos",
      cancelar: "Cancelar",
      exigirConfirmacaoVisual: true
    })) return;
    setBotaoLoading(botao, true, "Salvando...");
    storefrontAdminSaveStore(next);
    let syncPending = false;
    if (storefrontAdminRemoteReady()) {
      try {
        await storefrontAdminPersistStoreRemote(next);
      } catch (syncError) {
        syncPending = true;
        storefrontQueuePendingAction("store-upsert", next);
        registrarStorefrontDebugLeve("persistencia_falhou", "Contatos salvos localmente e aguardando sincronização.", { message: syncError?.message || String(syncError) });
      }
    } else {
      syncPending = true;
      storefrontQueuePendingAction("store-upsert", next);
    }
    limparStorefrontAlteracoesPendentes(syncPending ? "Contatos salvos; atualização online automática" : "Contatos salvos");
    registrarStorefrontActivity("Contatos atualizados", "Canais de atendimento da loja foram salvos.");
    if (syncPending) confirmarStorefrontSalvamentoLocal("Contatos salvos neste aparelho.");
    else mostrarToast("Contatos da loja salvos.", "sucesso", 3000);
    fecharPopup();
    renderApp();
    concluirNavegacaoPendenteLoja();
  } catch (error) {
    mostrarToast("Não foi possível salvar os contatos agora.", "erro", 4200);
    registrarStorefrontDebugLeve("save_falhou", "Falha ao salvar contatos da loja.", { message: error?.message || String(error) });
  } finally {
    setBotaoLoading(botao, false);
    storefrontEndOperation("storefront-contacts-save");
  }
}

function abrirStoreVisualPanel(area = "overview", context = {}) {
  const { fecharPopup, getStorefrontPublicMode, getStorefrontPublicViewModel, mostrarToast, selecionarItemLojaVisual } = context;
  const vm = getStorefrontPublicViewModel();
  if (!getStorefrontPublicMode(vm).admin) return mostrarToast("Modo admin não autorizado.", "erro", 3200);
  const target = {
    products: "products",
    categories: "categories",
    contacts: "contacts",
    banner: "banner",
    theme: "identity",
    templates: "identity",
    publish: "checklist"
  }[String(area || "")] || "overview";
  fecharPopup();
  selecionarItemLojaVisual(target);
}



function getStorefrontPublicVisualV3(context = {}) {
  const { window } = context;
  const renderer = window.SimplificaStorefrontVisualV3?.public;
  if (!renderer) throw new Error("Loja publica visual V3 nao carregada.");
  return renderer;
}
function renderStorefrontV3HeaderMenu(vm, context = {}) { return getStorefrontPublicVisualV3(context).headerMenu(vm); }
function renderStorefrontV3Root(vm, content = "", context = {}) { return getStorefrontPublicVisualV3(context).root(vm, content); }
function renderStorefrontV3BottomNav(vm, context = {}) { return getStorefrontPublicVisualV3(context).bottomNav(vm); }
function renderStorefrontV3Home(vm, context = {}) { return getStorefrontPublicVisualV3(context).home(vm); }
function renderStorefrontV3Hero(vm, context = {}) { return getStorefrontPublicVisualV3(context).hero(vm); }
function renderStorefrontV3Benefits(context = {}) { return getStorefrontPublicVisualV3(context).benefits(); }
function renderStorefrontV3Categories(vm, context = {}) { return getStorefrontPublicVisualV3(context).categories(vm); }
function renderStorefrontV3CategoryCard(vm, category = {}, context = {}) { return getStorefrontPublicVisualV3(context).categoryCard(vm, category); }
function renderStorefrontV3ProductSection(vm, products = [], title = "Produtos", subtitle = "", context = {}) { return getStorefrontPublicVisualV3(context).productSection(vm, products, title, subtitle); }
function renderStorefrontV3ProductCard(vm, product = {}, context = {}) { return getStorefrontPublicVisualV3(context).productCard(vm, product); }
function renderStorefrontV3ProductPage(vm, product = {}, context = {}) { return getStorefrontPublicVisualV3(context).productPage(vm, product); }
function renderStorefrontV3CategoriesPage(vm, context = {}) { return getStorefrontPublicVisualV3(context).categoriesPage(vm); }
function renderStorefrontV3CategoryPage(vm, category = {}, context = {}) { return getStorefrontPublicVisualV3(context).categoryPage(vm, category); }
function renderStorefrontV3Contact(vm, context = {}) { return getStorefrontPublicVisualV3(context).contact(vm); }
function renderStorefrontV3EmptyState(title, description, label, action, context = {}) { return getStorefrontPublicVisualV3(context).emptyState(title, description, label, action); }


function fecharNavegacaoContextualLojaSeExistir(context = {}) {
  const { document, fecharPainelEdicaoGuiadaLoja, storefrontGuidedPanelOpen } = context;
  if (storefrontGuidedPanelOpen || document.querySelector(".sfe-shell--mobile")) {
    fecharPainelEdicaoGuiadaLoja();
    return true;
  }
  const headerMenu = document.querySelector(".sfv3-menu[open]");
  if (headerMenu) {
    headerMenu.removeAttribute("open");
    return true;
  }
  return false;
}

function navegarVoltarLojaSeguroInterno(ignoreDirty = false, context = {}) {
  const { abrirLojaPublicaAdminContextual, getStorefrontAdminStoreLocal, getStorefrontDirtyState, getStorefrontPublicMode, getStorefrontPublicRoute, getStorefrontPublicRoutePath, navegarLojaPublica, solicitarNavegacaoSeguraLoja, storefrontPublicInternalHistory, telaAtual, trocarTela } = context;
  const editingStorefront = telaAtual === "lojaAdmin" || (telaAtual === "lojaPublica" && getStorefrontPublicMode().admin);
  if (!ignoreDirty && editingStorefront && getStorefrontDirtyState().dirty) {
    solicitarNavegacaoSeguraLoja(() => navegarVoltarLojaSeguroInterno(true, context));
    return true;
  }
  if (telaAtual === "lojaAdmin") {
    abrirLojaPublicaAdminContextual({
      slug: getStorefrontAdminStoreLocal().slug || "ne3d-teste",
      view: "home"
    });
    return true;
  }
  if (telaAtual !== "lojaPublica") return false;

  const previousPath = storefrontPublicInternalHistory.pop();
  if (previousPath) {
    navegarLojaPublica(previousPath, { replace: true, restoreScroll: true });
    return true;
  }

  const route = getStorefrontPublicRoute();
  if (String(route.view || "home") !== "home") {
    navegarLojaPublica(getStorefrontPublicRoutePath({ slug: route.slug, view: "home" }), {
      replace: true,
      restoreScroll: true
    });
    return true;
  }

  trocarTela("lojaOnline", {
    resetStack: true,
    skipStack: true,
    replaceHistory: true
  });
  return true;
}
  const api = Object.freeze({ serializeStorefrontForm, getStorefrontSessionRecoveryState, storefrontFlushAutosaveNow, getStorefrontAutosaveDraft, aplicarStorefrontAutosavePayload, restaurarStorefrontAutosaveLocal, descartarStorefrontAutosaveLocal, renderStorefrontRecoveryNotice, storefrontQueuePendingAction, getStorefrontPendingQueue, renderStorefrontUnsavedChangesModal, descartarENavegarLoja, salvarEdicaoVisualAtualLoja, salvarENavegarLoja, abrirContatosProdutoLoja, salvarRascunhoProdutoGuiadoLoja, getRascunhoProdutoGuiadoDoFormulario, preservarRascunhoProdutoGuiadoAtual, salvarStorefrontMobileRapido, destacarSecaoLojaVisual, setStoreVisualViewport, informarRecursoFuturoLoja, getStorefrontContactConfig, salvarStorefrontContatos, abrirStoreVisualPanel, getStorefrontPublicVisualV3, renderStorefrontV3HeaderMenu, renderStorefrontV3Root, renderStorefrontV3BottomNav, renderStorefrontV3Home, renderStorefrontV3Hero, renderStorefrontV3Benefits, renderStorefrontV3Categories, renderStorefrontV3CategoryCard, renderStorefrontV3ProductSection, renderStorefrontV3ProductCard, renderStorefrontV3ProductPage, renderStorefrontV3CategoriesPage, renderStorefrontV3CategoryPage, renderStorefrontV3Contact, renderStorefrontV3EmptyState, fecharNavegacaoContextualLojaSeExistir, navegarVoltarLojaSeguroInterno });
  global.SimplificaStorefrontEditor = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
