(function attachStorefrontAdminRender(global) {
  "use strict";



async function alterarStatusLeadLojaOnline(id, status, context = {}) {
  const { getStorefrontPreviewLeadsLocal, mostrarToast, renderApp, storefrontAdminIsLocalId, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminWrite } = context;
  try {
    if (storefrontAdminRemoteReady() && !storefrontAdminIsLocalId(id)) {
      await storefrontAdminRequest(`/rest/v1/store_cart_leads?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status })
      });
    }
    const leads = getStorefrontPreviewLeadsLocal().map((lead) => String(lead.id) === String(id) ? { ...lead, status } : lead);
    storefrontAdminWrite("simplifica-storefront-leads-preview-v1", leads);
    mostrarToast("Status do lead atualizado.", "sucesso");
    renderApp();
  } catch (error) {
    mostrarToast("Não foi possível atualizar o lead.", "erro", 3600);
    console.error("[Storefront admin] alterar lead", error);
  }
}

function abrirWhatsAppLeadLojaOnline(id, context = {}) {
  const { getStorefrontAdminStoreLocal, getStorefrontPreviewLeadsLocal, mostrarToast, window } = context;
  const lead = getStorefrontPreviewLeadsLocal().find((item) => String(item.id) === String(id));
  const phone = String(lead?.customer_phone || getStorefrontAdminStoreLocal().whatsapp || "").replace(/\D/g, "");
  const msg = lead?.whatsapp_message || `Olá! Sobre o pedido da loja ${getStorefrontAdminStoreLocal().name}.`;
  if (!phone) return mostrarToast("WhatsApp não configurado para este lead/loja.", "erro", 3600);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

function baixarQrCodeLojaOnline(context = {}) {
  const { document, gerarQrPixDataUrl, getStorefrontAdminStoreLocal, getStorefrontPublicUrlLocal, mostrarToast } = context;
  const dataUrl = gerarQrPixDataUrl(getStorefrontPublicUrlLocal());
  if (!dataUrl) return mostrarToast("QR Code indisponível neste ambiente.", "erro");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `loja-${getStorefrontAdminStoreLocal().slug || "simplifica3d"}-qrcode.png`;
  a.click();
}

function renderStorefrontTabs(active, context = {}) {
  const { STOREFRONT_ADMIN_TABS, escaparHtml } = context;
  const icons = {
    overview: "◷",
    appearance: "◐",
    products: "▣",
    categories: "≡",
    banner: "▤",
    leads: "●",
    qrcode: "⌁",
    settings: "⚙"
  };
  return `<nav class="tabs storefront-admin-tabs" aria-label="Admin da loja">${STOREFRONT_ADMIN_TABS.map(([id, label]) => `
    <button class="tab ${active === id ? "active" : ""}" type="button" onclick="setStorefrontAdminTab('${id}')">
      <span aria-hidden="true">${escaparHtml(icons[id] || "•")}</span>
      <strong>${escaparHtml(label)}</strong>
    </button>
  `).join("")}</nav>`;
}

function renderStoreEmptyState({ title = "Nada por aqui ainda", description = "", action = "", icon = "▦" } = {}, context = {}) {
  const { escaparHtml } = context;
  return `
    <div class="store-empty-state">
      <span aria-hidden="true">${escaparHtml(icon)}</span>
      <strong>${escaparHtml(title)}</strong>
      ${description ? `<small>${escaparHtml(description)}</small>` : ""}
      ${action}
    </div>
  `;
}

function renderStorefrontDemoNotice(vm = {}, context = {}) {
  if (!vm.demo?.enabled) return "";
  return `
    <div class="storefront-demo-banner">
      <strong>Modelos para começar</strong>
      <span>Use os exemplos abaixo como inspiração. A sua loja exibirá somente os produtos que você cadastrar e publicar.</span>
    </div>
  `;
}

function getStorefrontDisplayName(store = {}, context = {}) {
  const name = String(store.name || "").trim();
  return /internal\s*test|teste\s*interno/i.test(name) ? "Minha Loja 3D" : (name || "Minha Loja 3D");
}

function renderStoreStatusCard({ label = "", value = "", description = "", tone = "neutral" } = {}, context = {}) {
  const { escaparAttr, escaparHtml } = context;
  return `
    <article class="store-status-card store-status-${escaparAttr(tone)}">
      <span>${escaparHtml(label)}</span>
      <strong>${escaparHtml(value)}</strong>
      ${description ? `<small>${escaparHtml(description)}</small>` : ""}
    </article>
  `;
}

function renderStorePreviewContainer({ content = "", actions = "", title = "Visualização da loja", subtitle = "Confira como a sua loja ficará para os clientes.", source = "legacy" } = {}, context = {}) {
  const { escaparAttr, escaparHtml } = context;
  const previewActions = actions || `
    <button class="btn secondary" type="button" onclick="document.querySelector('.store-preview-container')?.classList.toggle('expanded')">Expandir visualização</button>
    <button class="btn secondary" type="button" onclick="abrirLojaPublicaOnline()">Abrir loja</button>
    <button class="btn ghost" type="button" onclick="copiarLinkLojaOnline()">Copiar link</button>
  `;
  return `
    <section class="store-preview-container store-preview-panel store-preview-zone storefront-preview storefront-app" data-store-theme="light" data-store-theme-preference="light" data-storefront-live-preview data-storefront-render="preview" data-storefront-source="${escaparAttr(source)}">
      <div class="store-preview-toolbar">
        <div>
          <strong>${escaparHtml(title)}</strong>
          <small>${escaparHtml(subtitle)}</small>
        </div>
        <span class="status-badge">Visualização</span>
      </div>
      <div class="store-preview-device store-preview-frame"><div class="store-preview-scroll">${content}</div></div>
      <div class="actions store-preview-actions">${previewActions}</div>
    </section>
  `;
}

function renderEditableContainer({ label = "", content = "", className = "" } = {}, context = {}) {
  const { escaparAttr, escaparHtml } = context;
  return `<div class="editable-container ${escaparAttr(className)}" data-editor-ready="future">${label ? `<span>${escaparHtml(label)}</span>` : ""}${content}</div>`;
}

function renderStoreSection({ title = "", content = "", subtitle = "", className = "" } = {}, context = {}) {
  const { escaparAttr, escaparHtml } = context;
  return `<section class="store-section ${escaparAttr(className)}">
    <div class="store-section-head">
      <h4>${escaparHtml(title)}</h4>
      ${subtitle ? `<small>${escaparHtml(subtitle)}</small>` : ""}
    </div>
    ${content}
  </section>`;
}

function renderStoreProductCard(product = {}, images = [], categories = [], context = {}) {
  const { escaparAttr, escaparHtml, getStorefrontProductTypeLabel, renderPrecoProdutoLojaOnline, renderUiIcon } = context;
  const image = images.find((item) => item.product_id === product.id)?.image_url || product.image_url || "";
  const categoryName = categories.find((cat) => String(cat.id) === String(product.category_id))?.name || "Produto 3D";
  const typeLabel = getStorefrontProductTypeLabel(product);
  const time = product.estimated_production_time || (product.is_customizable ? "Sob consulta" : "Pronto para orçamento");
  return `
    <article class="store-product-card editable-product-card" data-editor-ready="future">
      <div class="store-product-media">
        ${image ? `<img loading="lazy" decoding="async" src="${escaparAttr(image)}" alt="${escaparAttr(product.title || "Produto")}">` : renderUiIcon("estoque")}
        <span class="store-product-floating-badge">${product.featured ? "Destaque" : product.__demo ? "Modelo" : typeLabel}</span>
      </div>
      <div class="store-product-copy">
        <span>${escaparHtml(categoryName)}</span>
        <strong>${escaparHtml(product.title || "Produto da loja")}</strong>
        <small>${escaparHtml(product.description || "Produto público preparado para a loja.")}</small>
      </div>
      <div class="store-product-meta">
        <strong>${escaparHtml(renderPrecoProdutoLojaOnline(product))}</strong>
        <small>${escaparHtml(typeLabel)} • ${escaparHtml(time)}</small>
      </div>
      <div class="store-product-actions">
        ${product.is_customizable ? `<span class="status-badge badge-info">personalizado</span>` : ""}
        ${String(product.stock_mode || "") === "unavailable" ? `<span class="status-badge badge-warning">indisponível</span>` : ""}
        <button class="btn secondary" type="button" disabled title="Carrinho público será controlado pela loja pública.">Adicionar</button>
      </div>
    </article>
  `;
}

function renderStoreProductGrid(products = [], images = [], categories = [], limit = 4, context = {}) {
  return `<div class="store-product-grid">${products.slice(0, limit).map((product) => renderStoreProductCard(product, images, categories, context)).join("") || renderStoreEmptyState({ title: "Nenhum produto publicado ainda", description: "Sua loja começará a aparecer aqui quando os produtos forem publicados.", icon: "□" }, context)}</div>`;
}

function renderStoreCategorySection(categories = [], context = {}) {
  const { escaparHtml } = context;
  const visibleCategories = categories.filter((cat) => cat.visible !== false).slice(0, 8);
  return renderStoreSection({
    title: "Categorias",
    subtitle: "Navegação da loja pública",
    className: "editable-category-section",
    content: `<div class="store-category-row">${visibleCategories.map((cat, index) => `
      <button class="${index === 0 ? "active" : ""}" type="button" disabled title="Filtro interativo será liberado na loja pública.">
        <span aria-hidden="true">${escaparHtml(cat.icon || "▦")}</span>
        <strong>${escaparHtml(cat.name)}</strong>
        ${cat.__demo ? `<em>Modelo</em>` : ""}
      </button>
    `).join("") || renderStoreEmptyState({ title: "Nenhuma categoria criada", description: "Adicione categorias para organizar sua loja.", icon: "≡" }, context)}</div>`
  }, context);
}

function renderBannerSection(store = {}, context = {}) {
  const { escaparAttr, escaparHtml, getStorefrontControlledTheme } = context;
  return `
    <div class="store-banner-section editable-banner" data-editor-ready="future" style="--store-primary:${escaparAttr(getStorefrontControlledTheme(store.theme_config || {}).primary)};--store-accent:${escaparAttr(getStorefrontControlledTheme(store.theme_config || {}).accent)}">
      ${store.banner_url ? `<img src="${escaparAttr(store.banner_url)}" alt="Banner da loja">` : ""}
      <div>
        <span>${escaparHtml(store.__demo ? "Modelo inicial" : store.active ? "Loja publicada" : "Em preparação")}</span>
        <strong>${escaparHtml(getStorefrontDisplayName(store, context))}</strong>
        <small>${escaparHtml(store.description || "Sua loja de produtos personalizados.")}</small>
        <button class="btn secondary" type="button" disabled title="CTA público será liberado na loja pública.">Ver produtos</button>
      </div>
    </div>
  `;
}

function renderStoreHeader(store = {}, context = {}) {
  const { escaparAttr, escaparHtml, renderMarcaOficialProjeto } = context;
  return `
    <header class="store-header-preview editable-store-header" data-editor-ready="future">
      <div class="store-header-brand">
        ${store.logo_url ? `<img src="${escaparAttr(store.logo_url)}" alt="Logo da loja">` : renderMarcaOficialProjeto("store-header-logo", "Simplifica 3D", "icon")}
        <div>
          <strong>${escaparHtml(getStorefrontDisplayName(store, context))}</strong>
          <small>${escaparHtml(store.description || "Catálogo público de produtos personalizados.")}</small>
        </div>
      </div>
      <div class="store-header-actions">
        <span class="status-badge badge-info">Loja</span>
        ${store.whatsapp ? `<button class="btn secondary" type="button" disabled title="WhatsApp público abre na loja publicada.">WhatsApp</button>` : ""}
        ${store.instagram ? `<button class="btn ghost" type="button" disabled title="Instagram público abre na loja publicada.">Instagram</button>` : ""}
        <button class="btn ghost" type="button" disabled title="Compartilhamento será liberado na loja pública.">Compartilhar</button>
      </div>
    </header>
  `;
}

function renderStorefrontEditorFutureButton(extraClass = "secondary", context = {}) {
  return "";
}

function renderStorefrontPreviewLegacy(vm, options = {}, context = {}) {
  const { escaparHtml } = context;
  const products = options.products || vm.products.filter((product) => product.featured || product.visible);
  const featured = products.filter((product) => product.featured).length ? products.filter((product) => product.featured) : products;
  const visibleProducts = vm.products.filter((product) => product.visible !== false);
  return renderStorePreviewContainer({
    title: options.title || "Visualização da loja",
    subtitle: options.subtitle || "Confira como a loja será apresentada aos clientes.",
    source: options.source || "legacy",
    content: `
      ${renderStoreHeader(vm.store, context)}
      ${renderEditableContainer({ label: "Banner principal", className: "editable-banner-container", content: renderBannerSection(vm.store, context) }, context)}
      ${renderStoreCategorySection(vm.categories, context)}
      ${renderStoreSection({ title: "Produtos em destaque", subtitle: "Itens que aparecem primeiro para o cliente", className: "store-featured-section", content: renderStoreProductGrid(featured, vm.images, vm.categories, 3, context) }, context)}
      ${renderStoreSection({ title: "Catálogo", subtitle: "Grade pública da loja", className: "store-catalog-section", content: renderStoreProductGrid(visibleProducts, vm.images, vm.categories, 6, context) }, context)}
      <footer class="store-preview-footer">
        <span>Loja criada com Simplifica 3D</span>
        <strong>${escaparHtml(vm.store.slug || "loja")}</strong>
      </footer>
    `,
    actions: ""
  }, context);
}

function renderStorefrontPreviewV2(vm, options = {}, context = {}) {
  return renderStorefrontPreviewLegacy(vm, { ...options, source: "v2" }, context);
}

function renderStorefrontPreview(vm, options = {}, context = {}) {
  const { renderStorefrontView } = context;
  return renderStorefrontView({
    mode: "preview",
    source: options.source,
    vm,
    options
  });
}

function criarStorefrontPreviewVmDoFormulario(form, context = {}) {
  const { getStorefrontAdminViewModel, normalizarCorTemaControlado } = context;
  const vm = getStorefrontAdminViewModel();
  if (!form) return vm;
  const baseStore = { ...vm.store };
  const theme = { ...(baseStore.theme_config || {}) };
  if (form.storeName) baseStore.name = String(form.storeName.value || "").trim() || baseStore.name;
  if (form.storeDescription) baseStore.description = String(form.storeDescription.value || "").trim();
  if (form.storeWhatsApp) baseStore.whatsapp = String(form.storeWhatsApp.value || "").replace(/\D/g, "");
  if (form.storeInstagram) baseStore.instagram = String(form.storeInstagram.value || "").trim();
  if (form.storeLogoUrl) baseStore.logo_url = String(form.storeLogoUrl.value || "").trim();
  if (form.storeBannerUrl) baseStore.banner_url = String(form.storeBannerUrl.value || "").trim();
  theme.mode = "light";
  if (form.storePrimary) theme.primary = normalizarCorTemaControlado(form.storePrimary.value || theme.primary || "#00BFA6", theme.mode, "primary");
  if (form.storeAccent) theme.accent = normalizarCorTemaControlado(form.storeAccent.value || theme.accent || "#FF8A1F", theme.mode, "secondary");
  baseStore.theme_config = theme;
  return { ...vm, store: baseStore };
}

function atualizarStorefrontPreviewAoVivo(form, context = {}) {
  const { document, registrarStorefrontDebugLeve } = context;
  try {
    const target = document.querySelector("[data-storefront-live-preview]");
    if (!target) return;
    const vm = criarStorefrontPreviewVmDoFormulario(form, context);
    target.outerHTML = renderStorefrontPreview(vm, {
      title: "Visualização em tempo real",
      subtitle: "As alterações aparecem aqui antes de salvar."
    }, context);
  } catch (error) {
    registrarStorefrontDebugLeve("preview_falhou", "Falha ao atualizar preview em tempo real.", { message: error?.message || String(error) });
  }
}



function renderStoreAdminControls(type = "", data = {}, vm, context = {}) {
  const { getStorefrontPublicMode, getStorefrontPublicViewModel } = context;
  if (vm === undefined) vm = getStorefrontPublicViewModel();
  if (!getStorefrontPublicMode(vm).admin) return "";
  void type;
  void data;
  return "";
}

function renderStoreAdminFloatingEditor(vm, context = {}) {
  const { escaparAttr, getStorefrontPublicMode, getStorefrontPublicRoute, getStorefrontPublicUrl } = context;
  const mode = getStorefrontPublicMode(vm);
  if (!mode.requested) return "";
  if (mode.readonly) {
    return `
      <div class="store-context-denied store-context-access-card">
        <div>
          <span>Admin contextual</span>
          <strong>Entre para editar esta loja</strong>
          <p>A edição da loja fica disponível para usuários autenticados. No plano Grátis você pode montar e visualizar a loja; publicar e compartilhar link público exigem Start ou Pro.</p>
        </div>
        <div class="store-context-access-actions">
          <a class="btn ghost" href="${escaparAttr(getStorefrontPublicUrl({ slug: vm.store?.slug || getStorefrontPublicRoute().slug, view: "home" }))}" onclick="return navegarLojaPublicaLink(event, this, { forceClient: true })">Ver loja pública</a>
          <button class="btn secondary" type="button" onclick="trocarTela('admin')">Entrar no ERP</button>
        </div>
      </div>
    `;
  }
  if (!mode.admin) return "";
  return `
    <button class="store-context-edit-fab" type="button" onclick="selecionarItemLojaVisual('overview')">Editar loja</button>
  `;
}

function renderStorefrontSimpleOnboarding(vm, context = {}) {
  const { escaparAttr, escaparHtml } = context;
  const store = vm.store || {};
  const products = Array.isArray(vm.products) ? vm.products : [];
  const categories = Array.isArray(vm.categories) ? vm.categories : [];
  const hasLogo = !!store.logo_url;
  const hasColor = !!store.theme_config?.primary;
  const hasWhatsapp = !!store.whatsapp;
  const hasProduct = products.some((product) => product.visible !== false);
  const steps = [
    ["Nome da loja", !!store.name, "appearance"],
    ["Logo", hasLogo, "appearance"],
    ["Cor principal", hasColor, "appearance"],
    ["WhatsApp", hasWhatsapp, "appearance"],
    ["Primeiro produto", hasProduct, "products"],
    ["Publicar loja", !!store.active, "settings"]
  ];
  const completed = steps.filter(([, done]) => done).length;
  const percent = Math.round((completed / steps.length) * 100);
  return `
    <section class="store-simple-onboarding" aria-label="Guia rapido da loja">
      <div class="store-simple-onboarding-head">
        <span>Modo simples</span>
        <strong>Sua loja pronta em minutos</strong>
        <small>${completed}/${steps.length} passos concluidos</small>
      </div>
      <div class="store-simple-progress" aria-hidden="true"><span style="width:${percent}%"></span></div>
      <div class="store-simple-step-list">
        ${steps.map(([label, done, tab]) => `
          <button type="button" class="${done ? "done" : ""}" onclick="abrirStorefrontAdminRoute('${escaparAttr(tab)}')">
            <i>${done ? "✓" : "○"}</i>
            <span>${escaparHtml(label)}</span>
          </button>
        `).join("")}
      </div>
      ${categories.length ? "" : `<p>As categorias base ja aparecem no template para evitar uma loja vazia.</p>`}
    </section>
  `;
}

function renderStorefrontTemplatePresets(vm, context = {}) {
  const { STOREFRONT_TEMPLATE_PRESETS, escaparAttr, escaparHtml, getStorefrontEditorMode } = context;
  const active = vm.store?.theme_config?.template_id || "minimal";
  const editorMode = getStorefrontEditorMode();
  const presets = editorMode === "simple" ? STOREFRONT_TEMPLATE_PRESETS.slice(0, 4) : STOREFRONT_TEMPLATE_PRESETS;
  return `
    <section class="store-template-panel" aria-label="Modelos visuais da loja">
      <div class="store-template-panel-head">
        <span>Templates</span>
        <strong>Estilo da loja</strong>
      </div>
      <div class="store-template-grid">
        ${presets.map((preset) => `
          <button type="button" class="${active === preset.id ? "active" : ""}" onclick="aplicarStorefrontPresetVisual('${escaparAttr(preset.id)}')" title="${escaparAttr(preset.desc)}">
            <i style="--preset-primary:${escaparAttr(preset.primary)};--preset-accent:${escaparAttr(preset.accent)}"><b></b></i>
            <span>${escaparHtml(preset.title)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function aplicarStorefrontPresetVisual(id = "minimal", context = {}) {
  const { STOREFRONT_TEMPLATE_PRESETS, getStoreThemeSaved, getStorefrontAdminStoreLocal, marcarStorefrontAlteracoesPendentes, mostrarToast, normalizarCorTemaControlado, normalizarTemaLojaOnline, registrarStorefrontActivity, renderApp, storefrontAdminSaveStore } = context;
  const preset = STOREFRONT_TEMPLATE_PRESETS.find((item) => item.id === id) || STOREFRONT_TEMPLATE_PRESETS[0];
  const store = getStorefrontAdminStoreLocal();
  const next = {
    ...store,
    theme_config: {
      ...(store.theme_config || {}),
      primary: normalizarCorTemaControlado(preset.primary, normalizarTemaLojaOnline(store.theme_config?.mode || getStoreThemeSaved()), "primary"),
      accent: normalizarCorTemaControlado(preset.accent, normalizarTemaLojaOnline(store.theme_config?.mode || getStoreThemeSaved()), "secondary"),
      template_id: preset.id,
      template_name: preset.title,
      template_tone: preset.tone,
      layout_preset: preset.id === "moda" ? "editorial" : preset.id === "geek" ? "showcase" : "balanced"
    }
  };
  storefrontAdminSaveStore(next);
  marcarStorefrontAlteracoesPendentes(`Template ${preset.title} aplicado`);
  registrarStorefrontActivity("Template visual aplicado", preset.title);
  mostrarToast(`Template ${preset.title} aplicado.`, "sucesso", 2200);
  renderApp();
}


function renderLojaOnlineHub(context = {}) {
  const { aplicarRegraPublicacaoLojaLocal, canUseStorefrontLocal, escaparAttr, escaparHtml, getStorefrontAdminViewModel, getStorefrontPublicUrlLocal, getStorefrontPublicationAccess, isStorefrontPubliclyAccessible, renderSmartScreenSkeleton, renderStoreStatusCard, telaComCarregamentoUX } = context;
  if (telaComCarregamentoUX("loja")) return renderSmartScreenSkeleton("loja");
  const publicationRule = aplicarRegraPublicacaoLojaLocal({ silent: true });
  const vm = getStorefrontAdminViewModel();
  const publicationAccess = publicationRule.access || getStorefrontPublicationAccess();
  const publicActive = isStorefrontPubliclyAccessible(vm.store, publicationAccess);
  const linkPublico = getStorefrontPublicUrlLocal();
  const novos = vm.leads.filter((lead) => String(lead.status || "novo") === "novo").length;
  const whatsapp = vm.events.filter((event) => event.event_type === "whatsapp_click").length;
  const visitas = vm.events.filter((event) => event.event_type === "store_view").length;
  const published = vm.products.filter((product) => product.visible).length;
  const podeAdministrar = canUseStorefrontLocal();
  return `
    <section class="app-page storefront-hub-page">
      <div class="app-header storefront-hub-header">
        <div>
          <span class="status-badge ${publicActive ? "badge-success" : "badge-warning"}">${publicActive ? "Loja ativa" : "Loja inativa"}</span>
          <h2>Loja Online</h2>
          <p class="muted">Acompanhe a sua loja, organize produtos e compartilhe a loja com seus clientes.</p>
        </div>
        <div class="actions">
          <button class="btn" type="button" onclick="abrirLojaPublicaAdminContextual()" ${podeAdministrar ? "" : "disabled title=\"Edição liberada para usuários autorizados.\""}>Editar loja</button>
          <button class="btn secondary" type="button" onclick="compartilharLojaPublica('${escaparAttr(linkPublico)}')" ${publicationAccess.canShare ? "" : "disabled title=\"Publicação disponível nos planos Start e Pro ativos.\""}>Compartilhar loja</button>
          <button class="btn ghost" type="button" onclick="abrirLojaPublicaOnline()" ${publicActive ? "" : "disabled title=\"Publique a loja para abrir o link público.\""}>Ver como cliente</button>
        </div>
      </div>
      <div class="storefront-plan-notice ${publicationAccess.canPublish ? "is-ready" : "is-blocked"}">
        <strong>${escaparHtml(publicationAccess.canPublish ? "Publicação disponível" : "Publicação bloqueada")}</strong>
        <span>${escaparHtml(publicationAccess.internalMessage)}</span>
      </div>
      <div class="storefront-hub-grid">
        ${[
          { label: "Status", value: publicActive ? "Publicado" : "Rascunho", description: vm.store.slug || "endereço pendente", tone: publicActive ? "success" : "warning" },
          { label: "Produtos visíveis", value: published, description: `${vm.products.length} no catálogo`, tone: "neutral" },
          { label: "Novos contatos", value: novos, description: `${vm.leads.length} recebidos`, tone: novos ? "info" : "neutral" },
          { label: "Visitas", value: visitas, description: `${whatsapp} clique(s) no WhatsApp`, tone: "neutral" }
        ].map((card) => renderStoreStatusCard(card, context)).join("")}
      </div>
      <section class="card storefront-hub-card">
        <div class="card-header">
          <div>
            <h3>Link e compartilhamento</h3>
            <p class="muted">Compartilhe o endereço da sua loja com clientes e parceiros.</p>
          </div>
          <span class="status-badge">${escaparHtml(vm.store.slug || "loja")}</span>
        </div>
        <div class="storefront-link-box"><span>${escaparHtml(linkPublico)}</span></div>
        <div class="store-qr-layout compact">
          <div id="storefrontHubQr" class="qr-preview" aria-label="QR Code da loja"></div>
          <p class="muted">O link e o QR Code permanecem disponíveis aqui para consulta. Use “Compartilhar loja” no topo para enviar aos clientes.</p>
        </div>
      </section>
      <section class="card storefront-hub-card">
        <div class="card-header">
          <div>
            <h3>Atividades recentes da loja</h3>
            <p class="muted">Veja as últimas visitas, contatos e atualizações da sua loja.</p>
          </div>
        </div>
        ${renderStorefrontRecentActivity(vm, context)}
      </section>
      ${!podeAdministrar ? `<section class="card storefront-hub-card"><strong>Edição da loja indisponível</strong><p class="muted">Confira as permissões do seu perfil para organizar esta Loja.</p></section>` : ""}
    </section>
  `;
}

function renderStorefrontRecentActivity(vm, context = {}) {
  const { escaparHtml, formatarMoeda, getStorefrontActivityLocal, renderStoreEmptyState } = context;
  const atividades = [
    ...getStorefrontActivityLocal().map((item) => ({
      title: item.title,
      description: `${item.description || "Atualização da loja"} • ${new Date(item.created_at || Date.now()).toLocaleString("pt-BR")}`
    })),
    ...vm.events.slice(0, 4).map((event) => ({
      title: event.event_type === "whatsapp_click" ? "Clique no WhatsApp" : event.event_type === "add_to_cart" ? "Produto adicionado ao carrinho" : "Visita registrada",
      description: new Date(event.created_at || Date.now()).toLocaleString("pt-BR")
    })),
    ...vm.leads.slice(0, 3).map((lead) => ({
      title: "Contato recebido",
      description: `${lead.customer_name || "Cliente via WhatsApp"} • ${formatarMoeda(lead.subtotal || 0)}`
    }))
  ].slice(0, 6);
  if (!atividades.length) {
    return renderStoreEmptyState({
      title: "Nenhuma atividade recente",
      description: "Visitas, cliques, contatos e atualizações da loja aparecerão aqui.",
      icon: "◷"
    });
  }
  return `<div class="store-admin-list compact">${atividades.map((item) => `
    <article class="store-admin-row">
      <div class="store-admin-main">
        <span class="store-admin-icon">•</span>
        <div>
          <strong>${escaparHtml(item.title)}</strong>
          <small>${escaparHtml(item.description)}</small>
        </div>
      </div>
    </article>
  `).join("")}</div>`;
}

function renderStorefrontSaveState(vm, context = {}) {
  const { escaparHtml, getStorefrontDirtyState } = context;
  const atualizado = vm.store.updated_at || vm.store.updatedAt || vm.store.created_at || "";
  const dirty = getStorefrontDirtyState();
  return `
    <div class="storefront-save-state" data-storefront-save-state>
      <span class="status-badge ${dirty.dirty ? "badge-warning" : "badge-success"}">${dirty.dirty ? "Alterações não salvas" : "Alterações salvas"}</span>
      <span class="status-badge ${vm.store.active ? "badge-success" : "badge-warning"}">${vm.store.active ? "Publicado" : "Rascunho"}</span>
      <small>${dirty.dirty ? escaparHtml(dirty.detail || "Rascunho local") : `Última atualização: ${atualizado ? new Date(atualizado).toLocaleString("pt-BR") : "local"}`}</small>
    </div>
  `;
}

function renderStorefrontAdminPanel(context = {}) {
  const { renderStorefrontView } = context; return renderStorefrontView({ mode: "editor" }); }



function hidratarLojaOnlineAdmin(context = {}) {
  const { document, gerarQrPixDataUrl, getStorefrontPublicUrlLocal, sincronizarLojaOnlineAdminRemoto, telaAtual } = context;
  if (telaAtual !== "lojaOnline" && telaAtual !== "lojaAdmin") return;
  sincronizarLojaOnlineAdminRemoto(false);
  const alvo = document.getElementById("storefrontAdminQr") || document.getElementById("storefrontHubQr");
  if (!alvo) return;
  const dataUrl = gerarQrPixDataUrl(getStorefrontPublicUrlLocal());
  alvo.innerHTML = dataUrl
    ? `<img src="${dataUrl}" alt="QR Code da loja online" style="width:160px;height:160px;border-radius:16px;background:#fff;padding:10px;">`
    : `<p class="muted">QR Code indisponível neste ambiente.</p>`;
}


function renderOpcoesLojasPromocoes3d(context = {}) {
  const { PROMOTIONS_3D_OFFICIAL_HOSTS, escaparAttr, escaparHtml, promotions3dState } = context;
  const unique = new Map();
  promotions3dState.stores.forEach((store) => {
    const host = String(store?.host || "").toLowerCase();
    if (PROMOTIONS_3D_OFFICIAL_HOSTS.includes(host)) unique.set(host, String(store.name || host));
  });
  promotions3dState.items.forEach((item) => {
    if (item.host && !unique.has(item.host)) unique.set(item.host, item.store);
  });
  return [
    `<option value="todas" ${promotions3dState.store === "todas" ? "selected" : ""}>Todas as lojas</option>`,
    ...Array.from(unique.entries()).map(([host, name]) => `<option value="${escaparAttr(host)}" ${promotions3dState.store === host ? "selected" : ""}>${escaparHtml(name)}</option>`)
  ].join("");
}


function filtrarLojaPromocoes3d(host = "todas", context = {}) {
  const { PROMOTIONS_3D_OFFICIAL_HOSTS, atualizarResultadosPromocoes3d, promotions3dState } = context;
  promotions3dState.store = host === "todas" || PROMOTIONS_3D_OFFICIAL_HOSTS.includes(String(host).toLowerCase())
    ? String(host).toLowerCase()
    : "todas";
  atualizarResultadosPromocoes3d();
}
  const api = Object.freeze({ alterarStatusLeadLojaOnline, abrirWhatsAppLeadLojaOnline, baixarQrCodeLojaOnline, renderStorefrontTabs, renderStoreEmptyState, renderStorefrontDemoNotice, getStorefrontDisplayName, renderStoreStatusCard, renderStorePreviewContainer, renderEditableContainer, renderStoreSection, renderStoreProductCard, renderStoreProductGrid, renderStoreCategorySection, renderBannerSection, renderStoreHeader, renderStorefrontEditorFutureButton, renderStorefrontPreviewLegacy, renderStorefrontPreviewV2, renderStorefrontPreview, criarStorefrontPreviewVmDoFormulario, atualizarStorefrontPreviewAoVivo, renderStoreAdminControls, renderStoreAdminFloatingEditor, renderStorefrontSimpleOnboarding, renderStorefrontTemplatePresets, aplicarStorefrontPresetVisual, renderLojaOnlineHub, renderStorefrontRecentActivity, renderStorefrontSaveState, renderStorefrontAdminPanel, hidratarLojaOnlineAdmin, renderOpcoesLojasPromocoes3d, filtrarLojaPromocoes3d });
  global.SimplificaStorefrontAdminRender = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
