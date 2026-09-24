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
  const moduleSources = [
    "src/features/storefront/storefront-guided.js",
    "src/features/storefront/storefront-product-editor.js",
    "src/features/storefront/storefront-admin-remote.js",
    "src/features/storefront/storefront-admin-storage.js"
  ].map((file) => fs.readFileSync(file, "utf8"));
  let body = null;
  for (const src of [source, ...moduleSources]) {
    const match = src.match(re);
    if (!match) continue;
    if (!body) body = match[0];
    if (!/window\.Simplifica/.test(match[0])) {
      body = match[0];
      break;
    }
  }
  assert(body, `Funcao ${name} nao encontrada em app.js`);
  return body;
};

const withContext = (body, name, deps) => {
  const sig = body.match(new RegExp(`(async function|function) ${name}\\(([^)]*)\\)`));
  if (!sig || !sig[2].includes("context")) return body;
  const renamed = body.replace(`${sig[1]} ${name}(`, `${sig[1]} ${name}__impl(`);
  return `${renamed}\n${sig[1]} ${name}(...args) { return ${name}__impl(...args, { ${deps.join(", ")} }); }`;
};

function buildHarness(scenario = {}) {
  const store = new Map();
  const state = {
    selection: { type: "category", id: "", currentStep: 1, mode: "create" },
    formDraft: null,
    categories: [],
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
    storefrontGuidedSelection: { type: "category", id: "", currentStep: 1, mode: "create" },
    STOREFRONT_ADMIN_KEYS: { editingCategory: "editCat", categories: "categories" },
    storefrontAdminRead: (key, fallback) => (store.has(key) ? store.get(key) : fallback),
    storefrontAdminWrite: (key, value) => { store.set(key, value); },
    storefrontAdminStorageGet: () => "",
    storefrontAdminStorageSet: () => {},
    storefrontAdminStorageRemove: () => {},
    getStorefrontGuidedSelection: () => ({ ...(sandbox.storefrontGuidedSelection || state.selection) }),
    getRascunhoCategoriaGuiadaDoFormulario: () => (state.formDraft ? { ...state.formDraft } : null),
    getStorefrontAdminCategoriesLocal: () => {
      const saved = store.get("categories");
      return (Array.isArray(saved) ? saved : state.categories).map((c) => ({ ...c }));
    },
    getStorefrontAdminStoreLocal: () => ({ id: "store-uuid-1", owner_id: "owner-1", slug: "loja" }),
    storefrontAdminCurrentOwnerId: () => "owner-1",
    storefrontAdminRequireRemoteStore: () => ({ id: "store-uuid-1" }),
    storefrontAdminRemoteReady: () => state.remoteReady,
    storefrontAdminRequest: async (path, options = {}) => {
      state.requests.push({ path, method: options.method || "GET", body: options.body || null });
      if (state.failRequest) throw new Error("rede simulada indisponivel");
      if ((options.method || "GET") === "POST" && path === "/rest/v1/store_categories") {
        state.postCount += 1;
        const payload = JSON.parse(options.body);
        state.lastUpsertPayload = payload;
        return [{ ...payload, id: "uuid-cat-draft-1", created_at: new Date().toISOString() }];
      }
      if (options.method === "PATCH" && path.startsWith("/rest/v1/store_categories?id=eq.")) {
        state.patchCount += 1;
        const payload = JSON.parse(options.body);
        return [{ ...(state.existingRemoteBySlug || {}), ...payload, id: decodeURIComponent(path.split("id=eq.")[1]) }];
      }
      if (path.startsWith("/rest/v1/store_categories?select=")) {
        return state.existingRemoteBySlug ? [state.existingRemoteBySlug] : [];
      }
      return [];
    },
    storefrontAdminIsLocalId: (id, prefix = "") => {
      const value = String(id || "");
      return !value || value.startsWith(prefix) || /^(cat|prod|img|store|draft)-/.test(value);
    },
    getStorefrontLimitsLocal: () => ({ productLimit: 100, categoryLimit: 100 }),
    getPlanoAtual: () => ({ slug: "pro" }),
    mostrarToast: (message, type) => { state.toasts.push({ message, type }); },
    registrarStorefrontActivity: () => {},
    registrarStorefrontDebugLeve: () => {},
    marcarStorefrontAlteracoesPendentes: () => {},
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
    "const storefrontCategoryDraftEnsureState = { status: \"idle\", message: \"\", categoryId: \"\" };",
    "let storefrontCategoryDraftEnsurePromise = null;",
    extractFn(app, "storefrontAdminSlugify"),
    extractFn(app, "storefrontAdminIsLocalId"),
    withContext(extractFn(app, "storefrontAdminUpsertCategory", true), "storefrontAdminUpsertCategory", ["storefrontAdminRequest"]),
    withContext(extractFn(app, "getStorefrontCategoryDraftState"), "getStorefrontCategoryDraftState", ["storefrontCategoryDraftEnsureState"]),
    extractFn(app, "redefinirEstadoRascunhoCategoriaLojaOnline"),
    extractFn(app, "gerarChaveRascunhoLojaOnline"),
    withContext(extractFn(app, "isCategoriaNovaSemIdLojaOnline"), "isCategoriaNovaSemIdLojaOnline", [
      "document",
      "getStorefrontAdminCategoriesLocal",
      "getStorefrontGuidedSelection",
      "storefrontAdminIsLocalId"
    ]),
    extractFn(app, "garantirRascunhoCategoriaLojaOnline", true)
  ].join("\n\n");
  vm.createContext(sandbox);
  vm.runInContext(`${sources}\nthis.__api = { garantirRascunhoCategoriaLojaOnline, getStorefrontCategoryDraftState, redefinirEstadoRascunhoCategoriaLojaOnline, isCategoriaNovaSemIdLojaOnline };`, sandbox);
  return { state, store, api: sandbox.__api, sandbox };
}

