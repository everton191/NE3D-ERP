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

function assertOrdered(source, markers, message) {
  let previousIndex = -1;
  markers.forEach((marker) => {
    const index = source.indexOf(marker);
    assert(index > previousIndex, `${message}: ${marker}`);
    previousIndex = index;
  });
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
const prepareWeb = read("scripts/prepare-web.js");
const pkg = JSON.parse(read("package.json"));
const storeEditorRenderer = read("modules/store-editor/storeEditorRenderer.js");
const storeEditorTabs = read("modules/store-editor/storeEditorTabs.js");
const storeEditorPreview = read("modules/store-editor/storeEditorPreview.js");
const storeEditorProducts = read("modules/store-editor/storeEditorProducts.js");

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
  "modules/store-editor/storeEditorRenderer.js",
  "modules/store-editor/storeEditorTabs.js",
  "modules/store-editor/storeEditorPreview.js",
  "modules/store-editor/storeEditorProducts.js",
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
assert(sw.includes("simplifica-3d-v116-estavel-20260528-store-editor-4g"), "service worker possui cache versionado atual");
assert(sw.includes("caches.keys()"), "service worker limpa caches antigos");
assert(index.includes("1.0.16-estavel-store-editor-4g-20260528"), "index.html usa cache-bust atual");
[
  "./modules/store-editor/storeEditorRenderer.js",
  "./modules/store-editor/storeEditorTabs.js",
  "./modules/store-editor/storeEditorPreview.js",
  "./modules/store-editor/storeEditorProducts.js"
].forEach((marker) => assert(sw.includes(marker), `fase 4f modulo entra no precache PWA: ${marker}`));

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
  "const enableStorefrontV2",
  "function renderStorefrontView",
  "mode = \"public\"",
  "source = \"legacy\"",
  "renderStorefrontPublicV2",
  "renderStorefrontPublicLegacy",
  "renderStorefrontPreviewLegacy",
  "renderStorefrontAdminPanelLegacy",
  "data-storefront-render",
  "data-storefront-source",
  "store-public-header store-header",
  "store-public-product-grid store-products",
  "store-public-footer store-footer",
  "storefront-admin-page store-editor-shell store-editor-zone"
].forEach((marker) => assert(app.includes(marker), `migracao storefront v2 presente: ${marker}`));
[
  "Hotfix 4B.1 - escala responsiva controlada da Storefront V2",
  ".store-public-shell[data-storefront-source=\"v2\"]",
  "--store-stage-max:clamp(1120px, 84vw, 1440px)",
  ".store-public-shell[data-storefront-source=\"v2\"] .store-public-banner-copy h1",
  ".store-public-shell[data-storefront-source=\"v2\"] .store-mobile-admin-actions",
  "@media (min-width:1024px)",
  "@media (min-width:1920px)"
].forEach((marker) => assert(css.includes(marker), `hotfix escala storefront v2 presente: ${marker}`));
[
  "Hotfix global - escala visual segura do ERP e Storefront",
  "html{\n  font-size:16px;",
  "--font-xs:0.75rem",
  "--font-3xl:1.875rem",
  "--space-md:0.75rem",
  "body[data-ui-profile=\"web_pwa\"]:not(.mobile-mode) :where(.btn,.app-button,.ds-button)",
  "body[data-ui-profile=\"web_pwa\"]:not(.mobile-mode) :where(.desktop-main,.app-page,.dashboard-grid,.desktop-grid)"
].forEach((marker) => assert(css.includes(marker), `hotfix escala global presente: ${marker}`));
[
  "function isTablet()",
  "function isDesktop()",
  "function getViewportMode()",
  "function applyViewportModeClasses",
  "viewport-mobile",
  "viewport-tablet",
  "viewport-desktop",
  "return Math.min(1.08, Math.max(0.86",
  "root.style.setProperty(\"--base-font-size\", \"1rem\")",
  "root.style.setProperty(\"--font-3xl\", \"1.875rem\")"
].forEach((marker) => assert(app.includes(marker), `controle global de escala presente: ${marker}`));
[
  "Hotfix global 2 - modo desktop/tablet/mobile explicito",
  "body.viewport-desktop .mobile-bottom-nav",
  "body.viewport-tablet .mobile-bottom-nav",
  "body.viewport-desktop .menu",
  "body.viewport-desktop .desktop-shell",
  "body.viewport-desktop :where(.desktop-sidebar,.app-sidebar,.side-menu:not(.side-drawer))",
  "body.viewport-mobile :where(.desktop-sidebar,.app-sidebar,.side-menu:not(.side-drawer))",
  "body.viewport-mobile .desktop-shell",
  "@media (min-width: 1024px)"
].forEach((marker) => assert(css.includes(marker), `hotfix viewport global presente: ${marker}`));
[
  "Hotfix sidebar desktop - separa menu ERP de drawer/mobile",
  "body.viewport-desktop{",
  "--sidebar-width:clamp(240px, 15vw, 300px)",
  "body.viewport-desktop :where(.app-sidebar,.desktop-sidebar,.side-menu:not(.side-drawer))",
  "flex-direction:column !important",
  "body.viewport-desktop :where(.mobile-menu,.mobile-drawer,.app-bottom-nav,.app-bottom-navigation,.mobile-bottom-nav,.side-drawer)"
].forEach((marker) => assert(css.includes(marker), `hotfix sidebar desktop presente: ${marker}`));
[
  "side-menu app-sidebar desktop-sidebar",
  "side-menu side-drawer mobile-drawer"
].forEach((marker) => assert(app.includes(marker), `separacao sidebar/drawer presente: ${marker}`));
[
  "products:new",
  "product:${product.id}",
  "fecharPopup(); abrirEditorProdutoLojaOnline()",
  "abrirEditorProdutoLojaOnline('${escaparAttr(action.slice(8))}')"
].forEach((marker) => assert(app.includes(marker), `atalho de produtos da loja abre editor correto: ${marker}`));
[
  "Hotfix menu loja - evita sobreposicao dos links no editor",
  "@media (max-width: 1180px)",
  "@media (max-width: 1360px)",
  ".store-public-shell .store-public-header .store-public-menu-toggle",
  ".store-public-shell.store-public-admin-mode .store-public-header .store-public-menu-toggle",
  ".store-public-shell .store-public-header.mobile-open .store-public-main-nav",
  ".store-public-shell .store-public-header.mobile-open .store-public-actions"
].forEach((marker) => assert(css.includes(marker), `hotfix menu loja presente: ${marker}`));
[
  "Fase 4C - editor profissional da loja",
  ".store-editor-shell",
  ".store-editor-sidebar",
  ".store-editor-workspace",
  ".store-editor-header",
  ".store-editor-main",
  ".store-editor-sections",
  ".store-preview-panel"
].forEach((marker) => assert(css.includes(marker), `fase 4c editor profissional presente no CSS: ${marker}`));
[
  "function renderStorefrontEditorActionGroups",
  "function renderStoreEditorTabContent",
  "store-editor-tab-panel",
  "has-inline-preview",
  "store-editor-shell store-editor-zone",
  "store-editor-sidebar",
  "store-editor-workspace",
  "store-editor-main",
  "store-editor-sections",
  "store-preview-container store-preview-panel store-preview-zone"
].forEach((marker) => assert(app.includes(marker), `fase 4c editor profissional presente no app: ${marker}`));
[
  "Fase 4D - refinamento e migracao do editor da loja",
  ".store-editor-tab-panel",
  ".store-editor-tab-panel.has-preview-panel",
  ".store-editor-tab-main",
  ".store-products-summary",
  ".store-products-summary-grid",
  ".store-product-editor-panel",
  ".store-product-list-panel",
  ".store-preview-panel .store-preview-device",
  ".store-preview-panel .store-preview-scroll"
].forEach((marker) => assert(css.includes(marker), `fase 4d refinamento do editor presente no CSS: ${marker}`));
[
  "storefrontProductForm",
  "store-products-summary",
  "store-product-editor-panel",
  "store-product-list-panel",
  "Adicionar produto",
  "renderStoreEditorTabContent(activeTab, bodyContent, vm)"
].forEach((marker) => assert(app.includes(marker), `fase 4d refinamento do editor presente no app: ${marker}`));
[
  "SimplificaStoreEditor",
  "getStoreEditorNamespace",
  "isStoreEditorModuleReady",
  "logStoreEditorModuleFallback",
  "renderer.renderTabContent",
  "renderStorefrontView({ mode: \"editor\" })",
  "renderStorefrontView({ mode: \"public\" })"
].forEach((marker) => assert(app.includes(marker), `fase 4e app.js continua orquestrando com modulo: ${marker}`));
[
  "/modules/store-editor/storeEditorTabs.js",
  "/modules/store-editor/storeEditorPreview.js",
  "/modules/store-editor/storeEditorProducts.js",
  "/modules/store-editor/storeEditorRenderer.js"
].forEach((marker) => assert(index.includes(marker), `fase 4e modulo carregado antes do app: ${marker}`));
assertOrdered(index, [
  "/modules/store-editor/storeEditorRenderer.js",
  "/modules/store-editor/storeEditorTabs.js",
  "/modules/store-editor/storeEditorPreview.js",
  "/modules/store-editor/storeEditorProducts.js",
  "/app.js"
], "fase 4e ordem de scripts antes do app.js");
[
  "modules/store-editor",
  "modules/store-preview",
  "modules/storefront"
].forEach((marker) => assert(prepareWeb.includes(marker), `fase 4e build copia modulo publico: ${marker}`));
[
  "renderTabContent",
  "store-editor-tab-panel",
  "has-preview-panel",
  "has-inline-preview",
  "store-editor-tab-main",
  "data-store-editor-renderer=\"module\"",
  "data-store-editor-modules-ready=\"true\"",
  "data-store-editor-module-version",
  "moduleVersion = \"store-editor-4g\"",
  "isStoreEditorModuleReady"
].forEach((marker) => assert(storeEditorRenderer.includes(marker), `fase 4e renderer preserva contrato: ${marker}`));
assert(app.includes("data-store-editor-renderer=\"fallback\""), "fase 4f fallback legado continua identificavel");
assert(app.includes("data-store-editor-modules-ready=\"false\""), "fase 4f fallback marca modulos indisponiveis");
assert(app.includes("data-store-editor-module-version=\"app-fallback-4g\""), "fase 4g fallback possui versao diagnostica");
assert(app.includes("[StoreEditorModules] módulos incompletos, usando fallback local"), "fase 4f fallback possui log debug controlado");
assert(app.includes("FALLBACK_REQUIRED Fase 4G"), "fase 4g fallback minimo classificado");
assert(app.includes("store-editor-fallback-minimal"), "fase 4g fallback minimo aplicado");
assert(!getFunctionBody(app, "renderStoreEditorTabContent").includes("previewTitles"), "fase 4g remove duplicacao de titulos de preview do fallback");
[
  "sanitizeTab",
  "hasInlinePreview",
  "getPreviewCopy"
].forEach((marker) => assert(storeEditorTabs.includes(marker), `fase 4e tabs helper presente: ${marker}`));
[
  "renderPreviewForTab",
  "store-preview-device",
  "store-preview-scroll"
].forEach((marker) => assert(`${storeEditorPreview}\n${app}`.includes(marker), `fase 4e preview preservado: ${marker}`));
[
  "getStats",
  "renderEmptyState",
  "storefrontProductForm"
].forEach((marker) => assert(`${storeEditorProducts}\n${app}`.includes(marker), `fase 4e produtos preservados: ${marker}`));
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
  "cancelAtPeriodEnd",
  "getPlanAccessState",
  "canCancelRenewal",
  "shouldShowPendingPayment",
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
  "test:plans",
  "test:project-saneamento"
].forEach((script) => assert(Boolean(pkg.scripts?.[script]), `script npm ativo: ${script}`));

warn(css.includes("--z-sidebar"), "tokens de z-index formalizados para a Fase 2A");
warn(exists("modules/storefront/README.md"), "pasta modules agora expoe apenas contratos seguros da storefront");
warn(app.includes("enableStorefrontV2") || app.includes("enableNewStorefront") || app.includes("enableNewPlans"), "feature flags oficiais formalizadas");

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Checks de reestruturacao concluidos.");
