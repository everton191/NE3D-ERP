const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
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

if (fs.existsSync(path.join(root, "assets"))) {
  fs.cpSync(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });
}

const publicSrcFiles = [
  "src/services/errorTelemetry.js",
  "src/services/diagnosticsService.js",
  "src/services/smartLoaderService.js",
  "src/services/safeAreaManager.js",
  "src/services/themeAuthorityV2.js",
  "src/services/googleMotionEnhancer.js",
  "src/services/printerMonitoringService.js",
  "src/services/adMobService.js",
  "src/services/adSenseService.js",
  "src/services/monetizationLimits.js",
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
  "themes/base/design-system-v2.css"
];

publicThemeFiles.forEach((relativePath) => {
  if (fs.existsSync(path.join(root, relativePath))) {
    copyFile(relativePath);
  }
});

const publicModuleDirs = [
  "modules/store-preview",
  "modules/storefront"
];

publicModuleDirs.forEach((relativePath) => {
  const source = path.join(root, relativePath);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(dist, relativePath), { recursive: true });
  }
});

console.log("Arquivos web preparados em dist/");
