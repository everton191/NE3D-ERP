const fs = require("fs");

const sw = fs.readFileSync("sw.js", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const gradle = fs.readFileSync("android/app/build.gradle", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");
const adSense = fs.readFileSync("src/services/adSenseService.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const required = [
  "simplifica-3d-v196-store-guided-draft-release-20260626",
  "event.request.mode === \"navigate\"",
  "display\": \"standalone\"",
  "versionName \"1.0.54-rc\"",
  "versionCode 53",
  "APP_VERSION = \"1.0.54-rc\"",
  "APP_VERSION_CODE = 53",
  "\"@capacitor/app\"",
  "web-ad-banner-visible",
  "body.web-ad-banner-visible #app-content"
];

const sources = [sw, manifest, gradle, app, packageJson, adSense, css].join("\n");
const missing = required.filter((item) => !sources.includes(item));

if (missing.length) {
  console.error("PWA/APK upgrade incompleto:", missing.join(", "));
  process.exit(1);
}

const userPathIndex = app.indexOf('segmentoStorageSeguro(syncConfig.supabaseUserId, "usuario")');
const companyPathIndex = app.indexOf('segmentoStorageSeguro(companyId, "empresa")');
if (userPathIndex < 0 || companyPathIndex < 0 || userPathIndex > companyPathIndex) {
  console.error("Caminho de upload deve iniciar pelo user_id exigido pela policy do Storage.");
  process.exit(1);
}

console.log("Storefront PWA upgrade: cache e versionamento atualizados presentes.");
