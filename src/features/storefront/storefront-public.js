(function attachStorefrontPublic(global) {
  "use strict";



function parseStorefrontAdminRoute(pathname, context = {}) {
  const { location } = context;
  if (pathname === undefined) pathname = location.pathname;
  const partes = String(pathname || "").replace(/\/+$/, "").split("/").filter(Boolean);
  if (partes[0] !== "store-admin" || !partes[1]) return null;
  return {
    slug: decodeURIComponent(partes[1] || "")
  };
}

function getStorefrontPublicRouteFromAdminRoute(pathname, context = {}) {
  const { location } = context;
  if (pathname === undefined) pathname = location.pathname;
  const adminRoute = typeof pathname === "string" || pathname === undefined
    ? parseStorefrontAdminRoute(pathname, context)
    : pathname;
  if (!adminRoute?.slug) return null;
  return {
    slug: adminRoute.slug,
    view: "home",
    productSlug: "",
    categorySlug: ""
  };
}

function getStorefrontAdminRoutePath(slug, context = {}) {
  const { getStorefrontAdminStoreLocal, storefrontAdminSlugify } = context;
  if (slug === undefined) slug = getStorefrontAdminStoreLocal().slug || "ne3d-teste";
  return `/store-admin/${encodeURIComponent(storefrontAdminSlugify(slug || "loja"))}`;
}

function parseStorefrontPublicRoute(pathname, context = {}) {
  const { location } = context;
  if (pathname === undefined) pathname = location.pathname;
  const partes = String(pathname || "").replace(/\/+$/, "").split("/").filter(Boolean);
  const simpleViews = new Set(["produtos", "categorias", "contato", "sobre"]);
  if (partes[0] !== "loja") return null;
  if (!partes[1]) return null;
  return {
    slug: decodeURIComponent(partes[1] || ""),
    view: partes[2] === "produto" ? "product" : partes[2] === "categoria" ? "category" : simpleViews.has(partes[2]) ? partes[2] : "home",
    productSlug: partes[2] === "produto" ? decodeURIComponent(partes[3] || "") : "",
    categorySlug: partes[2] === "categoria" ? decodeURIComponent(partes[3] || "") : ""
  };
}

function isSuperAdminRoute(pathname, context = {}) {
  const { location } = context;
  if (pathname === undefined) pathname = location.pathname;
  const partes = String(pathname || "").replace(/\/+$/, "").split("/").filter(Boolean);
  return partes.length === 1 && String(partes[0] || "").toLowerCase() === "superadmin";
}

function getStorefrontPublicRoutePath(route, context = {}) {
  if (route === undefined) route = getStorefrontPublicRoute(context);
  const slug = encodeURIComponent(route.slug || "ne3d-teste");
  if (route.view === "product" && route.productSlug) return `/loja/${slug}/produto/${encodeURIComponent(route.productSlug)}`;
  if (route.view === "category" && route.categorySlug) return `/loja/${slug}/categoria/${encodeURIComponent(route.categorySlug)}`;
  if (["produtos", "categorias", "contato", "sobre"].includes(route.view)) return `/loja/${slug}/${route.view}`;
  return `/loja/${slug}`;
}

function getStorefrontPublicRoute(context = {}) {
  const { storefrontPublicRouteState } = context;
  return storefrontPublicRouteState || { slug: "ne3d-teste", view: "home", productSlug: "", categorySlug: "" };
}

function getStorefrontCompatibleAdminSlugs(adminSlug, context = {}) {
  const { getStorefrontAdminStoreLocal } = context;
  if (adminSlug === undefined) adminSlug = getStorefrontAdminStoreLocal().slug;
  return new Set([
    String(adminSlug || "").toLowerCase(),
    "ne3d",
    "ne3d-teste",
    "ne3d-internal-test"
  ].filter(Boolean));
}

function isStorefrontOwnerForSlug(slug, vm = null, context = {}) {
  const { canUseStorefrontLocal, getStorefrontAdminStoreLocal, getUsuarioAtual, isAmbienteLocal, syncConfig } = context;
  if (slug === undefined) slug = getStorefrontPublicRoute(context).slug;
  const usuario = getUsuarioAtual();
  if (!usuario || !canUseStorefrontLocal(usuario)) return false;
  const currentOwner = String(syncConfig.supabaseUserId || getStorefrontAdminStoreLocal().owner_id || getUsuarioAtual()?.id || "");
  const adminStore = getStorefrontAdminStoreLocal();
  const targetSlug = String(slug || "").toLowerCase();
  const adminSlug = String(adminStore.slug || "").toLowerCase();
  const publicOwner = String(vm?.store?.owner_id || "");
  if (publicOwner && currentOwner && publicOwner === currentOwner) return true;
  if (!publicOwner && (vm?.source === "local" || isAmbienteLocal()) && getStorefrontCompatibleAdminSlugs(adminSlug, context).has(targetSlug)) return true;
  return !!targetSlug && !!adminSlug && targetSlug === adminSlug;
}

function getStorefrontPublicMode(vm = null, context = {}) {
  const { getUsuarioAtual, isStorefrontAdminContextRoute, location, registrarStorefrontDebugLeve } = context;
  const params = new URLSearchParams(location.search || "");
  const requested = params.get("admin") === "1" || isStorefrontAdminContextRoute();
  const route = vm?.route || getStorefrontPublicRoute(context);
  const owner = requested && isStorefrontOwnerForSlug(route.slug, vm, context);
  if (requested && !owner) {
    registrarStorefrontDebugLeve("owner_invalido", "Modo admin contextual solicitado sem sessão/propriedade válida.", {
      slug: route.slug || "",
      hasUser: !!getUsuarioAtual()
    });
  }
  return {
    requested,
    admin: owner,
    readonly: requested && !owner
  };
}

function sincronizarAdminLocalComLojaPublica(vm = null, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, storefrontAdminWrite } = context;
  if (!vm?.store || vm.source !== "supabase" || !getStorefrontPublicMode(vm, context).admin) return;
  try {
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.store, vm.store);
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.categories, vm.categories || []);
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, vm.products || []);
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, vm.images || []);
  } catch (_) {}
}

function getStorefrontPublicAdminUrl(route, context = {}) {
  const { APP_PUBLIC_URL, getStorefrontAdminStoreLocal, location } = context;
  if (route === undefined) route = { slug: getStorefrontAdminStoreLocal().slug || "ne3d-teste" };
  const origem = location.origin && location.origin !== "null" ? location.origin : APP_PUBLIC_URL;
  const path = getStorefrontPublicRoutePath({ slug: route.slug || getStorefrontAdminStoreLocal().slug, view: route.view || "home", productSlug: route.productSlug || "", categorySlug: route.categorySlug || "" }, context);
  return `${origem}${path}?admin=1`;
}

function getStorefrontPublicCacheKey(slug, context = {}) {
  const { STOREFRONT_PUBLIC_CACHE_PREFIX, storefrontAdminSlugify } = context;
  if (slug === undefined) slug = getStorefrontPublicRoute(context).slug;
  return `${STOREFRONT_PUBLIC_CACHE_PREFIX}${storefrontAdminSlugify(slug || "loja")}`;
}

function getStorefrontPublicCache(slug, context = {}) {
  const { localStorage } = context;
  try {
    const cached = JSON.parse(localStorage.getItem(getStorefrontPublicCacheKey(slug, context)) || "null");
    if (cached?.store?.slug) return cached;
  } catch (_) {}
  return null;
}

function setStorefrontPublicCache(slug, data, context = {}) {
  const { localStorage } = context;
  try {
    localStorage.setItem(getStorefrontPublicCacheKey(slug, context), JSON.stringify({
      ...data,
      publication_verified_at: new Date().toISOString(),
      cached_at: new Date().toISOString()
    }));
  } catch (_) {}
}

function getStorefrontPublicFallback(slug, context = {}) {
  const { getStorefrontAdminViewModel, isStorefrontAdminContextRoute, location } = context;
  if (slug === undefined) slug = getStorefrontPublicRoute(context).slug;
  const adminVm = getStorefrontAdminViewModel();
  const adminSlug = String(adminVm.store.slug || "").toLowerCase();
  const slugAtual = String(slug || "").toLowerCase();
  const slugCompat = getStorefrontCompatibleAdminSlugs(adminSlug, context);
  if (slugCompat.has(slugAtual)) {
    const adminRequested = new URLSearchParams(location.search || "").get("admin") === "1" || isStorefrontAdminContextRoute();
    const store = {
      ...adminVm.store,
      slug: slug || adminVm.store.slug || "ne3d-teste",
      active: adminVm.store.active === true,
      __demo: adminVm.demo?.enabled === true || adminVm.store.__demo === true
    };
    return {
      store,
      categories: adminRequested ? adminVm.categories : adminVm.categories.filter((cat) => cat.visible !== false),
      products: adminRequested ? adminVm.products : adminVm.products.filter((product) => product.visible !== false),
      images: adminVm.images || [],
      productRanking: adminVm.productRanking || [],
      limits: adminVm.limits,
      source: "local"
    };
  }
  return null;
}

function getStorefrontProductRankingFromEvents(events = [], context = {}) {
  const ranking = new Map();
  const weights = { product_view: 1, whatsapp_click: 3, add_to_cart: 5, lead_created: 9, remove_from_cart: -2 };
  (Array.isArray(events) ? events : []).forEach((event) => {
    const productId = String(event?.product_id || event?.metadata_json?.product_id || "");
    if (!productId || !Object.prototype.hasOwnProperty.call(weights, event?.event_type)) return;
    const current = ranking.get(productId) || { product_id: productId, smart_score: 0 };
    current.smart_score += weights[event.event_type];
    ranking.set(productId, current);
  });
  return Array.from(ranking.values());
}

