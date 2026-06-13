const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const app = read("app.js");
const css = read("style.css");
const storefrontCss = read("storefront-v3.css");
const index = read("index.html");
const sw = read("sw.js");
const renderApp = app.slice(app.indexOf("function renderApp("), app.indexOf("function podeMostrarControlesFlutuantes("));

assert(app.includes("const STOREFRONT_PUBLIC_RELEASE = true;"), "loja publica deve estar oficializada sem porta beta");
assert(!renderApp.includes("sincronizarStorefrontBetaAccessRemoto(false)"), "render principal nao deve consultar beta legado");
[
  "Beta fechado",
  "Experiência beta",
  "Editor visual futuro",
  "Preview da sua loja",
  "Ver preview",
  "Demonstração visual",
  "Crop guiado + compressão leve"
].forEach((label) => assert(!app.includes(label), `interface ainda contem rotulo tecnico: ${label}`));
assert(app.includes("Modelos para começar"), "aviso de modelos deve usar linguagem comercial");
assert(app.includes("Visualização da loja"), "visualizacao deve estar em portugues");
assert(app.includes("Visualização da sua loja"), "rotulo de visualizacao da loja deve estar em portugues");
assert(app.includes("Vinculado ao estoque"), "modo de estoque deve estar em portugues");
assert(!app.includes("Vinculado ao ERP"), "interface nao deve expor nomenclatura interna do estoque");
assert(app.includes("Contatos/Pedidos"), "aba de contatos nao deve usar lead em ingles");
assert(app.includes('alt="Banner ${escaparAttr(getStorefrontDisplayName(store))}"'), "banner deve usar nome publico seguro");
assert(app.includes("const storeDisplayName = getStorefrontDisplayName(vm.store);"), "SEO deve usar nome publico seguro");
assert(!app.includes(">Abrir admin da loja</button>"), "cartao principal nao deve repetir entrada do proprio admin");
assert(css.includes(".ui-action-bar"), "barra de acoes reutilizavel ausente");
assert(css.includes(".ui-icon-button"), "botao compacto reutilizavel ausente");
assert(css.includes(".ui-context-menu"), "menu contextual reutilizavel ausente");
assert(app.includes("function renderStorefrontV3HeaderMenu"), "menu superior V3 deve possuir renderizador proprio");
assert(app.includes('class="storefront-v3__menu ui-context-menu"'), "menu superior V3 deve abrir como flyout");
assert(app.includes('aria-controls="storefront-v3-header-menu"'), "menu superior V3 deve possuir contrato acessivel");
assert(app.includes('role="menuitem" aria-label="Categorias"'), "opcoes do menu superior V3 devem possuir nomes acessiveis");
assert(!app.includes("document.getElementById('storefront-v3-categories')?.scrollIntoView"), "menu superior V3 nao deve rolar a pagina para categorias");
assert(app.includes('home: `<svg ${attrs}><path d="m3 11 9-8 9 8"'), "inicio deve possuir icone proprio de casa");
assert(app.includes('categoria: `<svg ${attrs}><rect x="4" y="4" width="6" height="6"'), "categorias deve possuir icone proprio de grade");
assert(app.includes('orcamento: `<svg ${attrs}><path d="M7 3h10l3 3v15H7z"'), "orcamento deve possuir icone proprio de documento");
assert(app.includes('${renderUiIcon("orcamento")}${cart.count ? `<em>${cart.count}</em>` : ""}<span>Orçamento</span>'), "barra inferior deve diferenciar orcamento de carrinho");
assert(app.slice(app.indexOf("function renderStorefrontV3BottomNav"), app.indexOf("function renderStorefrontV3Home")).includes('renderUiIcon("orcamento")'), "barra inferior V3 deve usar icone proprio de orcamento");
assert(storefrontCss.includes(".storefront-v3__menu-panel"), "menu superior V3 deve possuir painel flutuante");
assert(storefrontCss.includes(".storefront-v3__menu:not([open]) .storefront-v3__menu-panel"), "menu superior V3 deve fechar sem deslocar o layout");
assert(css.includes("grid-template-columns:112px minmax(0, 1fr);"), "cards administrativos desktop devem ser compactos");
assert(css.includes("grid-template-columns:72px minmax(0, 1fr);"), "cards administrativos mobile devem caber na viewport");
assert(css.includes("grid-template-columns:64px minmax(0, 1fr);"), "cards administrativos mobile estreitos devem manter leitura");
assert(index.includes("1.0.64-storefront-icons-20260613"), "cache-bust web oficial ausente");
assert(sw.includes("simplifica-3d-v170-storefront-icons-20260613"), "cache PWA oficial ausente");

console.log("Storefront public UI: loja oficial, textos em portugues e acoes compactas validados.");
