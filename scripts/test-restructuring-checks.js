const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

function warn(condition, message) {
  if (!condition) console.warn(`WARN: ${message}`);
  else console.log(`OK: ${message}`);
}

function getFunctionBody(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  const braceStart = source.indexOf("{", start);
  if (braceStart < 0) return "";
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(braceStart + 1, index);
    }
  }
  return "";
}

const app = read("app.js");
const css = read("style.css");
const sw = read("sw.js");
const index = read("index.html");
const pkg = JSON.parse(read("package.json"));

[
  "docs/reestruturacao-profissional-checks.md",
  "docs/module-dependencies.md",
  "docs/render-flow.md",
  "docs/css-risk-map.md",
  "docs/layout-zones.md",
  "docs/design-system.md",
  "docs/theme-tokens.md",
  "docs/spacing-system.md",
  "docs/components.md",
  "docs/component-contracts.md",
  "docs/storefront-architecture.md",
  "docs/storefront-layout.md",
  "docs/storefront-zones.md"
].forEach((file) => assert(exists(file), `documento de reestruturacao presente: ${file}`));

[
  "core/.gitkeep",
  "layouts/.gitkeep",
  "components/.gitkeep",
  "themes/.gitkeep",
  "legacy/.gitkeep",
  "themes/base/tokens.css",
  "themes/dark/tokens.css",
  "themes/light/tokens.css",
  "themes/premium/tokens.css",
  "components/buttons/contract.css",
  "components/cards/contract.css",
  "components/inputs/contract.css",
  "components/modals/contract.css",
  "components/badges/contract.css",
  "components/tables/contract.css",
  "components/navigation/contract.css",
  "components/empty-states/contract.css",
  "components/loaders/contract.css",
  "modules/storefront/README.md",
  "modules/storefront/contract.css",
  "modules/store-editor/README.md",
  "modules/store-editor/contract.css",
  "modules/store-preview/README.md",
  "modules/store-preview/contract.css"
].forEach((file) => assert(exists(file), `pasta-base preparada: ${file}`));

assert(/const APP_VERSION = "1\.0\.16-estavel"/.test(app), "app.js esta na versao 1.0.16-estavel");
assert(/const APP_VERSION_CODE = 15/.test(app), "app.js possui versionCode 15");
assert(index.includes('id="app-shell"'), "index.html monta app-shell");
assert(index.includes('id="app-content"'), "index.html monta app-content");
assert(index.includes('id="overlay-layer"'), "index.html monta overlay-layer");
assert(index.includes('id="drawer-layer"'), "index.html monta drawer-layer");
assert(index.includes('id="modal-layer"'), "index.html monta modal-layer");
assert(index.includes('id="toast-layer"'), "index.html monta toast-layer");
assert(app.includes("function ensureAppShellLayers"), "app.js garante app-shell em runtime");
["openModal", "closeModal", "openDrawer", "closeDrawer", "showToast", "hideToast", "showOverlay", "hideOverlay"].forEach((fn) => {
  assert(app.includes(`function ${fn}`), `handler global presente: ${fn}`);
});
assert(app.includes("function normalizeLayerOptions"), "wrapper de modal/drawer aceita assinatura estruturada");
assert(app.includes("function renderOverlayScrim"), "overlay central usa scrim padronizado");
assert(app.includes("function syncAppShellLayerState"), "estado global das camadas sincroniza lock visual");
assert(app.includes("app-layer-open"), "body recebe classe de lock quando camada visual esta ativa");
assert(app.includes("openModal({\n    size: \"wide\""), "modal legal migrado para modal-layer");
assert(app.includes("openDrawer({\n    content: renderDrawerLateral"), "drawer lateral migrado para drawer-layer");
assert(!getFunctionBody(app, "abrirDocumentoLegal").includes("popup.innerHTML"), "abrirDocumentoLegal nao escreve mais direto no popup legado");
assert(!getFunctionBody(app, "abrirDrawerLateral").includes("popup.innerHTML"), "abrirDrawerLateral nao escreve mais direto no popup legado");
["--z-base", "--z-sidebar", "--z-overlay", "--z-drawer", "--z-modal", "--z-toast", "--z-critical"].forEach((token) => {
  assert(css.includes(token), `token z-index presente: ${token}`);
});
assert(!/z-index\s*:\s*(9999|10000)\s*;/.test(css), "CSS nao usa z-index 9999/10000 hardcoded fora dos tokens");
assert(!/z-index\s*:\s*(9999|10000)\s*;/.test(app), "app.js nao usa z-index 9999/10000 inline hardcoded");
assert(sw.includes("simplifica-3d-v116-estavel-20260526-plan-profile-rings"), "service worker possui cache versionado atual");
assert(sw.includes("caches.keys()"), "service worker limpa caches antigos");
assert(index.includes("1.0.16-estavel-plan-profile-rings"), "index.html usa cache-bust atual");

