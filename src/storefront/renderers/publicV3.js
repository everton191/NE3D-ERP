(function initStorefrontPublicV3(global) {
  "use strict";

  const api = {};
  const call = (name, ...args) => typeof global[name] === "function" ? global[name](...args) : "";
  const esc = (value) => call("escaparHtml", value ?? "");
  const attr = (value) => call("escaparAttr", value ?? "");
  const modeOf = (vm) => call("getStorefrontPublicMode", vm) || { admin: false };
  const route = (options) => call("getStorefrontPublicRoutePath", options);
  const icon = (name) => call("renderUiIcon", name);
  const image = (src, options) => call("renderStorefrontResponsiveImage", src, options);
  const storeName = (store) => call("getStorefrontDisplayName", store) || "Minha Loja";
  const productImage = (vm, product) => call("getStorefrontProductImage", product, vm.images || []);
  const productUrl = (vm, product) => call("storefrontPublicProductUrl", vm, product);
  const categoryUrl = (vm, category) => call("storefrontPublicCategoryUrl", vm, category);
  const money = (value) => call("formatarMoeda", Number(value || 0));
  const categoryIcon = (category = {}) => {
    const configured = String(category.icon || "").toLowerCase();
    if (/^[a-z][a-z0-9-]*$/.test(configured)) return icon(configured);
    const value = `${category.name || ""} ${category.slug || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (/decor|casa|vaso/.test(value)) return icon("empresa");
    if (/colecion|geek|anime|miniatura/.test(value)) return icon("estrela");
    if (/acessor|suporte/.test(value)) return icon("config");
    if (/util|organiz|caixa/.test(value)) return icon("estoque");
    if (/chaveir|brinde|lembranca/.test(value)) return icon("carrinho");
    if (/peca|tecnic|produc/.test(value)) return icon("producao");
    if (/personal/.test(value)) return icon("aparencia");
    return icon("categoria");
  };
  const edit = (type, id = "", section = "", field = "", source = "") =>
    `event.preventDefault(); selecionarItemLojaVisual('${attr(type)}','${attr(id)}',{entityType:'${attr(type)}',entityId:'${attr(id)}',targetSection:'${attr(section)}',targetField:'${attr(field)}',source:'${attr(source)}'}); return false;`;

  api.headerMenu = function headerMenu(vm) {
    return `
      <details class="sfv3-menu ui-context-menu">
        <summary aria-label="Abrir menu da loja" aria-expanded="false" aria-controls="sfv3-header-menu" aria-haspopup="menu">${icon("menu")}<span>Menu</span></summary>
        <nav id="sfv3-header-menu" class="sfv3-menu__panel ui-context-menu-panel" role="menu">
          <a role="menuitem" href="${route({ slug: vm.store.slug, view: "home" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">Início</a>
          <a role="menuitem" href="${route({ slug: vm.store.slug, view: "categorias" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">Categorias</a>
          <a role="menuitem" href="${route({ slug: vm.store.slug, view: "produtos" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">Produtos</a>
          <a role="menuitem" href="${route({ slug: vm.store.slug, view: "contato" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">Contato</a>
        </nav>
      </details>`;
  };

  api.bottomNav = function bottomNav(vm) {
    return `
      <nav class="sfv3-bottom-nav" aria-label="Navegação da loja">
        <a href="${route({ slug: vm.store.slug, view: "home" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">${icon("home")}<span>Início</span></a>
        <a href="${route({ slug: vm.store.slug, view: "categorias" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">${icon("categoria")}<span>Categorias</span></a>
        <button type="button" onclick="abrirCarrinhoLojaPublica()">${icon("carrinho")}<span>Orçamento</span></button>
        <a href="${route({ slug: vm.store.slug, view: "contato" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">${icon("conta")}<span>Contato</span></a>
      </nav>`;
  };

  api.root = function root(vm, content = "") {
    const mode = modeOf(vm);
    const cart = call("getStorefrontCartSummary", vm) || { count: 0 };
    const brandClick = mode.admin ? edit("identity", "", "logo", "storeLogoUrl", "brand") : "return navegarLojaPublicaLink(event,this,{scrollTop:true})";
    return `
      <div class="storefront-app storefront-public storefront-v3 sfv3" data-storefront-version="v3-rebuilt" data-store-theme="light" data-store-theme-preference="light">
        <header class="sfv3-header">
          ${api.headerMenu(vm)}
          <a class="sfv3-brand" href="${route({ slug: vm.store.slug, view: "home" })}" onclick="${brandClick}">
            ${vm.store.logo_url ? `<img src="${attr(vm.store.logo_url)}" alt="${attr(storeName(vm.store))}">` : call("renderMarcaOficialProjeto", "sfv3-brand__logo", "Simplifica 3D", "icon")}
            <span><strong>${esc(storeName(vm.store))}</strong><small>${esc(vm.store.description || "Impressão 3D e personalizados")}</small></span>
          </a>
          <label class="sfv3-search"><span class="sr-only">Buscar produtos</span><input type="search" placeholder="O que você está procurando?" onkeydown="if(event.key==='Enter'){event.preventDefault();filtrarProdutosLojaPublica(this.value)}">${icon("search")}</label>
          <nav class="sfv3-header__actions">
            <button class="store-ui-button--ghost" type="button" onclick="abrirCarrinhoLojaPublica()">${icon("carrinho")}<span>Carrinho</span><b>${cart.count || 0}</b></button>
            ${vm.store.whatsapp ? `<button type="button" onclick="abrirWhatsappLojaPublica()">${icon("whatsapp")}<span>WhatsApp</span></button>` : ""}
          </nav>
        </header>
        <main class="sfv3-main">${content}</main>
        <footer class="sfv3-footer"><strong>${esc(storeName(vm.store))}</strong><span>Loja criada com Simplifica 3D</span></footer>
        ${mode.admin ? "" : api.bottomNav(vm)}
      </div>`;
  };

  api.hero = function hero(vm) {
    const mode = modeOf(vm);
    const store = vm.store || {};
    const banner = call("getStorefrontBannerImage", store) || call("getStorefrontDemoBannerImage");
    return `
      <section class="sfv3-hero" ${mode.admin ? `onclick="${edit("banner", "", "banner", "storeBannerTitle", "hero")}"` : ""}>
        <div class="sfv3-hero__copy">
          <span>Personalizados</span>
          <h1>${esc(store.theme_config?.banner_title || "Transformamos ideias em impressão 3D")}</h1>
          <p>${esc(store.theme_config?.banner_subtitle || store.description || "Peças exclusivas, com acabamento profissional e qualidade.")}</p>
          <div class="sfv3-actions"><button type="button" onclick="event.stopPropagation();document.getElementById('sfv3-products')?.scrollIntoView({behavior:'smooth'})">Ver produtos</button><button class="store-ui-button--secondary" type="button" onclick="event.stopPropagation();abrirCarrinhoLojaPublica()">Solicitar orçamento</button></div>
        </div>
        <figure class="sfv3-hero__media">${image(banner, { alt: "Banner da loja", title: store.theme_config?.banner_title || storeName(store), kind: "banner" })}</figure>
      </section>`;
  };

  api.benefits = function benefits() {
    return `<section class="sfv3-benefits">${[
      ["entrega", "Frete rápido", "para todo o Brasil"],
      ["caixa", "Atendimento direto", "orçamento pelo WhatsApp"],
      ["seguranca", "Compra segura", "seus dados protegidos"],
      ["producao", "Produção sob medida", "feito para você"]
    ].map(([i, t, d]) => `<article>${icon(i)}<span><strong>${t}</strong><small>${d}</small></span></article>`).join("")}</section>`;
  };

  api.categoryCard = function categoryCard(vm, category = {}) {
    const mode = modeOf(vm);
    const src = call("getStorefrontCategoryVisualImage", category);
    const click = mode.admin ? edit("category", category.id, "category", "categoryName", "category-card") : "return navegarLojaPublicaLink(event,this,{scrollTop:true})";
    return `<a class="store-ui-card sfv3-category-card" href="${categoryUrl(vm, category)}" onclick="${click}">${src ? image(src, { alt: category.name || "Categoria", kind: "category" }) : categoryIcon(category)}<span><strong>${esc(category.name || "Categoria")}</strong><small>${Number(category.product_count || 0)} produtos</small></span></a>`;
  };

  api.categories = function categories(vm) {
    return `<section class="sfv3-section"><header><h2>Categorias em destaque</h2><a href="${route({ slug: vm.store.slug, view: "categorias" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">Ver todas</a></header><div class="sfv3-category-grid">${(vm.categories || []).slice(0, 6).map((cat) => api.categoryCard(vm, cat)).join("") || api.emptyState("Sem categorias", "As categorias serão exibidas aqui.")}</div></section>`;
  };

  api.productCard = function productCard(vm, product = {}) {
    const mode = modeOf(vm);
    const url = productUrl(vm, product);
    const click = mode.admin ? edit("product", product.id, "basic", "productTitle", "product-card") : "return navegarLojaPublicaLink(event,this,{scrollTop:true})";
    return `<article class="store-ui-card sfv3-product-card" data-store-product-id="${attr(product.id || "")}"><a class="sfv3-product-card__media" href="${url}" onclick="${click}">${image(productImage(vm, product), { alt: product.title || "Produto", kind: "product" })}${product.featured ? "<em>Destaque</em>" : ""}</a><div><a href="${url}" onclick="${click}"><strong>${esc(product.title || "Produto")}</strong></a><small>${esc(call("getStorefrontCategoryName", vm, product.category_id) || "Personalizado")}</small><b>${product.show_price === false ? "Sob orçamento" : money(product.price)}</b><button type="button" onclick="adicionarProdutoCarrinhoLojaPublica('${attr(product.id)}')">${icon("carrinho")}<span>Adicionar</span></button></div></article>`;
  };

  api.productSection = function productSection(vm, products = [], title = "Produtos", subtitle = "") {
    return `<section class="sfv3-section" id="sfv3-products"><header><span><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</span><a href="${route({ slug: vm.store.slug, view: "produtos" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">Ver todos</a></header><div class="sfv3-product-grid">${products.map((product) => api.productCard(vm, product)).join("") || api.emptyState("Nenhum produto", "A loja ainda está preparando o catálogo.")}</div></section>`;
  };

  api.home = function home(vm) {
    const products = (vm.products || []).filter((product) => product.featured);
    return `${api.hero(vm)}${api.benefits()}${api.categories(vm)}${api.productSection(vm, products.length ? products : (vm.products || []).slice(0, 6), "Mais vendidos")}${api.contact(vm)}`;
  };

  api.productPage = function productPage(vm, product = {}) {
    return `<section class="sfv3-product-page"><a class="sfv3-back" href="${route({ slug: vm.store.slug, view: "home" })}" onclick="return navegarLojaPublicaLink(event,this,{scrollTop:true})">← Voltar</a><div class="sfv3-product-page__media">${image(productImage(vm, product), { alt: product.title || "Produto", kind: "product" })}</div><div class="sfv3-product-page__info"><small>${esc(call("getStorefrontCategoryName", vm, product.category_id) || "Personalizado")}</small><h1>${esc(product.title || "Produto")}</h1><strong>${product.show_price === false ? "Sob orçamento" : money(product.price)}</strong><p>${esc(product.description || product.short_description || "Produto preparado para orçamento.")}</p><button type="button" onclick="adicionarProdutoCarrinhoLojaPublica('${attr(product.id)}')">${icon("carrinho")} Adicionar ao orçamento</button></div></section>`;
  };

  api.categoriesPage = function categoriesPage(vm) {
    return `<section class="sfv3-section"><header><span><h1>Categorias</h1><p>Explore as áreas da loja.</p></span></header><div class="sfv3-category-list">${(vm.categories || []).map((cat) => api.categoryCard(vm, cat)).join("") || api.emptyState("Sem categorias", "A loja ainda está preparando categorias.")}</div></section>`;
  };

  api.categoryPage = function categoryPage(vm, category = {}) {
    const products = (vm.products || []).filter((product) => String(product.category_id) === String(category.id));
    return api.productSection(vm, products, category.name || "Categoria", `${products.length} produtos encontrados`);
  };

  api.contact = function contact(vm) {
    const contact = call("getStorefrontContactConfig", vm.store || {}) || {};
    const mode = modeOf(vm);
    const entries = [["whatsapp", "WhatsApp", contact.whatsapp], ["instagram", "Instagram", contact.instagram], ["tiktok", "TikTok", contact.tiktok], ["email", "E-mail", contact.email], ["map-pin", "Endereço", contact.address]].filter((item) => item[2]);
    return `<section class="sfv3-contact" id="sfv3-contact" ${mode.admin ? `onclick="${edit("contacts", "", "contacts", "whatsapp", "contact")}"` : ""}><header><h2>Estamos aqui para ajudar</h2><p>Fale com a loja e solicite seu orçamento.</p></header><div>${entries.map(([i, t, v]) => `<article>${icon(i)}<strong>${t}</strong><span>${esc(v)}</span></article>`).join("") || `<p>Os canais de contato serão exibidos aqui.</p>`}</div>${contact.whatsapp ? `<button type="button" onclick="event.stopPropagation(); abrirWhatsappLojaPublica()">${icon("whatsapp")} Falar no WhatsApp</button>` : ""}</section>`;
  };

  api.emptyState = function emptyState(title = "Nada por aqui", description = "", label = "Ver catálogo", action = "location.href='/'") {
    return `<article class="store-ui-card sfv3-empty"><span>${icon("search")}</span><h2>${esc(title)}</h2><p>${esc(description)}</p><button type="button" onclick="${attr(action)}">${esc(label)}</button></article>`;
  };

  global.SimplificaStorefrontVisualV3 = Object.freeze({ public: Object.freeze(api), version: "storefront-visual-rebuild-20260614" });
})(window);
