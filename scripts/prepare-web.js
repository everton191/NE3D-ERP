const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const includeReleaseDownloads = !process.argv.includes("--without-downloads");
const includeWebAiSmoke = process.argv.includes("--with-web-ai-smoke");
const functionGemmaFileName = "functiongemma-270m-it-39eccb091651513a5dfb56892d3714c1b5b8276c-Q8_0.gguf";
const functionGemmaSource = process.env.SIMPLIFICA_FUNCTIONGEMMA_GGUF
  || path.join("D:\\AI-Models", "FunctionGemma", "artifacts", functionGemmaFileName);
const functionGemmaDescriptor = Object.freeze({
  id: "functiongemma-270m-it-q8_0-web",
  modelId: "functiongemma-270m-it-q8_0-web",
  displayName: "FunctionGemma Q8 — Web",
  version: "0.2.0-q8_0+39eccb091651513a5dfb56892d3714c1b5b8276c",
  runtime: "wllama-3.6.0-llama.cpp-wasm",
  downloadBytes: 291557856,
  sha256: "595b727d73a8e78cc8da03f12a947137818c6d3544be903eef8494824b2d5b47",
  recommendedContext: 512,
  supportedPlatforms: ["web", "pwa", "wasm"],
  profile: "OPERATIONAL",
  capabilities: { text: true, vision: false, audio: false, tools: true },
  source: { repo: "google/functiongemma-270m-it", revision: "39eccb091651513a5dfb56892d3714c1b5b8276c", quantization: "Q8_0" },
  status: "available",
  rank: 100
});
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

if (includeReleaseDownloads) {
  const wllamaPackageDir = path.join(root, "node_modules", "@wllama", "wllama");
  const wllamaTargetDir = path.join(dist, "assets", "vendor", "wllama");
  const wllamaFiles = [
    [path.join(wllamaPackageDir, "esm", "index.min.js"), "index.min.js"],
    [path.join(wllamaPackageDir, "esm", "wasm", "wllama.wasm"), "wllama.wasm"],
    [path.join(wllamaPackageDir, "LICENCE"), "LICENCE"]
  ];
  for (const [source, targetName] of wllamaFiles) {
    if (!fs.existsSync(source)) throw new Error(`Runtime Web oficial ausente: ${source}`);
    fs.mkdirSync(wllamaTargetDir, { recursive: true });
    fs.copyFileSync(source, path.join(wllamaTargetDir, targetName));
  }
}

if (fs.existsSync(path.join(root, "models"))) {
  fs.cpSync(path.join(root, "models"), path.join(dist, "models"), { recursive: true });
}

const functionGemmaTargetDir = path.join(dist, "models", "functiongemma");
fs.mkdirSync(functionGemmaTargetDir, { recursive: true });
const includeFunctionGemmaWeb = includeReleaseDownloads && fs.existsSync(functionGemmaSource)
  && fs.statSync(functionGemmaSource).size === functionGemmaDescriptor.downloadBytes;
if (includeFunctionGemmaWeb) {
  fs.copyFileSync(functionGemmaSource, path.join(functionGemmaTargetDir, functionGemmaFileName));
}
const webArtifacts = includeFunctionGemmaWeb
  ? [{ ...functionGemmaDescriptor, url: `/models/functiongemma/${functionGemmaFileName}` }]
  : [];
fs.writeFileSync(
  path.join(functionGemmaTargetDir, "web-artifacts.js"),
  `(function(g){g.SimplificaWebAiArtifacts=Object.freeze(${JSON.stringify(webArtifacts)});})(window);\n`,
  "utf8"
);
if (includeWebAiSmoke && includeFunctionGemmaWeb) {
  fs.copyFileSync(path.join(root, "scripts", "fixtures", "functiongemma-web-smoke.html"), path.join(dist, "__functiongemma-web-smoke.html"));
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
  "src/ai/action-registry.js",
  "src/ai/action-search.js",
  "src/ai/deterministic-router.js",
  "src/ai/ai-telemetry.js",
  "src/ai/result-envelope.js",
  "src/ai/tool-calling-model.js",
  "src/ai/functiongemma-adapter.js",
  "src/ai/functiongemma-native-runtime.js",
  "src/ai/functiongemma-web-runtime.js",
  "src/ai-3d/core.js",
  "src/ai-3d/operation-safety.js",
  "src/ai-3d/canonical-order.js",
  "src/ai-3d/order-create-preparation.js",
  "src/ai-3d/order-create-executor.js",
  "src/ai-3d/order-shared-usecases.js",
  "src/ai-3d/operational-usecases.js",
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
