const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const app = read("app.js");
const css = read("style.css");
const index = read("index.html");
const sw = read("sw.js");
const renderApp = app.slice(app.indexOf("function renderApp("), app.indexOf("function podeMostrarControlesFlutuantes("));

assert(app.includes("const STOREFRONT_PUBLIC_RELEASE = true;"), "loja publica deve estar oficializada sem porta beta");
assert(!renderApp.includes("sincronizarStorefrontBetaAccessRemoto(false)"), "render principal nao deve consultar beta legado");
[
  "Beta fechado",
  "Experiência beta",
  "Editor visual futuro",
  "Preview da sua vitrine",
  "Ver preview",
  "Demonstração visual",
  "Crop guiado + compressão leve"
].forEach((label) => assert(!app.includes(label), `interface ainda contem rotulo tecnico: ${label}`));
assert(app.includes("Modelos para começar"), "aviso de modelos deve usar linguagem comercial");
assert(app.includes("Visualização da vitrine"), "visualizacao deve estar em portugues");
assert(app.includes("Vinculado ao estoque"), "modo de estoque deve estar em portugues");
assert(!app.includes("Vinculado ao ERP"), "interface nao deve expor nomenclatura interna do estoque");
assert(app.includes("Contatos/Pedidos"), "aba de contatos nao deve usar lead em ingles");
assert(app.includes('alt="Banner ${escaparAttr(getStorefrontDisplayName(store))}"'), "banner deve usar nome publico seguro");
assert(app.includes("const storeDisplayName = getStorefrontDisplayName(vm.store);"), "SEO deve usar nome publico seguro");
assert(!app.includes(">Abrir admin da loja</button>"), "cartao principal nao deve repetir entrada do proprio admin");
assert(css.includes(".ui-action-bar"), "barra de acoes reutilizavel ausente");
assert(css.includes(".ui-icon-button"), "botao compacto reutilizavel ausente");
assert(css.includes(".ui-context-menu"), "menu contextual reutilizavel ausente");
assert(css.includes("grid-template-columns:112px minmax(0, 1fr);"), "cards administrativos desktop devem ser compactos");
assert(css.includes("grid-template-columns:72px minmax(0, 1fr);"), "cards administrativos mobile devem caber na viewport");
assert(css.includes("grid-template-columns:64px minmax(0, 1fr);"), "cards administrativos mobile estreitos devem manter leitura");
assert(index.includes("1.0.30-rc-storefront-public-ui-20260601"), "cache-bust web oficial ausente");
assert(sw.includes("simplifica-3d-v136-storefront-public-ui-20260601"), "cache PWA oficial ausente");

console.log("Storefront public UI: loja oficial, textos em portugues e acoes compactas validados.");