function ordenarProdutosLojaInteligente(products = [], ranking = [], context = {}) {
  const scores = new Map((Array.isArray(ranking) ? ranking : []).map((item) => [String(item.product_id || ""), Number(item.smart_score || 0)]));
  return (Array.isArray(products) ? products : [])
    .map((product, index) => ({ product, index }))
    .sort((a, b) => {
      const featured = Number(b.product?.featured === true) - Number(a.product?.featured === true);
      if (featured) return featured;
      const score = (scores.get(String(b.product?.id || "")) || 0) - (scores.get(String(a.product?.id || "")) || 0);
      return score || a.index - b.index;
    })
    .map(({ product }) => product);
}

function filtrarCatalogoPublicoLoja(products = [], ranking = [], storeId = "") {
  const publicProducts = (Array.isArray(products) ? products : []).filter((product) =>
    product?.visible === true && product.stock_mode !== "unavailable"
    && (!product.store_id || String(product.store_id) === String(storeId)));
  const productIds = new Set(publicProducts.map((product) => String(product.id)));
  return {
    products: publicProducts,
    productRanking: (Array.isArray(ranking) ? ranking : [])
      .filter((item) => productIds.has(String(item?.product_id || "")))
  };
}

function getStorefrontPublicViewModel(context = {}) {
  const { getPlanoAtual, getStorefrontLimitsLocal, isAmbienteLocal, isStorefrontAdminContextRoute, location } = context;
  const route = getStorefrontPublicRoute(context);
  const adminRequested = new URLSearchParams(location.search || "").get("admin") === "1" || isStorefrontAdminContextRoute();
  const adminPreview = adminRequested ? getStorefrontPublicFallback(route.slug, context) : null;
  const adminFallback = adminPreview && getStorefrontPublicMode({ store: adminPreview.store, route, source: adminPreview.source }, context).admin
    ? adminPreview : null;
  const localFallback = isAmbienteLocal() ? getStorefrontPublicFallback(route.slug, context) : null;
  const fallback = adminFallback || localFallback;
  if (!fallback?.store) {
    return { route, store: null, categories: [], products: [], images: [], loading: true, source: "empty" };
  }
  const modeProbe = getStorefrontPublicMode({ store: fallback.store, route, source: fallback.source }, context);
  const includeHiddenForAdmin = adminRequested && modeProbe.admin;
  const categories = (fallback.categories || [])
    .filter((cat) => includeHiddenForAdmin || cat.visible !== false)
    .sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0));
  const catalog = includeHiddenForAdmin
    ? { products: fallback.products || [], productRanking: fallback.productRanking || [] }
    : filtrarCatalogoPublicoLoja(fallback.products, fallback.productRanking, fallback.store.id);
  const products = ordenarProdutosLojaInteligente(catalog.products, catalog.productRanking, context);
  return { ...fallback, route, categories, products, productRanking: catalog.productRanking, images: fallback.images || [], limits: fallback.limits || getStorefrontLimitsLocal(getPlanoAtual()?.slug), loading: false };
}

function getStorefrontPublicUrl(route, context = {}) {
  const { APP_PUBLIC_URL, location } = context;
  if (route === undefined) route = getStorefrontPublicRoute(context);
  const origem = location.origin && location.origin !== "null" ? location.origin : APP_PUBLIC_URL;
  return `${origem}${getStorefrontPublicRoutePath(route, context)}`;
}

function getStorefrontProductImage(product = {}, images = [], context = {}) {
  const gallery = images
    .filter((item) => String(item.product_id) === String(product.id))
    .sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0));
  return gallery.find((item) => item.image_url)?.image_url || product.image_url || product.images?.[0] || "";
}

function getStorefrontProductImages(product = {}, images = [], context = {}) {
  const gallery = images
    .filter((item) => String(item.product_id) === String(product.id))
    .sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0))
    .map((item) => item.image_url)
    .filter(Boolean);
  if (product.image_url) gallery.unshift(product.image_url);
  if (Array.isArray(product.images)) gallery.push(...product.images.filter(Boolean));
  return [...new Set(gallery)];
}



