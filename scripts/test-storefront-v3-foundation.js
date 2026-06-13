const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const v3css = fs.readFileSync("storefront-v3.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getStorefrontBlock() {
  const start = app.indexOf("function renderStorefrontView");
  const end = app.indexOf("function renderDashboard", start);
  assert(start >= 0 && end > start, "Bloco da storefront nao encontrado para auditoria");
  return app.slice(start, end);
}

const storefrontBlock = getStorefrontBlock();

[
  'const STOREFRONT_V3_VERSION = "storefront-v3-editor-v3-approved"',
  "const STOREFRONT_V3_LIGHT_THEME = Object.freeze",
  'primary: "#2F6F73"',
  'primaryHover: "#3B848A"',
  'selected: "#4D9CA2"',
  'accent: "#E0A243"',
  "const STOREFRONT_V3_PAYMENT_STATE = Object.freeze",
  "const STOREFRONT_V3_PRODUCT_STEPS = Object.freeze",
  "const STOREFRONT_PUBLIC_ORDER_DRAFTS_KEY",
  'paymentProvider: "disabled"',
  'paymentStatus: "disabled"',
  "paymentIntentId: null",
  'checkoutMode: "whatsapp"',
  "onlinePaymentEnabled: false",
  "function getStorefrontV3PaymentState"
].forEach((marker) => assert(app.includes(marker), `Contrato V3 ausente: ${marker}`));

[
  'const preference = STOREFRONT_V3_LIGHT_THEME.preference',
  'const mode = STOREFRONT_V3_LIGHT_THEME.mode',
  "updateStorefrontThemeColor(STOREFRONT_V3_LIGHT_THEME.mode)",
  "STOREFRONT_THEME_COLORS[STOREFRONT_V3_LIGHT_THEME.mode]",
  'data-storefront-version="${escaparAttr(STOREFRONT_V3_VERSION)}"',
  'data-online-payment-enabled="false"',
  'data-checkout-mode="${escaparAttr(paymentState.checkoutMode)}"',
  'data-store-theme="${escaparAttr(storefrontTheme.mode)}"',
  'data-store-theme-preference="${escaparAttr(storefrontTheme.preference)}"',
  "renderStorePublicV3TopStrip(vm)",
  "renderStorePublicV3SearchDock(vm)",
  "renderStorePublicBottomNav(vm)",
  "function getStorefrontCategoryVisualImage",
  "const visualBanner = userBanner || getStorefrontDemoBannerImage()",
  "function filtrarProdutosLojaPublica",
  "function registrarPedidoRascunhoLojaPublica",
  "function storefrontProductUsesControlledStock",
  "function manterCampoEditorGuiadoVisivel",
  "function getStorefrontGuidedProductChecklist",
  "onfocusin=\"manterCampoEditorGuiadoVisivel(event)\"",
  "store-guided-product-checklist",
  "store-guided-v3-sticky-head",
  "store-guided-v3-back",
  "store-guided-v3-menu",
  "store-guided-v3-fields",
  "function renderStorefrontV3Root",
  "const STOREFRONT_V3_EXAMPLE_ASSETS = Object.freeze",
  "assets/storefront-v3/examples/product-dino.jpg",
  "Dinossauro Flex",
  "Luminária Eiffel",
  "Suporte de Celular",
  "Vaso Geométrico",
  "Chaveiro Personalizado",
  "Dragão Articulado",
  'class="storefront-v3"',
  'data-storefront-version="v3"',
  "renderStorefrontV3Hero(vm)",
  "renderStorefrontV3Categories(vm)",
  "renderStorefrontV3ProductCard(vm, product)",
  "renderStorefrontV3EmptyState"
].forEach((marker) => assert(app.includes(marker), `Render V3 sem contrato: ${marker}`));

assert(app.includes("<h2>Editar produto</h2>"), "Editor Mobile V3 deve usar topo compacto de produto");
assert(app.includes("Salvar rascunho"), "Editor Mobile V3 deve usar acao oficial Salvar rascunho");
assert(!app.includes("Publicar/Salvar"), "Editor Mobile V3 nao deve manter rotulo ambiguo Publicar/Salvar");
assert(!app.includes(">Rascunho</button>"), "Editor Mobile V3 nao deve manter acao abreviada duplicada Rascunho");
assert(app.includes("mobileGuidedEditorOnly = mode.admin && isMobile() && storefrontGuidedPanelOpen"), "Editor Mobile V3 deve ter branch de render sem DOM legado");
assert(app.includes('data-editor-mobile-v3-only="${mobileGuidedEditorOnly ? "true" : "false"}"'), "Editor Mobile V3 deve expor marcador de DOM limpo");
assert(app.includes('${mobileGuidedEditorOnly ? "" : `'), "Editor Mobile V3 deve deixar de renderizar canvas/topbar legados quando aberto");

