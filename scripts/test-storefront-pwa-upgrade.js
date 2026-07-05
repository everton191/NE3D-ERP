const fs = require("fs");

const sw = fs.readFileSync("sw.js", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const gradle = fs.readFileSync("android/app/build.gradle", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");
const adSense = fs.readFileSync("src/services/adSenseService.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const required = [
  "event.request.mode === \"navigate\"",
  "display\": \"standalone\"",
  "\"@capacitor/app\"",
  "web-ad-banner-visible",
  "body.web-ad-banner-visible #app-content"
];

const sources = [sw, manifest, gradle, app, packageJson, adSense, css].join("\n");
const missing = required.filter((item) => !sources.includes(item));
const appVersion = app.match(/const APP_VERSION = "([^"]+)"/)?.[1];
const appVersionCode = Number(app.match(/const APP_VERSION_CODE = (\d+)/)?.[1]);
const gradleVersion = gradle.match(/versionName "([^"]+)"/)?.[1];
const gradleVersionCode = Number(gradle.match(/versionCode (\d+)/)?.[1]);
if (!/const CACHE_NAME = "simplifica-3d-v\d+-[^"]+";/.test(sw)) missing.push("cache PWA versionado");
if (!appVersion || appVersion !== gradleVersion) missing.push("versionName alinhado");
if (!appVersionCode || appVersionCode !== gradleVersionCode) missing.push("versionCode alinhado");

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
