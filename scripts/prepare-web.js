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

if (fs.existsSync(path.join(root, "models"))) {
  fs.cpSync(path.join(root, "models"), path.join(dist, "models"), { recursive: true });
}

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
  "src/services/simplifica3dAiActions.js",
  "src/services/simplifica3dAiRuntime.js",
  "src/services/simplifica3dFinancialCore.js",
  "src/ai-3d/core.js",
  "src/ai-3d/operation-safety.js",
  "src/ai-3d/canonical-order.js",
  "src/ai-3d/order-create-preparation.js",
  "src/ai-3d/order-create-executor.js",
  "src/ai-3d/rlm/rlm-core.js",
  "src/ai-3d/orchestrator.js",
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

console.log("Arquivos web preparados em dist/");