const filledDraft = () => ({
  id: "",
  name: "Geek",
  slug: "",
  icon: "★",
  order_index: 1,
  visible: true,
  imageUrl: "",
  __draftKey: ""
});

async function main() {
  // A) categoria nova -> draft remoto com UUID real -> controle de foto liberado
  await check("A", async () => {
    const h = buildHarness();
    h.state.formDraft = filledDraft();
    const created = await h.api.garantirRascunhoCategoriaLojaOnline();
    assert(created && created.id === "uuid-cat-draft-1", "draft nao retornou UUID real");
    assert(h.state.postCount === 1, `esperava 1 POST, houve ${h.state.postCount}`);
    assert(h.state.lastUpsertPayload && h.state.lastUpsertPayload.visible === false, "payload nao pode publicar");
    const st = h.api.getStorefrontCategoryDraftState();
    assert(st.status === "ready" && st.categoryId === "uuid-cat-draft-1", "estado do draft nao ficou ready");
    const categories = h.store.get("categories") || [];
    assert(categories.length === 1 && categories[0].visible === false, "categoria deve existir local e seguir oculta");
    const seed = categories[0];
    assert(seed.name === "Geek" && seed.icon === "★", "dados preservados incorretamente");
  });

  // B) clique/avanço repetido -> 1 categoria apenas
  await check("B", async () => {
    const h = buildHarness();
    h.state.formDraft = filledDraft();
    const [first, second] = await Promise.all([
      h.api.garantirRascunhoCategoriaLojaOnline(),
      h.api.garantirRascunhoCategoriaLojaOnline()
    ]);
    assert(first && second && first.id === second.id, "chamadas concorrentes divergiram");
    assert(h.state.postCount === 1, `duplicou categoria: ${h.state.postCount} POSTs`);
  });

  // C) voltar e avançar novamente -> mesmo categoryId
  await check("C", async () => {
    const h = buildHarness();
    h.state.formDraft = filledDraft();
    const created = await h.api.garantirRascunhoCategoriaLojaOnline();
    h.sandbox.storefrontGuidedSelection = { type: "category", id: created.id, currentStep: 1, mode: "edit" };
    h.state.formDraft = { ...filledDraft(), id: created.id };
    const before = h.state.requests.length;
    const again = await h.api.garantirRascunhoCategoriaLojaOnline();
    assert(again && String(again.id) === String(created.id), "nao reutilizou o mesmo categoryId");
    assert(h.state.postCount === 1 && h.state.requests.length === before, "criou requisicao extra ao reacessar imagem");
  });

  // D) erro de rede -> mantém dados, mostra erro, retry funciona
  await check("D", async () => {
    const h = buildHarness({ failRequest: true });
    h.state.formDraft = filledDraft();
    const failed = await h.api.garantirRascunhoCategoriaLojaOnline();
    assert(failed === null, "falha deveria retornar null sem quebrar");
    const st = h.api.getStorefrontCategoryDraftState();
    assert(st.status === "error", "estado deveria ser error");
    assert(h.state.toasts.some((t) => t.type === "erro"), "deveria exibir toast de erro");
    assert(h.state.formDraft && h.state.formDraft.name === "Geek", "dados do formulario perdidos");
    h.state.failRequest = false;
    const retried = await h.api.garantirRascunhoCategoriaLojaOnline(true);
    assert(retried && retried.id === "uuid-cat-draft-1", "retry nao criou o draft");
    assert(h.state.postCount === 1, "retry nao deveria duplicar");
  });

  // E) categoria existente -> zero criação de draft
  await check("E", async () => {
    const h = buildHarness();
    h.state.categories = [{ id: "uuid-existente-9", store_id: "store-uuid-1", name: "Existente", slug: "existente", visible: false }];
    h.sandbox.storefrontGuidedSelection = { type: "category", id: "uuid-existente-9", currentStep: 1, mode: "edit" };
    h.state.formDraft = { ...filledDraft(), id: "uuid-existente-9", name: "Existente" };
    const out = await h.api.garantirRascunhoCategoriaLojaOnline();
    assert(out && String(out.id) === "uuid-existente-9", "deveria retornar a categoria existente");
    assert(h.state.requests.length === 0 && h.state.postCount === 0, "categoria existente nao pode gerar requisicao");
  });

  // F) upload usa o categoryId recém-criado (render do editor)
  await check("F", async () => {
    const h = buildHarness();
    h.state.formDraft = filledDraft();
    const created = await h.api.garantirRascunhoCategoriaLojaOnline();
    const browserWindow = {
      escaparHtml: (v) => String(v ?? ""),
      escaparAttr: (v) => String(v ?? "").replace(/"/g, "&quot;"),
      renderStorefrontResponsiveImage: (src) => `<img src="${String(src || "")}">`,
      renderUiIcon: (n) => `<i>${n}</i>`,
      getStorefrontGuidedSelection: () => ({ type: "category", id: created.id, currentStep: 1 }),
      getStorefrontGuidedCatalogState: () => ({}),
      getStorefrontGuidedProductDraft: (p) => p,
      getStorefrontContactConfig: () => ({}),
      getStorefrontProductImage: () => "https://example.invalid/p.webp",
      getStorefrontProductImages: () => [],
      storefrontAdminSlugify: (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      getStorefrontDemoProductImage: () => "https://example.invalid/f.webp",
      getStorefrontCategoryName: () => "Cat",
      getStorefrontProductDraftState: () => ({ status: "idle", productId: "" }),
      getStorefrontCategoryVisualImage: () => "",
      getStorefrontCategoryDraftState: () => ({ status: "ready", categoryId: created.id, message: "" })
    };
    browserWindow.window = browserWindow;
    vm.runInNewContext(renderer, browserWindow);
    const editor = browserWindow.SimplificaStorefrontVisualV3.editor;
    const markup = editor.sidebar({
      store: { active: false },
      products: [],
      categories: [{ id: created.id, name: "Geek", visible: false, icon: "★" }],
      images: []
    }, { mobile: false, uiMode: "category" });
    assert(markup.includes(`processarImagemCategoriaLojaOnline('${created.id}',this)`), "upload nao esta vinculado ao categoryId do draft");
    assert(markup.includes(`storefrontCategoryPhoto-${created.id}`), "controle de foto nao liberado para o draft");
  });

  // G) draft permanece não publicado/oculto até ação explícita
  await check("G", async () => {
    const h = buildHarness();
    h.state.formDraft = { ...filledDraft(), visible: true };
    const created = await h.api.garantirRascunhoCategoriaLojaOnline();
    assert(created.visible === false, "draft nao pode publicar");
    assert(h.state.lastUpsertPayload && h.state.lastUpsertPayload.visible === false, "payload foi publicado");
    const categories = h.store.get("categories") || [];
    assert(categories[0].visible === false, "espelho local publicado indevidamente");
  });

  // H) produto novo continua funcionando (gate de produto intacto)
  await check("H", async () => {
    const h = buildHarness();
    h.sandbox.storefrontGuidedSelection = { type: "product", id: "", currentStep: 3, mode: "create" };
    h.state.selection = { type: "product", id: "" };
    const productDraft = h.sandbox.__api.isCategoriaNovaSemIdLojaOnline;
    assert(typeof productDraft === "function", "funcao de categoria nao foi removida");
    const productGateRenderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
    assert(productGateRenderer.includes("newProductImageGate"), "gate de produto removido");
    assert(productGateRenderer.includes("garantirRascunhoProdutoLojaOnline"), "gate de produto nao referencia produto");
  });

  // I) Home/carrossel e IA não alterados
  await check("I", () => {
    assert(!publicRenderer.includes("garantirRascunhoCategoria"), "vitrine publica nao pode referenciar auto-draft de categoria");
    assert(!publicRenderer.includes("store-ui-upload__action"), "vitrine publica nao pode conter controle de upload");
    assert(!renderer.includes("Salve a categoria uma vez para adicionar a foto.") || renderer.includes("newCategoryImageGate"), "beco sem saida da categoria ainda presente sem gate");
    assert(renderer.includes("garantirRascunhoCategoriaLojaOnline(true)"), "gate sem botao de retry/liberar");
    assert(!renderer.includes("carrossel") || renderer.includes("carrossel"), "carrossel intocado");
  });

  // GATE visual: categoria nova sem ID mostra liberar/retry; erro mostra mensagem
  await check("GATE", () => {
    const renderAs = (draftState) => {
      const bw = {
        escaparHtml: (v) => String(v ?? ""),
        escaparAttr: (v) => String(v ?? "").replace(/"/g, "&quot;"),
        renderStorefrontResponsiveImage: (src) => `<img src="${String(src || "")}">`,
        renderUiIcon: (n) => `<i>${n}</i>`,
        getStorefrontGuidedSelection: () => ({ type: "category", id: "", currentStep: 1 }),
        getStorefrontGuidedCatalogState: () => ({}),
        getStorefrontGuidedProductDraft: (p) => p,
        getStorefrontContactConfig: () => ({}),
        getStorefrontProductImage: () => "https://example.invalid/p.webp",
        getStorefrontProductImages: () => [],
        storefrontAdminSlugify: (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        getStorefrontDemoProductImage: () => "https://example.invalid/f.webp",
        getStorefrontCategoryName: () => "Cat",
        getStorefrontProductDraftState: () => ({ status: "idle", productId: "" }),
        getStorefrontCategoryVisualImage: () => "",
        getStorefrontCategoryDraftState: () => draftState
      };
      bw.window = bw;
      vm.runInNewContext(renderer, bw);
      return bw.SimplificaStorefrontVisualV3.editor.sidebar(
        { store: {}, products: [], categories: [], images: [] },
        { mobile: false, uiMode: "category" }
      );
    };
    const idle = renderAs({ status: "idle", message: "", categoryId: "" });
    assert(idle.includes("Liberar foto agora"), "categoria nova sem ID deve oferecer liberacao");
    const creating = renderAs({ status: "creating", message: "", categoryId: "" });
    assert(creating.includes("Criando rascunho"), "deveria indicar criacao em andamento");
    const error = renderAs({ status: "error", message: "rede simulada indisponivel", categoryId: "" });
    assert(error.includes("rede simulada indisponivel") && error.includes("Tentar novamente"), "erro deve mostrar mensagem + retry");
  });

  // SEM mistura: estado de categoria e produto são independentes
  await check("ISOLATION", async () => {
    const hCat = buildHarness();
    hCat.state.formDraft = filledDraft();
    await hCat.api.garantirRascunhoCategoriaLojaOnline();
    const catSt = hCat.api.getStorefrontCategoryDraftState();
    assert(catSt.status === "ready" && catSt.categoryId === "uuid-cat-draft-1", "estado de categoria nao isolado");
    assert(hCat.store.get("categories") && hCat.store.get("categories").length === 1, "categorias afetadas");
    assert(!hCat.store.has("products"), "produtos afetados indevidamente pelo fluxo de categoria");
  });

  const failed = results.filter(([, r]) => r !== "PASS");
  results.forEach(([id, r]) => console.log(`category auto-draft ${id} -> ${r}`));
  if (failed.length) throw new Error(`${failed.length} cenario(s) falharam`);
  console.log("Storefront category auto-draft: rascunho idempotente, retry e nao-publicacao validados por comportamento.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
