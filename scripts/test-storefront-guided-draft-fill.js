const fs = require("fs");
const vm = require("vm");

const app = fs.readFileSync("app.js", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

function extractFunction(name) {
  const start = app.indexOf(`function ${name}`);
  assert(start >= 0, `Funcao ausente: ${name}`);
  const signatureEnd = app.indexOf(") {", start);
  const braceStart = signatureEnd >= 0 ? signatureEnd + 2 : app.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") depth -= 1;
    if (depth === 0) return app.slice(start, index + 1);
  }
  throw new Error(`Funcao incompleta: ${name}`);
}

[
  "salvarRascunhoProdutoGuiadoLoja(this.form)",
  "salvarProdutoLojaOnline(event)",
  "getStorefrontPublicationChecklist",
  "exigirChecklistPublicacaoLoja",
  "alternarStatusLojaOnline()",
  "requestSensitiveActionConfirmation"
].forEach((marker) => assert(app.includes(marker) || renderer.includes(marker), `Contrato de rascunho/publicacao ausente: ${marker}`));

[
  'name="storeName"',
  'name="storeDescription"',
  'name="storeWhatsApp"',
  'name="storeInstagram"',
  'name="productTitle"',
  'name="productShortDescription"',
  'name="productPrice"',
  'name="productPriceMode"',
  'name="productStockMode"',
  "productVisible",
  'name="productPhotoGallery"',
  "Salvar rascunho"
].forEach((marker) => assert(renderer.includes(marker), `Campo esperado no editor guiado ausente: ${marker}`));

const sandbox = {
  document: {
    getElementById() {
      return null;
    }
  },
  getStorefrontProductFormField(form, name) {
    return form.elements.find((field) => field.name === name) || null;
  },
  salvarProdutoLojaOnline(event) {
    sandbox.savedEvent = event;
  }
};
sandbox.window = sandbox;

vm.runInNewContext(extractFunction("salvarRascunhoProdutoGuiadoLoja"), sandbox);

const draftForm = {
  submitted: false,
  elements: [
    { name: "productTitle", value: "Suporte articulado ficticio" },
    { name: "productShortDescription", value: "Produto de teste para validar interface" },
    { name: "productPrice", value: "79,90" },
    { name: "productPriceMode", value: "fixed" },
    { name: "productStockMode", value: "manual" },
    { name: "productStockQuantity", value: "12" },
    { name: "productVisible", type: "checkbox", checked: true },
    { name: "productFeaturedVisible", type: "checkbox", checked: true },
    { name: "productFeatured", type: "checkbox", checked: true }
  ],
  requestSubmit() {
    this.submitted = true;
  }
};

assert(sandbox.salvarRascunhoProdutoGuiadoLoja(draftForm) === true, "Salvar rascunho deve aceitar formulario valido");
assert(draftForm.submitted === true, "Salvar rascunho deve submeter o formulario existente");
assert(draftForm.elements.find((field) => field.name === "productVisible").checked === false, "Rascunho nao pode ficar visivel na loja");
assert(draftForm.elements.find((field) => field.name === "productFeaturedVisible").checked === false, "Rascunho nao pode ficar destacado visualmente");
assert(draftForm.elements.find((field) => field.name === "productFeatured").checked === false, "Rascunho nao pode salvar destaque oculto");
assert(!sandbox.savedEvent, "Com requestSubmit nativo o rascunho nao deve chamar salvamento duplicado");

const fallbackForm = {
  elements: [{ name: "productVisible", type: "checkbox", checked: true }],
  requestSubmit: null
};
assert(sandbox.salvarRascunhoProdutoGuiadoLoja(fallbackForm) === true, "Fallback de rascunho deve retornar sucesso");
assert(sandbox.savedEvent?.target === fallbackForm, "Fallback deve chamar salvarProdutoLojaOnline com formulario alvo");
assert(fallbackForm.elements[0].checked === false, "Fallback tambem deve salvar oculto");

const browserWindow = {
  escaparHtml: (value) => String(value ?? ""),
  escaparAttr: (value) => String(value ?? "").replace(/"/g, "&quot;"),
  renderStorefrontResponsiveImage: (src) => `<img src="${String(src || "")}">`,
  renderUiIcon: (name) => `<i>${name}</i>`,
  getStorefrontGuidedSelection: () => ({ type: "overview", id: "", currentStep: 1 }),
  getStorefrontGuidedCatalogState: () => ({}),
  getStorefrontContactConfig: () => ({ whatsapp: "85999990000" }),
  getStorefrontProductImage: () => "",
  getStorefrontCompletion: () => ({ completionPercent: 80, items: [{ done: false }] }),
  storefrontAdminSlugify: (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  getStorefrontDemoProductImage: () => "assets/storefront-v3/examples/product-support.jpg?v=20260611",
  getStorefrontCategoryName: () => "Teste"
};
browserWindow.window = browserWindow;
vm.runInNewContext(renderer, browserWindow);

const editor = browserWindow.SimplificaStorefrontVisualV3.editor;
const vmData = {
  store: { active: false, name: "Loja Ficticia Codex", slug: "loja-ficticia-codex", whatsapp: "85999990000" },
  products: [{
    id: "prod-ficticio",
    title: "Suporte articulado ficticio",
    short_description: "Produto de teste para validar interface",
    price: 79.9,
    price_mode: "fixed",
    stock_mode: "manual",
    stock_quantity: 12,
    visible: false
  }],
  categories: [{ id: "cat-ficticia", name: "Produtos ficticios", visible: true }],
  limits: { publishEnabled: true },
  completion: { completionPercent: 80, requiredPendingCount: 1, recommendedPendingCount: 0, canPublish: false }
};

const assistedSidebar = editor.sidebar(vmData, { mobile: false, assisted: true, uiMode: "overview", dirty: false });
assert(assistedSidebar.includes("sfe-assisted-hint"), "PWA assistido deve orientar edicao por partes");
assert(assistedSidebar.includes("Concluir guia"), "Publicacao deve permanecer bloqueada enquanto checklist estiver pendente");
assert(assistedSidebar.includes("disabled"), "Botao publicar deve ficar desativado antes do checklist completo");
assert(assistedSidebar.includes("abrirChecklistGuiadoLoja()"), "Botao bloqueado deve revisar checklist, nao publicar");
assert(!assistedSidebar.includes("onclick=\"alternarStatusLojaOnline()\" disabled"), "Fluxo bloqueado nao pode chamar publicacao");

const productForm = editor.product(vmData, vmData.products[0]);
assert(productForm.includes('value="Suporte articulado ficticio"'), "Produto ficticio deve preencher titulo no editor");
assert(productForm.includes('value="79.9"') || productForm.includes('value="79,9"'), "Produto ficticio deve preencher preco");
assert(productForm.includes('name="productVisible"') && !productForm.includes('name="productVisible" checked'), "Produto ficticio deve abrir como rascunho oculto");
assert(productForm.includes("Salvar rascunho"), "Formulario deve manter acao de rascunho sem publicar");

console.log("Storefront guided draft fill: dados ficticios, rascunho, checklist e bloqueio de publicacao validados.");
