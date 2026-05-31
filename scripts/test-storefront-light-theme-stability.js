const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'const STOREFRONT_THEME_STORAGE_KEY = "simplifica3d_store_theme"',
  "function normalizarTemaLojaOnline",
  "function getStoreThemeSaved",
  "function updateStorefrontThemeColor",
  "function applyStoreTheme",
  "window.SimplificaStoreTheme = Object.freeze",
  'return normalized === "dark" || normalized === "light" ? normalized : "light"',
  'data-store-theme="${escaparAttr(storefrontTheme.mode)}"',
  'mode: "light"',
  '${["light", "dark"].map'
].forEach((marker) => assert(app.includes(marker), `Autoridade de tema da loja ausente: ${marker}`));

[
  'localStorage.getItem(storageKey)',
  'savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light"',
  'document.documentElement.setAttribute("data-store-theme", resolvedTheme)',
  'resolvedTheme === "dark" ? "#08131d" : "#ffffff"',
  "1.0.24-rc-storefront-light-theme-20260531"
].forEach((marker) => assert(index.includes(marker), `Bootstrap claro antecipado ausente: ${marker}`));

[
  ':root[data-store-theme="light"]',
  ':root[data-store-theme="dark"]',
  '.store-public-shell[data-storefront-source="v2"][data-store-theme="dark"]',
  "--store-card:#ffffff",
  "--store-input-bg:#ffffff",
  "--store-input-placeholder:#7b8991",
  ":root[data-store-theme] :where(.store-cart-drawer,.store-lead-modal)",
  ":root[data-store-theme] body :is(.store-cart-drawer,.store-lead-modal)",
  "background:var(--store-card)",
  "background:var(--store-header-bg)"
].forEach((marker) => assert(css.includes(marker), `Token claro ou componente migrado ausente: ${marker}`));

assert(!app.includes('${["auto", "light", "dark"].map'), "Loja ainda oferece modo automatico dependente do sistema operacional");
assert(manifest.includes('"background_color": "#ffffff"'), "Splash PWA ainda nao usa fundo claro");
assert(manifest.includes('"theme_color": "#ffffff"'), "Manifest PWA ainda nao usa theme-color claro");
assert(sw.includes("simplifica-3d-v130-estavel-20260531-storefront-light-theme"), "Cache PWA do tema claro nao foi atualizado");

console.log("Storefront light theme stability: padrao claro, persistencia, tokens, drawers globais, manifest e cache validados.");
