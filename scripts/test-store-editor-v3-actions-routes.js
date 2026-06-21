const fs = require("fs");
const vm = require("vm");
const app = fs.readFileSync("app.js", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

["abrirNovoProdutoGuiadoLoja()", "abrirNovaCategoriaGuiadaLoja()", "openStorefrontGuidedCatalogItem", "setStorefrontGuidedProductStep", "voltarFormularioGuiadoProdutoLoja()", "salvarProdutoLojaOnline(event)", "salvarCategoriaLojaOnline(event)", "salvarStorefrontAparencia(event)", "salvarStorefrontContatos(event)", "abrirChecklistGuiadoLoja()"].forEach((marker) => assert(renderer.includes(marker) || app.includes(marker), `Acao/rota V3 ausente: ${marker}`));
["sfe-sidebar-actions", "voltarPainelLojaVisual()", "salvarEdicaoVisualAtualLoja()", "abrirLojaPublicaOnline()", "alternarStatusLojaOnline()"].forEach((marker) => assert(renderer.includes(marker), `Ação lateral PWA ausente: ${marker}`));
["abrirSeletorImagemStorefront", "storefrontLogoPhoto", "storefrontBannerPhoto", "data-storefront-product-photo", "data-replace-image"].forEach((marker) => assert(renderer.includes(marker) || app.includes(marker), `Controle de troca de imagem ausente: ${marker}`));
["WhatsApp da loja", "abrirContatosProdutoLoja()", "sfe-contact-shortcut"].forEach((marker) => assert(renderer.includes(marker), `Atalho de WhatsApp no produto ausente: ${marker}`));
assert(app.includes('function abrirContatosProdutoLoja()'), "Atalho de WhatsApp deve preservar alteracoes nao salvas");
assert(app.includes("const replacementTarget = replaceExisting ? productImages[0] : null"), "troca de foto deve substituir a imagem principal sem consumir nova cota");
assert(!/sfe-desktop-topbar[\s\S]*?<nav>/.test(renderer), "Topbar desktop nao deve voltar a concentrar ações do editor");
assert(app.includes("function renderStorefrontView"), "Orquestrador de modos ausente");
assert(app.includes('renderMode === "editor"'), "Rota editor nao e decidida pelo orquestrador");
assert(!app.includes("renderStorefrontEditorV2"), "Rota editor antiga ainda existe");

const browserWindow = {
  escaparHtml: (value) => String(value ?? ""),
  escaparAttr: (value) => String(value ?? "").replace(/"/g, "&quot;"),
  renderStorefrontResponsiveImage: (src) => `<img src="${String(src || "")}">`,
  renderUiIcon: (name) => `<i>${name}</i>`,
  getStorefrontGuidedSelection: () => ({ type: "product", id: "produto-1", currentStep: 3 }),
  getStorefrontGuidedCatalogState: () => ({}),
  getStorefrontContactConfig: () => ({}),
  getStorefrontProductImage: () => "https://example.invalid/produto.webp",
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
const desktopMarkup = editor.sidebar(sampleVm, { mobile: false, uiMode: "product" });
const mobileMarkup = editor.sidebar(sampleVm, { mobile: true, uiMode: "product" });
[desktopMarkup, mobileMarkup].forEach((markup, index) => {
  assert(markup.includes('id="storefrontProductPhotoMain-produto-1"'), `troca da foto principal ausente no shell ${index ? "mobile" : "desktop"}`);
  assert(markup.includes('id="storefrontProductPhotoGallery-produto-1"'), `inclusao de galeria ausente no shell ${index ? "mobile" : "desktop"}`);
  assert(markup.includes('name="productPhotoGallery"'), `campo de galeria ausente no shell ${index ? "mobile" : "desktop"}`);
  assert(markup.includes("multiple"), `selecao multipla de fotos ausente no shell ${index ? "mobile" : "desktop"}`);
  assert(markup.includes('data-storefront-product-photo="produto-1"'), `marcador de foto ausente no shell ${index ? "mobile" : "desktop"}`);
  assert(markup.includes('data-replace-image="true"'), `troca de imagem ausente no shell ${index ? "mobile" : "desktop"}`);
  assert(markup.includes('data-replace-image="false"'), `adicao sem substituir imagem ausente no shell ${index ? "mobile" : "desktop"}`);
  assert(markup.includes("abrirSeletorImagemStorefront"), `botao de imagem ausente no shell ${index ? "mobile" : "desktop"}`);
});
console.log("Store editor V3 actions and routes: fluxos administrativos validados.");
