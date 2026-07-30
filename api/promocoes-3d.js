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
    collections: ["promocao", "oferta", "oferta-turbo"]
  }
]);

const BLOCKED_PRODUCT_WORDS = /\b(laser|scanner|gravadora|engraver|falcon|otter)\b/i;
const ALLOWED_PRODUCT_WORDS = /\b(3d|printer|impressora|filament|filamento|resin|resina|pla|petg|abs|asa|tpu|kobra|photon|ender|creality|hotend|bico|nozzle|extrusora|placa|peça|peca|acessório|acessorio)\b/i;

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

async function loadOffers() {
  const groups = await Promise.all(
    OFFICIAL_STORES.flatMap((store) => store.collections.map((collection) => fetchCollection(store, collection)))
  );
  const unique = new Map();
  groups.flat().forEach((offer) => {
    const current = unique.get(offer.id);
    if (!current || offer.discount > current.discount || offer.currentPrice < current.currentPrice) {
      unique.set(offer.id, offer);
    }
  });
  return Array.from(unique.values())
    .sort((a, b) => Date.parse(b.updatedAt || b.publishedAt || 0) - Date.parse(a.updatedAt || a.publishedAt || 0)
      || b.discount - a.discount
      || a.currentPrice - b.currentPrice
      || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, 60);
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
    const offers = await loadOffers();
    response.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      stores: OFFICIAL_STORES.map(({ name, host }) => ({ name, host })),
      offers
    });
  } catch {
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json({ ok: false, offers: [] });
  }
}

module.exports = handler;
module.exports.loadOffers = loadOffers;
module.exports.classifyProduct = classifyProduct;
module.exports.getProductOffer = getProductOffer;
