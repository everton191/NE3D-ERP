const fs = require("fs");
const vm = require("vm");

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const results = [];
const check = (id, fn) => {
  try {
    const out = fn();
    if (out && typeof out.then === "function") return out.then(() => results.push([id, "PASS"])).catch((e) => results.push([id, `FAIL: ${e.message}`]));
    results.push([id, "PASS"]);
  } catch (e) { results.push([id, `FAIL: ${e.message}`]); }
  return null;
};

const app = fs.readFileSync("app.js", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");

const extractFn = (source, name, isAsync = false) => {
  const kind = isAsync ? "async function" : "function";
  const re = new RegExp(`^${kind} ${name}\\([\\s\\S]*?^\\}`, "m");
  const match = source.match(re);
  assert(match, `Funcao ${name} nao encontrada em app.js`);
  return match[0];
};

// ---- Harness: executa o codigo REAL de ensure + upsert contra fakes ----
function buildHarness(scenario = {}) {
  const store = new Map();
  const state = {
    selection: { type: "product", id: "", currentStep: 3, mode: "create" },
    formDraft: null,
    seed: null,
    products: [],
    remoteReady: scenario.remoteReady !== false,
    failRequest: !!scenario.failRequest,
    requests: [],
    postCount: 0,
    patchCount: 0,
    toasts: [],
    renders: 0,
    lastUpsertPayload: null,
    existingRemoteBySlug: scenario.existingRemoteBySlug || null
  };
  const sandbox = {
    console,
    window: {},
    storefrontGuidedSelection: { type: "product", id: "", currentStep: 3, mode: "create" },
    STOREFRONT_ADMIN_KEYS: { editingProductSeed: "seed", products: "products" },
    storefrontAdminRead: (key, fallback) => (store.has(key) ? store.get(key) : fallback),
    storefrontAdminWrite: (key, value) => { store.set(key, value); },
    getStorefrontGuidedSelection: () => ({ ...(sandbox.storefrontGuidedSelection || state.selection) }),
    getRascunhoProdutoGuiadoDoFormulario: () => (state.formDraft ? { ...state.formDraft } : null),
    getStorefrontAdminProductsLocal: () => {
      const saved = store.get("products");
      return (Array.isArray(saved) ? saved : state.products).map((p) => ({ ...p }));
    },
    getStorefrontAdminStoreLocal: () => ({ id: "store-uuid-1", owner_id: "owner-1", slug: "loja" }),
    storefrontAdminCurrentOwnerId: () => "owner-1",
    storefrontAdminRequireRemoteStore: () => ({ id: "store-uuid-1" }),
    storefrontAdminRemoteReady: () => state.remoteReady,
    storefrontAdminRequest: async (path, options = {}) => {
      state.requests.push({ path, method: options.method || "GET", body: options.body || null });
      if (state.failRequest) throw new Error("rede simulada indisponivel");
      if ((options.method || "GET") === "POST" && path === "/rest/v1/store_products") {
        state.postCount += 1;
        const payload = JSON.parse(options.body);
        state.lastUpsertPayload = payload;
        return [{ ...payload, id: "uuid-draft-1", created_at: new Date().toISOString() }];
      }
      if (options.method === "PATCH" && path.startsWith("/rest/v1/store_products?id=eq.")) {
        state.patchCount += 1;
        const payload = JSON.parse(options.body);
        return [{ ...(state.existingRemoteBySlug || {}), ...payload, id: decodeURIComponent(path.split("id=eq.")[1]) }];
      }
      if (path.startsWith("/rest/v1/store_products?select=")) {
        return state.existingRemoteBySlug ? [state.existingRemoteBySlug] : [];
      }
      return [];
    },
    getStorefrontLimitsLocal: () => ({ productLimit: 100 }),
    getPlanoAtual: () => ({ slug: "pro" }),
    storefrontIsDemoProduct: (p) => !!(p && (p.__demo || p.__template)),
    mostrarToast: (message, type) => { state.toasts.push({ message, type }); },
    registrarStorefrontActivity: () => {},
    registrarStorefrontDebugLeve: () => {},
    storefrontScheduleAutosave: () => {},
    renderizarPreservandoScroll: () => { state.renders += 1; },
    renderApp: () => { state.renders += 1; },
    __ops: new Set(),
    storefrontBeginOperation: (key) => { if (sandbox.__ops.has(key)) return false; sandbox.__ops.add(key); return true; },
    storefrontEndOperation: (key) => { sandbox.__ops.delete(key); }
  };
  sandbox.window = sandbox;
  const sources = [
    "const storefrontProductDraftEnsureState = { status: \"idle\", message: \"\", productId: \"\" };",
    "let storefrontProductDraftEnsurePromise = null;",
    extractFn(app, "storefrontAdminSlugify"),
    extractFn(app, "storefrontAdminIsLocalId"),
    extractFn(app, "storefrontAdminUpsertProduct", true),
    extractFn(app, "getStorefrontProductDraftState"),
    extractFn(app, "redefinirEstadoRascunhoProdutoLojaOnline"),
    extractFn(app, "gerarChaveRascunhoLojaOnline"),
    extractFn(app, "gerarChaveRascunhoProdutoLojaOnline"),
    extractFn(app, "isProdutoNovoSemIdLojaOnline"),
    extractFn(app, "garantirRascunhoProdutoLojaOnline", true)
  ].join("\n\n");
  vm.createContext(sandbox);
  // storefrontGuidedSelection e lets internos das funcoes extraidas
  vm.runInContext(`${sources}\nthis.__api = { garantirRascunhoProdutoLojaOnline, getStorefrontProductDraftState, redefinirEstadoRascunhoProdutoLojaOnline, isProdutoNovoSemIdLojaOnline };`, sandbox);
  return { state, store, api: sandbox.__api, sandbox };
}

const filledDraft = () => ({
  id: "",
  title: "Camiseta Teste",
  short_description: "Curta",
  description: "Completa",
  slug: "",
  erp_product_id: null,
  category_id: "cat-1",
  price: 49.9,
  compare_price: null,
  price_mode: "fixed",
  show_price: true,
  visible: false,
  featured: false,
  is_customizable: true,
  estimated_production_time: "",
  public_observations: "",
  stock_mode: "unlimited",
  stock_quantity: null
});

async function main() {
  // A) novo produto -> draft remoto com ID real -> controles liberados
  await check("A", async () => {
    const h = buildHarness();
    h.state.formDraft = filledDraft();
    const created = await h.api.garantirRascunhoProdutoLojaOnline();
    assert(created && created.id === "uuid-draft-1", "draft nao retornou ID real");
    assert(h.state.postCount === 1, `esperava 1 POST, houve ${h.state.postCount}`);
    assert(h.state.lastUpsertPayload && h.state.lastUpsertPayload.visible === false && h.state.lastUpsertPayload.featured === false, "payload do draft nao pode publicar");
    const st = h.api.getStorefrontProductDraftState();
    assert(st.status === "ready" && st.productId === "uuid-draft-1", "estado do draft nao ficou ready");
    const products = h.store.get("products") || [];
    assert(products.length === 1 && products[0].visible === false && products[0].featured === false, "produto deve existir local e seguir nao publicado");
    const seed = h.store.get("seed") || {};
    assert(String(seed.id) === "uuid-draft-1", "seed nao recebeu o ID real");
    assert(String(seed.title) === "Camiseta Teste" && Number(seed.price) === 49.9, "dados digitados nao foram preservados no seed");
  });

  // B) avancar duas vezes -> um unico POST (single-flight)
  await check("B", async () => {
    const h = buildHarness();
    h.state.formDraft = filledDraft();
    const [first, second] = await Promise.all([
      h.api.garantirRascunhoProdutoLojaOnline(),
      h.api.garantirRascunhoProdutoLojaOnline()
    ]);
    assert(first && second && first.id === second.id, "chamadas concorrentes divergiram");
    assert(h.state.postCount === 1, `duplicou produto: ${h.state.postCount} POSTs`);
  });

  // C) voltar e avancar novamente -> reutiliza o mesmo ID, sem novo POST
  await check("C", async () => {
    const h = buildHarness();
    h.state.formDraft = filledDraft();
    const created = await h.api.garantirRascunhoProdutoLojaOnline();
    h.sandbox.storefrontGuidedSelection = { type: "product", id: created.id, currentStep: 2, mode: "edit" };
    h.state.formDraft = { ...filledDraft(), id: created.id };
    const before = h.state.requests.length;
    const again = await h.api.garantirRascunhoProdutoLojaOnline();
    assert(again && String(again.id) === String(created.id), "nao reutilizou o mesmo productId");
    assert(h.state.postCount === 1 && h.state.requests.length === before, "criou requisicao extra ao reacessar Imagens");
  });

  // D) falha de rede -> mantem dados, mostra erro, retry funciona
  await check("D", async () => {
    const h = buildHarness({ failRequest: true });
    h.state.formDraft = filledDraft();
    const failed = await h.api.garantirRascunhoProdutoLojaOnline();
    assert(failed === null, "falha deveria retornar null sem quebrar");
    const st = h.api.getStorefrontProductDraftState();
    assert(st.status === "error", "estado deveria ser error");
    assert(h.state.toasts.some((t) => t.type === "erro"), "deveria exibir toast de erro");
    const seed = h.store.get("seed");
    assert(!seed || String(seed.title || "") === "" || String(seed.title) === "Camiseta Teste", "seed foi corrompido na falha");
    assert(h.state.formDraft && h.state.formDraft.title === "Camiseta Teste", "dados do formulario perdidos");
    h.state.failRequest = false;
    const retried = await h.api.garantirRascunhoProdutoLojaOnline(true);
    assert(retried && retried.id === "uuid-draft-1", "retry nao criou o draft");
    assert(h.state.postCount === 1, "retry nao deveria duplicar");
  });

  // E) produto existente -> nenhum draft novo
  await check("E", async () => {
    const h = buildHarness();
    h.state.products = [{ id: "uuid-existente-9", store_id: "store-uuid-1", title: "Existente", slug: "existente", visible: false }];
    h.sandbox.storefrontGuidedSelection = { type: "product", id: "uuid-existente-9", currentStep: 3, mode: "edit" };
    h.state.formDraft = { ...filledDraft(), id: "uuid-existente-9", title: "Existente" };
    const out = await h.api.garantirRascunhoProdutoLojaOnline();
    assert(out && String(out.id) === "uuid-existente-9", "deveria retornar o produto existente");
    assert(h.state.requests.length === 0 && h.state.postCount === 0, "produto existente nao pode gerar requisicao");
  });

  // F) upload usa o mesmo productId do draft (render do editor)
  await check("F", async () => {
    const h = buildHarness();
    h.state.formDraft = filledDraft();
    const created = await h.api.garantirRascunhoProdutoLojaOnline();
    const browserWindow = {
      escaparHtml: (v) => String(v ?? ""),
      escaparAttr: (v) => String(v ?? "").replace(/"/g, "&quot;"),
      renderStorefrontResponsiveImage: (src) => `<img src="${String(src || "")}">`,
      renderUiIcon: (n) => `<i>${n}</i>`,
      getStorefrontGuidedSelection: () => ({ type: "product", id: created.id, currentStep: 3 }),
      getStorefrontGuidedCatalogState: () => ({}),
      getStorefrontGuidedProductDraft: (p) => p,
      getStorefrontContactConfig: () => ({}),
      getStorefrontProductImage: () => "https://example.invalid/p.webp",
      getStorefrontProductImages: () => [],
      storefrontAdminSlugify: (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      getStorefrontDemoProductImage: () => "https://example.invalid/f.webp",
      getStorefrontCategoryName: () => "Cat",
      getStorefrontProductDraftState: () => ({ status: "ready", productId: created.id, message: "" })
    };
    browserWindow.window = browserWindow;
    vm.runInNewContext(renderer, browserWindow);
    const editor = browserWindow.SimplificaStorefrontVisualV3.editor;
    const markup = editor.sidebar({
      store: { active: false },
      products: [{ id: created.id, title: "Camiseta Teste", visible: false }],
      categories: [],
      images: []
    }, { mobile: false, uiMode: "product" });
    assert(markup.includes(`processarImagemProdutoLojaOnline('${created.id}',this)`), "upload nao esta vinculado ao productId do draft");
    assert(markup.includes(`id="storefrontProductPhotoMain-uuid-draft-1"`), "foto principal nao liberada para o draft");
  });

  // G) draft segue NAO publicado
  await check("G", async () => {
    const h = buildHarness();
    h.state.formDraft = { ...filledDraft(), visible: true, featured: true };
    const created = await h.api.garantirRascunhoProdutoLojaOnline();
    assert(created.visible === false && created.featured === false, "draft nao pode publicar");
    assert(h.state.lastUpsertPayload === null || h.state.lastUpsertPayload.visible === false, "payload foi publicado");
    const products = h.store.get("products") || [];
    assert(products[0].visible === false, "espelho local publicado indevidamente");
  });

  // H) Home/carrossel e vitrine publica intocados
  await check("H", () => {
    assert(!publicRenderer.includes("garantirRascunho"), "vitrine publica nao pode referenciar auto-draft");
    assert(!publicRenderer.includes("store-ui-upload__action"), "vitrine publica nao pode conter controle de upload");
    assert(renderer.includes("processarImagemExemploLojaOnline"), "fluxo de modelo/exemplo nao pode regredir");
    assert(!renderer.includes("Salve o produto uma vez para liberar a galeria de fotos."), "beco sem saida do produto novo ainda presente");
    assert(renderer.includes("garantirRascunhoProdutoLojaOnline(true)"), "gate sem botao de retry/liberar");
  });

  // Gate visual: produto novo sem ID mostra preparar/retry; erro mostra mensagem
  await check("GATE", () => {
    const renderAs = (draftState) => {
      const browserWindow = {
        escaparHtml: (v) => String(v ?? ""),
        escaparAttr: (v) => String(v ?? "").replace(/"/g, "&quot;"),
        renderStorefrontResponsiveImage: (src) => `<img src="${String(src || "")}">`,
        renderUiIcon: (n) => `<i>${n}</i>`,
        getStorefrontGuidedSelection: () => ({ type: "product", id: "", currentStep: 3 }),
        getStorefrontGuidedCatalogState: () => ({}),
        getStorefrontGuidedProductDraft: (p) => p,
        getStorefrontContactConfig: () => ({}),
        getStorefrontProductImage: () => "https://example.invalid/p.webp",
        getStorefrontProductImages: () => [],
        storefrontAdminSlugify: (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        getStorefrontDemoProductImage: () => "https://example.invalid/f.webp",
        getStorefrontCategoryName: () => "Cat",
        getStorefrontProductDraftState: () => draftState
      };
      browserWindow.window = browserWindow;
      vm.runInNewContext(renderer, browserWindow);
      return browserWindow.SimplificaStorefrontVisualV3.editor.sidebar(
        { store: {}, products: [], categories: [], images: [] },
        { mobile: false, uiMode: "product" }
      );
    };
    const idle = renderAs({ status: "idle", message: "", productId: "" });
    assert(idle.includes("Liberar fotos agora"), "produto novo sem ID deve oferecer liberacao");
    const creating = renderAs({ status: "creating", message: "", productId: "" });
    assert(creating.includes("Criando rascunho"), "deveria indicar criacao em andamento");
    const error = renderAs({ status: "error", message: "rede simulada indisponivel", productId: "" });
    assert(error.includes("rede simulada indisponivel") && error.includes("Tentar novamente"), "erro deve mostrar mensagem + retry");
  });

  const failed = results.filter(([, r]) => r !== "PASS");
  results.forEach(([id, r]) => console.log(`auto-draft ${id} -> ${r}`));
  if (failed.length) throw new Error(`${failed.length} cenario(s) falharam`);
  console.log("Storefront product auto-draft: rascunho idempotente, retry e nao-publicacao validados por comportamento.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
