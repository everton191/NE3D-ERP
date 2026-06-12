const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'renderStorefrontResponsiveImage(previewImage',
  'function renderStoreGuidedProductsList',
  'function renderStoreGuidedCategoriesList',
  "onclick=\"abrirNovoProdutoGuiadoLoja()\"",
  "onclick=\"abrirNovaCategoriaGuiadaLoja()\"",
  "returnToStorefrontGuidedCatalog(\"products\"",
  "returnToStorefrontGuidedCatalog(\"categories\"",
  'onclick="alinharSelecaoLojaVisual()"',
  'onclick="setStorefrontGuidedProductStep(${safeStep - 1})"',
  'onclick="marcarStorefrontAlteracoesPendentes(\'Rascunho do produto atualizado\')"',
  'onclick="setStorefrontGuidedProductStep(${safeStep + 1})"',
  'mode.admin ? "" : renderStorefrontV3BottomNav(vm)',
  "renderStoreGuidedCategoryIconPicker",
  "renderStoreEditorSwitch({",
  'targetSection: "basic"',
  'targetField: "productTitle"'
].forEach((marker) => assert(app.includes(marker), `Acoes/rotas V3 ausentes: ${marker}`));

console.log("Store editor V3 actions and routes: fluxo principal, selecao e barras corretas validados.");
