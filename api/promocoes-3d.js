const OFFICIAL_STORES = Object.freeze([
  {
    name: "Anycubic Brasil",
    host: "www.anycubicofficial.com.br",
    baseUrl: "https://www.anycubicofficial.com.br",
    collections: ["special-sale", "flash-sale", "sale"]
  },
  {
    name: "Creality Brasil",
    host: "crealitybrasil.com.br",
    baseUrl: "https://crealitybrasil.com.br",
    collections: ["promocao", "oferta", "oferta-turbo"],
    pixDiscount: 10
  },
  {
    name: "Eprint Store",
    host: "www.shop.eprintstore.com.br",
    baseUrl: "https://www.shop.eprintstore.com.br",
    pages: ["/"]
  },
  {
    name: "Loja Info Brasil",
    host: "lojainfobr.com.br",
    baseUrl: "https://lojainfobr.com.br",
    pages: ["/"],
    pixDiscount: 10
  }
]);

const BLOCKED_PRODUCT_WORDS = /\b(laser|scanner|gravadora|engraver|falcon|otter)\b/i;
const ALLOWED_PRODUCT_WORDS = /\b(3d|printer|impressora|filament|filamento|resin|resina|pla|petg|abs|asa|tpu|kobra|photon|ender|creality|hotend|bico|nozzle|extrusora|placa|peça|peca|acessório|acessorio)\b/i;
const REQUEST_GAP_MS = 350;
const SUPABASE_PROMOTIONS_URL = "https://qsufnnivlgdidmjuaprb.supabase.co/functions/v1/promotions-refresh";

function asNumber(value) {
  const number = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function asDate(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function classifyProduct(product = {}) {
  const title = String(product.title || "").toLowerCase();
  const text = `${title} ${product.product_type || ""} ${product.tags || ""}`.toLowerCase();
  if (/\b(printer|impressora)\s*3d\b|\b(kobra|photon|ender)\b/.test(title)) return "impressoras";
  if (/\b(kit|hotend|bico|nozzle|cabo|placa|peça|peca|acessório|acessorio|accessory|wash\s*&\s*cure|extrusora|tela lcd|filme|recipiente|módulo|modulo|plataforma)\b/.test(title)) return "materiais";
  if (/\b(filament|filamento|pla|petg|abs|asa|tpu)\b/.test(title)) return "filamentos";
  if (/\b(resin|resina)\b/.test(title)) return "resinas";
  if (/\b(printer|impressora|kobra|photon|ender)\b/.test(title)) return "impressoras";
  if (/\b(filament|filamento|pla|petg|abs|asa|tpu)\b/.test(text)) return "filamentos";
  if (/\b(resin|resina)\b/.test(text)) return "resinas";
  if (/\b(printer|impressora|kobra|photon|ender)\b/.test(text)) return "impressoras";
  return "materiais";
}

function getProductOffer(product, store, collection) {
  const text = `${product?.title || ""} ${product?.product_type || ""} ${product?.tags || ""}`;
  if (!product?.handle || BLOCKED_PRODUCT_WORDS.test(text) || !ALLOWED_PRODUCT_WORDS.test(text)) return null;

  const availableVariants = Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant?.available === true && asNumber(variant.price) > 0)
    : [];
  if (!availableVariants.length) return null;

  const currentPrice = Math.min(...availableVariants.map((variant) => asNumber(variant.price)));
  const comparablePrices = availableVariants
    .map((variant) => asNumber(variant.compare_at_price))
    .filter((price) => price > currentPrice);
  const oldPrice = comparablePrices.length ? Math.max(...comparablePrices) : 0;
  const discount = oldPrice > currentPrice
    ? Math.max(1, Math.round(((oldPrice - currentPrice) / oldPrice) * 100))
    : 0;
  const image = product.images?.find((item) => item?.src)?.src || product.image?.src || "";

  return {
    id: `${store.host}:${product.handle}`,
    store: store.name,
    host: store.host,
    title: String(product.title || "Produto 3D").trim(),
    category: classifyProduct(product),
    currentPrice,
    pixPrice: store.pixDiscount ? Math.round(currentPrice * (1 - store.pixDiscount / 100) * 100) / 100 : 0,
    oldPrice,
    discount,
    image,
    url: `${store.baseUrl}/products/${encodeURIComponent(product.handle)}`,
    collection,
    publishedAt: asDate(product.published_at || product.created_at),
    updatedAt: asDate(product.updated_at || product.published_at || product.created_at)
  };
}

async function fetchCollection(store, collection) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const url = `${store.baseUrl}/collections/${encodeURIComponent(collection)}/products.json?limit=50`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "Simplifica3D-Promocoes/1.0"
      }
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return (Array.isArray(payload?.products) ? payload.products : [])
      .map((product) => getProductOffer(product, store, collection))
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function flattenStructuredData(value) {
  if (Array.isArray(value)) return value.flatMap(flattenStructuredData);
  if (!value || typeof value !== "object") return [];
  return [value, ...flattenStructuredData(value["@graph"])];
}

