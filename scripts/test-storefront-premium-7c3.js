const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  const start = app.indexOf(`function ${name}`);
  assert(start >= 0, `Funcao ausente: ${name}`);
  const paramsStart = app.indexOf("(", start);
  let paramsDepth = 0;
  let braceStart = -1;
  for (let index = paramsStart; index < app.length; index += 1) {
    if (app[index] === "(") paramsDepth += 1;
    if (app[index] === ")") paramsDepth -= 1;
    if (paramsDepth === 0) {
      braceStart = app.indexOf("{", index);
      break;
    }
  }
  assert(braceStart >= 0, `Corpo ausente: ${name}`);
  let depth = 0;
  for (let index = braceStart; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") depth -= 1;
    if (depth === 0) return app.slice(start, index + 1);
  }
  throw new Error(`Funcao incompleta: ${name}`);
}

[
  "function renderStorePublicHomeContact",
  "function renderStorePublicContactGrid",
  "function renderStorePublicContactCta",
  "Novidades em breve",
  "Estamos preparando nosso catálogo",
  'maxlength="100"',
  'maxlength="60"',
  'maxlength="180"',
  'class="store-public-product-options"',
  "store-public-whatsapp-action"
].forEach((marker) => assert(app.includes(marker), `Storefront premium incompleta: ${marker}`));

const publicRender = extractFunction("renderStorefrontPublicLegacy");
const bannerIndex = publicRender.indexOf("${renderStorePublicBanner(vm)}");
const benefitsIndex = publicRender.indexOf("${renderStorePublicBenefits(vm)}");
const categoriesIndex = publicRender.indexOf("${renderStorePublicCategoryBar(vm)}");
const contactIndex = publicRender.indexOf("${renderStorePublicHomeContact(vm)}");
assert(bannerIndex >= 0 && benefitsIndex > bannerIndex && categoriesIndex > benefitsIndex && contactIndex > categoriesIndex, "Home premium deve seguir banner, beneficios, categorias e contato");
assert(!publicRender.includes("${renderStorePublicTestimonials(vm)}"), "Home premium nao deve renderizar depoimentos genericos");
assert(!publicRender.includes("${renderStorePublicPromoSection(vm)}"), "Home premium nao deve renderizar promocao redundante");

const contactPage = extractFunction("renderStorePublicContactPage");
assert(contactPage.includes("${renderStorePublicContactGrid(vm)}"), "Contato publico deve usar grade unica");
assert(contactPage.includes("${renderStorePublicContactCta(vm)}"), "Contato publico deve usar CTA unico");
assert(!contactPage.includes("renderStoreContactHeroPreview"), "Contato publico nao deve duplicar preview administrativo");
assert(extractFunction("renderStoreAdminControls").includes('if (!getStorefrontPublicMode(vm).admin) return "";'), "Controles admin devem permanecer bloqueados na visao publica");
assert(extractFunction("renderStoreAdminFloatingEditor").includes('if (!mode.admin) return "";'), "Editor flutuante nao pode vazar para cliente");

[
  "Fase 7C.3 - storefront publica premium clara",
  "--store-bg:#f2f5f4",
  "grid-template-columns:repeat(4, minmax(0, 1fr))",
  "aspect-ratio:1 / 1",
  ".store-public-product-options",
  ".store-public-contact-cta",
  ".store-public-floating-cart{",
  "@media (max-width:359px)"
].forEach((marker) => assert(css.includes(marker), `CSS premium 7C.3 ausente: ${marker}`));

assert(sw.includes("simplifica-3d-v149-light-theme-no-gradient-20260606"), "Cache PWA premium ausente");
assert(index.includes("1.0.43-rc-light-theme-no-gradient-20260606"), "Cache-bust premium ausente");

console.log("Storefront premium 7C.3: composicao clara, contato unico, cards responsivos, detalhe e cache validados.");
