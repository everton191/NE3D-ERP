const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const designSystemV2 = fs.readFileSync("themes/base/design-system-v2.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'const STOREFRONT_THEME_STORAGE_KEY = "simplifica3d_store_theme_preference"',
  'const STOREFRONT_THEME_LEGACY_STORAGE_KEY = "simplifica3d_store_theme"',
  "function normalizarTemaLojaOnline",
  "function getStoreThemeSaved",
  "function updateStorefrontThemeColor",
  "function applyStoreTheme",
  "window.SimplificaStoreTheme = Object.freeze",
  'return window.SimplificaThemeAuthorityV2?.normalizePreference?.(theme, "light")',
  'data-storefront-source="v2"',
  'data-store-theme="${escaparAttr(storefrontTheme.mode)}" data-store-theme-preference="${escaparAttr(storefrontTheme.preference)}"',
  'store-banner-has-image',
  'mode: "light"',
  '${["light", "system", "dark"].map'
].forEach((marker) => assert(app.includes(marker), `Autoridade de tema da loja ausente: ${marker}`));

[
  'const storeKey = "simplifica3d_store_theme_preference"',
  'const legacyStoreKey = "simplifica3d_store_theme"',
  'document.documentElement.setAttribute("data-store-theme", storeTheme)',
  'document.documentElement.setAttribute("data-store-theme-preference", storePreference)',
  'return allowed.includes(value) ? value : "light"',
  'erpTheme === "dark" ? "#08131d" : "#ffffff"',
  "1.0.31-rc-light-theme-banner-actions-20260601"
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
  "background:var(--store-header-bg)",
  ".store-public-banner.store-banner-has-image > img",
  ".store-public-banner:has(> img) > img",
  "filter:none !important",
  "mix-blend-mode:normal !important",
  "Checkpoint 2026-06-01 - auditoria pesada do tema claro da loja",
  ".store-public-banner.store-banner-has-image .store-public-banner-copy"
].forEach((marker) => assert(css.includes(marker), `Token claro ou componente migrado ausente: ${marker}`));

assert(!app.includes('${["auto", "light", "dark"].map'), "Loja ainda oferece valor legado auto");
assert(css.includes("body.theme-light.app-shell-ready #app-shell"), "Shell claro do ERP deve neutralizar vidro herdado");
assert(css.includes("body.theme-light.app-shell-ready #app-content"), "Conteudo claro do ERP deve neutralizar vidro herdado");
assert(designSystemV2.includes(".storefront-theme-v2.store-public-shell"), "Shell publico V2 deve possuir isolamento estrutural");
assert(designSystemV2.includes(".storefront-theme-v2 .store-public-connection-badge"), "Badge online V2 deve possuir contrato proprio");
assert(designSystemV2.includes("position:static"), "Badge online V2 nao deve flutuar sobre conteudo");
assert(manifest.includes('"background_color": "#ffffff"'), "Splash PWA ainda nao usa fundo claro");
assert(manifest.includes('"theme_color": "#ffffff"'), "Manifest PWA ainda nao usa theme-color claro");
assert(sw.includes("simplifica-3d-v137-light-theme-banner-actions-20260601"), "Cache PWA do tema claro nao foi atualizado");

console.log("Storefront light theme stability: padrao claro, persistencia, tokens, drawers globais, manifest e cache validados.");