[
  "--bg-primary",
  "--bg-secondary",
  "--bg-tertiary",
  "--card-bg",
  "--card-bg-hover",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--border-primary",
  "--border-secondary",
  "--accent-primary",
  "--accent-secondary",
  "--success",
  "--warning",
  "--danger",
  "--info",
  "--space-xxs",
  "--space-xs",
  "--space-sm",
  "--space-md",
  "--space-lg",
  "--space-xl",
  "--space-2xl",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-pill",
  "--radius-card",
  "--radius-button",
  "--shadow-xs",
  "--shadow-sm",
  "--shadow-md",
  "--shadow-lg",
  "--shadow-xl",
  "--shadow-soft",
  "--font-xs",
  "--font-sm",
  "--font-md",
  "--font-lg",
  "--font-xl",
  "--font-2xl",
  "--topbar-height",
  "--bottom-nav-height",
  "--content-max-width",
  "--transition-fast",
  "--transition-base",
  "--transition-slow"
].forEach((token) => assert(css.includes(token), `token global presente: ${token}`));
["--breakpoint-mobile", "--breakpoint-tablet", "--breakpoint-desktop", "--breakpoint-ultrawide", "--sidebar-width"].forEach((token) => {
  assert(css.includes(token), `token/layout responsivo presente: ${token}`);
});
[
  ".ds-button",
  ".ds-card",
  ".ds-input",
  ".ds-modal",
  ".ds-badge",
  ".ds-table",
  ".ds-nav-item",
  ".ds-empty-state",
  ".ds-skeleton",
  ".ds-loader"
].forEach((selector) => assert(css.includes(selector), `contrato visual ativo presente: ${selector}`));
[
  ".store-layout-zone",
  ".store-editor-zone",
  ".store-preview-zone",
  ".store-products",
  ".store-preview-scroll",
  ".store-cart-drawer",
  "contain:layout paint"
].forEach((selector) => assert(css.includes(selector), `contrato modular da storefront presente: ${selector}`));
[
  "--interaction-hover-lift",
  "--interaction-active-scale",
  "@keyframes ds-enter-soft",
  "@keyframes ds-toast-in",
  "@keyframes ds-skeleton-sweep",
  "prefers-reduced-motion: reduce"
].forEach((marker) => assert(css.includes(marker), `polimento premium presente: ${marker}`));
assert(css.includes("body.app-shell-ready #app-content"), "app-content e o scroller principal do app shell");
assert(css.includes("body.app-shell-ready.app-layer-open #app-content"), "scroll de fundo bloqueado quando camadas visuais estao abertas");
[".layout-shell", ".layout-admin", ".layout-storefront", ".layout-auth", ".layout-editor"].forEach((zone) => {
  assert(css.includes(zone), `zona oficial de layout presente: ${zone}`);
});

assert(css.includes(".side-drawer"), "CSS possui drawer mobile");
assert(css.includes(".mobile-bottom-nav"), "CSS possui bottom navigation mobile");
assert(app.includes("function renderMobileBottomNav"), "app.js renderiza bottom navigation mobile");
assert(app.includes("function renderDrawerLateral"), "app.js renderiza drawer lateral");

assert(exists("src/storefront/services/storefront-public.service.ts"), "servico publico de storefront existe");
assert(exists("src/storefront/services/storefront-admin.service.ts"), "servico admin de storefront existe");
assert(exists("src/storefront/adapters/product.adapter.ts"), "adapter de produto de storefront existe");
assert(exists("src/storefront/plans/storefrontPlanRules.ts"), "regras de planos de storefront existem");

[
  "activePlan",
  "subscriptionStatus",
  "expiresAt",
  "normalizarSlugPlano",
  "checkout_opened",
  "setPlansModernTab"
].forEach((marker) => assert(app.includes(marker), `marcador de planos/assinatura presente: ${marker}`));

[
  "test:storefront-pwa-upgrade",
  "test:ui-theme-consistency",
  "test:storefront-desktop-upscale",
  "test:plans-saas-structure",
  "test:project-saneamento"
].forEach((script) => assert(Boolean(pkg.scripts?.[script]), `script npm ativo: ${script}`));

warn(css.includes("--z-sidebar"), "tokens de z-index formalizados para a Fase 2A");
warn(exists("modules/storefront/README.md"), "pasta modules agora expoe apenas contratos seguros da storefront");
warn(app.includes("enableNewStorefront") || app.includes("enableNewPlans"), "feature flags oficiais ainda devem ser formalizadas");

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Checks de reestruturacao concluidos.");
