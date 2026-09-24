(function attachStorefrontAdminStore(global) {
  "use strict";



function getStorefrontDemoProductImage(visual = "produto", title = "Produto", context = {}) {
  const { STOREFRONT_V3_EXAMPLE_ASSETS, escaparHtml } = context;
  const v3Assets = {
    decoracao: STOREFRONT_V3_EXAMPLE_ASSETS.categoryDecor,
    colecionaveis: STOREFRONT_V3_EXAMPLE_ASSETS.categoryCollectibles,
    acessorios: STOREFRONT_V3_EXAMPLE_ASSETS.categoryAccessories,
    utilidades: STOREFRONT_V3_EXAMPLE_ASSETS.categoryUtilities,
    chaveiros: STOREFRONT_V3_EXAMPLE_ASSETS.categoryKeychains,
    pecas: STOREFRONT_V3_EXAMPLE_ASSETS.categoryTechnical,
    "pecas-tecnicas": STOREFRONT_V3_EXAMPLE_ASSETS.categoryTechnical,
    dino: STOREFRONT_V3_EXAMPLE_ASSETS.productDino,
    dinosaur: STOREFRONT_V3_EXAMPLE_ASSETS.productDino,
    eiffel: STOREFRONT_V3_EXAMPLE_ASSETS.productEiffel,
    support: STOREFRONT_V3_EXAMPLE_ASSETS.productSupport,
    suporte: STOREFRONT_V3_EXAMPLE_ASSETS.productSupport,
    keychain: STOREFRONT_V3_EXAMPLE_ASSETS.productKeychain,
    chaveiro: STOREFRONT_V3_EXAMPLE_ASSETS.productKeychain,
    dragon: STOREFRONT_V3_EXAMPLE_ASSETS.productDragon,
    dragao: STOREFRONT_V3_EXAMPLE_ASSETS.productDragon,
    vase: STOREFRONT_V3_EXAMPLE_ASSETS.productVase,
    vaso: STOREFRONT_V3_EXAMPLE_ASSETS.productVase,
    organizer: STOREFRONT_V3_EXAMPLE_ASSETS.productOrganizer,
    organizador: STOREFRONT_V3_EXAMPLE_ASSETS.productOrganizer,
    technical: STOREFRONT_V3_EXAMPLE_ASSETS.productTechnical,
    tecnico: STOREFRONT_V3_EXAMPLE_ASSETS.productTechnical
  };
  if (v3Assets[visual]) return v3Assets[visual];
  const commons = {
    stamp: "/assets/storefront-demo/stamp.jpg?v=20260601",
    keychain: "/assets/storefront-demo/custom-part.jpg?v=20260601",
    topper: "/assets/storefront-demo/figure.jpg?v=20260601",
    cutter: "/assets/storefront-demo/organizer.jpg?v=20260601",
    keepsake: "/assets/storefront-demo/miniature.jpg?v=20260601",
    vase: "/assets/storefront-demo/vase.jpg?v=20260601"
  };
  if (commons[visual]) return commons[visual];
  const palette = {
    vase: ["#243746", "#6fb7c9", "#d8f5f2"],
    stamp: ["#2b2d36", "#9aa4b2", "#f2f7fb"],
    box: ["#232a34", "#5f7184", "#e9eef5"],
    figure: ["#251f2f", "#8d79b7", "#f3eefe"],
    miniature: ["#1f2937", "#7aa8d8", "#edf6ff"],
    custom: ["#2d2732", "#d0a870", "#fff4db"]
  };
  const [bg, main, light] = palette[visual] || palette.box;
  const safeTitle = escaparHtml(String(title || "Produto").slice(0, 34));
  const shape = {
    vase: `<path d="M265 92c-26 30-26 58-8 82 17 23 19 50-4 88-19 31-7 70 46 70h66c53 0 65-39 46-70-23-38-21-65-4-88 18-24 18-52-8-82-31 15-103 15-134 0Z" fill="${main}"/><ellipse cx="332" cy="94" rx="70" ry="18" fill="${light}" opacity=".75"/><ellipse cx="332" cy="330" rx="86" ry="18" fill="#000" opacity=".18"/>`,
    stamp: `<rect x="212" y="204" width="240" height="92" rx="18" fill="${main}"/><rect x="276" y="124" width="112" height="96" rx="22" fill="${light}" opacity=".82"/><rect x="238" y="292" width="188" height="34" rx="12" fill="#111827" opacity=".55"/>`,
    box: `<path d="m206 174 124-62 128 62-128 70-124-70Z" fill="${light}" opacity=".75"/><path d="M206 174v126l124 70V244L206 174Z" fill="${main}"/><path d="M458 174v126l-128 70V244l128-70Z" fill="#94a3b8" opacity=".58"/>`,
    figure: `<circle cx="332" cy="126" r="42" fill="${light}" opacity=".85"/><path d="M278 204c8-44 100-44 108 0l19 126H259l19-126Z" fill="${main}"/><path d="M250 332h164v26H250z" fill="#111827" opacity=".48"/>`,
    miniature: `<path d="M330 92 376 180l96 14-70 68 17 95-89-46-86 46 16-95-70-68 96-14 44-88Z" fill="${main}"/><path d="M210 358h240" stroke="${light}" stroke-width="18" stroke-linecap="round" opacity=".72"/>`,
    custom: `<rect x="196" y="154" width="272" height="164" rx="34" fill="${main}" transform="rotate(-7 332 236)"/><path d="M238 226h188M260 268h142" stroke="${light}" stroke-width="18" stroke-linecap="round" opacity=".8"/>`
  }[visual] || "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 664 440" role="img" aria-label="${safeTitle}">
    <defs>
      <radialGradient id="g" cx="50%" cy="22%" r="72%"><stop offset="0" stop-color="${light}" stop-opacity=".26"/><stop offset=".58" stop-color="${bg}" stop-opacity=".92"/><stop offset="1" stop-color="#090b10"/></radialGradient>
      <filter id="s"><feDropShadow dx="0" dy="26" stdDeviation="24" flood-color="#000" flood-opacity=".32"/></filter>
    </defs>
    <rect width="664" height="440" fill="url(#g)"/>
    <circle cx="512" cy="74" r="120" fill="${main}" opacity=".12"/>
    <g filter="url(#s)">${shape}</g>
    <text x="42" y="394" fill="#f8fbff" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">${safeTitle}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getStorefrontCategoryVisualImage(category = {}, store = null, context = {}) {
  const { getStorefrontPublicViewModel, telaAtual } = context;
  const currentStore = store
    || (telaAtual === "lojaPublica" ? getStorefrontPublicViewModel()?.store : getStorefrontAdminStoreLocal(context))
    || {};
  const categoryImages = currentStore?.theme_config?.category_images || {};
  const id = String(category?.id || "");
  const slug = String(category?.slug || "");
  return String(category?.image_url || categoryImages[id] || categoryImages[slug] || "").trim();
}

function getStorefrontDemoBannerImage(context = {}) {
  const { STOREFRONT_V3_EXAMPLE_ASSETS } = context;
  return STOREFRONT_V3_EXAMPLE_ASSETS.hero;
}

function getStorefrontDemoPreviewData(store, context = {}) {
  const { getStoreThemeSaved, getStorefrontOwnerIdLocal, normalizarTemaLojaOnline, storefrontAdminSlugify } = context;
  if (store === undefined) store = getStorefrontAdminStoreLocal(context);
  const ownerId = store.owner_id || getStorefrontOwnerIdLocal();
  const demoCategories = [
    ["Decoração", "◇", "decoracao"],
    ["Colecionáveis", "◉", "colecionaveis"],
    ["Acessórios", "▣", "acessorios"],
    ["Utilidades", "▱", "utilidades"],
    ["Chaveiros", "◌", "chaveiros"],
    ["Peças Técnicas", "⚙", "pecas-tecnicas"]
  ].map(([name, icon, visual], index) => ({
    id: `demo-cat-${storefrontAdminSlugify(name)}`,
    store_id: store.id,
    owner_id: ownerId,
    name,
    slug: storefrontAdminSlugify(name),
    icon,
    visual_type: visual,
    image_url: getStorefrontDemoProductImage(visual, name, context),
    order_index: index + 1,
    visible: true,
    __demo: true
  }));
  const categoryBySlug = (slug) => demoCategories.find((cat) => cat.slug === slug)?.id || demoCategories[0]?.id || null;
  const demoProducts = [
    ["Dinossauro Flex", "colecionaveis", 49.9, true, "2 a 5 dias úteis", "dino", "Dinossauro articulado impresso em 3D para coleção, decoração ou presente."],
    ["Luminária Eiffel", "decoracao", 79.9, true, "3 a 7 dias úteis", "eiffel", "Peça decorativa inspirada na Torre Eiffel para ambientes criativos."],
    ["Suporte de Celular", "acessorios", 29.9, true, "1 a 3 dias úteis", "support", "Suporte de mesa estável, com inclinação confortável para chamadas e vídeos."],
    ["Vaso Geométrico", "decoracao", 34.9, true, "2 a 4 dias úteis", "vase", "Cachepô geométrico leve para plantas pequenas e decoração de ambientes."],
    ["Chaveiro Personalizado", "chaveiros", 19.9, false, "Prazo sob consulta", "keychain", "Chaveiro personalizado para lembranças, brindes e presentes."],
    ["Dragão Articulado", "colecionaveis", 59.9, false, "3 a 7 dias úteis", "dragon", "Dragão articulado impresso em 3D com visual decorativo e divertido."],
    ["Organizador Modular", "utilidades", 44.9, false, "2 a 4 dias úteis", "organizer", "Organizador modular para mesa, gaveta ou bancada, produzido sob medida."],
    ["Presilha Técnica Sob Medida", "pecas-tecnicas", 24.9, false, "Prazo sob consulta", "technical", "Peça técnica de reposição feita conforme medidas e necessidade do cliente."]
  ].map(([title, categorySlug, price, featured, time, visual, description]) => ({
    id: `demo-prod-${storefrontAdminSlugify(title)}`,
    store_id: store.id,
    owner_id: ownerId,
    erp_product_id: null,
    title,
    slug: storefrontAdminSlugify(title),
    description,
    price,
    compare_price: null,
    price_mode: "fixed",
    show_price: true,
    category_id: categoryBySlug(categorySlug),
    visible: true,
    featured,
    is_customizable: categorySlug === "personalizados",
    estimated_production_time: time,
    public_observations: "",
    stock_mode: "unlimited",
    stock_quantity: null,
    visual_type: visual,
    image_url: getStorefrontDemoProductImage(visual, title, context),
    __demo: true
  }));
  demoCategories.forEach((category) => {
    category.product_count = demoProducts.filter((product) => String(product.category_id) === String(category.id)).length;
  });
  const demoLead = {
    id: "demo-lead-storefront-preview",
    store_id: store.id,
    owner_id: ownerId,
    customer_name: "Cliente demonstração",
    customer_phone: "(00) 00000-0000",
    customer_note: "Lead fictício apenas para preview.",
    items_json: [{ title: "Carimbo personalizado", quantity: 1, price: 39.9 }],
    subtotal: 39.9,
    whatsapp_message: "Mensagem demonstrativa da loja.",
    status: "novo",
    source: "demonstração",
    created_at: new Date().toISOString(),
    __demo: true
  };
  const now = new Date().toISOString();
  const demoEvents = [
    { id: "demo-event-store-view", event_type: "store_view", created_at: now, __demo: true },
    { id: "demo-event-whatsapp", event_type: "whatsapp_click", created_at: now, __demo: true },
    { id: "demo-event-cart", event_type: "add_to_cart", created_at: now, __demo: true }
  ];
  const demoStore = {
    ...store,
    name: store.name || "Minha loja criativa",
    description: store.description || "Produtos personalizados, utilidades e peças sob encomenda com acabamento profissional.",
    active: false,
    theme_config: {
      primary: store.theme_config?.primary || "#00BFA6",
      accent: store.theme_config?.accent || "#FF8A1F",
      mode: normalizarTemaLojaOnline(store.theme_config?.mode || getStoreThemeSaved()),
      template_id: store.theme_config?.template_id || "impressao-3d",
      template_name: store.theme_config?.template_name || "Impressão 3D"
    },
    __demo: true
  };
  return { store: demoStore, categories: demoCategories, products: demoProducts, leads: [demoLead], events: demoEvents, images: [] };
}

function getStorefrontAdminStoreLocal(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, STOREFRONT_PUBLICATION_STATUS, appConfig, getStorefrontOwnerIdLocal, getStorefrontPublicationStatus, storefrontAdminRead } = context;
  const ownerId = getStorefrontOwnerIdLocal();
  const defaultSlug = getStorefrontDefaultSlugLocal(context);
  const fallback = {
    id: `store-${ownerId || "local"}`,
    owner_id: ownerId,
    slug: defaultSlug,
    name: appConfig.businessName || "Minha loja 3D",
    description: "Produtos personalizados, brindes e peças sob encomenda em impressão 3D.",
    logo_url: "",
    banner_url: "",
    whatsapp: "",
    instagram: "",
    active: false,
    publication_status: STOREFRONT_PUBLICATION_STATUS.DRAFT,
    theme_config: { primary: "#00BFA6", accent: "#FF8A1F", mode: "light" }
  };
  const store = { ...fallback, ...storefrontAdminRead(STOREFRONT_ADMIN_KEYS.store, fallback), owner_id: ownerId };
  return { ...store, publication_status: getStorefrontPublicationStatus(store) };
}

function getStorefrontDefaultSlugLocal(context = {}) {
  const { appConfig, getStorefrontScopedOwnerId, getUsuarioAtual, storefrontAdminSlugify, syncConfig, usuarioAtualEmail } = context;
  const usuario = getUsuarioAtual() || {};
  const candidates = [
    appConfig.businessSlug,
    appConfig.businessName,
    usuario.store_slug,
    usuario.username,
    usuario.nome,
    usuario.email,
    usuarioAtualEmail,
    syncConfig.supabaseEmail,
    syncConfig.supabaseUserId
  ];
  for (const candidate of candidates) {
    const raw = String(candidate || "").split("@")[0];
    const slug = storefrontAdminSlugify(raw);
    if (slug && !["local", "usuario", "admin", "teste"].includes(slug)) return slug;
  }
  return `loja-${getStorefrontScopedOwnerId().slice(0, 8)}`;
}

function getStorefrontAdminCategoriesLocal(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, storefrontAdminRead } = context;
  const store = getStorefrontAdminStoreLocal(context);
  const saved = storefrontAdminRead(STOREFRONT_ADMIN_KEYS.categories, null);
  if (Array.isArray(saved)) return saved;
  return getStorefrontDemoPreviewData(store, context).categories;
}

