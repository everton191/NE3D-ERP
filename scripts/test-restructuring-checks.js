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
const storefrontPublicV3 = read("src/storefront/renderers/publicV3.js");
const storefrontEditorV3 = read("src/storefront/renderers/editorV3.js");
const storefrontLayoutsV3 = read("src/storefront/styles/layouts.css");

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
  "modules/store-preview/contract.css",
  "src/storefront/renderers/publicV3.js",
  "src/storefront/renderers/editorV3.js",
  "src/storefront/styles/tokens.css",
  "src/storefront/styles/components.css",
  "src/storefront/styles/layouts.css"
].forEach((file) => assert(exists(file), `pasta-base preparada: ${file}`));

assert(/const APP_VERSION = "1\.0\.36-rc"/.test(app), "app.js esta na versao 1.0.36-rc");
assert(/const APP_VERSION_CODE = 35/.test(app), "app.js possui versionCode 35");
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
assert(sw.includes("simplifica-3d-v176-mobile-fixes-ads-space-20260615"), "service worker possui cache versionado atual");
assert(sw.includes("caches.keys()"), "service worker limpa caches antigos");
assert(index.includes("1.0.69-mobile-fixes-ads-space-20260615"), "index.html usa cache-bust atual");
assert(exists("src/services/safeAreaManager.js"), "safeAreaManager central existe");
assert(index.indexOf("/src/services/safeAreaManager.js") > -1 && index.indexOf("/src/services/safeAreaManager.js") < index.indexOf("/app.js?v="), "safeAreaManager carrega antes do app");
assert(sw.includes("./src/services/safeAreaManager.js"), "safeAreaManager entra no precache PWA");
assert(css.includes("--app-safe-bottom"), "CSS usa variavel global de safe area inferior");
assert(css.includes("bottom:0 !important"), "Bottom nav principal nao deve somar margem fixa");
assert(css.includes("padding-bottom:var(--app-safe-bottom) !important"), "Bottom nav principal usa padding seguro");
assert(css.includes("bottom:calc(var(--app-safe-bottom) + 16px) !important"), "Elementos inferiores flutuantes usam safe area central");
assert(read("android/app/src/main/java/br/com/ne3d/erp/MainActivity.java").includes("simplifica-native-insets-change"), "Android notifica mudanca de insets para o WebView");
assert(pkg.scripts && pkg.scripts["test:layout-overflow-v2"] === "node scripts/test-layout-overflow-v2.js", "package.json expoe test:layout-overflow-v2");
assert(pkg.scripts && pkg.scripts["test:erp-shell-v2"] === "node scripts/test-erp-shell-v2.js", "package.json expoe test:erp-shell-v2");
assert(pkg.scripts && pkg.scripts["test:storefront-public-ui"] === "node scripts/test-storefront-public-ui.js", "package.json expoe test:storefront-public-ui");
assert(app.includes("const STOREFRONT_PUBLIC_RELEASE = true;"), "loja publica V2 esta oficializada sem porta beta");
assert(!getFunctionBody(app, "renderApp").includes("sincronizarStorefrontBetaAccessRemoto(false)"), "render principal nao consulta acesso beta legado");
assert(app.includes("function selecionarItemLojaVisual"), "fase 7c possui selecao contextual da loja publica");
assert(app.includes("function editarProdutoPublicadoLojaOnline"), "fase 7c corrige entrada de edicao do produto publicado");
assert(storefrontLayoutsV3.includes(".sfe-shell--mobile"), "editor rebuilt possui shell mobile controlada");
[
  "./src/storefront/renderers/publicV3.js",
  "./src/storefront/renderers/editorV3.js",
  "./src/storefront/styles/tokens.css",
  "./src/storefront/styles/components.css",
  "./src/storefront/styles/layouts.css"
].forEach((marker) => assert(sw.includes(marker), `rebuild visual entra no precache PWA: ${marker}`));

[
  "src/services/aiService.js",
  "src/services/aiProviderAdapter.js",
  "src/services/aiQuotaService.js",
  "src/services/aiContextService.js",
  "src/services/aiFeatureFlagService.js",
  "src/services/aiCostService.js",
  "scripts/test-ai-foundation.js",
  "docs/ai-foundation.md",
  "supabase/migrations/20260529141000_ai_foundation_disabled.sql"
].forEach((file) => assert(exists(file), `fase 5b fundacao IA desativada presente: ${file}`));
assert(pkg.scripts && pkg.scripts["test:ai-foundation"] === "node scripts/test-ai-foundation.js", "package.json expoe test:ai-foundation");
assert(!index.includes("aiService.js"), "services de IA nao carregam na UI");
assert(!index.includes("ai-foundation"), "nenhuma tela de IA carregada no HTML");

