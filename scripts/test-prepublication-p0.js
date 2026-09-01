const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const storefrontHandler = require(path.join(root, "api", "storefront-page.js"));
const robotsHandler = require(path.join(root, "api", "robots.js"));
const sitemapHandler = require(path.join(root, "api", "sitemap.js"));
const notFoundHandler = require(path.join(root, "api", "not-found.js"));

function createResponse() {
  return {
    headers: {}, statusCode: 200, body: "", redirectTo: "",
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = String(body); return this; },
    redirect(code, location) { this.statusCode = code; this.redirectTo = location; return this; }
  };
}

function jsonResponse(body) {
  return { ok: true, json: async () => body };
}

async function withFetch(implementation, run) {
  const previous = global.fetch;
  global.fetch = implementation;
  try { return await run(); } finally { global.fetch = previous; }
}

async function main() {
  const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  const routes = JSON.stringify(config.routes);
  assert(routes.includes("/api/storefront-page?path=$1"), "rota /loja deve passar pela validacao do servidor");
  assert(routes.includes("/api/not-found"), "fallback final deve ser 404 real");
  assert(!routes.includes('"dest":"/"'), "nao pode haver fallback universal para index.html");
  assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes('name="robots" content="noindex,nofollow,noarchive"'), "shell do ERP precisa iniciar noindex");
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  assert(sw.includes("return cached || Response.error();"), "asset ausente nao pode receber index.html do service worker");
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert(app.includes("const fallback = adminFallback || localFallback;"), "cache persistido nao pode autorizar loja publica");
  assert(app.includes("invalidarStorefrontPublicCache(route.slug);"), "loja que deixa de ser publica deve invalidar o cache");

  await withFetch(async (url) => {
    const value = String(url);
    if (value.includes("/stores?")) return jsonResponse([{ id: "store-1", slug: "loja-real", name: "Loja Real", description: "Produtos reais", updated_at: "2026-08-31T12:00:00.000Z" }]);
    if (value.includes("/store_products?")) return jsonResponse([{ id: "product-1", store_id: "store-1", slug: "produto-real", title: "Produto Real", description: "Descricao real", updated_at: "2026-08-31T12:00:00.000Z" }]);
    if (value.includes("/store_product_images?")) return jsonResponse([{ image_url: "https://cdn.example/produto-real.webp" }]);
    throw new Error(`consulta inesperada: ${value}`);
  }, async () => {
    const response = createResponse();
    await storefrontHandler({ query: { path: "loja-real/produto/produto-real" }, headers: { host: "teste.local" } }, response);
    assert.strictEqual(response.statusCode, 200);
    assert(response.body.includes("Produto Real | Loja Real"));
    assert(response.body.includes('content="index,follow,max-image-preview:large"'));
    assert(response.body.includes('content="https://cdn.example/produto-real.webp"'));
    assert(response.body.includes('rel="canonical" href="https://teste.local/loja/loja-real/produto/produto-real"'));
  });

  await withFetch(async () => jsonResponse([]), async () => {
    const response = createResponse();
    await storefrontHandler({ query: { path: "inexistente" }, headers: { host: "teste.local" } }, response);
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.headers["x-robots-tag"], "noindex, nofollow");
    assert(response.body.includes('name="robots" content="noindex,nofollow,noarchive"'));
  });

  await withFetch(async (url) => {
    const value = String(url);
    if (value.includes("/stores?")) return jsonResponse([{ id: "store-1", slug: "loja-real", name: "Loja Real" }]);
    if (value.includes("/store_categories?")) return jsonResponse([]);
    throw new Error(`consulta inesperada: ${value}`);
  }, async () => {
    const response = createResponse();
    await storefrontHandler({ query: { path: "loja-real/categoria/inexistente" }, headers: { host: "teste.local" } }, response);
    assert.strictEqual(response.statusCode, 404);
  });

  const robots = createResponse();
  robotsHandler({ headers: { host: "teste.local" } }, robots);
  assert.strictEqual(robots.statusCode, 200);
  assert(robots.body.includes("Sitemap: https://teste.local/sitemap.xml"));
  assert(robots.body.includes("Disallow: /store-admin/"));

  await withFetch(async (url) => {
    const value = String(url);
    if (value.includes("/stores?")) return jsonResponse([{ id: "store-1", slug: "loja-real", updated_at: "2026-08-31T12:00:00.000Z" }]);
    if (value.includes("/store_products?")) return jsonResponse([{ store_id: "store-1", slug: "produto-real", updated_at: "2026-08-31T12:00:00.000Z" }]);
    throw new Error(`consulta inesperada: ${value}`);
  }, async () => {
    const sitemap = createResponse();
    await sitemapHandler({ headers: { host: "teste.local" } }, sitemap);
    assert.strictEqual(sitemap.statusCode, 200);
    assert(sitemap.body.includes("https://teste.local/loja/loja-real"));
    assert(sitemap.body.includes("https://teste.local/loja/loja-real/produto/produto-real"));
  });

  const missingAsset = createResponse();
  notFoundHandler({ headers: { host: "teste.local" } }, missingAsset);
  assert.strictEqual(missingAsset.statusCode, 404);
  assert.strictEqual(missingAsset.headers["x-robots-tag"], "noindex, nofollow");
  console.log("P0 pre-publicacao: handlers, SEO, sitemap, robots e 404 validados.");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