function getStorefrontAdminProductsLocal(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, storefrontAdminRead } = context;
  const store = getStorefrontAdminStoreLocal(context);
  const saved = storefrontAdminRead(STOREFRONT_ADMIN_KEYS.products, null);
  if (Array.isArray(saved)) return saved;
  return getStorefrontDemoPreviewData(store, context).products;
}

function getStorefrontAdminImagesLocal(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, storefrontAdminRead } = context;
  const saved = storefrontAdminRead(STOREFRONT_ADMIN_KEYS.images, []);
  return Array.isArray(saved) ? saved : [];
}

function getStorefrontDefaultCategories(store, context = {}) {
  const { storefrontAdminSlugify } = context;
  if (store === undefined) store = getStorefrontAdminStoreLocal(context);
  return ["Decoração", "Personalizados", "Utilidades", "Geek e anime", "Miniaturas", "Sob encomenda"].map((name, index) => ({
    id: `template-cat-${storefrontAdminSlugify(name)}`,
    store_id: store.id,
    owner_id: store.owner_id,
    name,
    slug: storefrontAdminSlugify(name),
    icon: ["◒", "★", "▣", "✦", "◎", "+"][index] || "▦",
    order_index: index + 1,
    visible: true,
    __template: true
  }));
}

function getStorefrontAdminTab(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, STOREFRONT_ADMIN_TABS, storefrontAdminStorageGet } = context;
  const tab = storefrontAdminStorageGet(STOREFRONT_ADMIN_KEYS.tab) || "overview";
  return STOREFRONT_ADMIN_TABS.some(([id]) => id === tab) ? tab : "overview";
}

