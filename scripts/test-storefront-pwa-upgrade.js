const fs = require("fs");

const sw = fs.readFileSync("sw.js", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const gradle = fs.readFileSync("android/app/build.gradle", "utf8");
const app = fs.readFileSync("app.js", "utf8");

const required = [
  "simplifica-3d-v161-soft-light-store-20260610",
  "event.request.mode === \"navigate\"",
  "display\": \"standalone\"",
  "versionName \"1.0.27-rc\"",
  "versionCode 26",
  "APP_VERSION = \"1.0.27-rc\"",
  "APP_VERSION_CODE = 26"
];

const sources = [sw, manifest, gradle, app].join("\n");
const missing = required.filter((item) => !sources.includes(item));

if (missing.length) {
  console.error("PWA/APK upgrade incompleto:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront PWA upgrade: cache e versionamento atualizados presentes.");
