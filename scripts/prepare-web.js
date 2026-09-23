const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const includeReleaseDownloads = !process.argv.includes("--without-downloads");
const files = [
  "index.html",
  "style.css",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
  "ads.txt"
];

function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(dist, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

files.forEach(copyFile);

const publicDownloadFiles = [
  "downloads/update.json",
  "downloads/NE3D-ERP.apk"
];

if (includeReleaseDownloads) {
  publicDownloadFiles.forEach((relativePath) => {
    if (fs.existsSync(path.join(root, relativePath))) {
      copyFile(relativePath);
    }
  });
}

if (fs.existsSync(path.join(root, "assets"))) {
  fs.cpSync(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });
}

// GGUF artifacts are development/device inputs, never Web, PWA, or APK assets.
// Keep this as an allowlist: adding a file to models/ does not publish it implicitly.
const publicModelFiles = ["models/models-manifest.v1.json"];
publicModelFiles.forEach((relativePath) => {
  if (fs.existsSync(path.join(root, relativePath))) copyFile(relativePath);
});

const publicSrcFiles = [
  "src/config/runtimeFeatures.js",
  "src/services/errorTelemetry.js",
  "src/services/diagnosticsService.js",
  "src/services/smartLoaderService.js",
  "src/services/safeAreaManager.js",
  "src/services/themeAuthorityV3.js",
  "src/services/googleMotionEnhancer.js",
  "src/services/printerMonitoringService.js",
  "src/services/adMobService.js",
  "src/services/adSenseService.js",
  "src/services/monetizationLimits.js",
  "src/services/calculatorDomain.js",
  "src/shared/date-formatters.js",
  "src/services/ai-runtime-loader.js",
  "src/navigation/screen-registry.js",
  "src/navigation/screen-v3-wrapper.js",
  "src/navigation/screen-dispatcher.js",
  "src/navigation/app-domain-events.js",
  "src/app/bootstrap.js",
  "src/services/simplifica3dAiActions.js",
  "src/services/simplifica3dAiRuntime.js",
  "src/services/simplifica3dFinancialCore.js",
  "src/ai/action-registry.js",
  "src/ai/action-search.js",
  "src/ai/workflow-tool-graph.js",
  "src/ai/deterministic-router.js",
  "src/ai/ai-telemetry.js",
  "src/ai/result-envelope.js",
  "src/ai/tool-calling-model.js",
  "src/ai/local-tool-model-adapter.js",
  "src/ai/canonical-runtime-bindings.js",
  "src/ai-3d/core.js",
  "src/ai-3d/entity-resolution.js",
  "src/ai-3d/operation-safety.js",
  "src/ai-3d/canonical-order.js",
  "src/ai-3d/order-create-preparation.js",
  "src/ai-3d/order-create-executor.js",
  "src/ai-3d/order-shared-usecases.js",
  "src/ai-3d/operational-usecases.js",
  "src/ai-3d/rlm/rlm-core.js",
  "src/ai-3d/orchestrator.js",
  "src/features/home/carousel3d/carousel-contract.js",
  "src/features/home/carousel3d/config/home-carousel-config.js",
  "src/features/home/carousel3d/widgets/home-carousel-widget-registry.js",
  "src/features/home/carousel3d/widgets/home-carousel-widget-state.js",
  "src/features/home/carousel3d/core/home-carousel-engine.js",
  "src/features/home/carousel3d/visual/home-carousel-renderer.js",
  "src/features/home/carousel3d/core/home-carousel-scene.js",
  "src/features/app-ui/app-ui-renderers.js",
  "src/features/customers/customer-normalizers.js",
  "src/features/customers/customers-renderer.js",
  "src/features/customers/customers-saas-query.js",
  "src/features/orders/order-normalizers.js",
  "src/features/orders/orders-financial.js",
  "src/features/orders/orders-operational-history.js",
  "src/features/orders/orders-renderer.js",
  "src/features/orders/orders-repository.js",
  "src/features/orders/orders-controller.js",
  "src/features/orders/orders-command-service.js",
  "src/features/orders/orders-handlers.js",
  "src/features/cash/cash-payment-methods.js",
  "src/features/cash/cash-repository.js",
  "src/features/cash/cash-sync-service.js",
  "src/features/cash/cash-commands.js",
  "src/features/cash/cash-renderer.js",
  "src/features/account/plan-normalizers.js",
  "src/features/account/account-security.js",
  "src/features/account/auth-commands.js",
  "src/features/account/auth-remote-commands.js",
  "src/features/account/auth-session-commands.js",
  "src/features/account/billing-commands.js",
  "src/features/diagnostics/diagnostics-admin.js",
  "src/features/sync/sync-remote-commands.js",
  "src/features/sync/remote-data-commands.js",
  "src/features/saas/saas-admin-commands.js",
  "src/features/security/security-audit-commands.js",
  "src/features/company/company-administration.js",
  "src/features/company/company-pdf-info.js",
  "src/features/company/company-pdf-preview.js",
  "src/features/company/pdf-document-delivery.js",
  "src/features/company/pdf-order-composer.js",
  "src/features/company/company-settings-actions.js",
  "src/features/company/pdf-settings-renderer.js",
  "src/features/company/company-renderer.js",
  "src/features/users/users-administration-renderer.js",
  "src/features/users/users-administration-commands.js",
  "src/features/config/config-appearance.js",
  "src/features/config/config-interface-mode.js",
  "src/features/storefront/promotions-formatters.js",
  "src/features/storefront/storefront-access.js",
  "src/features/storefront/storefront-admin-storage.js",
  "src/features/storefront/storefront-editor.js",
  "src/features/storefront/storefront-publication.js",
  "src/features/storefront/storefront-v3.js",
  "src/features/storefront/storefront-product-editor.js",
  "src/features/storefront/storefront-guided.js",
  "src/features/storefront/storefront-admin-store.js",
  "src/features/storefront/storefront-admin-remote.js",
  "src/features/storefront/storefront-images.js",
  "src/features/storefront/storefront-public.js",
  "src/features/storefront/storefront-admin-render.js",
  "src/features/storefront/storefront-publication.js",
  "src/features/storefront/storefront-v3.js",
  "src/features/storefront/storefront-product-editor.js",
  "src/features/storefront/storefront-guided.js",
  "src/features/storefront/storefront-admin-store.js",
  "src/features/storefront/storefront-admin-remote.js",
  "src/features/storefront/storefront-images.js",
  "src/features/storefront/storefront-public.js",
  "src/features/storefront/storefront-admin-render.js",

  "src/features/inventory/inventory-identifiers.js",
  "src/features/inventory/inventory-normalizers.js",
  "src/features/inventory/inventory-presentation.js",
  "src/features/inventory/inventory-roll-consumption.js",
  "src/features/inventory/inventory-handlers.js",
  "src/features/inventory/inventory-batch-commands.js",
  "src/features/inventory/inventory-modals.js",
  "src/features/inventory/inventory-screen-renderer.js",
  "src/features/calculator/calculator-commands.js",
  "src/features/calculator/calculator-settings.js",
  "src/features/account/account-profile-modals.js",
  "src/features/production/production-status.js",
  "src/features/production/production-repository.js",
  "src/features/production/production-commands.js",
  "src/features/production/production-bambu-commands.js",
  "src/features/production/production-renderer.js",
  "src/features/printers/printer-presentation.js",
  "src/features/printers/printers-operations.js",
  "src/features/home/home-data.js",
  "src/features/home/home-controller.js",
  "src/features/reports/reports-controller.js",
  "src/features/reports/reports-formatters.js",
  "src/features/reports/reports-data.js",
  "src/features/reports/reports-renderer.js",
  "src/features/reports/reports-view-model.js",
  "src/styles/google-expressive-motion.css",
  "src/storefront/styles/tokens.css",
  "src/storefront/styles/components.css",
  "src/storefront/styles/layouts.css",
  "src/storefront/renderers/publicV3.js",
  "src/storefront/renderers/editorV3.js"
];