function abrirPainelLojaOnlineAdmin(tab = "", context = {}) {
  const { STOREFRONT_ADMIN_KEYS, abrirLojaPublicaAdminContextual, storefrontAdminStorageSet } = context;
  if (tab) storefrontAdminStorageSet(STOREFRONT_ADMIN_KEYS.tab, tab);
  abrirLojaPublicaAdminContextual({ slug: getStorefrontAdminStoreLocal(context).slug || getStorefrontDefaultSlugLocal(context) });
}

function abrirLojaPublicaOnline(context = {}) {
  const { getStorefrontPublicUrlLocal, window } = context;
  window.open(getStorefrontPublicUrlLocal(), "_blank", "noopener");
}

function storefrontAdminRemoteReady(context = {}) {
  const { estaOnline, syncConfig } = context;
  return !!(syncConfig.supabaseAccessToken && syncConfig.supabaseUserId && syncConfig.supabaseUrl && estaOnline());
}

async function storefrontAdminRequest(path, options = {}, context = {}) {
  const { requisicaoSupabase } = context;
  return requisicaoSupabase(path, { ...options, telemetry: false });
}
  const api = Object.freeze({ getStorefrontDemoProductImage, getStorefrontCategoryVisualImage, getStorefrontDemoBannerImage, getStorefrontDemoPreviewData, getStorefrontAdminStoreLocal, getStorefrontDefaultSlugLocal, getStorefrontAdminCategoriesLocal, getStorefrontAdminProductsLocal, getStorefrontAdminImagesLocal, getStorefrontDefaultCategories, getStorefrontAdminTab, abrirPainelLojaOnlineAdmin, abrirLojaPublicaOnline, storefrontAdminRemoteReady, storefrontAdminRequest });
  global.SimplificaStorefrontAdminStore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
