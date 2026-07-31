const fs = require("fs");

const gitignore = fs.readFileSync(".gitignore", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const gradle = fs.readFileSync("android/app/build.gradle", "utf8");
const update = fs.readFileSync("downloads/update.json", "utf8");

const requiredIgnores = [
  "rollback/",
  "storefront-preview/",
  "scripts/backup-supabase-public-rest.js"
];

const missingIgnores = requiredIgnores.filter((item) => !gitignore.includes(item));
if (missingIgnores.length) {
  throw new Error(`Entradas de saneamento ausentes no .gitignore: ${missingIgnores.join(", ")}`);
}

const requiredVersionSignals = [
  "APP_VERSION = \"1.0.25\"",
  "APP_VERSION_CODE = 26",
  "versionName \"1.0.25\"",
  "versionCode 26",
  "\"version\": \"1.0.25\"",
  "\"versionCode\": 26"
];

const sources = [app, sw, gradle, update].join("\n");
const missingSignals = requiredVersionSignals.filter((item) => !sources.includes(item));
if (!/const CACHE_NAME = "simplifica-3d-v\d+-[^"]+";/.test(sw)) {
  missingSignals.push("cache PWA versionado");
}
if (missingSignals.length) {
  throw new Error(`PWA/APK fora da versao consolidada: ${missingSignals.join(", ")}`);
}

console.log("Saneamento tecnico: ignores, PWA/APK e versionamento consolidados.");
