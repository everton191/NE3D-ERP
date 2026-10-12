const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const sandbox = { window: {}, URLSearchParams, console };
vm.runInNewContext(fs.readFileSync("src/features/storefront/storefront-public.js", "utf8"), sandbox);
const storefront = sandbox.window.SimplificaStorefrontPublic;
const store = { id: "store-a", slug: "store-a", active: true, publication_status: "published" };
const product = { id: "product-a", store_id: store.id, visible: true, stock_mode: "unlimited" };
const privateProduct = { id: "product-private", store_id: store.id, visible: false, stock_mode: "unlimited" };
const unavailableProduct = { id: "product-unavailable", store_id: store.id, visible: true, stock_mode: "unavailable" };

async function hydrate(rankingResult, { storeResult = [store] } = {}) {
  let cached = null;
  let invalidated = false;
  let rendered = 0;
  let cacheReads = 0;
  const context = {
    telaAtual: "lojaPublica", storefrontPublicRouteState: {}, estaOnline: () => true,
    getStorefrontPublicRoute: () => ({ slug: store.slug }), location: { search: "" },
    requisicaoSupabase: async (path, request) => {
      assert.equal(request.auth, false, "hidratacao publica nao deve usar JWT do proprietario");
      if (path.includes("/rest/v1/stores?")) return storeResult;
      if (path.includes("/rest/v1/store_categories?")) return [];
      if (path.includes("/rest/v1/store_products?")) return [product];
      if (path.includes("/rest/v1/store_product_images?")) return [];
      if (path.includes("/rpc/get_storefront_product_ranking")) {
        if (rankingResult instanceof Error) throw rankingResult;
        return rankingResult;
      }
      throw new Error(`Requisicao inesperada: ${path}`);
    },
    setStorefrontPublicCache: (_slug, value) => { cached = value; },
    invalidarStorefrontPublicCache: () => { invalidated = true; },
    confirmarPublicacaoStorefront: () => {},
    registrarEventoLojaPublica: () => {},
    STOREFRONT_ANALYTICS_EVENT_TYPES: [], getStorefrontAnalyticsConsent: () => "declined",
    registrarVisualizacaoProdutoLojaPublica: () => {},
    renderApp: () => { rendered += 1; },
    localStorage: { getItem: () => { cacheReads += 1; return JSON.stringify({ productRanking: [{ product_id: privateProduct.id, smart_score: 999 }] }); } }
  };
  await storefront.hidratarLojaPublicaSeNecessario(context);
  return { cached, invalidated, rendered, cacheReads };
}

async function main() {
  for (const result of [[], new Error("HTTP 503"), new Error("timeout")]) {
    const state = await hydrate(result);
    assert.equal(state.cached.products.length, 1, "produto publico continua disponivel sem ranking");
    assert.deepEqual(Array.from(state.cached.productRanking), [], "falha/vazio nao reutiliza ranking privado");
    assert.equal(state.rendered, 1, "vitrine continua utilizavel");
    assert.equal(state.cacheReads, 0, "cache antigo nao deve ser reutilizado na hidratacao");
  }
  const mixed = await hydrate([
    { product_id: product.id, smart_score: 5 },
    { product_id: privateProduct.id, smart_score: 999 },
    { product_id: "other-store-product", smart_score: 999 }
  ]);
  assert.deepEqual(Array.from(mixed.cached.productRanking, (row) => row.product_id), [product.id],
    "cache publico nao deve guardar ranking privado ou de outra loja");
  const inaccessible = await hydrate([{ product_id: product.id, smart_score: 5 }], { storeResult: [] });
  assert.equal(inaccessible.cached, null, "loja inacessivel nao deve gravar cache");
  assert.equal(inaccessible.invalidated, true, "loja inacessivel invalida o cache anterior");

  const localVm = storefront.getStorefrontPublicViewModel({
    storefrontPublicRouteState: { slug: store.slug, view: "home" },
    isStorefrontAdminContextRoute: () => false,
    location: { search: "" },
    isAmbienteLocal: () => true,
    getStorefrontAdminViewModel: () => ({
      store, categories: [], images: [],
      products: [product, privateProduct, unavailableProduct],
      productRanking: [product, privateProduct, unavailableProduct].map((item) => ({ product_id: item.id, smart_score: 10 }))
    }),
    getStorefrontPublicMode: () => ({ admin: false }),
    getStorefrontLimitsLocal: () => ({}), getPlanoAtual: () => ({ slug: "start" })
  });
  assert.deepEqual(Array.from(localVm.products, (item) => item.id), [product.id],
    "fallback publico local deve seguir a visibilidade do catalogo");
  assert.deepEqual(Array.from(localVm.productRanking, (item) => item.product_id), [product.id],
    "fallback publico local nao revela ranking de produtos privados");
  console.log("PASS fallback: vazio, HTTP, timeout, loja inacessivel, cache cruzado e preview publico local.");
}

main().catch((error) => {
  console.error(`FAIL storefront ranking fallback: ${error.message}`);
  process.exitCode = 1;
});
