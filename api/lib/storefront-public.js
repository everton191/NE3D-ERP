const fs = require("fs");
const path = require("path");

const DEFAULT_SUPABASE_URL = "https://qsufnnivlgdidmjuaprb.supabase.co";
const DEFAULT_ORIGIN = "https://erpne3d.vercel.app";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function escapeXml(value = "") {
  return escapeHtml(value);
}

function decodeSegment(value = "") {
  try {
    return decodeURIComponent(String(value || "").trim());
  } catch (_) {
    return "";
  }
}

function validSlug(value = "") {
  return /^[a-z0-9][a-z0-9-]{0,95}$/i.test(String(value || ""));
}

function getOrigin(request) {
  const forwardedHost = String(request?.headers?.["x-forwarded-host"] || request?.headers?.host || "").split(",")[0].trim();
  const host = /^[a-z0-9.-]+(?::\d{1,5})?$/i.test(forwardedHost) ? forwardedHost : "";
  const protocol = String(request?.headers?.["x-forwarded-proto"] || "https").split(",")[0].trim() === "http" ? "http" : "https";
  return host ? `${protocol}://${host}` : DEFAULT_ORIGIN;
}

function getPublishableKey() {
  if (process.env.SUPABASE_PUBLISHABLE_KEY) return process.env.SUPABASE_PUBLISHABLE_KEY;
  try {
    const app = fs.readFileSync(path.join(process.cwd(), "app.js"), "utf8");
    return app.match(/SUPABASE_DEFAULT_ANON_KEY[\s\S]{0,400}?["'](sb_publishable_[^"']+)["']/)?.[1] || "";
  } catch (_) {
    return "";
  }
}

function getSupabaseConfig() {
  return {
    url: String(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, ""),
    publishableKey: getPublishableKey()
  };
}

async function publicQuery(resource, params) {
  const { url, publishableKey } = getSupabaseConfig();
  if (!publishableKey) throw new Error("SUPABASE_PUBLISHABLE_KEY_MISSING");
  const query = new URLSearchParams(params);
  const response = await fetch(`${url}/rest/v1/${resource}?${query.toString()}`, {
    headers: { apikey: publishableKey, accept: "application/json" },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`SUPABASE_PUBLIC_QUERY_${response.status}`);
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

function parseStorefrontPath(value = "") {
  const parts = String(value || "").split("/").filter(Boolean).map(decodeSegment);
  if (!validSlug(parts[0]) || parts.length > 3) return null;
  if (!parts[1]) return { slug: parts[0], view: "home" };
  if (parts[1] === "produto" && validSlug(parts[2])) return { slug: parts[0], view: "product", productSlug: parts[2] };
  if (["produtos", "categorias", "contato", "sobre"].includes(parts[1]) && parts.length === 2) return { slug: parts[0], view: parts[1] };
  if (parts[1] === "categoria" && validSlug(parts[2])) return { slug: parts[0], view: "category", categorySlug: parts[2] };
  return null;
}

async function loadPublicPage(route) {
  const stores = await publicQuery("stores", { select: "id,slug,name,description,banner_url,logo_url,updated_at", slug: `eq.${route.slug}`, limit: "1" });
  const store = stores[0];
  if (!store?.id) return null;
  if (route.view === "category") {
    const categories = await publicQuery("store_categories", {
      select: "id,slug",
      store_id: `eq.${store.id}`,
      slug: `eq.${route.categorySlug}`,
      limit: "1"
    });
    return categories[0] ? { store, product: null } : null;
  }
  if (route.view !== "product") return { store, product: null };
  const products = await publicQuery("store_products", {
    select: "id,slug,title,description,short_description,updated_at",
    store_id: `eq.${store.id}`,
    slug: `eq.${route.productSlug}`,
    limit: "1"
  });
  const product = products[0];
  if (!product) return null;
  const images = await publicQuery("store_product_images", {
    select: "image_url",
    product_id: `eq.${product.id}`,
    order: "order_index.asc",
    limit: "1"
  });
  return { store, product: { ...product, image_url: images[0]?.image_url || "" } };
}

function getTemplate() {
  return fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
}

function publicMeta({ store, product }, origin, pathname) {
  const displayName = String(store.name || "Simplifica 3D");
  const title = product?.title ? `${product.title} | ${displayName}` : `${displayName} | Simplifica 3D`;
  const description = product?.description || product?.short_description || store.description || "Loja online de produtos e personalizados em impressão 3D.";
  const image = product?.image_url || store.banner_url || store.logo_url || `${origin}/assets/simplifica-brand-cover.jpg`;
  const canonical = `${origin}${pathname}`;
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="robots" content="index,follow,max-image-preview:large">`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:type" content="${product ? "product" : "website"}">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta property="og:site_name" content="${escapeHtml(displayName)}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`
  ].join("\n");
}

function renderPublicPage(page, origin, pathname) {
  const template = getTemplate();
  const meta = publicMeta(page, origin, pathname);
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, meta.match(/<title>[\s\S]*?<\/title>/i)[0])
    .replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="index,follow,max-image-preview:large">`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(page.product?.description || page.product?.short_description || page.store.description || "Loja online de produtos e personalizados em impressão 3D.")}">`)
    .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(page.product?.title ? `${page.product.title} | ${page.store.name || "Simplifica 3D"}` : `${page.store.name || "Simplifica 3D"} | Simplifica 3D`)}">`)
    .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(page.product?.description || page.product?.short_description || page.store.description || "Loja online de produtos e personalizados em impressão 3D.")}">`)
    .replace(/<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${page.product ? "product" : "website"}">`)
    .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(page.product?.image_url || page.store.banner_url || page.store.logo_url || `${origin}/assets/simplifica-brand-cover.jpg`)}">`)
    .replace(/<meta name="twitter:card"[^>]*>/i, `<meta name="twitter:card" content="summary_large_image">`)
    .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(page.product?.image_url || page.store.banner_url || page.store.logo_url || `${origin}/assets/simplifica-brand-cover.jpg`)}">`)
    .replace("</head>", `${meta}\n</head>`);
}

function renderNotFound(origin, title = "Página não encontrada") {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${escapeHtml(title)} | Simplifica 3D</title></head><body><main><h1>${escapeHtml(title)}</h1><p>O endereço solicitado não existe ou não está publicado.</p><p><a href="${escapeHtml(origin)}/">Voltar ao Simplifica 3D</a></p></main></body></html>`;
}

module.exports = { escapeXml, getOrigin, loadPublicPage, parseStorefrontPath, publicQuery, renderNotFound, renderPublicPage, validSlug };