function getStructuredOffer(product, store) {
  const types = Array.isArray(product?.["@type"]) ? product["@type"] : [product?.["@type"]];
  if (!types.includes("Product")) return null;
  const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
  const availableOffer = offers.find((offer) => {
    const availability = String(offer?.availability || "").toLowerCase();
    return asNumber(offer?.price) > 0 && (!availability || availability.includes("instock"));
  });
  const urlValue = product.url || availableOffer?.url;
  let url;
  try {
    url = new URL(String(urlValue || ""), store.baseUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== store.host) return null;
  const title = String(product.name || "").trim();
  const text = `${title} ${product.category || ""} ${product.description || ""}`;
  if (!title || BLOCKED_PRODUCT_WORDS.test(text) || !ALLOWED_PRODUCT_WORDS.test(text)) return null;
  const currentPrice = asNumber(availableOffer.price);
  const imageValue = Array.isArray(product.image) ? product.image[0] : product.image;
  const image = typeof imageValue === "object" ? imageValue?.url : imageValue;
  return {
    id: `${store.host}:${url.pathname.replace(/\/+$/, "") || title}`,
    store: store.name,
    host: store.host,
    title,
    category: classifyProduct({ title, product_type: product.category, tags: product.description }),
    currentPrice,
    pixPrice: store.pixDiscount ? Math.round(currentPrice * (1 - store.pixDiscount / 100) * 100) / 100 : 0,
    oldPrice: 0,
    discount: 0,
    image: String(image || ""),
    url: url.toString(),
    collection: "pagina-oficial",
    publishedAt: asDate(product.datePublished),
    updatedAt: asDate(product.dateModified || product.datePublished),
    expiresAt: asDate(availableOffer?.validThrough || product.validThrough)
  };
}

async function fetchStructuredPage(store, page) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(new URL(page, store.baseUrl), {
      signal: controller.signal,
      headers: {
        accept: "text/html",
        "user-agent": "Simplifica3D-Promocoes/1.0"
      }
    });
    if (!response.ok) return [];
    const html = await response.text();
    const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    const products = [];
    for (const match of matches) {
      try {
        products.push(...flattenStructuredData(JSON.parse(match[1])));
      } catch {}
    }
    return products.map((product) => getStructuredOffer(product, store)).filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function loadStoreOffers(store) {
  const targets = [
    ...(store.collections || []).map((collection) => () => fetchCollection(store, collection)),
    ...(store.pages || []).map((page) => () => fetchStructuredPage(store, page))
  ];
  const offers = [];
  for (let index = 0; index < targets.length; index += 1) {
    if (index > 0) await wait(REQUEST_GAP_MS);
    offers.push(...await targets[index]());
  }
  return offers;
}

async function loadOffers() {
  // Cada loja é consultada em uma fila própria. Isso evita rajadas no mesmo
  // domínio, enquanto uma falha ou bloqueio temporário não interrompe as demais.
  const groups = await Promise.all(OFFICIAL_STORES.map(loadStoreOffers));
  const unique = new Map();
  groups.flat().forEach((offer) => {
    const current = unique.get(offer.id);
    if (!current || offer.discount > current.discount || offer.currentPrice < current.currentPrice) {
      unique.set(offer.id, offer);
    }
  });
  return diversifyOffers(Array.from(unique.values()), 60);
}

function diversifyOffers(offers, limit = 60) {
  const now = Date.now();
  const sorted = offers.filter((offer) => !offer.expiresAt || Date.parse(offer.expiresAt) > now)
    .sort((a, b) => (Date.parse(b.updatedAt || b.publishedAt) || 0) - (Date.parse(a.updatedAt || a.publishedAt) || 0)
      || b.discount - a.discount
      || a.currentPrice - b.currentPrice
      || a.title.localeCompare(b.title, "pt-BR"));
  const queues = new Map();
  sorted.forEach((offer) => {
    const queue = queues.get(offer.host) || [];
    queue.push(offer);
    queues.set(offer.host, queue);
  });
  const diverse = [];
  while (diverse.length < limit && Array.from(queues.values()).some((queue) => queue.length)) {
    queues.forEach((queue) => {
      if (queue.length && diverse.length < limit) diverse.push(queue.shift());
    });
  }
  return diverse;
}

async function loadBotOffers() {
  try {
    const response = await fetch(SUPABASE_PROMOTIONS_URL, {
      headers: { accept: "application/json", "user-agent": "Simplifica3D-Promocoes/1.0" },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return payload?.ok && Array.isArray(payload.offers) ? payload.offers : [];
  } catch {
    return [];
  }
}

async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");
  if (String(request?.method || "GET").toUpperCase() === "OPTIONS") {
    response.status(204).end();
    return;
  }
  try {
    const requestUrl = new URL(request.url || "/", "https://erpne3d.vercel.app");
    const officialOnly = requestUrl.searchParams.get("source") === "official";
    const officialOffers = await loadOffers();
    const botOffers = officialOnly ? [] : await loadBotOffers();
    const unique = new Map([...officialOffers, ...botOffers].map((offer) => [offer.id, offer]));
    const offers = diversifyOffers(Array.from(unique.values()), 60);
    const stores = new Map(OFFICIAL_STORES.map(({ name, host }) => [host, { name, host }]));
    offers.forEach((offer) => {
      if (offer?.host && offer?.store) stores.set(offer.host, { name: offer.store, host: offer.host });
    });
    response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      stores: Array.from(stores.values()),
      offers
    });
  } catch {
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json({ ok: false, offers: [] });
  }
}

module.exports = handler;
module.exports.loadOffers = loadOffers;
module.exports.diversifyOffers = diversifyOffers;
module.exports.classifyProduct = classifyProduct;
module.exports.getProductOffer = getProductOffer;
module.exports.getStructuredOffer = getStructuredOffer;
