const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const cssChecks = [
  "--store-stage-max",
  "--store-shadow-soft",
  "body.theme-light .store-public-shell",
  "body:not(.theme-light) .store-public-shell",
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