const visualEditorRenderStart = app.indexOf("const storeContent = renderStorefrontV3Root(vm, pageContent)");
const visualEditorRenderEnd = app.indexOf("function renderStorePublicInnerHeader", visualEditorRenderStart);
const visualEditorRenderBlock = app.slice(visualEditorRenderStart, visualEditorRenderEnd);
assert(visualEditorRenderBlock.includes("mobileGuidedEditorOnly"), "Render visual deve calcular modo mobile-only");
assert(visualEditorRenderBlock.includes("renderStoreVisualEditorSidebar(vm)"), "Render mobile-only deve preservar painel V3");
assert(visualEditorRenderBlock.includes('${mobileGuidedEditorOnly ? "" : `'), "Render mobile-only deve remover main legado do DOM");
assert(visualEditorRenderBlock.includes("renderStoreVisualEditorTopbar(vm)"), "Topbar desktop deve permanecer somente no branch desktop/tablet");
assert(visualEditorRenderBlock.includes("renderStoreVisualMobileActions(vm)"), "Acoes moveis antigas devem permanecer somente fora do mobile-only");

const visualSidebarStart = app.indexOf("function renderStoreVisualEditorSidebar");
const visualSidebarEnd = app.indexOf("function renderStoreVisualEditorTopbar", visualSidebarStart);
const visualSidebarBlock = app.slice(visualSidebarStart, visualSidebarEnd);
assert(visualSidebarBlock.includes("mobileV3Only = isMobile() && storefrontGuidedPanelOpen"), "Sidebar V3 deve detectar mobile-only");
assert(visualSidebarBlock.includes('${mobileV3Only ? "" : `'), "Sidebar V3 nao deve renderizar cabecalho legado no mobile-only");

const publicRenderStart = app.indexOf("function renderStorefrontPublicLegacy");
const publicRenderEnd = app.indexOf("function renderStorePublicInnerHeader", publicRenderStart);
const publicRenderBlock = app.slice(publicRenderStart, publicRenderEnd);
assert(publicRenderBlock.includes("renderStorefrontV3Root(vm, pageContent)"), "render publico deve usar raiz nova .storefront-v3");
assert(!publicRenderBlock.includes("store-public-shell storefront-root storefront-theme-v2"), "render publico nao deve usar shell visual antigo da Loja V2");
const v3RootStart = app.indexOf("function renderStorefrontV3Root");
const v3RootEnd = app.indexOf("function renderStorefrontV3BottomNav", v3RootStart);
const v3RootBlock = app.slice(v3RootStart, v3RootEnd);
assert(v3RootBlock.includes('class="storefront-v3"'), "Raiz publica V3 deve ser renderizada explicitamente");
assert(!v3RootBlock.includes("renderStorePublicCartFloating"), "Raiz publica V3 nao deve criar botao flutuante legado");
const cartModalStart = app.indexOf("function abrirCarrinhoLojaPublica");
const cartModalEnd = app.indexOf("function abrirStoreLeadModal", cartModalStart);
const cartModalBlock = app.slice(cartModalStart, cartModalEnd);
assert(cartModalBlock.includes("storefront-v3__modal-backdrop storefront-v3__cart"), "Carrinho publico deve usar modal V3");
assert(cartModalBlock.includes("storefront-v3__cart-panel"), "Carrinho publico deve usar painel V3");
assert(!cartModalBlock.includes("storefront-theme-v2"), "Carrinho publico nao pode renderizar tema visual V2");
assert(!cartModalBlock.includes("store-cart-backdrop"), "Carrinho publico nao pode renderizar backdrop visual V2");
const leadModalStart = app.indexOf("function abrirStoreLeadModal");
const leadModalEnd = app.indexOf("async function enviarLeadLojaPublica", leadModalStart);
const leadModalBlock = app.slice(leadModalStart, leadModalEnd);
assert(leadModalBlock.includes("storefront-v3__modal-backdrop storefront-v3__lead"), "Solicitacao de produto deve usar modal V3");
assert(!leadModalBlock.includes("storefront-theme-v2"), "Solicitacao de produto nao pode renderizar tema visual V2");