[
  "src/integrations/google/README.md",
  "docs/google-integrations-foundation.md",
  "src/integrations/google/google.config.example.js",
  "src/integrations/google/googleIntegrationService.js",
  "src/integrations/google/auth/README.md",
  "src/integrations/google/calendar/README.md",
  "src/integrations/google/drive/README.md",
  "src/integrations/google/gmail/README.md",
  "src/integrations/google/sheets/README.md",
  "supabase/functions/google-oauth/README.md",
  "supabase/functions/google-calendar-sync/README.md",
  "supabase/functions/google-drive-backup/README.md",
  "supabase/functions/google-gmail-send/README.md",
  "supabase/functions/google-sheets-sync/README.md",
  "supabase/migrations/20260529193000_google_integrations_foundation_disabled.sql",
  "scripts/test-google-integrations-foundation.js",
  "scripts/google-integrations-remote-controlled.js"
].forEach((file) => assert(exists(file), `fundacao Google futura desativada presente: ${file}`));
assert(pkg.scripts && pkg.scripts["test:google-integrations-foundation"] === "node scripts/test-google-integrations-foundation.js", "package.json expoe test:google-integrations-foundation");
assert(pkg.scripts && pkg.scripts["supabase:google-integrations:validate"] === "node scripts/google-integrations-remote-controlled.js validate", "package.json expoe validacao remota Google");
assert(!index.includes("googleIntegrationService.js"), "service Google futuro nao carrega na UI");
assert(read("scripts/prepare-web.js").includes("publicSrcFiles"), "build web usa allowlist para src publico");
assert(!/fs\.cpSync\(path\.join\(root,\s*["']src["']\)/.test(read("scripts/prepare-web.js")), "build web nao publica src inteiro");
assert(read("src/integrations/google/googleIntegrationService.js").includes("GOOGLE_INTEGRATIONS_DISABLED"), "service Google retorna disabled controlado");
assert(read("supabase/migrations/20260529193000_google_integrations_foundation_disabled.sql").includes("app_integration_feature_flags"), "migration Google prepara feature flags desligadas");
assert(read("scripts/google-integrations-remote-controlled.js").includes("google_integrations_remote_validation_ok"), "validacao remota Google tem marcador de sucesso");
assert(read("scripts/google-integrations-remote-controlled.js").includes("integration_tokens should not expose frontend policies"), "validacao remota Google protege tokens");

[
  "src/services/diagnosticsService.js",
  "scripts/diagnostics-remote-controlled.js",
  "scripts/test-diagnostics-foundation.js",
  "docs/diagnostics-error-reports.md",
  "docs/superadmin-bug-reports.md",
  "docs/codex-diagnostics-report.md",
  "docs/ai-future-foundation.md",
  "supabase/migrations/20260529162000_diagnostics_bugs_feedback_codex.sql",
  "supabase/migrations/20260529173500_diagnostics_validation_hardening.sql"
].forEach((file) => assert(exists(file), `fase 6a diagnosticos presente: ${file}`));
assert(pkg.scripts && pkg.scripts["test:diagnostics"] === "node scripts/test-diagnostics-foundation.js", "package.json expoe test:diagnostics");
assert(pkg.scripts && pkg.scripts["test:feedback-reports"] === "node scripts/test-diagnostics-foundation.js", "package.json expoe test:feedback-reports");
assert(pkg.scripts && pkg.scripts["test:superadmin-diagnostics"] === "node scripts/test-diagnostics-foundation.js", "package.json expoe test:superadmin-diagnostics");
assert(pkg.scripts && pkg.scripts["test:codex-report-export"] === "node scripts/test-diagnostics-foundation.js", "package.json expoe test:codex-report-export");
assert(pkg.scripts && pkg.scripts["supabase:diagnostics:validate"] === "node scripts/diagnostics-remote-controlled.js validate", "package.json expoe validacao remota de diagnosticos");
assert(index.includes("/src/services/diagnosticsService.js") && index.indexOf("/src/services/diagnosticsService.js") < index.indexOf("/app.js"), "DiagnosticsService carrega antes do app.js");
assert(sw.includes("./src/services/diagnosticsService.js"), "DiagnosticsService entra no precache PWA");
[
  "reportAppError",
  "reportFeedback",
  "reportDiagnosticEvent",
  "generateErrorFingerprint",
  "sanitizeDiagnosticPayload",
  "flushPendingDiagnosticsQueue"
].forEach((marker) => assert(read("src/services/diagnosticsService.js").includes(marker), `fase 6a service marker presente: ${marker}`));
[
  "window.DiagnosticsService.configure",
  "app_bug_reports_exports?select=*",
  "atualizarSeveridadeRelatorioAutomatico",
  "atualizarNotaAdminBug",
  "atualizarNotaAdminFeedback",
  "atualizarStatusClusterDiagnostico",
  "atualizarSeveridadeClusterDiagnostico",
  "atualizarNotaAdminCluster",
  "renderSuperAdminDiagnosticos",
  "gerarRelatorioCodexDiagnostico",
  "Relatórios e Diagnóstico"
].forEach((marker) => assert(app.includes(marker), `fase 6a marker presente: ${marker}`));
assert(read("supabase/migrations/20260529173500_diagnostics_validation_hardening.sql").includes("refresh_app_bug_cluster_from_error"), "fase 6b clusters recebem trigger de atualizacao");
assert(read("supabase/migrations/20260529162000_diagnostics_bugs_feedback_codex.sql").includes("add column if not exists message text"), "fase 6c migration de feedback e idempotente para coluna message");
assert(read("scripts/diagnostics-remote-controlled.js").includes("diagnostics_remote_validation_ok"), "fase 6c validacao remota tem marcador de sucesso");
assert(read("scripts/diagnostics-remote-controlled.js").includes("refresh_app_bug_cluster_after_error"), "fase 6c validacao remota confere trigger de cluster");

[
  "docs/billing-mercado-pago.md",
  "scripts/test-billing-webhook.js",
  "scripts/billing-webhook-remote-controlled.js",
  "supabase/functions/_shared/mercadopago-billing.ts",
  "supabase/migrations/20260529213000_billing_webhook_hardening.sql"
].forEach((file) => assert(exists(file), `fase 5a1 billing webhook presente: ${file}`));
assert(pkg.scripts && pkg.scripts["test:billing-webhook"] === "node scripts/test-billing-webhook.js", "package.json expoe test:billing-webhook");
assert(pkg.scripts && pkg.scripts["supabase:billing-webhook:validate"] === "node scripts/billing-webhook-remote-controlled.js validate", "package.json expoe validacao remota billing webhook");
assert(read("supabase/functions/mercadopago-webhook/index.ts").includes("reserveWebhookEvent"), "webhook reserva evento idempotente");
assert(read("supabase/functions/mercadopago-cancel-subscription/index.ts").includes("cancel_at_period_end: true"), "cancelamento remoto agenda fim do periodo");
assert(read("scripts/billing-webhook-remote-controlled.js").includes("billing_webhook_remote_validation_ok"), "validacao remota billing webhook tem marcador de sucesso");
[
  "docs/checkout-payment-states-sandbox.md",
  "scripts/mercadopago-sandbox-controlled.js",
  "scripts/test-checkout-payment-states.js"
].forEach((file) => assert(exists(file), `fase 5c checkout sandbox presente: ${file}`));
assert(pkg.scripts && pkg.scripts["test:checkout-payment-states"] === "node scripts/test-checkout-payment-states.js", "package.json expoe test:checkout-payment-states");
assert(pkg.scripts && pkg.scripts["mercadopago:sandbox:fixtures"] === "node scripts/mercadopago-sandbox-controlled.js fixtures", "package.json expoe fixtures sandbox seguras");
assert(app.includes("function normalizarRetornoCheckoutMercadoPago"), "fase 5c diferencia retorno checkout");
assert(app.includes("function limparParametrosRetornoMercadoPago"), "fase 5c limpa parametros transitorios");
assert(app.includes('sincronizarLicencaEfetivaSePossivel("payment-return")'), "fase 5c sincroniza licenca apos retorno");
assert(read("scripts/mercadopago-sandbox-controlled.js").includes('REQUIRED_SANDBOX_TOKEN_PREFIX = "TEST-"'), "runner sandbox bloqueia token produtivo");

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
  "function renderStorefrontView",
  "function renderStorefrontPublicV3Rebuilt",
  "function getStorefrontEditorVisualV3",
  "renderStorefrontView({ mode: \"editor\" })",
  "renderStorefrontView({ mode: \"public\" })"
].forEach((marker) => assert(app.includes(marker), `orquestracao storefront rebuilt presente: ${marker}`));
[
  "sfv3-header",
  "sfv3-hero",
  "sfv3-product-card",
  "sfv3-bottom-nav"
].forEach((marker) => assert(storefrontPublicV3.includes(marker), `componente publico rebuilt presente: ${marker}`));
[
  "sfe-shell",
  "sfe-preview",
  "sfe-tabs",
  "sfe-actions"
].forEach((marker) => assert(storefrontEditorV3.includes(marker), `componente editor rebuilt presente: ${marker}`));
assert(!app.includes("renderStorefrontPublicV2"), "renderer publico V2 removido");
assert(!app.includes("renderStorefrontEditorV2"), "renderer editor V2 removido");
assert(!exists("storefront-v3.css"), "folha visual antiga removida");
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
  "abrirNovoProdutoGuiadoLoja()",
  "openStorefrontGuidedCatalogItem(",
  "api.product",
  "api.products"
].forEach((marker) => assert(storefrontEditorV3.includes(marker), `atalho de produtos rebuilt abre editor correto: ${marker}`));
[
  "sfv3-menu",
  "sfv3-menu__panel",
  "sfv3-header",
  "sfv3-header__actions"
].forEach((marker) => assert(storefrontPublicV3.includes(marker), `menu rebuilt presente: ${marker}`));
[
  "api.product",
  "api.category",
  "api.banner",
  "api.contacts",
  "api.checklist",
  "sfe-product-form",
  "sfe-preview",
  "sfe-actions"
].forEach((marker) => assert(storefrontEditorV3.includes(marker), `editor rebuilt presente: ${marker}`));
assertOrdered(index, [
  "/src/storefront/renderers/publicV3.js",
  "/src/storefront/renderers/editorV3.js",
  "/app.js"
], "renderers rebuilt carregam antes do app.js");
assert(!index.includes("/modules/store-editor/"), "ponte visual antiga nao carrega no HTML");
assert(!prepareWeb.includes('"modules/store-editor"'), "ponte visual antiga nao entra no dist");
assert(!sw.includes("./modules/store-editor/"), "ponte visual antiga nao entra no PWA");
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
  "PLAN_REGISTRY",
  "START_PLAN_ENABLED",
  "getPlanEntitlements",
  "getPlanLimits",
  "getPlanUpgradeOptions",
  "checkout_opened",
  "setPlansModernTab"
].forEach((marker) => assert(app.includes(marker), `marcador de planos/assinatura presente: ${marker}`));

[
  "test:storefront-pwa-upgrade",
  "test:storefront-premium-7c3",
  "test:storefront-light-theme-stability",
  "test:design-system-v2",
  "test:erp-theme-v2",
  "test:storefront-theme-v2",
  "test:storefront-demo-products",
  "test:plans-theme-v2",
  "test:theme-isolation",
  "test:ui-theme-consistency",
  "test:storefront-desktop-upscale",
  "test:plans-saas-structure",
  "test:plans",
  "test:plans-ui",
  "test:start-plan",
  "test:project-saneamento"
].forEach((script) => assert(Boolean(pkg.scripts?.[script]), `script npm ativo: ${script}`));

[
  "canReactivateRenewal",
  "plans_screen_opened",
  "plan_card_viewed",
  "plan_checkout_clicked",
  "plan_start_unavailable_clicked",
  "start_plan_checkout_requested",
  "payment_pending_real_viewed",
  "Assinar Start",
  "Assinar Pro"
].forEach((marker) => assert(app.includes(marker), `fase 5b tela premium de planos presente: ${marker}`));
assert(read("src/services/diagnosticsService.js").includes("webhook_start_plan_resolution_failed"), "diagnostico Start do webhook presente");
assert(exists("docs/start-plan-authority.md"), "documentacao de autoridade Start presente");
assert(exists("docs/plans-entitlements-matrix.md"), "matriz Free/Start/Pro presente");
assert(exists("scripts/start-plan-remote-controlled.js"), "runner remoto controlado do Start presente");
assert(exists("supabase/migrations/20260530103000_start_plan_backend_authority.sql"), "migration Start idempotente presente");
assert(css.includes(".plans-modern-screen.plans-pricing-screen"), "fase 5b workspace dedicado de planos presente");
assert(css.includes("repeat(auto-fit, minmax(min(100%, 300px), 1fr))"), "fase 5b grid responsivo de planos presente");

warn(css.includes("--z-sidebar"), "tokens de z-index formalizados para a Fase 2A");
warn(exists("modules/storefront/README.md"), "pasta modules agora expoe apenas contratos seguros da storefront");
assert(!app.includes("enableStorefrontV2"), "loja rebuilt nao depende de feature flag visual V2");

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Checks de reestruturacao concluidos.");