publicSrcFiles.forEach((relativePath) => {
  if (fs.existsSync(path.join(root, relativePath))) {
    copyFile(relativePath);
  }
});

const publicThemeFiles = [
];

publicThemeFiles.forEach((relativePath) => {
  if (fs.existsSync(path.join(root, relativePath))) {
    copyFile(relativePath);
  }
});

const publicModuleDirs = [
  "modules/store-preview",
  "modules/storefront",
  "src/assistant-core",
  "apps/simplifica/assistant-pack"
];

// UI V3 ships as an isolated foundation. Its technical route only mounts on localhost.
const uiV3Dirs = ["styles/ui-v3", "src/ui-v3"];
uiV3Dirs.forEach((relativePath) => {
  const source = path.join(root, relativePath);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(dist, relativePath), { recursive: true });
  }
});

publicModuleDirs.forEach((relativePath) => {
  const source = path.join(root, relativePath);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(dist, relativePath), { recursive: true });
  }
});

function assertNoLocalModelArtifactsInWebBuild() {
  const forbidden = [];
  const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(child);
    if (entry.name.toLowerCase().endsWith(".gguf")) forbidden.push(path.relative(dist, child));
  });
  walk(dist);
  if (fs.existsSync(path.join(dist, "models", "local"))) forbidden.push("models/local");
  if (forbidden.length) throw new Error(`Artefatos locais de modelo proibidos no build Web: ${forbidden.join(", ")}`);
}

assertNoLocalModelArtifactsInWebBuild();
console.log("Arquivos web preparados em dist/ sem GGUFs locais.");