[
  "--store-bg:#ffffff",
  "--store-bg-soft:#f3f7f7",
  "--store-text:#1f2d2f",
  "--store-text-soft:#667a7d",
  "--store-border:#dde7e8",
  "--store-primary:#2f6f73 !important",
  "--store-primary-hover:#3b848a !important",
  "--store-selected:#4d9ca2 !important",
  "--store-accent:#e0a243 !important",
  "--store-button-bg:#2f6f73 !important",
  "--store-button-hover:#3b848a !important",
  "background-image:none !important",
  ".store-public-shell[data-storefront-version=\"storefront-v3-editor-v3-approved\"] .store-public-v3-strip",
  ".store-public-shell[data-storefront-version=\"storefront-v3-editor-v3-approved\"] .store-public-v3-search",
  ".store-public-shell[data-storefront-version=\"storefront-v3-editor-v3-approved\"] .store-category-visual img",
  ".store-public-shell[data-storefront-version=\"storefront-v3-editor-v3-approved\"] .store-empty-state",
  "grid-template-columns:repeat(2, minmax(0, 1fr))",
  ".store-public-bottom-nav",
  "--store-v3-icon-xs:14px",
  "--store-v3-icon-sm:16px",
  "--store-v3-icon-md:18px",
  "--store-v3-icon-lg:22px",
  "--store-v3-icon-tile:38px",
  "--store-v3-logo-size:40px",
  ".store-public-shell[data-storefront-version=\"storefront-v3-editor-v3-approved\"] :where(svg,.ui-icon)",
  ".store-public-shell[data-storefront-version=\"storefront-v3-editor-v3-approved\"] .store-category-visual :where(svg,.ui-icon)",
  ".store-guided-compact-preview",
  ".store-guided-v3-sticky-head",
  ".store-guided-v3-back",
  ".store-guided-v3-menu",
  ".store-guided-v3-fields",
  ".store-guided-step-nav",
  ".store-guided-step-nav button.active",
  ".store-guided-step-pane",
  ".store-guided-step-actions",
  ".store-guided-product-checklist",
  ".storefront-v3-host--admin,",
  ".store-guided-editor-sidebar.is-open,",
  ".store-guided-v3-product-form{",
  "--input-bg:#ffffff",
  ".store-guided-editor-sidebar.is-open :where(button,input,textarea,select)",
  "background-image:none",
  ".store-guided-step-actions .btn.primary",
  ".storefront-v3-host--admin .store-visual-editor-frame:has(.store-guided-editor-sidebar.is-open) .store-visual-editor-main",
  ".storefront-v3-host--admin .store-visual-editor-topbar",
  ".storefront-v3-host--admin .store-visual-editor-frame:has(.store-guided-editor-sidebar.is-open) .store-visual-mobile-actions",
  ".store-guided-editor-sidebar.is-open .store-guided-v3-product-form",
  "scroll-padding-bottom:calc(124px + var(--store-editor-v3-keyboard-inset, 0px) + var(--app-safe-bottom, 0px))"
].forEach((marker) => assert(css.includes(marker), `Paleta V3 ausente no CSS: ${marker}`));

[
  'partes[1] === "produto" ? "product"',
  'partes[1] === "categoria" ? "category"',
  'partes[2] === "produto" ? "product"',
  'partes[2] === "categoria" ? "category"',
  'getStorefrontPublicRoutePath({ slug: vm.store.slug, view: "produtos" })',
  'storefrontPublicCategoryUrl(vm, category)',
  'storefrontPublicProductUrl(vm, product)'
].forEach((marker) => assert(app.includes(marker), `Rota publica preservada ausente: ${marker}`));

[
  "createPreference",
  "checkoutPro",
  "onlinePaymentEnabled: true",
  'paymentProvider: "mercadopago"',
  "Pagar agora"
].forEach((forbidden) => assert(!storefrontBlock.includes(forbidden), `Pagamento online foi ativado indevidamente na loja: ${forbidden}`));

assert(index.includes("1.0.64-storefront-icons-20260613"), "Cache-bust Web/PWA V3 ausente no index");
assert(sw.includes("simplifica-3d-v170-storefront-icons-20260613"), "Cache V3 ausente no service worker");
assert(index.includes("/storefront-v3.css?v=1.0.64-storefront-icons-20260613"), "CSS isolado da Loja V3 nao carrega no HTML");
assert(sw.includes("./storefront-v3.css"), "CSS isolado da Loja V3 nao entra no PWA");
[
  "hero-3d-products.jpg",
  "category-decoracao.jpg",
  "category-colecionaveis.jpg",
  "category-acessorios.jpg",
  "category-utilidades.jpg",
  "category-chaveiros.jpg",
  "category-pecas-tecnicas.jpg",
  "product-dino.jpg",
  "product-eiffel.jpg",
  "product-support.jpg",
  "product-vase.jpg",
  "product-keychain.jpg",
  "product-dragon.jpg"
].forEach((file) => assert(fs.existsSync(`assets/storefront-v3/examples/${file}`), `Imagem exemplo V3 ausente: ${file}`));
assert(!app.includes("Tênis Casual Masculino"), "Exemplo de sapato do mockup do editor nao deve entrar na loja");
[
  ".storefront-v3-host,",
  ".storefront-v3__modal-backdrop{",
  "color-scheme:light",
  "--bg-primary:#ffffff",
  "--input-bg:#ffffff",
  ".storefront-v3{",
  ".storefront-v3__header",
  ".storefront-v3__hero",
  ".storefront-v3__category-card",
  ".storefront-v3__product-card",
  ".storefront-v3__empty-state",
  ".storefront-v3__bottom-nav",
  ".storefront-v3__modal-backdrop",
  ".storefront-v3__cart-panel",
  ".storefront-v3__lead-panel",
  "background-image:none",
  "grid-template-columns:repeat(2, minmax(0, 1fr))"
].forEach((marker) => assert(v3css.includes(marker), `CSS V3 isolado ausente: ${marker}`));
assert(!/linear-gradient|radial-gradient|conic-gradient/.test(v3css), "CSS isolado da Loja V3 nao deve conter gradientes herdados");

console.log("Storefront V3 approved: editor guiado, loja publica, carrinho/orcamento e cache validados.");
