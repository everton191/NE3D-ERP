const { escapeXml, getOrigin, publicQuery } = require("./lib/storefront-public");

function urlEntry(loc, lastmod) {
  return `<url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>` : ""}</url>`;
}

async function handler(request, response) {
  const origin = getOrigin(request);
  try {
    const stores = await publicQuery("stores", { select: "id,slug,updated_at", order: "updated_at.desc", limit: "1000" });
    const products = await publicQuery("store_products", { select: "store_id,slug,updated_at", order: "updated_at.desc", limit: "1000" });
    const storeById = new Map(stores.filter((store) => store?.id && store?.slug).map((store) => [String(store.id), store]));
    const entries = stores.map((store) => urlEntry(`${origin}/loja/${encodeURIComponent(store.slug)}`, store.updated_at));
    products.forEach((product) => {
      const store = storeById.get(String(product.store_id));
      if (store && product?.slug) entries.push(urlEntry(`${origin}/loja/${encodeURIComponent(store.slug)}/produto/${encodeURIComponent(product.slug)}`, product.updated_at));
    });
    response.setHeader("Content-Type", "application/xml; charset=utf-8");
    response.setHeader("Cache-Control", "private, no-store");
    response.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>`);
  } catch (_) {
    response.setHeader("X-Robots-Tag", "noindex, nofollow");
    response.setHeader("Cache-Control", "no-store");
    response.status(503).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>");
  }
}

module.exports = handler;
