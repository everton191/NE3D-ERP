const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

["function selecionarItemLojaVisual", "function fecharPainelEdicaoGuiadaLoja", "function atualizarPreviewGuiadoLoja", "function manterCampoEditorGuiadoVisivel", "function processarImagemExemploLojaOnline", "function abrirChecklistGuiadoLoja"].forEach((marker) => assert(app.includes(marker), `Funcao guiada preservada ausente: ${marker}`));
["Básico", "Preço/Estoque", "Imagens", "Publicação", "Salvar rascunho", "sfe-preview", "sfe-actions", "store-ui-upload"].forEach((marker) => assert(renderer.includes(marker), `Editor guiado rebuilt incompleto: ${marker}`));
assert(layouts.includes('html[data-store-editor-keyboard-open="true"]'), "Editor nao reduz preview com teclado");
assert(!/class="[^"]*store-guided-/.test(renderer), "Editor novo ainda usa classe visual guiada antiga");
assert(!index.includes("/modules/store-editor/"), "Fallback visual antigo ainda carregado");
assert(!sw.includes("./modules/store-editor/"), "Fallback visual antigo ainda no PWA");
console.log("Storefront guided editor: etapas, preview, upload e teclado validados.");