function selecionarImagemProdutoLojaPublica(button, context = {}) {
  const gallery = button?.closest?.(".sfv3-product-gallery");
  const main = gallery?.querySelector?.("[data-storefront-product-main]");
  const url = String(button?.dataset?.imageSrc || "");
  if (!main || !url) return false;
  main.src = url;
  main.dataset.storeImageHandled = "false";
  gallery.querySelectorAll(".sfv3-product-gallery__thumb").forEach((item) => {
    const selected = item === button;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  return true;
}

function storefrontPublicCategoryName(vm, product = {}, context = {}) {
  return vm.categories.find((cat) => String(cat.id) === String(product.category_id))?.name || product.category || "Produto 3D";
}

function storefrontPublicProductUrl(vm, product = {}, context = {}) {
  const { getStorefrontPublicRoutePath } = context;
  return getStorefrontPublicRoutePath({ slug: vm.store.slug || vm.route.slug, view: "product", productSlug: product.slug || product.id });
}

function storefrontPublicCategoryUrl(vm, category = {}, context = {}) {
  const { getStorefrontPublicRoutePath } = context;
  return getStorefrontPublicRoutePath({ slug: vm.store.slug || vm.route.slug, view: "category", categorySlug: category.slug || category.id });
}

function getStorefrontUiMode(vm, context = {}) {
  const { getStorefrontGuidedSelection, getStorefrontPublicMode, getStorefrontPublicViewModel, storefrontGuidedPanelOpen } = context;
  if (vm === undefined) vm = getStorefrontPublicViewModel();
  const mode = getStorefrontPublicMode(vm);
  if (!mode.admin) return "public";
  if (!storefrontGuidedPanelOpen) return "preview";
  const selection = getStorefrontGuidedSelection();
  switch (String(selection.type || "overview")) {
    case "products":
      return "catalog-products";
    case "categories":
      return "catalog-categories";
    case "product":
      return "edit-product";
    case "category":
      return "edit-category";
    case "banner":
      return "edit-banner";
    case "identity":
      return "edit-identity";
    case "contacts":
      return "edit-contact";
    case "links":
      return "edit-settings";
    case "checklist":
      return "publish";
    default:
      return "guided";
  }
}

function renderStorefrontImageFallbackMarkup(kind = "product", title = "Produto", context = {}) {
  const { escaparAttr, escaparHtml } = context;
  const safeKind = escaparAttr(kind || "product");
  const safeTitle = escaparAttr(title || "Produto");
  const helperText = kind === "banner"
    ? "Imagem indisponível"
    : kind === "category"
      ? "Visual da categoria"
      : "Adicione uma foto";
  return `
    <div class="store-image-fallback store-image-fallback-${safeKind}" role="img" aria-label="${safeTitle}">
      <i aria-hidden="true">▣</i>
      <span>${escaparHtml(helperText)}</span>
    </div>
  `;
}

function renderStorefrontResponsiveImage(url = "", {
  alt = "",
  className = "",
  loading = "lazy",
  decoding = "async",
  kind = "product",
  title = ""
} = {}, context = {}) {
  const { escaparAttr } = context;
  if (!String(url || "").trim()) {
    return renderStorefrontImageFallbackMarkup(kind, title || alt || "Imagem da loja", context);
  }
  const classes = String(className || "").trim();
  return `<img src="${escaparAttr(url)}" alt="${escaparAttr(alt || title || "Imagem da loja")}" ${classes ? `class="${escaparAttr(classes)}"` : ""} loading="${escaparAttr(loading)}" decoding="${escaparAttr(decoding)}" data-store-image-fallback="${escaparAttr(kind)}" data-store-image-title="${escaparAttr(title || alt || "Imagem da loja")}" onerror="handleStorefrontImageError(this)">`;
}

function handleStorefrontImageError(image, context = {}) {
  if (!image || image.dataset?.storeImageHandled === "true") return;
  image.dataset.storeImageHandled = "true";
  const wrapper = image.closest("[data-store-image-wrapper]");
  const fallback = renderStorefrontImageFallbackMarkup(
    image.dataset?.storeImageFallback || "product", image.dataset?.storeImageTitle || image.getAttribute("alt") || "Imagem da loja", context
  );
  if (wrapper) {
    wrapper.innerHTML = fallback;
    return;
  }
  image.outerHTML = fallback;
}

function renderStoreStatusBadge(product = {}, context = {}) {
  const { escaparAttr, escaparHtml, getStorefrontProductTypeLabel } = context;
  const typeLabel = getStorefrontProductTypeLabel(product);
  const mode = String(product.stock_mode || "unlimited");
  const tone = mode === "unavailable" ? "warning" : product.is_customizable ? "info" : product.featured ? "success" : "neutral";
  return `<span class="store-status-badge store-status-badge-${escaparAttr(tone)}">${escaparHtml(typeLabel)}</span>`;
}

function getStorefrontPublicCart(context = {}) {
  const { localStorage } = context;
  try {
    const cart = JSON.parse(localStorage.getItem(getStorefrontPublicCartKey(undefined, context)) || "[]");
    return Array.isArray(cart) ? cart.filter((item) => item?.product_id && Number(item.quantity || 0) > 0) : [];
  } catch (_) {
    return [];
  }
}

function getStorefrontPublicCartKey(route, context = {}) {
  const { STOREFRONT_PUBLIC_CART_KEY, getStorefrontPublicRoute, storefrontAdminSlugify } = context;
  if (route === undefined) route = getStorefrontPublicRoute();
  return `${STOREFRONT_PUBLIC_CART_KEY}:${storefrontAdminSlugify(route.slug || "loja")}`;
}

function setStorefrontPublicCart(cart = [], context = {}) {
  const { localStorage } = context;
  try {
    localStorage.setItem(getStorefrontPublicCartKey(undefined, context), JSON.stringify(cart.slice(0, 80)));
  } catch (_) {}
}

function getStorefrontAnalyticsConsent(context = {}) {
  const { STOREFRONT_ANALYTICS_CONSENT_KEY, localStorage } = context;
  try {
    const value = localStorage.getItem(STOREFRONT_ANALYTICS_CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : "unset";
  } catch (_) { return "unset"; }
}

function definirConsentimentoAnalyticsLoja(value = "rejected", context = {}) {
  const { STOREFRONT_ANALYTICS_CONSENT_KEY, localStorage, mostrarToast, renderApp } = context;
  const normalized = value === "accepted" ? "accepted" : "rejected";
  try { localStorage.setItem(STOREFRONT_ANALYTICS_CONSENT_KEY, normalized); } catch (_) {}
  mostrarToast(normalized === "accepted" ? "Medição de uso da loja ativada." : "Medição de uso da loja desativada.", "sucesso", 3000);
  renderApp();
}

function limparPersistenciaPublicaLegadaComPii(context = {}) {
  const { STOREFRONT_PUBLIC_EVENTS_KEY, STOREFRONT_PUBLIC_LEADS_KEY, STOREFRONT_PUBLIC_ORDER_DRAFTS_KEY, localStorage } = context;
  try {
    localStorage.removeItem(STOREFRONT_PUBLIC_LEADS_KEY);
    localStorage.removeItem(STOREFRONT_PUBLIC_EVENTS_KEY);
    localStorage.removeItem(STOREFRONT_PUBLIC_ORDER_DRAFTS_KEY);
  } catch (_) {}
}


function getStorefrontPublicCartSummary(vm, context = {}) {
  const { getStorefrontPublicCart, getStorefrontPublicViewModel } = context;
  if (vm === undefined) vm = getStorefrontPublicViewModel();
  const products = vm.products || [];
  const items = getStorefrontPublicCart()
    .map((item) => {
      const product = products.find((prod) => String(prod.id) === String(item.product_id));
      if (!product) return null;
      const quantity = Math.max(1, Number(item.quantity || 1));
      const price = Number(product.price || item.price || 0);
      return { ...item, product, quantity, price, subtotal: quantity * price };
    })
    .filter(Boolean);
  return {
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.subtotal, 0)
  };
}

function adicionarProdutoCarrinhoLojaPublica(productId = "", quantity = 1, context = {}) {
  const { getStorefrontPublicCart, getStorefrontPublicVmProduto, mostrarToast, registrarEventoLojaPublica, renderApp, setStorefrontPublicCart } = context;
  const { product } = getStorefrontPublicVmProduto(productId);
  if (!product || String(product.stock_mode || "") === "unavailable") return mostrarToast("Produto indisponível no momento.", "erro", 3200);
  const cart = getStorefrontPublicCart();
  const current = cart.find((item) => String(item.product_id) === String(product.id));
  if (current) current.quantity = Math.min(99, Number(current.quantity || 1) + Math.max(1, Number(quantity || 1)));
  else cart.push({ product_id: product.id, quantity: Math.max(1, Number(quantity || 1)), price: Number(product.price || 0), added_at: new Date().toISOString() });
  setStorefrontPublicCart(cart);
  registrarEventoLojaPublica("add_to_cart", { product_id: product.id }, { silent: true });
  mostrarToast("Produto adicionado ao carrinho.", "sucesso", 2200);
  renderApp();
}

function atualizarQuantidadeCarrinhoLojaPublica(productId = "", delta = 0, context = {}) {
  const { abrirCarrinhoLojaPublica, getStorefrontPublicCart, registrarEventoLojaPublica, renderApp, setStorefrontPublicCart } = context;
  const cart = getStorefrontPublicCart();
  const item = cart.find((entry) => String(entry.product_id) === String(productId));
  if (!item) return;
  item.quantity = Math.max(0, Math.min(99, Number(item.quantity || 1) + Number(delta || 0)));
  setStorefrontPublicCart(cart.filter((entry) => Number(entry.quantity || 0) > 0));
  if (delta < 0) registrarEventoLojaPublica("remove_from_cart", { product_id: productId }, { silent: true });
  abrirCarrinhoLojaPublica();
  renderApp();
}

function removerProdutoCarrinhoLojaPublica(productId = "", context = {}) {
  const { abrirCarrinhoLojaPublica, getStorefrontPublicCart, registrarEventoLojaPublica, renderApp, setStorefrontPublicCart } = context;
  setStorefrontPublicCart(getStorefrontPublicCart().filter((entry) => String(entry.product_id) !== String(productId)));
  registrarEventoLojaPublica("remove_from_cart", { product_id: productId }, { silent: true });
  abrirCarrinhoLojaPublica();
  renderApp();
}

function limparCarrinhoLojaPublica(context = {}) {
  const { fecharPopup, mostrarToast, renderApp, setStorefrontPublicCart } = context;
  setStorefrontPublicCart([]);
  mostrarToast("Carrinho limpo.", "info", 2200);
  fecharPopup();
  renderApp();
}

function renderStoreAdSlot({ placement = "inline", label = "Espaço patrocinado" } = {}, context = {}) {
  const { escaparAttr, escaparHtml } = context;
  return `
    <aside class="store-ad-slot store-ad-slot-${escaparAttr(placement)}" data-ad-ready="future" hidden>
      <span>Patrocinado</span>
      <strong>${escaparHtml(label)}</strong>
    </aside>
  `;
}

function renderStoreSponsoredCard(context = {}) {
  return renderStoreAdSlot({ placement: "card", label: "Card patrocinado preparado para fase futura" }, context);
}

function renderInlineStoreAd(context = {}) {
  return renderStoreAdSlot({ placement: "inline", label: "Anúncio inline preparado para fase futura" }, context);
}


function invalidarStorefrontPublicCache(slug, context = {}) {
  const { getStorefrontPublicCacheKey, getStorefrontPublicRoute, localStorage, sessionStorage, storefrontAdminSlugify } = context;
  if (slug === undefined) slug = getStorefrontPublicRoute().slug;
  const normalizedSlug = storefrontAdminSlugify(slug || "loja");
  try { localStorage.removeItem(getStorefrontPublicCacheKey(slug)); } catch (_) {}
  try { sessionStorage.setItem(`simplifica-storefront-public-revoked:${normalizedSlug}`, "1"); } catch (_) {}
}

function storefrontPublicPublicationIsRevoked(slug, context = {}) {
  const { getStorefrontPublicRoute, sessionStorage, storefrontAdminSlugify } = context;
  if (slug === undefined) slug = getStorefrontPublicRoute().slug;
  try { return sessionStorage.getItem(`simplifica-storefront-public-revoked:${storefrontAdminSlugify(slug || "loja")}`) === "1"; } catch (_) { return false; }
}

function confirmarPublicacaoStorefront(slug, context = {}) {
  const { getStorefrontPublicRoute, sessionStorage, storefrontAdminSlugify } = context;
  if (slug === undefined) slug = getStorefrontPublicRoute().slug;
  try { sessionStorage.removeItem(`simplifica-storefront-public-revoked:${storefrontAdminSlugify(slug || "loja")}`); } catch (_) {}
}

async function reservarCreditoPedidoFree(actionType, label = "ação", context = {}) {
  const { ADS_ENABLED, FREE_ACTION_CREDIT_LIMIT, FREE_ACTION_FALLBACK_UNLOCK_MINUTES, getPlanPolicy, getUsuarioMonetizacao, minutosRestantesFallbackAcoes, mostrarToast, registrarAuditoria, tentarLiberarCreditosAcaoPorAnuncio, window } = context;
  if (!ADS_ENABLED) return { allowed: true, receipt: null, user: null, actionType };
  const monetizacao = window.MonetizationLimits;
  const usuario = getUsuarioMonetizacao();
  if (!monetizacao || getPlanPolicy().isPro || !monetizacao.shouldCountAction?.(actionType)) {
    return { allowed: true, receipt: null, user: usuario, actionType };
  }
  if (!monetizacao.canUseAction(usuario)) {
    const liberado = await tentarLiberarCreditosAcaoPorAnuncio(actionType);
    if (!liberado || !monetizacao.canUseAction(usuario)) {
      const minutos = minutosRestantesFallbackAcoes(usuario) || FREE_ACTION_FALLBACK_UNLOCK_MINUTES;
      mostrarToast(`Limite de ações do Free atingido. Como o anúncio não abriu, a liberação automática acontece em até ${minutos} minuto(s).`, "aviso", 6500);
      registrarAuditoria("limite ações free", { actionType, label, fallbackMinutes: minutos });
      return { allowed: false, receipt: null, user: usuario, actionType };
    }
  }
  const receipt = monetizacao.registerAction(usuario, actionType);
  const restantes = Math.max(0, Number(receipt?.limit || FREE_ACTION_CREDIT_LIMIT) - Number(receipt?.count || 0));
  if (restantes <= 3) mostrarToast(`${restantes} ação(ões) restantes no Free antes do próximo anúncio.`, restantes ? "info" : "aviso", 3600);
  return { allowed: true, receipt: { count: Number(receipt?.count), updatedAt: Number(receipt?.updatedAt) }, user: usuario, actionType };
}

function compensarCreditoPedidoFree(reservation, context = {}) {
  const { window } = context;
  if (!reservation?.receipt) return { refunded: false, reason: "NOT_RESERVED" };
  return window.MonetizationLimits?.refundRegisteredAction?.(reservation.user, reservation.actionType, reservation.receipt)
    || { refunded: false, reason: "REFUND_UNAVAILABLE" };
}

function isStorefrontGuidedTarget(section = "", field = "", context = {}) {
  const { getStorefrontGuidedSelection } = context;
  const selection = getStorefrontGuidedSelection();
  const sectionMatches = section && String(selection.targetSection || "").toLowerCase() === String(section).toLowerCase();
  const fieldMatches = field && String(selection.targetField || "").toLowerCase() === String(field).toLowerCase();
  return !!(sectionMatches || fieldMatches);
}

function getStorefrontEditorVisualV3(context = {}) {
  const { window } = context;
  const renderer = window.SimplificaStorefrontVisualV3?.editor;
  if (!renderer) throw new Error("Editor visual V3 nao carregado.");
  return renderer;
}





function atualizarStorefrontConnectionBadge(context = {}) {
  const { document, navigator } = context;
  document.querySelectorAll("[data-storefront-connection]").forEach((node) => {
    const online = typeof navigator === "undefined" ? true : navigator.onLine !== false;
    node.classList.toggle("online", online);
    node.classList.toggle("offline", !online);
    const label = node.querySelector("span");
    if (label) label.textContent = online ? "Online" : "Offline - Loja em modo local";
  });
}

function getStorefrontRenderSource(source = "", context = {}) {
  return "v3-rebuilt";
}

function renderStorefrontView({ mode = "public", source = "", vm = null, options = {} } = {}, context = {}) {
  const { getStorefrontAdminViewModel, renderStorefrontAdminStandalone, renderStorefrontV3Home, renderStorefrontV3Root } = context;
  const renderMode = String(mode || "public").trim().toLowerCase();
  if (renderMode === "preview") {
    const previewVm = vm || getStorefrontAdminViewModel();
    return renderStorefrontV3Root(previewVm, renderStorefrontV3Home(previewVm));
  }
  if (renderMode === "editor") {
    return renderStorefrontAdminStandalone();
  }
  return renderStorefrontPublicV3Rebuilt(context, options);
}

function getStorefrontPlanToneClass(context = {}) {
  const { getPlanoAtual, normalizarSlugPlano } = context;
  const slug = normalizarSlugPlano(getPlanoAtual()?.slug || "free");
  if (["pro", "plus", "premium", "premium_trial"].includes(slug)) return "store-plan-pro";
  if (slug === "start") return "store-plan-start";
  return "store-plan-free";
}

function renderLojaOnlinePublica(context = {}) {
  return renderStorefrontView({ mode: "public" }, context);
}

function atualizarSeoLojaPublica(vm, product = null, context = {}) {
  const { document, getStorefrontDisplayName, getStorefrontProductImage, getStorefrontPublicUrl } = context;
  try {
    const validCategory = vm.route?.view !== "category" || (vm.categories || []).some((item) => String(item.slug || item.id) === String(vm.route?.categorySlug));
    const validContent = !!vm?.store && (vm.route?.view !== "product" || !!product) && validCategory;
    if (!validContent) {
      document.querySelector('meta[name="robots"]')?.setAttribute("content", "noindex,nofollow,noarchive");
      document.head.querySelector('link[rel="canonical"]')?.remove();
      return;
    }
    const storeDisplayName = getStorefrontDisplayName(vm.store);
    const title = product?.title ? `${product.title} | ${storeDisplayName}` : `${storeDisplayName} | Simplifica 3D`;
    const description = product?.description || vm.store?.description || "Loja online de produtos e personalizados em impressão 3D.";
    const image = product
      ? getStorefrontProductImage(product, vm.images || [])
      : (vm.store?.banner_url || vm.store?.logo_url || "/assets/simplifica-brand-cover.jpg");
    const url = getStorefrontPublicUrl(vm.route);
    document.title = title;

    [
      ["description", description],
      ["og:title", title],
      ["og:description", description],
      ["og:url", url],
      ["og:type", product ? "product" : "website"],
      ["og:image", image],
      ["og:site_name", storeDisplayName || "Simplifica 3D"],
      ["og:locale", "pt_BR"],
      ["twitter:card", "summary_large_image"],
      ["twitter:title", title],
      ["twitter:description", description],
      ["twitter:image", image],
      ["theme-color", "#ffffff"],
      ["apple-mobile-web-app-title", storeDisplayName || "Simplifica 3D"]
    ].forEach(([name, content]) => {
      const selector = name.startsWith("og:") ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.head.querySelector(selector);
      if (!meta) {
        meta = document.createElement("meta");
        if (name.startsWith("og:")) meta.setAttribute("property", name);
        else meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", String(content || ""));
    });

    document.head.querySelector('meta[name="robots"]')?.setAttribute("content", "index,follow,max-image-preview:large");

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    const favicon = vm.store?.favicon_url || vm.store?.logo_url;
    if (favicon) {
      ["icon", "apple-touch-icon"].forEach((rel) => {
        let icon = document.head.querySelector(`link[rel="${rel}"]`);
        if (!icon) {
          icon = document.createElement("link");
          icon.setAttribute("rel", rel);
          document.head.appendChild(icon);
        }
        icon.setAttribute("href", favicon);
      });
    }
  } catch (_) {}
}

function renderStorefrontPublicV3Rebuilt(context = {}) {
  const { STOREFRONT_V3_LIGHT_THEME, applyStoreTheme, getStorefrontDemoPreviewData, getStorefrontPublicMode, getStorefrontPublicRoutePath, getStorefrontPublicViewModel, getStorefrontPublicationAccess, isMobile, isStorefrontDemoPreviewAllowed, isStorefrontPubliclyAccessible, isStorefrontRemotePubliclyAccessible, renderStoreVisualEditorSidebar, renderStoreVisualEditorTopbar, renderStoreVisualMobileActions, renderStorefrontV3CategoriesPage, renderStorefrontV3CategoryPage, renderStorefrontV3Contact, renderStorefrontV3EmptyState, renderStorefrontV3Home, renderStorefrontV3ProductPage, renderStorefrontV3ProductSection, renderStorefrontV3Root, sincronizarAdminLocalComLojaPublica, storefrontGuidedPanelOpen, storefrontIsDemoProduct } = context;
  let vm = getStorefrontPublicViewModel();
  if (!vm.store) {
    applyStoreTheme("light", { persist: false });
    return `
      <main class="storefront-app storefront-public sfv3-host" data-storefront-version="v3-rebuilt" data-online-payment-enabled="false" data-store-theme="light" data-store-theme-preference="light">
        <div class="storefront-app storefront-public sfv3" data-storefront-version="v3-rebuilt" data-storefront-theme="light" data-store-theme="light" data-store-theme-preference="light" data-online-payment-enabled="false">
          ${renderStorefrontV3EmptyState("Loja não encontrada", "Esta Loja ainda não está ativa ou o link informado não existe.", "Voltar ao Simplifica 3D", "location.href='/'")}
        </div>
      </main>
    `;
  }
  const mode = getStorefrontPublicMode(vm);
  const renderedTheme = STOREFRONT_V3_LIGHT_THEME;
  applyStoreTheme("light", { persist: false });
  const publicationAccess = getStorefrontPublicationAccess();
  const publicAllowed = String(vm.source || "") === "local"
    ? isStorefrontPubliclyAccessible(vm.store, publicationAccess)
    : isStorefrontRemotePubliclyAccessible(vm.store);
  if (!mode.admin) {
    vm = {
      ...vm,
      categories: vm.categories.filter((category) => !category.__demo && !category.__template),
      products: vm.products.filter((product) => !storefrontIsDemoProduct(product))
    };
    if (isStorefrontDemoPreviewAllowed() && (!vm.categories.length || !vm.products.length)) {
      const demoPreview = getStorefrontDemoPreviewData(vm.store);
      vm = {
        ...vm,
        categories: vm.categories.length ? vm.categories : demoPreview.categories,
        products: vm.products.length ? vm.products : demoPreview.products,
        demo: {
          ...(vm.demo || {}),
          enabled: true,
          categories: !vm.categories.length,
          products: !vm.products.length
        }
      };
    }
  } else if (isStorefrontDemoPreviewAllowed() && (!vm.categories.length || !vm.products.length)) {
    const demoPreview = getStorefrontDemoPreviewData(vm.store);
    const categories = vm.categories.length ? vm.categories : demoPreview.categories;
    const products = vm.products.length ? vm.products : demoPreview.products;
    vm = {
      ...vm,
      categories,
      products,
      demo: {
        ...(vm.demo || {}),
        enabled: true,
        categories: !vm.categories.length,
        products: !vm.products.length
      }
    };
  }
  if (!publicAllowed && !vm.store.__demo && !mode.admin) {
    return `
      <main class="storefront-app storefront-public sfv3-host" data-storefront-version="v3-rebuilt" data-online-payment-enabled="false" data-store-theme="light" data-store-theme-preference="light">
        <div class="storefront-app storefront-public sfv3" data-storefront-version="v3-rebuilt" data-store-theme="light" data-store-theme-preference="light" data-online-payment-enabled="false">
          ${renderStorefrontV3EmptyState("Loja temporariamente indisponível", "A loja não está disponível para acesso público no momento.", "Voltar", "location.href='/'")}
        </div>
      </main>
    `;
  }
  const featured = vm.products.filter((product) => product.featured);
  const productDetail = vm.route.view === "product"
    ? vm.products.find((product) => String(product.slug || product.id) === String(vm.route.productSlug))
    : null;
  const category = vm.route.view === "category"
    ? vm.categories.find((cat) => String(cat.slug || cat.id) === String(vm.route.categorySlug))
    : null;
  const routeMissing = (vm.route.view === "product" && !productDetail)
    || (vm.route.view === "category" && !category);
  const catalog = category ? vm.products.filter((product) => String(product.category_id) === String(category.id)) : vm.products;
  atualizarSeoLojaPublica(vm, productDetail, context);
  sincronizarAdminLocalComLojaPublica(vm);
  const pageContent = productDetail ? renderStorefrontV3ProductPage(vm, productDetail)
    : routeMissing ? renderStorefrontV3EmptyState("Conteúdo não encontrado", "O item solicitado não está disponível nesta Loja.", "Voltar para a loja", `location.href='${getStorefrontPublicRoutePath({ slug: vm.store.slug, view: "home" })}'`)
      : vm.route.view === "category" && category ? renderStorefrontV3CategoryPage(vm, category)
        : vm.route.view === "produtos" ? renderStorefrontV3ProductSection(vm, catalog, "Produtos da loja", "Explore o catálogo e solicite orçamento pelo WhatsApp.")
          : vm.route.view === "categorias" ? renderStorefrontV3CategoriesPage(vm)
            : vm.route.view === "contato" ? renderStorefrontV3Contact(vm)
              : renderStorefrontV3Home(vm);
  const storeContent = renderStorefrontV3Root(vm, pageContent);
  const mobileGuidedEditorOnly = mode.admin && isMobile() && storefrontGuidedPanelOpen;

  return `
    <main class="storefront-app ${mode.admin ? `storefront-editor sfe-host ${getStorefrontPlanToneClass(context)}` : "storefront-public"} sfv3-host" data-storefront-version="v3-rebuilt" data-online-payment-enabled="false" data-store-theme="light" data-store-theme-preference="light">
      ${mode.admin ? `
        <div class="sfe-workspace ${mobileGuidedEditorOnly ? "sfe-workspace--mobile" : "sfe-workspace--desktop"}" data-store-editor-theme="light" data-editor-mobile-v3-only="${mobileGuidedEditorOnly ? "true" : "false"}">
          ${renderStoreVisualEditorSidebar(vm)}
          ${mobileGuidedEditorOnly ? "" : `
            <section class="sfe-workspace__main">
              ${renderStoreVisualEditorTopbar(vm)}
              <div class="sfe-workspace__preview" data-storefront-theme="light">${storeContent}</div>
              ${renderStoreVisualMobileActions(vm)}
            </section>
          `}
        </div>
      ` : storeContent}
    </main>
  `;
}



async function storefrontPublicRequest(path, options = {}, context = {}) {
  const { requisicaoSupabase } = context;
  return requisicaoSupabase(path, { ...options, auth: false, telemetry: false, timeoutMs: options.timeoutMs || 10000 });
}

async function hidratarLojaPublicaSeNecessario(context = {}) {
  const { confirmarPublicacaoStorefront, estaOnline, getStorefrontPublicRoute, invalidarStorefrontPublicCache, location, registrarVisualizacaoProdutoLojaPublica, renderApp, setStorefrontPublicCache, storefrontPublicRouteState, telaAtual } = context;
  if (telaAtual !== "lojaPublica" || !storefrontPublicRouteState || !estaOnline()) return;
  const route = getStorefrontPublicRoute();
  try {
    const slug = encodeURIComponent(route.slug);
    const adminRequested = new URLSearchParams(location.search || "").get("admin") === "1";
    const stores = await storefrontPublicRequest(`/rest/v1/stores?select=*&slug=eq.${slug}${adminRequested ? "" : "&active=eq.true"}&limit=1`, undefined, context);
    const store = Array.isArray(stores) ? stores[0] : null;
    if (!store?.id) {
      invalidarStorefrontPublicCache(route.slug);
      renderApp();
      return;
    }
    const storeId = encodeURIComponent(store.id);
    const [categories, products, images, productRanking] = await Promise.all([
      storefrontPublicRequest(`/rest/v1/store_categories?select=*&store_id=eq.${storeId}&visible=eq.true&order=order_index.asc`, undefined, context),
      storefrontPublicRequest(`/rest/v1/store_products?select=*&store_id=eq.${storeId}&visible=eq.true&order=featured.desc,updated_at.desc`, undefined, context),
      storefrontPublicRequest(`/rest/v1/store_product_images?select=*&store_id=eq.${storeId}&order=order_index.asc`, undefined, context),
      storefrontPublicRequest("/rest/v1/rpc/get_storefront_product_ranking", {
        method: "POST",
        body: JSON.stringify({ p_store_id: store.id })
      }, context).catch(() => [])
    ]);
    const catalog = filtrarCatalogoPublicoLoja(products, productRanking, store.id);
    setStorefrontPublicCache(route.slug, { store, categories: categories || [], ...catalog, images: images || [], source: "supabase" });
    confirmarPublicacaoStorefront(route.slug);
    registrarEventoLojaPublica("store_view", { slug: route.slug }, { silent: true }, context);
    registrarVisualizacaoProdutoLojaPublica(route);
    renderApp();
  } catch (error) {
    console.warn("[Storefront public] hydrate failed", error);
  }
}

function getStorefrontPublicVmProduto(productId = "", context = {}) {
  const { getStorefrontPublicViewModel } = context;
  const vm = getStorefrontPublicViewModel();
  const product = vm.products.find((item) => String(item.id) === String(productId) || String(item.slug) === String(productId));
  return { vm, product };
}

function montarMensagemProdutoLojaPublica(product = {}, vm, lead = {}, context = {}) {
  const { getStorefrontPublicUrl, getStorefrontPublicViewModel } = context;
  if (vm === undefined) vm = getStorefrontPublicViewModel();
  const linhas = [
    `Olá! Tenho interesse neste produto da loja ${vm.store?.name || "Simplifica 3D"}:`,
    "",
    `${product.title || "Produto"} - ${renderPrecoProdutoLojaOnline(product, context)}`,
    product.estimated_production_time ? `Prazo informado: ${product.estimated_production_time}` : "",
    "",
    lead.customer_name ? `Meu nome: ${lead.customer_name}` : "Meu nome:",
    lead.customer_note ? `Observação: ${lead.customer_note}` : "Observação:",
    "",
    `Link da loja: ${getStorefrontPublicUrl(vm.route)}`
  ].filter((line) => line !== "");
  return linhas.join("\n");
}

function renderPrecoProdutoLojaOnline(product = {}, context = {}) {
  const { formatarMoeda } = context;
  if (product.show_price === false || String(product.price_mode || "").toLowerCase() === "quote") return "Sob orçamento";
  const price = Number(product.price || 0);
  return price > 0 ? formatarMoeda(price) : "Preço sob consulta";
}

function validarWhatsappLojaPublica(vm, context = {}) {
  const { getStorefrontContactConfig, getStorefrontPublicMode, getStorefrontPublicViewModel, mostrarToast, normalizarTelefoneWhatsapp, selecionarItemLojaVisual } = context;
  if (vm === undefined) vm = getStorefrontPublicViewModel();
  const contact = getStorefrontContactConfig(vm.store || {});
  if (normalizarTelefoneWhatsapp(contact.whatsapp || "")) return true;
  const adminMode = getStorefrontPublicMode(vm).admin;
  mostrarToast(adminMode ? "Adicione o WhatsApp em Contatos antes de receber orçamentos." : "Esta loja ainda está configurando o atendimento por WhatsApp.", "aviso", 4200);
  if (adminMode) selecionarItemLojaVisual("contacts");
  return false;
}

function montarMensagemCarrinhoLojaPublica(vm, summary, lead = {}, context = {}) {
  const { formatarMoeda, getStorefrontPublicUrl } = context;
  const linhas = [
    `Olá! Tenho interesse nestes produtos da loja ${vm.store?.name || "Simplifica 3D"}:`,
    "",
    ...summary.items.map((item, index) => `${index + 1}. ${item.quantity}x ${item.product.title || "Produto"} - ${formatarMoeda(item.price)} cada`),
    "",
    `Subtotal estimado: ${formatarMoeda(summary.subtotal)}`,
    "",
    lead.customer_name ? `Meu nome: ${lead.customer_name}` : "Meu nome:",
    lead.customer_note ? `Observação: ${lead.customer_note}` : "Observação:",
    "",
    `Link da loja: ${getStorefrontPublicUrl({ slug: vm.store?.slug || vm.route.slug, view: "home" })}`
  ];
  return linhas.join("\n");
}

function abrirCarrinhoLojaPublica(context = {}) {
  const { document, escaparAttr, escaparHtml, formatarMoeda, getStorefrontControlledTheme, getStorefrontProductImage, getStorefrontPublicCartSummary, getStorefrontPublicViewModel, getStorefrontV3PaymentState, renderUiIcon, storefrontPublicCategoryName } = context;
  const vm = getStorefrontPublicViewModel();
  const summary = getStorefrontPublicCartSummary(vm);
  const storefrontTheme = getStorefrontControlledTheme(vm.store?.theme_config || {});
  const paymentState = getStorefrontV3PaymentState();
  const popup = document.getElementById("popup");
  if (!popup) return;
  const renderCartThumb = (product) => {
    const url = getStorefrontProductImage(product, vm.images || []);
    return `<div class="store-cart-thumb">${url ? `<img src="${escaparAttr(url)}" loading="lazy" decoding="async" alt="${escaparAttr(product.title || "Produto")}">` : renderUiIcon("estoque")}</div>`;
  };
  popup.innerHTML = `
    <div class="storefront-modal sfv3-modal sfv3-modal--cart" data-storefront-version="v3-rebuilt" data-online-payment-enabled="${paymentState.onlinePaymentEnabled ? "true" : "false"}" data-checkout-mode="${escaparAttr(paymentState.checkoutMode)}" data-store-theme="light" data-store-theme-preference="light" role="dialog" aria-modal="true">
      <form class="sfv3-modal__panel" onsubmit="enviarCarrinhoLojaPublica(event)">
        <div class="sfv3-modal__header">
          <div>
            <span class="sfv3-status">Orçamento</span>
            <h2>Carrinho da loja</h2>
            <p>Revise os itens e envie a solicitação pelo WhatsApp.</p>
          </div>
          <button class="store-ui-icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="sfv3-cart-items">
          ${summary.items.map((item) => `
            <article class="sfv3-cart-item">
              ${renderCartThumb(item.product)}
              <div>
                <strong>${escaparHtml(item.product.title || "Produto")}</strong>
                <span>${escaparHtml(renderPrecoProdutoLojaOnline(item.product, context))} • ${escaparHtml(storefrontPublicCategoryName(vm, item.product))}</span>
              </div>
              <div class="sfv3-cart-stepper">
                <button type="button" onclick="atualizarQuantidadeCarrinhoLojaPublica('${escaparAttr(item.product.id)}', -1)">−</button>
                <strong>${item.quantity}</strong>
                <button type="button" onclick="atualizarQuantidadeCarrinhoLojaPublica('${escaparAttr(item.product.id)}', 1)">+</button>
              </div>
              <button class="store-ui-button--ghost" type="button" onclick="removerProdutoCarrinhoLojaPublica('${escaparAttr(item.product.id)}')">Remover</button>
            </article>
          `).join("") || `<div class="sfv3-cart-empty">${renderUiIcon("carrinho")}<strong>Carrinho vazio</strong><span>Adicione produtos do catálogo para solicitar um orçamento.</span></div>`}
        </div>
        <div class="sfv3-cart-total">
          <span>Subtotal estimado</span>
          <strong>${formatarMoeda(summary.subtotal)}</strong>
        </div>
        ${summary.items.length ? `
          <div class="sfv3-form-grid">
            <label>Nome<input name="customerName" placeholder="Seu nome"></label>
            <label>WhatsApp<input name="customerPhone" inputmode="tel" placeholder="DDD + número"></label>
          </div>
          <label class="sfv3-field"><span>Observação</span><textarea name="customerNote" rows="3" placeholder="Tamanho, cor, prazo desejado ou detalhes do personalizado"></textarea></label>
        ` : ""}
        <div class="sfv3-modal__actions">
          ${summary.items.length ? `<button class="store-ui-button--ghost" type="button" onclick="limparCarrinhoLojaPublica()">Limpar</button>` : ""}
          <button class="store-ui-button--secondary" type="button" onclick="fecharPopup()">Continuar comprando</button>
          <button class="store-ui-button" type="submit" ${summary.items.length ? "" : "disabled"}>Enviar pelo WhatsApp</button>
        </div>
      </form>
    </div>
  `;
  setTimeout(() => popup.querySelector("input[name='customerName']")?.focus(), 80);
}

function abrirStoreLeadModal(productId = "", context = {}) {
  const { document, escaparAttr, escaparHtml, getStorefrontControlledTheme, getStorefrontProductTypeLabel, getStorefrontV3PaymentState, mostrarToast, storefrontPublicCategoryName } = context;
  const { vm, product } = getStorefrontPublicVmProduto(productId, context);
  if (!product) return mostrarToast("Produto não encontrado na loja.", "erro", 3200);
  const storefrontTheme = getStorefrontControlledTheme(vm.store?.theme_config || {});
  const paymentState = getStorefrontV3PaymentState();
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="storefront-modal sfv3-modal sfv3-modal--lead" data-storefront-version="v3-rebuilt" data-online-payment-enabled="${paymentState.onlinePaymentEnabled ? "true" : "false"}" data-checkout-mode="${escaparAttr(paymentState.checkoutMode)}" data-store-theme="light" data-store-theme-preference="light" role="dialog" aria-modal="true">
      <form class="sfv3-modal--lead-panel" onsubmit="enviarLeadLojaPublica(event)">
        <div class="sfv3-modal__header">
          <div>
            <span class="sfv3-status">Solicitação</span>
            <h2>${escaparHtml(product.title || "Produto")}</h2>
            <p>Envie uma intenção de pedido para a loja. O vendedor revisa antes de virar pedido interno.</p>
          </div>
          <button class="store-ui-icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <input type="hidden" name="productId" value="${escaparAttr(product.id)}">
        <div class="sfv3-form-grid">
          <label>Nome<input name="customerName" placeholder="Seu nome"></label>
          <label>WhatsApp<input name="customerPhone" inputmode="tel" placeholder="DDD + número"></label>
        </div>
        <label class="sfv3-field"><span>Observação</span><textarea name="customerNote" rows="3" placeholder="Tamanho, cor, prazo desejado ou detalhes do personalizado"></textarea></label>
        <div class="sfv3-lead-summary">
          <strong>${escaparHtml(renderPrecoProdutoLojaOnline(product, context))}</strong>
          <span>${escaparHtml(storefrontPublicCategoryName(vm, product))} • ${escaparHtml(getStorefrontProductTypeLabel(product))}</span>
        </div>
        <div class="sfv3-modal__actions">
          <button class="store-ui-button--ghost" type="button" onclick="fecharPopup()">Cancelar</button>
          <button class="store-ui-button" type="submit">Enviar pelo WhatsApp</button>
        </div>
      </form>
    </div>
  `;
  setTimeout(() => popup.querySelector("input[name='customerName']")?.focus(), 80);
}

async function registrarLeadLojaPublica(vm, product, lead = {}, context = {}) {
  const { registrarStorefrontDebugLeve } = context;
  const item = { title: product.title, quantity: 1, price: Number(product.price || 0), product_id: product.id };
  const payload = {
    store_id: vm.store.id,
    owner_id: vm.store.owner_id,
    customer_name: lead.customer_name,
    customer_phone: lead.customer_phone,
    customer_note: lead.customer_note,
    items_json: [item],
    subtotal: Number(product.price || 0),
    whatsapp_message: lead.whatsapp_message,
    status: "novo",
    source: "storefront-public"
  };
  try {
    if (vm.source === "supabase" && !String(vm.store.id || "").startsWith("store-")) {
      const rows = await storefrontPublicRequest("/rest/v1/store_cart_leads", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload)
      }, context);
      return rows?.[0] || payload;
    }
  } catch (error) {
    registrarStorefrontDebugLeve("lead_falhou", "Lead de produto não foi salvo no Supabase; não haverá persistência local.", { message: error?.message || String(error) });
    console.warn("[Storefront public] lead best-effort failed", error);
  }
  registrarStorefrontDebugLeve("lead_nao_persistido_localmente", "Lead de produto não foi mantido neste navegador após falha remota.");
  return payload;
}

async function registrarLeadCarrinhoLojaPublica(vm, summary, lead = {}, context = {}) {
  const { registrarStorefrontDebugLeve } = context;
  const payload = {
    store_id: vm.store.id,
    owner_id: vm.store.owner_id,
    customer_name: lead.customer_name,
    customer_phone: lead.customer_phone,
    customer_note: lead.customer_note,
    items_json: summary.items.map((item) => ({ title: item.product.title, quantity: item.quantity, price: item.price, product_id: item.product.id })),
    subtotal: Number(summary.subtotal || 0),
    whatsapp_message: lead.whatsapp_message,
    status: "novo",
    source: "storefront-cart"
  };
  try {
    if (vm.source === "supabase" && !String(vm.store.id || "").startsWith("store-")) {
      const rows = await storefrontPublicRequest("/rest/v1/store_cart_leads", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload)
      }, context);
      return rows?.[0] || payload;
    }
  } catch (error) {
    registrarStorefrontDebugLeve("lead_falhou", "Lead do carrinho não foi salvo no Supabase; não haverá persistência local.", { message: error?.message || String(error) });
    console.warn("[Storefront public] cart lead best-effort failed", error);
  }
  registrarStorefrontDebugLeve("lead_nao_persistido_localmente", "Lead do carrinho não foi mantido neste navegador após falha remota.");
  return payload;
}

function storefrontProductUsesControlledStock(product = {}, context = {}) {
  const stockMode = String(product.stock_mode || "").trim().toLowerCase();
  if (["tracked", "controlado", "limited", "estoque", "stock"].includes(stockMode)) return true;
  if (product.erp_product_id || product.erpProductId) return true;
  return Number.isFinite(Number(product.stock_quantity)) && Number(product.stock_quantity) >= 0;
}

function getStorefrontOrderDraftStatus(summary = { items: [] }, context = {}) {
  const items = Array.isArray(summary.items) ? summary.items : [];
  return items.some((item) => item.stock_controlled === true || storefrontProductUsesControlledStock(item.product || item, context))
    ? "em_revisao"
    : "orcamento_pendente";
}

async function registrarPedidoRascunhoLojaPublica(vm, summary, lead = {}, savedLead = {}, source = "cart", context = {}) {
  const { registrarStorefrontDebugLeve } = context;
  const items = (Array.isArray(summary?.items) ? summary.items : []).map((item) => ({
    product_id: item.product?.id || item.product_id || item.id || null,
    erp_product_id: item.product?.erp_product_id || item.erp_product_id || null,
    title: item.product?.title || item.title || "Produto",
    quantity: Number(item.quantity || 1),
    price: Number(item.price ?? item.product?.price ?? 0),
    stock_controlled: storefrontProductUsesControlledStock(item.product || item, context)
  }));
  const payload = {
    store_id: vm.store?.id,
    owner_id: vm.store?.owner_id,
    lead_id: savedLead?.id || null,
    customer_name: lead.customer_name || savedLead?.customer_name || null,
    customer_phone: lead.customer_phone || savedLead?.customer_phone || null,
    items_json: items,
    subtotal: Number(summary?.subtotal || items.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0)),
    status: getStorefrontOrderDraftStatus({ items }, context),
    source: source === "product" ? "storefront-product-whatsapp" : "storefront-cart-whatsapp",
    created_at: new Date().toISOString()
  };
  if (!payload.store_id || !items.length) return null;
  try {
    if (vm.source === "supabase" && !String(payload.store_id || "").startsWith("store-")) {
      const rows = await storefrontPublicRequest("/rest/v1/store_order_drafts", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          store_id: payload.store_id,
          owner_id: payload.owner_id,
          lead_id: payload.lead_id,
          customer_name: payload.customer_name,
          customer_phone: payload.customer_phone,
          items_json: payload.items_json,
          subtotal: payload.subtotal,
          status: payload.status
        })
      }, context);
      return rows?.[0] || payload;
    }
  } catch (error) {
    registrarStorefrontDebugLeve("pedido_rascunho_falhou", "Rascunho da loja não foi salvo no Supabase; não haverá persistência local.", { message: error?.message || String(error) });
    console.warn("[Storefront public] order draft best-effort failed", error);
  }
  registrarStorefrontDebugLeve("rascunho_nao_persistido_localmente", "Rascunho com dados do cliente não foi mantido neste navegador após falha remota.");
  return null;
}

async function registrarEventoLojaPublica(eventType, metadata = {}, options = {}, context = {}) {
  const { STOREFRONT_ANALYTICS_EVENT_TYPES, getStorefrontAnalyticsConsent, getStorefrontPublicViewModel, registrarStorefrontDebugLeve } = context;
  if (!STOREFRONT_ANALYTICS_EVENT_TYPES.includes(eventType) || getStorefrontAnalyticsConsent() !== "accepted") return;
  const vm = getStorefrontPublicViewModel();
  if (!vm.store?.id) return;
  const source = String(metadata.source || "").slice(0, 64);
  const payload = { store_id: vm.store.id, product_id: metadata.product_id || null, event_type: eventType, metadata_json: source ? { source } : {} };
  try {
    if (vm.source === "supabase" && !String(vm.store.id || "").startsWith("store-")) {
      await storefrontPublicRequest("/rest/v1/store_events", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload)
      }, context);
      return;
    }
  } catch (error) {
    registrarStorefrontDebugLeve("persistencia_falhou", "Evento da loja pública não foi registrado no Supabase; fallback local será usado.", {
      eventType,
      message: error?.message || String(error)
    });
    if (!options.silent) console.warn("[Storefront public] event failed", error);
  }
  registrarStorefrontDebugLeve("analytics_nao_persistido_localmente", "Evento de analytics não foi mantido neste navegador após falha remota.", { eventType });
}

function salvarScrollLojaPublica(context = {}) {
  const { document, getStorefrontPublicRoutePath, storefrontPublicScrollPositions, telaAtual, window } = context;
  if (telaAtual !== "lojaPublica") return;
  const path = getStorefrontPublicRoutePath();
  storefrontPublicScrollPositions.set(path, window.scrollY || document.documentElement.scrollTop || 0);
}

function restaurarScrollLojaPublica(path, fallback = 0, context = {}) {
  const { getStorefrontPublicRoutePath, requestAnimationFrame, storefrontPublicScrollPositions, window } = context;
  if (path === undefined) path = getStorefrontPublicRoutePath();
  const y = storefrontPublicScrollPositions.has(path) ? storefrontPublicScrollPositions.get(path) : fallback;
  requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, Number(y) || 0), behavior: "auto" }));
}

function configurarNavegacaoLojaPublica(context = {}) {
  const { document, location, navegarLojaPublica, parseStorefrontPublicRoute, telaAtual, window } = context;
  if (window.__simplificaStorefrontPublicNavigationConfigured) return;
  window.__simplificaStorefrontPublicNavigationConfigured = true;
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (!link || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || link.target || link.hasAttribute("download")) return;
    const destino = new URL(href, location.origin);
    if (destino.origin !== location.origin || !parseStorefrontPublicRoute(destino.pathname)) return;
    const cliqueDentroDaLojaPublica = telaAtual === "lojaPublica" || !!link.closest(".sfv3");
    if (!cliqueDentroDaLojaPublica) return;
    event.preventDefault();
    navegarLojaPublica(destino.href);
  });
}

function navegarLojaPublicaLink(event, element, options = {}, context = {}) {
  const { navegarLojaPublica } = context;
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const href = element?.href || element?.getAttribute?.("href") || "";
  if (!href) return false;
  navegarLojaPublica(href, options);
  return false;
}

function abrirWhatsappLojaPublica(mensagem = "", context = {}) {
  const { getStorefrontContactConfig, getStorefrontPublicUrl, getStorefrontPublicViewModel, normalizarTelefoneWhatsapp, window } = context;
  const vm = getStorefrontPublicViewModel();
  const contact = getStorefrontContactConfig(vm.store || {});
  const phone = normalizarTelefoneWhatsapp(contact.whatsapp || "");
  if (!phone) return validarWhatsappLojaPublica(vm, context);
  const configuredMessage = contact.whatsapp_message;
  const texto = mensagem || `${configuredMessage || `Olá! Vim pela loja ${vm.store?.name || "Simplifica 3D"}.`}\n${getStorefrontPublicUrl(vm.route)}`;
  registrarEventoLojaPublica("whatsapp_click", { source: "storefront-public" }, { silent: true }, context);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
}

function normalizarUrlInstagramLoja(valor = "") {
  const informado = String(valor || "").trim();
  if (/^https?:\/\//i.test(informado)) return informado;
  const perfil = informado
    .replace(/^@+/, "")
    .replace(/^(?:www\.)?instagram\.com\/?/i, "")
    .replace(/^\/+|\/+$/g, "");
  return `https://www.instagram.com/${encodeURIComponent(perfil)}`;
}

function abrirInstagramLojaPublica(context = {}) {
  const { appConfig, getStorefrontContactConfig, getStorefrontPublicViewModel, mostrarToast, window } = context;
  const vm = getStorefrontPublicViewModel();
  const contact = getStorefrontContactConfig(vm.store || {});
  const instagram = contact.instagram || appConfig.companyInstagram || "";
  if (!String(instagram || "").trim()) return mostrarToast("Instagram da loja ainda não foi configurado.", "erro", 3600);
  registrarEventoLojaPublica("instagram_click", { source: "storefront-public" }, { silent: true }, context);
  window.open(normalizarUrlInstagramLoja(instagram), "_blank", "noopener");
}

function abrirTikTokLojaPublica(context = {}) {
  const { getStorefrontContactConfig, getStorefrontPublicViewModel, mostrarToast, window } = context;
  const vm = getStorefrontPublicViewModel();
  const contact = getStorefrontContactConfig(vm.store || {});
  const value = String(contact.tiktok || "").trim();
  if (!value) return mostrarToast("TikTok da loja ainda não foi configurado.", "erro", 3600);
  const url = /^https?:\/\//i.test(value)
    ? value
    : `https://www.tiktok.com/@${value.replace(/^@+/, "").replace(/^.*tiktok\.com\/@?/i, "")}`;
  registrarEventoLojaPublica("tiktok_click", { source: "storefront-public" }, { silent: true }, context);
  window.open(url, "_blank", "noopener");
}

function abrirEmailLojaPublica(context = {}) {
  const { appConfig, getStorefrontContactConfig, getStorefrontPublicViewModel, location, mostrarToast } = context;
  const vm = getStorefrontPublicViewModel();
  const contact = getStorefrontContactConfig(vm.store || {});
  const email = String(contact.email || appConfig.companyEmail || "").trim();
  if (!email) return mostrarToast("E-mail da loja ainda não foi configurado.", "erro", 3600);
  location.href = `mailto:${email}`;
}

function abrirWhatsappProdutoLojaPublica(productId = "", context = {}) {
  const { mostrarToast } = context;
  const { vm, product } = getStorefrontPublicVmProduto(productId, context);
  if (!product) return mostrarToast("Produto não encontrado.", "erro", 3200);
  registrarEventoLojaPublica("whatsapp_click", { product_id: product.id }, { silent: true }, context);
  abrirWhatsappLojaPublica(montarMensagemProdutoLojaPublica(product, vm, undefined, context), context);
}

function filtrarProdutosLojaPublica(query = "", context = {}) {
  const { document } = context;
  const term = String(query || "").trim().toLowerCase();
  document.querySelectorAll(".sfv3-product-card").forEach((card) => {
    const text = card.textContent?.toLowerCase?.() || "";
    card.toggleAttribute("hidden", !!term && !text.includes(term));
  });
}


function getStorefrontShareContext(url, context = {}) {
  const { getStorefrontProductImage, getStorefrontPublicUrl, getStorefrontPublicViewModel, location, parseStorefrontPublicRoute } = context;
  if (url === undefined) url = getStorefrontPublicUrl();
  const vm = getStorefrontPublicViewModel();
  const route = parseStorefrontPublicRoute(new URL(url, location.origin).pathname) || vm.route || {};
  const product = route.view === "product"
    ? vm.products.find((item) => String(item.slug || item.id) === String(route.productSlug))
    : null;
  const category = route.view === "category"
    ? vm.categories.find((item) => String(item.slug || item.id) === String(route.categorySlug))
    : null;
  const title = product?.title
    ? `${product.title} | ${vm.store?.name || "Loja"}`
    : category?.name
      ? `${category.name} | ${vm.store?.name || "Loja"}`
      : vm.store?.name || "Loja Online";
  const text = product?.title
    ? `Olha este produto da loja ${vm.store?.name || "Simplifica 3D"}: ${product.title}`
    : category?.name
      ? `Veja a categoria ${category.name} da loja ${vm.store?.name || "Simplifica 3D"}.`
      : `Conheça a loja ${vm.store?.name || "Simplifica 3D"} no Simplifica 3D.`;
  const image = product ? getStorefrontProductImage(product, vm.images || []) : (vm.store?.banner_url || vm.store?.logo_url || "/assets/simplifica-brand-cover.jpg");
  const whatsappText = `${text}\n${url}`;
  return { vm, route, product, category, title, text, image, whatsappText, url };
}

function abrirPreviewCompartilhamentoLoja(url, context = {}) {
  const { escaparAttr, escaparHtml, getStorefrontPublicUrl, window } = context;
  if (url === undefined) url = getStorefrontPublicUrl();
  const share = getStorefrontShareContext(url, context);
  const imageHtml = share.image ? `<img src="${escaparAttr(share.image)}" loading="lazy" decoding="async" alt="${escaparAttr(share.title)}">` : "";
  window.UiV3?.Dialog?.({
    title: "Link pronto para enviar",
    content: `
      <p class="muted">Use o compartilhamento nativo do celular, copie o link ou envie direto pelo WhatsApp.</p>
      <article class="store-share-preview-card">
        ${imageHtml}
        <div>
          <strong>${escaparHtml(share.title)}</strong>
          <span>${escaparHtml(share.text)}</span>
          <small>${escaparHtml(share.url)}</small>
        </div>
      </article>
      <div class="ui3-sticky-actions">
        <button class="ui3-button" data-variant="primary" type="button" data-share-native>Compartilhar no celular</button>
        <button class="ui3-button" data-variant="secondary" type="button" data-share-whatsapp>Enviar WhatsApp</button>
        <button class="ui3-button" data-variant="ghost" type="button" data-share-copy>Copiar link</button>
      </div>
    `,
    onClose: () => {},
  });
}

function copiarLinkLojaPublica(url, context = {}) {
  const { getStorefrontPublicUrl, mostrarToast, navigator, prompt } = context;
  if (url === undefined) url = getStorefrontPublicUrl();
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(() => mostrarToast("Link copiado.", "sucesso", 2200)).catch(() => prompt("Copie o link:", url));
    return;
  }
  prompt("Copie o link:", url);
}

function abrirWhatsappCompartilhamentoLoja(url, context = {}) {
  const { getStorefrontPublicUrl, window } = context;
  if (url === undefined) url = getStorefrontPublicUrl();
  const { whatsappText } = getStorefrontShareContext(url, context);
  window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank", "noopener");
}

function compartilharLojaPublica(url, options = {}, context = {}) {
  const { exigirChecklistPublicacaoLoja, getStorefrontPublicMode, getStorefrontPublicUrl, mostrarToast, navigator, registrarEventoLojaPublica, telaAtual } = context;
  if (url === undefined) url = getStorefrontPublicUrl();
  const { vm, title, text } = getStorefrontShareContext(url, context);
  const mode = getStorefrontPublicMode(vm);
  if ((mode.admin || telaAtual === "lojaOnline" || telaAtual === "lojaAdmin") && vm?.limits?.shareEnabled === false) {
    mostrarToast("Compartilhamento da loja fica disponível no Start ou Pro.", "info", 4200);
    return;
  }
  if ((mode.admin || telaAtual === "lojaOnline" || telaAtual === "lojaAdmin") && !exigirChecklistPublicacaoLoja({ intent: "compartilhar" })) return;
  if (navigator.share) {
    navigator.share({ title, text, url }).then(() => registrarEventoLojaPublica("share", { source: "native" }, { silent: true })).catch(() => {});
    return;
  }
  copiarLinkLojaPublica(url, context);
  if (!options.forceNative) mostrarToast("Compartilhamento indisponível neste navegador. O link foi copiado.", "info", 3000);
}


function sincronizarAnunciosLojaPublica(context = {}) {
  const { ADS_ENABLED, getStorefrontPublicMode, getStorefrontPublicViewModel, registrarErroAplicacaoSilencioso, telaAtual, window } = context;
  try {
    if (!ADS_ENABLED) {
      window.AdSenseService?.hideStorefrontSlots?.("RUNTIME_DISABLED");
      return;
    }
    const vm = telaAtual === "lojaPublica" ? getStorefrontPublicViewModel() : null;
    const resultado = window.AdSenseService?.syncStorefrontCards?.({
      isAdmin: vm ? getStorefrontPublicMode(vm).admin : false
    });
    if (resultado?.catch) resultado.catch(() => {});
  } catch (erro) {
    registrarErroAplicacaoSilencioso("ADSENSE_STOREFRONT_SYNC_FAILED", erro, "Anúncios da loja", { tela: telaAtual });
  }
}


async function transformarLeadLojaOnlinePreview(id, context = {}) {
  const { getStorefrontPreviewLeadsLocal, mostrarToast, renderApp, storefrontAdminCurrentOwnerId, storefrontAdminIsLocalId, storefrontAdminRead, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminWrite } = context;
  if (String(id || "").startsWith("demo-")) {
    mostrarToast("Este contato é apenas um exemplo e não gera pedido.", "info", 3200);
    return;
  }
  const leads = getStorefrontPreviewLeadsLocal();
  const lead = leads.find((item) => String(item.id) === String(id));
  if (!lead) {
    mostrarToast("Contato não encontrado na visualização.", "erro", 3200);
    return;
  }
  const draft = {
    id: `draft-${Date.now()}`,
    store_id: lead.store_id,
    owner_id: lead.owner_id,
    lead_id: lead.id,
    customer_name: lead.customer_name || "",
    customer_phone: lead.customer_phone || "",
    items_json: lead.items_json || [],
    subtotal: Number(lead.subtotal || 0),
    status: "rascunho",
    created_at: new Date().toISOString()
  };
  try {
    if (storefrontAdminRemoteReady() && !storefrontAdminIsLocalId(id)) {
      const rows = await storefrontAdminRequest("/rest/v1/store_order_drafts", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          store_id: lead.store_id,
          owner_id: storefrontAdminCurrentOwnerId(),
          lead_id: lead.id,
          customer_name: lead.customer_name || null,
          customer_phone: lead.customer_phone || null,
          items_json: lead.items_json || [],
          subtotal: Number(lead.subtotal || 0),
          status: "rascunho"
        })
      });
      await storefrontAdminRequest(`/rest/v1/store_cart_leads?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "convertido" })
      });
      if (rows?.[0]) draft.id = rows[0].id;
    }
    const drafts = storefrontAdminRead("simplifica-storefront-order-drafts-preview-v1", []);
    storefrontAdminWrite("simplifica-storefront-order-drafts-preview-v1", [draft, ...(Array.isArray(drafts) ? drafts : [])].slice(0, 100));
    storefrontAdminWrite("simplifica-storefront-leads-preview-v1", leads.map((item) => String(item.id) === String(id) ? { ...item, status: "convertido" } : item));
    mostrarToast("Pedido rascunho criado para revisão manual.", "sucesso", 3600);
    renderApp();
  } catch (error) {
    mostrarToast("Não foi possível transformar o contato em pedido agora.", "erro", 4200);
    console.error("[Storefront admin] transformar lead", error);
  }
}


function getStorefrontPreviewEventsLocal(context = {}) {
  const { getStorefrontDemoPreviewData, isStorefrontDemoPreviewAllowed, storefrontAdminRead } = context;
  const saved = storefrontAdminRead("simplifica-storefront-events-preview-v1", null);
  if (Array.isArray(saved)) return saved;
  return isStorefrontDemoPreviewAllowed() ? getStorefrontDemoPreviewData().events : [];
}


function getStorefrontPreviewLeadsLocal(context = {}) {
  const { getStorefrontDemoPreviewData, isStorefrontDemoPreviewAllowed, storefrontAdminRead } = context;
  const saved = storefrontAdminRead("simplifica-storefront-leads-preview-v1", null);
  if (Array.isArray(saved)) return saved;
  return isStorefrontDemoPreviewAllowed() ? getStorefrontDemoPreviewData().leads : [];
}
  const api = Object.freeze({ parseStorefrontAdminRoute, getStorefrontPublicRouteFromAdminRoute, getStorefrontAdminRoutePath, parseStorefrontPublicRoute, isSuperAdminRoute, getStorefrontPublicRoutePath, getStorefrontPublicRoute, getStorefrontCompatibleAdminSlugs, isStorefrontOwnerForSlug, getStorefrontPublicMode, sincronizarAdminLocalComLojaPublica, getStorefrontPublicAdminUrl, getStorefrontPublicCacheKey, getStorefrontPublicCache, setStorefrontPublicCache, getStorefrontPublicFallback, getStorefrontProductRankingFromEvents, ordenarProdutosLojaInteligente, getStorefrontPublicViewModel, getStorefrontPublicUrl, getStorefrontProductImage, getStorefrontProductImages, selecionarImagemProdutoLojaPublica, storefrontPublicCategoryName, storefrontPublicProductUrl, storefrontPublicCategoryUrl, getStorefrontUiMode, renderStorefrontImageFallbackMarkup, renderStorefrontResponsiveImage, handleStorefrontImageError, renderStoreStatusBadge, getStorefrontPublicCart, getStorefrontPublicCartKey, setStorefrontPublicCart, getStorefrontAnalyticsConsent, definirConsentimentoAnalyticsLoja, limparPersistenciaPublicaLegadaComPii, getStorefrontPublicCartSummary, adicionarProdutoCarrinhoLojaPublica, atualizarQuantidadeCarrinhoLojaPublica, removerProdutoCarrinhoLojaPublica, limparCarrinhoLojaPublica, renderStoreAdSlot, renderStoreSponsoredCard, renderInlineStoreAd, invalidarStorefrontPublicCache, storefrontPublicPublicationIsRevoked, confirmarPublicacaoStorefront, reservarCreditoPedidoFree, compensarCreditoPedidoFree, isStorefrontGuidedTarget, getStorefrontEditorVisualV3, atualizarStorefrontConnectionBadge, getStorefrontRenderSource, renderStorefrontView, getStorefrontPlanToneClass, renderLojaOnlinePublica, atualizarSeoLojaPublica, renderStorefrontPublicV3Rebuilt, storefrontPublicRequest, hidratarLojaPublicaSeNecessario, getStorefrontPublicVmProduto, montarMensagemProdutoLojaPublica, renderPrecoProdutoLojaOnline, validarWhatsappLojaPublica, montarMensagemCarrinhoLojaPublica, abrirCarrinhoLojaPublica, abrirStoreLeadModal, registrarLeadLojaPublica, registrarLeadCarrinhoLojaPublica, storefrontProductUsesControlledStock, getStorefrontOrderDraftStatus, registrarPedidoRascunhoLojaPublica, registrarEventoLojaPublica, salvarScrollLojaPublica, restaurarScrollLojaPublica, configurarNavegacaoLojaPublica, navegarLojaPublicaLink, abrirWhatsappLojaPublica, abrirInstagramLojaPublica, abrirTikTokLojaPublica, abrirEmailLojaPublica, abrirWhatsappProdutoLojaPublica, filtrarProdutosLojaPublica, getStorefrontShareContext, abrirPreviewCompartilhamentoLoja, copiarLinkLojaPublica, abrirWhatsappCompartilhamentoLoja, compartilharLojaPublica, sincronizarAnunciosLojaPublica, transformarLeadLojaOnlinePreview, getStorefrontPreviewEventsLocal, getStorefrontPreviewLeadsLocal });
  global.SimplificaStorefrontPublic = Object.freeze({ ...api, normalizarUrlInstagramLoja });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaStorefrontPublic;
})(typeof window !== "undefined" ? window : globalThis);
