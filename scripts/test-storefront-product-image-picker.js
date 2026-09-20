const fs = require("fs");
const vm = require("vm");

const assert = (condition, message) => { if (!condition) throw new Error(message); };

const renderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("src/storefront/styles/components.css", "utf8");

// --- 1. Renderiza o editor de produto (etapa 3 = Imagens) ---
const browserWindow = {
  escaparHtml: (value) => String(value ?? ""),
  escaparAttr: (value) => String(value ?? "").replace(/"/g, "&quot;"),
  renderStorefrontResponsiveImage: (src) => `<img src="${String(src || "")}">`,
  renderUiIcon: (name) => `<i>${name}</i>`,
  getStorefrontGuidedSelection: () => ({ type: "product", id: "produto-1", currentStep: 3 }),
  getStorefrontGuidedCatalogState: () => ({}),
  getStorefrontGuidedProductDraft: (product) => product,
  getStorefrontContactConfig: () => ({}),
  getStorefrontProductImage: () => "https://example.invalid/produto.webp",
  getStorefrontProductImages: (_product, images) => (images || []).map((item) => item.image_url),
  storefrontAdminSlugify: (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  getStorefrontDemoProductImage: () => "https://example.invalid/fallback.webp",
  getStorefrontCategoryName: () => "Sem categoria"
};
browserWindow.window = browserWindow;
vm.runInNewContext(renderer, browserWindow);
const editor = browserWindow.SimplificaStorefrontVisualV3.editor;

const sampleVm = {
  store: { active: true },
  products: [{ id: "produto-1", title: "Produto teste", visible: true }],
  categories: [],
  images: [{ id: "imagem-1", product_id: "produto-1", image_url: "https://example.invalid/produto.webp", order_index: 0 }]
};
const markup = editor.sidebar(sampleVm, { mobile: false, uiMode: "product" });

// --- 2. Mecanismo nativo: <label for> associado ao <input type=file> ---
const labelMatches = [...markup.matchAll(/<label[^>]*class="store-ui-upload__action"[^>]*for="([^"]+)"[^>]*>/g)];
assert(labelMatches.length >= 2, `Esperava ao menos 2 controles de foto (principal + galeria), achou ${labelMatches.length}`);
const inputMatches = [...markup.matchAll(/<input[^>]*id="([^"]+)"[^>]*>/g)];
const inputById = new Map(inputMatches.map((m) => [m[1], m[0]]));

for (const m of labelMatches) {
  const forId = m[1];
  const inputTag = inputById.get(forId);
  assert(inputTag, `label for="${forId}" sem input correspondente (acionamento quebrado)`);
  assert(/type="file"/.test(inputTag), `input #${forId} nao e type=file`);
  assert(/accept="image\/jpeg,image\/png,image\/webp"/.test(inputTag), `input #${forId} sem accept de imagens`);
  assert(!/(?:^|\s)hidden(?:\s|>|=)/.test(inputTag), `input #${forId} usa atributo hidden -> display:none bloqueia o file picker no desktop`);
}

const mainInput = inputById.get("storefrontProductPhotoMain-produto-1");
const galleryInput = inputById.get("storefrontProductPhotoGallery-produto-1");
assert(mainInput, "input da foto principal ausente");
assert(galleryInput, "input da galeria ausente");
assert(/onchange="processarImagemProdutoLojaOnline\('produto-1',this\)"/.test(mainInput), "handler change da foto principal desconectado");
assert(/onchange="processarImagemProdutoLojaOnline\('produto-1',this\)"/.test(galleryInput), "handler change da galeria desconectado");
assert(/\bmultiple\b/.test(galleryInput), "galeria deveria aceitar multipla selecao");
assert(!/onclick="abrirSeletorImagemStorefront/.test(markup), "controle ainda depende de clique JS fragil em vez do label nativo");

// CSS nao pode anular o input com display:none
assert(!/\.store-ui-upload input\s*\{[^}]*display\s*:\s*none/.test(css), "CSS esconde o input com display:none (bloqueia picker no desktop)");

// --- 3. Comportamento: label resolve para o input + fallback JS aciona click() ---
const fakeInputs = new Map();
for (const [id, tag] of inputById) {
  fakeInputs.set(id, {
    id, type: "file", value: "limpar-antes",
    _attrs: new Set(/(?:^|\s)hidden(?:\s|>|=)/.test(tag) ? ["hidden"] : []),
    hasAttribute(name) { return this._attrs.has(name); },
    removeAttribute(name) { this._attrs.delete(name); },
    style: { display: "" },
    disabled: false,
    clicked: false,
    click() { this.clicked = true; }
  });
}
const fakeDocument = { getElementById: (id) => fakeInputs.get(id) || null };

// Simula a ativacao nativa do label: for -> getElementById -> input file disponivel
for (const m of labelMatches) {
  const resolved = fakeDocument.getElementById(m[1]);
  assert(resolved && resolved.type === "file", `acionamento do label for="${m[1]}" nao resolve para um input file`);
}

// Executa a funcao real de fallback (compat mobile/Capacitor) contra o stub
const fnMatch = app.match(/function abrirSeletorImagemStorefront\(input\) \{[\s\S]*?\n\}/);
assert(fnMatch, "funcao abrirSeletorImagemStorefront ausente em app.js");
const sandbox = {
  mostrarToast: () => {},
  document: fakeDocument,
  inputClicado: null
};
vm.createContext(sandbox);
vm.runInContext(`${fnMatch[0]}\ninputClicado = abrirSeletorImagemStorefront(document.getElementById("storefrontProductPhotoMain-produto-1"));`, sandbox);
const mainStub = fakeInputs.get("storefrontProductPhotoMain-produto-1");
assert(mainStub.clicked === true, "fallback JS nao acionou input.click() (seletor nao abriria)");
assert(mainStub.value === "", "fallback JS deveria limpar input.value antes de abrir");
assert(sandbox.inputClicado === true, "fallback JS deveria retornar true ao acionar");

// Entrada invalida nao deve quebrar: retorna false sem click
vm.runInContext("inputClicado = abrirSeletorImagemStorefront(null);", sandbox);
assert(sandbox.inputClicado === false, "fallback JS deveria retornar false sem input");

// Legacy: markup antigo com hidden ainda abre (higiene antes do click)
const legacyStub = {
  type: "file", value: "x",
  _attrs: new Set(["hidden"]),
  hasAttribute(name) { return this._attrs.has(name); },
  removeAttribute(name) { this._attrs.delete(name); },
  style: { display: "none" },
  disabled: false, clicked: false,
  click() { this.clicked = true; }
};
sandbox.legacy = legacyStub;
vm.runInContext("inputClicado = abrirSeletorImagemStorefront(legacy);", sandbox);
assert(legacyStub.clicked === true, "fallback JS deveria higienizar input legado com hidden/display:none antes do click");
assert(!legacyStub.hasAttribute("hidden"), "fallback JS deveria remover hidden legado");

console.log("Storefront product image picker: label nativo -> input file -> change handler validado por comportamento.");
