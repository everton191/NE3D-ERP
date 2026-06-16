(function initStorefrontEditorV3(global) {
  "use strict";

  const api = {};
  const call = (name, ...args) => typeof global[name] === "function" ? global[name](...args) : "";
  const esc = (value) => call("escaparHtml", value ?? "");
  const attr = (value) => call("escaparAttr", value ?? "");
  const image = (src, options) => call("renderStorefrontResponsiveImage", src, options);
  const icon = (name) => call("renderUiIcon", name);
  const selection = () => call("getStorefrontGuidedSelection") || { type: "overview", currentStep: 1 };
  const contact = (vm) => call("getStorefrontContactConfig", vm.store || {}) || {};
  const productImage = (vm, product) => call("getStorefrontProductImage", product, vm.images || []);
  const selectedItem = (type, id) => {
    const sel = selection();
    const key = type === "categories" ? "categories" : "products";
    const itemType = key === "categories" ? "category" : "product";
    const catalogState = call("getStorefrontGuidedCatalogState", key) || {};
    return (String(sel.type || "") === itemType && String(sel.id || "") === String(id || ""))
      || String(catalogState.highlightId || "") === String(id || "");
  };
  const formHeader = (title, subtitle, backAction, preview = "", tabs = "") => `
    <div class="sfe-sticky-head">
      <header class="sfe-header"><button class="store-ui-icon-button" type="button" aria-label="Voltar" onclick="${backAction}">‹</button><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><button class="store-ui-icon-button" type="button" aria-label="Mais opções" onclick="selecionarItemLojaVisual('overview')">⋮</button></header>
      ${preview}${tabs}
    </div>`;
  const preview = (src, title, subtitle, status = "Visível na loja") => `<aside class="store-ui-card sfe-preview">${image(src, { alt: title, title, kind: "product" })}<div><strong>${esc(title)}</strong><small>${esc(subtitle)}</small><em>${esc(status)}</em></div></aside>`;
  const actions = (back, primary, primaryLabel, secondary = "") => `<footer class="sfe-actions ${secondary ? "" : "sfe-actions--two"}"><button class="store-ui-button--ghost sfe-action-back" type="button" onclick="${back}">Voltar</button>${secondary}<button class="sfe-action-primary" type="${primary === "submit" ? "submit" : "button"}" ${primary === "submit" ? "" : `onclick="${primary}"`}>${esc(primaryLabel)}</button></footer>`;
  const toggle = (name, label, checked, description = "", onchange = "") => `<label class="sfe-toggle"><input type="checkbox" name="${attr(name)}" ${checked ? "checked" : ""} ${onchange ? `onchange="${onchange}"` : ""}><span aria-hidden="true"></span><strong>${esc(label)}</strong>${description ? `<small>${esc(description)}</small>` : ""}</label>`;
  const categoryIcons = [
    ["categoria", "Categorias"],
    ["estrela", "Destaques"],
    ["aparencia", "Personalizados"],
    ["estoque", "Utilidades"],
    ["producao", "Produção"],
    ["carrinho", "Produtos"],
    ["empresa", "Decoração"],
    ["config", "Peças técnicas"],
    ["entrega", "Entrega"],
    ["lojaonline", "Loja"],
    ["clientes", "Atendimento"],
    ["caixa", "Ofertas"],
    ["tag", "Promoções"],
    ["presente", "Presentes"],
    ["roupa", "Roupas"],
    ["comida", "Alimentos"],
    ["pet", "Pets"],
    ["brinquedo", "Brinquedos"],
    ["livro", "Livros"],
    ["celular", "Eletrônicos"],
    ["chaveiro", "Chaveiros"],
    ["decoracao", "Casa"],
    ["lampada", "Iluminação"],
    ["camera", "Fotografia"],
    ["calculadora", "Calculadoras"],
    ["pedido", "Pedidos"],
    ["orcamento", "Orçamentos"],
    ["relatorios", "Relatórios"],
    ["share", "Compartilhar"],
    ["time", "Prazo"],
    ["map-pin", "Local"],
    ["print", "Impressão"],
    ["whatsapp", "WhatsApp"],
    ["instagram", "Instagram"],
    ["tiktok", "TikTok"],
    ["email", "E-mail"],
    ["edit", "Criação"],
    ["preferencias", "Opções"],
    ["conta", "Conta"],
    ["seguranca", "Segurança"],
    ["feedback", "Avaliações"],
    ["sobre", "Informações"],
    ["agenda", "Agenda"],
    ["personalizacao", "Sob medida"],
    ["usuarios", "Comunidade"],
    ["backup", "Arquivos"],
    ["home", "Início"],
    ["dashboard", "Painel"],
    ["pedidos", "Encomendas"],
    ["assinatura", "Clubes"],
    ["bell", "Novidades"],
    ["view", "Exposição"],
    ["pdf", "Documentos"],
    ["search", "Pesquisa"],
    ["plus", "Outros"],
    ["superadmin", "Premium"],
    ["menu", "Coleções"],
    ["clock", "Horários"]
  ];
  const categoryIcon = (value = "") => categoryIcons.some(([name]) => name === value) ? icon(value) : icon("categoria");
  const categoryPicker = (selected = "categoria") => {
    const current = categoryIcons.some(([name]) => name === selected) ? selected : "categoria";
    return `<fieldset class="sfe-icon-picker"><legend>Ícone da categoria</legend>${categoryIcons.map(([name, label]) => `<label title="${attr(label)}"><input type="radio" name="categoryIconChoice" value="${attr(name)}" ${name === current ? "checked" : ""} onchange="this.form.categoryIcon.value=this.value"><span>${icon(name)}<small>${esc(label)}</small></span></label>`).join("")}</fieldset>`;
  };
  const checklistTarget = (item = {}) => {
    const panel = item.target?.panel || item.area || "overview";
    const allowed = ["identity", "banner", "contacts", "products", "categories", "product", "category"];
    return allowed.includes(panel) ? panel : panel === "appearance" ? "identity" : "overview";
  };
  const hiddenAppearance = (vm, banner = false) => {
    const store = vm.store || {};
    return `<input type="hidden" name="storeSlug" value="${attr(store.slug || "")}"><input type="hidden" name="storeWhatsApp" value="${attr(store.whatsapp || "")}"><input type="hidden" name="storeInstagram" value="${attr(store.instagram || "")}">${banner ? `<input type="hidden" name="storeLogoUrl" value="${attr(store.logo_url || "")}">` : `<input type="hidden" name="storeBannerUrl" value="${attr(store.banner_url || "")}">`}<input type="hidden" name="storeThemeMode" value="light"><input type="hidden" name="storePrimary" value="${attr(store.theme_config?.primary || "#147F78")}"><input type="hidden" name="storeAccent" value="${attr(store.theme_config?.accent || "#4D9CA2")}">`;
  };

  api.identity = function identity(vm) {
    const store = vm.store || {};
    return `<form class="sfe-form" onfocusin="manterCampoEditorGuiadoVisivel(event)" oninput="atualizarFormularioGuiadoLoja(this,'Identidade em edição')" onsubmit="salvarStorefrontAparencia(event)">${formHeader("Editar identidade", "Nome, descrição e logo", "selecionarItemLojaVisual('overview')", preview(store.logo_url || call("getStorefrontDemoProductImage", "logo", store.name), store.name || "Minha Loja", store.description || "Identidade da loja"))}${hiddenAppearance(vm)}<main class="sfe-fields"><label>Nome da loja<input name="storeName" required maxlength="50" value="${attr(store.name || "")}"></label><label>Descrição<textarea name="storeDescription" rows="3" maxlength="100">${esc(store.description || "")}</textarea></label><label>Logo da loja<input name="storeLogoUrl" value="${attr(store.logo_url || "")}"></label><label class="store-ui-upload">Trocar logo<input type="file" accept="image/jpeg,image/png,image/webp" onchange="processarImagemLojaOnline('logo',this)"><span>JPG, PNG ou WebP</span></label></main>${actions("selecionarItemLojaVisual('overview')", "submit", "Salvar identidade")}</form>`;
  };

  api.banner = function banner(vm) {
    const store = vm.store || {};
    const src = store.banner_url || call("getStorefrontDemoBannerImage");
    return `<form class="sfe-form" onfocusin="manterCampoEditorGuiadoVisivel(event)" oninput="atualizarFormularioGuiadoLoja(this,'Banner em edição')" onsubmit="salvarStorefrontAparencia(event)">${formHeader("Editar banner", "Imagem e chamada principal", "selecionarItemLojaVisual('overview')", preview(src, store.theme_config?.banner_title || "Banner principal", store.theme_config?.banner_subtitle || store.description || "Chamada da loja"))}${hiddenAppearance(vm, true)}<main class="sfe-fields"><label>Título<input name="storeBannerTitle" required maxlength="40" value="${attr(store.theme_config?.banner_title || "Produtos feitos para a sua marca")}"></label><label>Subtítulo<textarea name="storeBannerSubtitle" rows="3" maxlength="100">${esc(store.theme_config?.banner_subtitle || store.description || "")}</textarea></label><label class="store-ui-upload">Trocar imagem<input type="file" accept="image/jpeg,image/png,image/webp" onchange="processarImagemLojaOnline('banner',this)"><span>Imagem horizontal, JPG, PNG ou WebP</span></label><label>Link da imagem<input name="storeBannerUrl" value="${attr(store.banner_url || "")}"></label><label>Texto do botão<input name="storeBannerCtaLabel" maxlength="24" value="${attr(store.theme_config?.banner_cta_label || "Ver produtos")}"></label><label>Ação do botão<select name="storeBannerCtaAction"><option value="catalog">Abrir catálogo</option><option value="whatsapp" ${store.theme_config?.banner_cta_action === "whatsapp" ? "selected" : ""}>Abrir WhatsApp</option></select></label></main>${actions("selecionarItemLojaVisual('overview')", "submit", "Salvar banner")}</form>`;
  };

  api.product = function product(vm, product = {}) {
    const sel = selection();
    const step = Math.max(1, Math.min(4, Number(sel.currentStep || 1)));
    const src = productImage(vm, product) || call("getStorefrontDemoProductImage", product.visual_type || "produto", product.title || "Produto");
    const categories = (vm.categories || []).filter((item) => !item.__demo && !item.__template);
    const tabs = `<nav class="sfe-tabs" aria-label="Etapas do produto">${["Básico", "Preço/Estoque", "Imagens", "Publicação"].map((label, i) => `<button type="button" class="${step === i + 1 ? "active" : ""}" onclick="setStorefrontGuidedProductStep(${i + 1})">${esc(label)}</button>`).join("")}</nav>`;
    const template = !!(product.__demo || product.__template);
    const next = step < 4 ? `setStorefrontGuidedProductStep(${step + 1})` : "submit";
    return `<form id="storefrontProductForm" class="sfe-form sfe-product-form" data-guided-product-step="${step}" onfocusin="manterCampoEditorGuiadoVisivel(event)" oninput="atualizarFormularioGuiadoLoja(this,'Produto em edição')" onsubmit="salvarProdutoLojaOnline(event)">${formHeader("Editar produto", product.id ? `Produto #${String(product.id).slice(-6)}` : "Novo produto", "voltarFormularioGuiadoProdutoLoja()", preview(src, product.title || "Novo produto", product.short_description || product.description || "Produto da loja", product.visible ? "Visível na loja" : "Rascunho"), tabs)}<main class="sfe-fields"><input type="hidden" name="productId" value="${attr(template ? "" : product.id || "")}"><input type="hidden" name="productTemplateSourceId" value="${attr(template ? product.id : "")}"><input type="hidden" name="productSlug" value="${attr(template ? "" : product.slug || "")}"><input type="hidden" name="erpProductId" value="${attr(product.erp_product_id || "")}"><input type="hidden" name="productComparePrice" value="${attr(product.compare_price ?? "")}"><input type="hidden" name="productPriceMode" value="${attr(product.price_mode || "fixed")}"><input type="hidden" name="productTime" value="${attr(product.estimated_production_time || "")}"><input type="hidden" name="productStockQuantity" value="${attr(product.stock_quantity ?? "")}"><input type="hidden" name="productObservations" value="${attr(product.public_observations || "")}"><input type="checkbox" hidden name="productShowPrice" ${product.show_price !== false ? "checked" : ""}><input type="checkbox" hidden name="productFeatured" ${product.featured ? "checked" : ""}><input type="checkbox" hidden name="productCustomizable" ${product.is_customizable !== false ? "checked" : ""}>
      <section class="sfe-step" data-step="1"><h3>Informações básicas</h3><label>Nome do produto<input name="productTitle" required maxlength="60" value="${attr(product.title || "")}"></label><label>Descrição curta<input name="productShortDescription" maxlength="100" value="${attr(product.short_description || "")}"></label><label>Descrição completa<textarea name="productDescription" rows="4" maxlength="180">${esc(product.description || "")}</textarea></label><label>Categoria<select name="productCategory"><option value="">Sem categoria</option>${categories.map((cat) => `<option value="${attr(cat.id)}" ${String(product.category_id || "") === String(cat.id) ? "selected" : ""}>${esc(cat.name)}</option>`).join("")}</select></label></section>
      <section class="sfe-step" data-step="2"><h3>Preço e estoque</h3><label>Preço de venda<input name="productPrice" inputmode="decimal" value="${attr(product.price ?? "")}"></label><label>Preço promocional<input name="productComparePriceVisible" inputmode="decimal" value="${attr(product.compare_price ?? "")}" oninput="this.form.productComparePrice.value=this.value"></label><label>Estoque<input name="productStockQuantityVisible" inputmode="numeric" value="${attr(product.stock_quantity ?? "")}" oninput="this.form.productStockQuantity.value=this.value"></label></section>
      <section class="sfe-step" data-step="3"><h3>Imagens do produto</h3><div class="store-ui-card sfe-image-editor">${image(src, { alt: product.title || "Produto", kind: "product" })}</div>${product.id || template ? `<label class="store-ui-upload">${src ? "Trocar foto" : "Adicionar foto"}<input type="file" accept="image/jpeg,image/png,image/webp" onchange="${template ? `processarImagemExemploLojaOnline('${attr(product.id)}',this)` : `processarImagemProdutoLojaOnline('${attr(product.id)}',this)`}"><span>A imagem será ajustada automaticamente.</span></label>` : `<p>Salve o produto uma vez para liberar fotos.</p>`}</section>
      <section class="sfe-step" data-step="4"><h3>Publicação</h3>${toggle("productVisible", "Mostrar na loja", !template && product.visible, "Desative para manter como rascunho.")}${toggle("productFeaturedVisible", "Destacar na página inicial", product.featured, "", "this.form.productFeatured.checked=this.checked")}<label>Observação pública<textarea name="productObservationsVisible" rows="3" oninput="this.form.productObservations.value=this.value">${esc(product.public_observations || "")}</textarea></label></section></main>${actions(step > 1 ? `setStorefrontGuidedProductStep(${step - 1})` : "voltarFormularioGuiadoProdutoLoja()", next, step < 4 ? "Próximo" : "Publicar", `<button class="store-ui-button--secondary" type="button" onclick="salvarRascunhoProdutoGuiadoLoja(this.form)">Salvar rascunho</button>`)}</form>`;
  };

  api.category = function category(vm, category = {}) {
    const template = !!(category.__demo || category.__template);
    return `<form class="sfe-form" onfocusin="manterCampoEditorGuiadoVisivel(event)" oninput="atualizarFormularioGuiadoLoja(this,'Categoria em edição')" onsubmit="salvarCategoriaLojaOnline(event)">${formHeader(category.id ? "Editar categoria" : "Nova categoria", "Informações e visibilidade", "voltarFormularioGuiadoCategoriaLoja()", preview(call("getStorefrontCategoryVisualImage", category), category.name || "Nova categoria", category.visible !== false ? "Visível na loja" : "Oculta"))}<main class="sfe-fields"><input type="hidden" name="categoryId" value="${attr(template ? "" : category.id || "")}"><input type="hidden" name="categorySlug" value="${attr(template ? "" : category.slug || "")}"><input type="hidden" name="categoryOrder" value="${attr(category.order_index || (vm.categories || []).length + 1)}"><label>Nome da categoria<input name="categoryName" required maxlength="40" value="${attr(category.name || "")}"></label><input type="hidden" name="categoryIcon" value="${attr(categoryIcons.some(([name]) => name === category.icon) ? category.icon : "categoria")}">${categoryPicker(category.icon || "categoria")}${toggle("categoryVisible", "Mostrar na loja", category.visible !== false, "Categorias ocultas não aparecem para clientes.")}</main>${actions("voltarFormularioGuiadoCategoriaLoja()", "submit", template ? "Criar categoria" : "Salvar categoria")}</form>`;
  };

  const list = (vm, type) => {
    const products = type === "products";
    const items = products ? vm.products || [] : vm.categories || [];
    return `<section class="sfe-list"><header class="sfe-list__header"><button class="store-ui-icon-button" type="button" onclick="selecionarItemLojaVisual('overview')">‹</button><div><h2>${products ? "Produtos" : "Categorias"}</h2><p>${items.length} itens cadastrados</p></div><button class="sfe-list__add" type="button" onclick="${products ? "abrirNovoProdutoGuiadoLoja()" : "abrirNovaCategoriaGuiadaLoja()"}">Adicionar</button></header><label><span class="sr-only">Buscar</span><input type="search" placeholder="Buscar" oninput="setStorefrontGuidedCatalogQuery('${type}',this.value)"></label><div class="sfe-list__items" data-store-guided-list="${type}">${items.map((item) => {
      const selected = selectedItem(type, item.id);
      return `<article class="store-ui-card sfe-list-card ${selected ? "is-selected" : ""}" data-store-guided-item-id="${attr(item.id)}" ${selected ? `aria-current="true"` : ""}><button type="button" onclick="openStorefrontGuidedCatalogItem('${type}','${attr(item.id)}')">${products ? image(productImage(vm, item), { alt: item.title || "Produto", kind: "product" }) : `<span class="sfe-list-card__icon">${categoryIcon(item.icon)}</span>`}<span><strong>${esc(products ? item.title || "Produto" : item.name || "Categoria")}</strong><small>${products ? esc(call("getStorefrontCategoryName", vm, item.category_id) || "Sem categoria") : `${Number(item.product_count || 0)} produtos`}</small></span><em>${(products ? item.visible : item.visible !== false) ? "Visível" : "Oculto"}</em></button></article>`;
    }).join("") || `<article class="sfe-empty"><h3>Nenhum item cadastrado</h3><p>Use o botão Adicionar para começar.</p></article>`}</div></section>`;
  };

  api.products = (vm) => list(vm, "products");
  api.categories = (vm) => list(vm, "categories");

  api.contacts = function contacts(vm) {
    const data = contact(vm);
    return `<form class="sfe-form" onfocusin="manterCampoEditorGuiadoVisivel(event)" onsubmit="salvarStorefrontContatos(event)">${formHeader("Editar contatos", "Canais exibidos somente após preenchimento", "selecionarItemLojaVisual('overview')", preview("", "Fale com a loja", data.whatsapp || data.email || "Adicione um canal de atendimento", data.instagram || data.tiktok || "Contato público"))}<main class="sfe-fields"><input type="hidden" name="facebook" value="${attr(data.facebook || "")}"><section class="sfe-field-group"><h3>Canais de atendimento</h3><p>Deixe vazio o canal que não deseja mostrar na loja.</p><label>WhatsApp<input name="whatsapp" inputmode="tel" autocomplete="tel" placeholder="DDD + número" value="${attr(data.whatsapp || "")}"></label><label>Instagram<input name="instagram" autocomplete="url" placeholder="@perfil ou link" value="${attr(data.instagram || "")}"></label><label>TikTok<input name="tiktok" autocomplete="url" placeholder="@perfil ou link" value="${attr(data.tiktok || "")}"></label><label>E-mail<input name="email" type="email" autocomplete="email" placeholder="contato@sualoja.com" value="${attr(data.email || "")}"></label></section><section class="sfe-field-group"><h3>Informações opcionais</h3><label>Endereço<input name="address" value="${attr(data.address || "")}"></label><label>Horário<textarea name="hours" rows="2">${esc(data.hours || "")}</textarea></label><label>Mensagem padrão do WhatsApp<textarea name="whatsappMessage" rows="3">${esc(data.whatsapp_message || "")}</textarea></label></section></main>${actions("selecionarItemLojaVisual('overview')", "submit", "Salvar contatos")}</form>`;
  };

  api.overview = function overview(vm) {
    const areas = [
      ["products", "estoque", "Produtos", "Gerencie seus produtos"],
      ["categories", "categoria", "Categorias", "Organize o catálogo"],
      ["banner", "aparencia", "Banner", "Edite a chamada principal"],
      ["identity", "empresa", "Identidade", "Nome, descrição e logo"],
      ["contacts", "whatsapp", "Contatos", "WhatsApp e redes sociais"],
      ["checklist", "seguranca", "Publicação", "Revise antes de publicar"]
    ];
    return `<section class="sfe-overview"><header><span>Editor da loja</span><h2>O que você deseja editar?</h2><p>Escolha uma área para abrir o editor guiado.</p></header><div>${areas.map(([type, iconName, title, text]) => `<button class="store-ui-card" type="button" onclick="selecionarItemLojaVisual('${type}')">${icon(iconName)}<span><strong>${title}</strong><small>${text}</small></span></button>`).join("")}</div></section>`;
  };

  api.links = function links(vm) {
    const url = call("getStorefrontPublicUrl", { slug: vm.store.slug, view: "home" });
    return `<section class="sfe-overview"><header><h2>Link da loja</h2><p>Abra ou compartilhe sua loja publicada.</p></header><div class="store-ui-card"><strong>${esc(url)}</strong><button type="button" onclick="abrirLojaPublicaOnline()">Abrir loja</button><button class="store-ui-button--secondary" type="button" onclick="copiarLinkLojaOnline()">Copiar link</button></div></section>`;
  };

  api.checklist = function checklist(vm) {
    const completion = call("getStorefrontCompletion", vm) || { completionPercent: 0, items: [] };
    const pending = (completion.items || []).filter((item) => !item.done);
    return `<section class="sfe-overview sfe-publication-checklist"><header><h2>Pendências para publicar</h2><p>${pending.length ? `${pending.length} ${pending.length === 1 ? "item precisa" : "itens precisam"} de atenção. Toque para corrigir.` : "Tudo pronto para publicar."}</p></header><div>${pending.map((item) => `<button class="store-ui-card sfe-publication-link" type="button" onclick="selecionarItemLojaVisual('${attr(checklistTarget(item))}','${attr(item.entityId || "")}')"><span><strong>○ ${esc(item.title)}</strong><small>${esc(item.description)}</small></span>${icon("edit")}</button>`).join("") || `<article class="store-ui-card sfe-publication-ready"><strong>✓ Loja pronta</strong><small>Todos os itens necessários foram concluídos.</small></article>`}</div><button class="store-ui-button--ghost" type="button" onclick="selecionarItemLojaVisual('overview')">Voltar</button></section>`;
  };

  api.context = function context(vm) {
    const sel = selection();
    if (sel.type === "identity") return api.identity(vm);
    if (sel.type === "banner") return api.banner(vm);
    if (sel.type === "contacts") return api.contacts(vm);
    if (sel.type === "links") return api.links(vm);
    if (sel.type === "checklist") return api.checklist(vm);
    if (sel.type === "products") return api.products(vm);
    if (sel.type === "categories") return api.categories(vm);
    if (sel.type === "product") return api.product(vm, (vm.products || []).find((item) => String(item.id) === String(sel.id)) || {});
    if (sel.type === "category") return api.category(vm, (vm.categories || []).find((item) => String(item.id) === String(sel.id)) || {});
    return api.overview(vm);
  };

  api.sidebar = function sidebar(vm, state = {}) {
    const sel = selection();
    const desktopActions = state.mobile ? "" : `<nav class="sfe-sidebar-actions" aria-label="Ações do editor"><button class="store-ui-button--ghost" type="button" onclick="voltarPainelLojaVisual()">${icon("back")}<span>Voltar</span></button><button type="button" onclick="salvarEdicaoVisualAtualLoja()">${icon("backup")}<span>Salvar</span></button><button class="store-ui-button--secondary" type="button" onclick="abrirLojaPublicaOnline()">${icon("view")}<span>Ver como cliente</span></button><button class="sfe-sidebar-publish" type="button" onclick="alternarStatusLojaOnline()">${icon(vm.store.active ? "view" : "share")}<span>${vm.store.active ? "Colocar em rascunho" : "Publicar"}</span></button></nav>`;
    return `<aside class="storefront-editor storefront-mobile-editor sfe-shell ${state.mobile ? "sfe-shell--mobile" : "sfe-shell--desktop"}" aria-label="Editor da loja" data-store-editor-theme="light" data-store-ui-mode="${attr(state.uiMode || "overview")}" data-store-selected-type="${attr(sel.type || "overview")}" data-store-selected-id="${attr(sel.id || "")}"><div class="sfe-scroll">${api.context(vm)}</div>${state.dirty ? `<button class="sfe-review" type="button" onclick="abrirChecklistGuiadoLoja()">Revisar e salvar</button>` : ""}${desktopActions}</aside>`;
  };

  api.topbar = function topbar(vm, state = {}) {
    return `<header class="sfe-desktop-topbar"><div><strong>Prévia da loja</strong><span>${state.dirty ? "Alterações não publicadas" : vm.store.active ? "Loja publicada" : "Loja em rascunho"}</span></div></header>`;
  };

  api.mobileActions = function mobileActions() {
    return `<nav class="sfe-mobile-actions"><button class="store-ui-button--ghost" type="button" onclick="voltarPainelLojaVisual()">Voltar</button><button type="button" onclick="salvarEdicaoVisualAtualLoja()">Salvar</button><button class="store-ui-button--secondary" type="button" onclick="abrirLojaPublicaOnline()">Visualizar</button></nav>`;
  };

  global.SimplificaStorefrontVisualV3 = Object.freeze({ ...(global.SimplificaStorefrontVisualV3 || {}), editor: Object.freeze(api), version: "storefront-visual-rebuild-20260614" });
})(window);
