const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const cssChecks = [
  "--store-stage-max",
  "--store-shadow-soft",
  '.store-public-shell[data-storefront-source="v2"][data-store-theme="light"]',
  '.store-public-shell[data-storefront-source="v2"][data-store-theme="dark"]',
  ".store-public-product-card:hover",
  ".store-public-banner",
  ".store-public-header",
  ".store-public-category-bar a"
];

const appChecks = [
  "getStorefrontControlledTheme",
  "normalizarCorTemaControlado",
  "renderThemePaletteButtons",
  "selecionarPaletaStorefront"
];

const missing = cssChecks.filter((needle) => !css.includes(needle))
  .concat(appChecks.filter((needle) => !app.includes(needle)));

if (missing.length) {
  throw new Error(`Balanceamento visual do storefront incompleto: ${missing.join(", ")}`);
}

console.log("Storefront visual balance: superficies, profundidade e paletas controladas verificadas.");
