const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

["abrirNovoProdutoGuiadoLoja()", "abrirNovaCategoriaGuiadaLoja()", "openStorefrontGuidedCatalogItem", "setStorefrontGuidedProductStep", "voltarFormularioGuiadoProdutoLoja()", "salvarProdutoLojaOnline(event)", "salvarCategoriaLojaOnline(event)", "salvarStorefrontAparencia(event)", "salvarStorefrontContatos(event)", "abrirChecklistGuiadoLoja()"].forEach((marker) => assert(renderer.includes(marker) || app.includes(marker), `Acao/rota V3 ausente: ${marker}`));
["sfe-sidebar-actions", "voltarPainelLojaVisual()", "salvarEdicaoVisualAtualLoja()", "abrirLojaPublicaOnline()", "alternarStatusLojaOnline()"].forEach((marker) => assert(renderer.includes(marker), `Ação lateral PWA ausente: ${marker}`));
["abrirSeletorImagemStorefront", "storefrontLogoPhoto", "storefrontBannerPhoto", "data-storefront-product-photo", "data-replace-image"].forEach((marker) => assert(renderer.includes(marker) || app.includes(marker), `Controle de troca de imagem ausente: ${marker}`));
assert(app.includes("const replacementTarget = replaceExisting ? productImages[0] : null"), "troca de foto deve substituir a imagem principal sem consumir nova cota");
assert(!/sfe-desktop-topbar[\s\S]*?<nav>/.test(renderer), "Topbar desktop nao deve voltar a concentrar ações do editor");
assert(app.includes("function renderStorefrontView"), "Orquestrador de modos ausente");
assert(app.includes('renderMode === "editor"'), "Rota editor nao e decidida pelo orquestrador");
assert(!app.includes("renderStorefrontEditorV2"), "Rota editor antiga ainda existe");
console.log("Store editor V3 actions and routes: fluxos administrativos validados.");
