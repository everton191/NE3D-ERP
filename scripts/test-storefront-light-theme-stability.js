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

assert(app.includes('light: "#f2f5f4"'), "Theme-color claro da loja deve usar o fundo suave, nao branco puro");

[
  'const storeKey = "simplifica3d_store_theme_preference"',
  'const legacyStoreKey = "simplifica3d_store_theme"',
  'document.documentElement.setAttribute("data-store-theme", storeTheme)',
  'document.documentElement.setAttribute("data-store-theme-preference", storePreference)',
  'return allowed.includes(value) ? value : "light"',
  'erpTheme === "dark" ? "#08131d" : "#f2f5f4"',
  "1.0.38-rc-pwa-apk-navigation-20260604"
].forEach((marker) => assert(index.includes(marker), `Bootstrap claro antecipado ausente: ${marker}`));

[
  ':root[data-store-theme="light"]',
  ':root[data-store-theme="dark"]',
  '.store-public-shell[data-storefront-source="v2"][data-store-theme="dark"]',
  "--store-card:#fcfdfc",
  "--store-input-bg:#f8faf9",
  "--store-input-placeholder:#7b8991",
  "--store-banner-overlay:none",
  ":root[data-store-theme] :where(.store-cart-drawer,.store-lead-modal)",
  ":root[data-store-theme] body :is(.store-cart-drawer,.store-lead-modal)",
  "background:var(--store-card)",
  "background:var(--store-header-bg)",
  ".store-public-banner.store-banner-has-image > img",
  ".store-public-banner:has(> img) > img",
  "filter:none !important",
  "mix-blend-mode:normal !important",
  "background-image:none !important",
  "Checkpoint 2026-06-01 - auditoria pesada do tema claro da loja",
  ".store-public-banner.store-banner-has-image .store-public-banner-copy",
  "Hotfix 2026-06-01 - loja clara sem estouro lateral no editor guiado",
  'body.theme-light .store-public-shell[data-storefront-source="v2"]:not([data-store-theme="dark"])',
  ".store-public-banner.store-banner-has-image::before",
  ".store-public-banner.store-banner-has-image::after",
  "content:none !important",
  "display:none !important",
  "body.theme-light .store-banner-section img",
  'body.theme-light .store-public-shell[data-storefront-source="v2"][data-store-theme="light"] .store-hero-device-art',
  "opacity:.74",
  "body.mobile-mode :where(",
  ".storefront-admin-page,",
  ".store-public-main",
  "padding-bottom:calc(var(--size-bottom-nav-height) + var(--space-2xl))",
  "grid-template-columns:repeat(2, minmax(0, 1fr))",
  "overflow-x:hidden"
].forEach((marker) => assert(css.includes(marker), `Token claro ou componente migrado ausente: ${marker}`));

[
  'const userBanner = String(store.banner_url || "").trim()',
  'const visualBanner = userBanner || (mode.admin ? getStorefrontDemoBannerImage() : "")'
].forEach((marker) => assert(app.includes(marker), `Fallback visual do banner ausente: ${marker}`));

[
  "radial-gradient(circle at 78% 38%",
  "linear-gradient(135deg, #f6fbfc 0%, #edf6f8 48%, #dfecef 100%)",
  "linear-gradient(90deg, rgba(246,251,252,.92) 0%, rgba(238,247,249,.74) 48%, rgba(226,238,242,.18) 100%)"
].forEach((legacyGradient) => assert(!css.includes(legacyGradient), `Gradiente legado do tema claro ainda ativo: ${legacyGradient}`));

assert(!app.includes('${["auto", "light", "dark"].map'), "Loja ainda oferece valor legado auto");
assert(css.includes("body.theme-light.app-shell-ready #app-shell"), "Shell claro do ERP deve neutralizar vidro herdado");
assert(css.includes("body.theme-light.app-shell-ready #app-content"), "Conteudo claro do ERP deve neutralizar vidro herdado");
assert(designSystemV2.includes(".storefront-theme-v2.store-public-shell"), "Shell publico V2 deve possuir isolamento estrutural");
assert(designSystemV2.includes(".storefront-theme-v2 .store-public-connection-badge"), "Badge online V2 deve possuir contrato proprio");
assert(designSystemV2.includes("position:static"), "Badge online V2 nao deve flutuar sobre conteudo");
function getBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert(start >= 0, `Bloco nao encontrado: ${startMarker}`);
  const end = endMarker ? source.indexOf(endMarker, start + startMarker.length) : -1;
  return source.slice(start, end > start ? end : source.length);
}

[
  getBlock(css, "body.theme-light :where(.card,.app-card,.modal-card", "body.theme-light :where(.card,.app-card,.modal-card,.popup-box,.ui-section,.technical-glass-panel,.dashboard-chart-card,.reports-panel,.settings-group) :where"),
  getBlock(css, "body.theme-light .store-public-shell[data-storefront-source=\"v2\"][data-store-theme=\"light\"] :where(", "body.theme-light .store-public-shell[data-storefront-source=\"v2\"][data-store-theme=\"light\"] :where(\n  .store-public-banner-copy h1"),
  getBlock(css, "body.theme-light .store-public-shell[data-storefront-source=\"v2\"][data-store-theme=\"light\"] .store-public-banner.store-banner-has-image::after", "body.theme-light .store-public-shell[data-storefront-source=\"v2\"][data-store-theme=\"light\"] .store-public-banner.store-banner-has-image .store-public-banner-copy"),
  getBlock(css, "body.theme-light .store-public-shell[data-storefront-source=\"v2\"][data-store-theme=\"light\"] .store-public-banner.store-banner-has-image .store-public-banner-copy", "body.theme-light .store-public-shell[data-storefront-source=\"v2\"][data-store-theme=\"light\"] .store-public-banner.store-banner-has-image .store-public-banner-copy h1")
].forEach((block, index) => assert(!/linear-gradient|radial-gradient/.test(block), `Gradiente decorativo ainda existe no bloco claro ${index + 1}`));

assert(manifest.includes('"background_color": "#f2f5f4"'), "Splash PWA ainda nao usa fundo claro suave");
assert(manifest.includes('"theme_color": "#f2f5f4"'), "Manifest PWA ainda nao usa theme-color claro suave");
assert(sw.includes("simplifica-3d-v144-pwa-apk-navigation-20260604"), "Cache PWA do tema claro nao foi atualizado");

console.log("Storefront light theme stability: padrao claro, persistencia, tokens, drawers globais, manifest e cache validados.");
