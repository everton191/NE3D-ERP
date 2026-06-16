const fs = require("fs");
const pkg = require("../package.json");

const read = (file) => fs.readFileSync(file, "utf8");
const app = read("app.js");
const index = read("index.html");
const prepare = read("scripts/prepare-web.js");
const sw = read("sw.js");
const docs = read("docs/storefront-visual-rebuild-architecture.md");
const publicRenderer = read("src/storefront/renderers/publicV3.js");
const editorRenderer = read("src/storefront/renderers/editorV3.js");
const styles = [
  "src/storefront/styles/tokens.css",
  "src/storefront/styles/components.css",
  "src/storefront/styles/layouts.css"
];
const renderers = [
  "src/storefront/renderers/publicV3.js",
  "src/storefront/renderers/editorV3.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[...styles, ...renderers].forEach((file) => {
  assert(fs.existsSync(file), `Arquivo rebuilt ausente: ${file}`);
  assert(new RegExp(`/${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?v=`).test(index), `Arquivo nao carregado: ${file}`);
  assert(prepare.includes(`"${file}"`), `Arquivo nao publicado no dist: ${file}`);
  assert(sw.includes(`./${file}`), `Arquivo nao publicado no PWA: ${file}`);
});

[
  "--store-button-height-md",
  "--store-input-height",
  "--store-card-padding",
  "--store-bottom-bar-height",
  "--store-primary"
].forEach((token) => assert(read(styles[0]).includes(token), `Token ausente: ${token}`));

[
  "storefront-app storefront-public storefront-v3 sfv3",
  "sfv3-header",
  "sfv3-hero",
  "sfv3-category-card",
  "sfv3-product-card",
  "sfv3-bottom-nav"
].forEach((marker) => assert(publicRenderer.includes(marker), `Componente publico rebuilt ausente: ${marker}`));

[
  "storefront-editor storefront-mobile-editor sfe-shell",
  "sfe-preview",
  "sfe-tabs",
  "sfe-fields",
  "sfe-actions",
  "sfe-product-form"
].forEach((marker) => assert(editorRenderer.includes(marker), `Componente editor rebuilt ausente: ${marker}`));

assert(app.includes("renderStorefrontPublicV3Rebuilt"), "Orquestrador publico rebuilt ausente");
assert(app.includes("getStorefrontEditorVisualV3"), "Orquestrador editor rebuilt ausente");
assert(!app.includes("renderStorefrontPublicV2"), "Renderer publico V2 ainda existe");
assert(!app.includes("renderStorefrontEditorV2"), "Renderer editor V2 ainda existe");
assert(!app.includes("renderStorefrontAdminPanelLegacy"), "Fallback visual legado ainda existe");
assert(!app.includes("enableStorefrontV2"), "Feature flag visual V2 ainda controla a loja");
assert(!index.includes("/modules/store-editor/"), "Ponte visual antiga ainda carrega no HTML");
assert(!sw.includes("./modules/store-editor/"), "Ponte visual antiga ainda entra no cache PWA");
assert(!prepare.includes('"modules/store-editor"'), "Ponte visual antiga ainda entra no dist");
assert(!fs.existsSync("storefront-v3.css"), "Folha visual antiga storefront-v3.css ainda existe");
assert(!index.includes("/storefront-v3.css"), "Folha visual antiga ainda carrega no HTML");
assert(!publicRenderer.includes("store-public-"), "Renderer publico novo usa classe visual antiga");
assert(!/class="[^"]*store-guided-/.test(editorRenderer), "Renderer editor novo usa classe visual antiga");
assert(docs.includes("Sistema visual e componentes reutilizáveis"), "Documentacao de componentes ausente");
assert(docs.includes("Arquivos visuais removidos"), "Documentacao nao registra remocao real");
assert(pkg.scripts["test:storefront-visual-rebuild"] === "node scripts/test-storefront-visual-rebuild.js", "Script npm ausente");

console.log("Storefront visual rebuild: V2 removida, V3 isolada e publicacao Web/PWA validadas.");
