const fs = require("fs");

const sw = fs.readFileSync("sw.js", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const gradle = fs.readFileSync("android/app/build.gradle", "utf8");
const app = fs.readFileSync("app.js", "utf8");

const required = [
  "simplifica-3d-v110-estavel-20260525-store-phase37-public",
  "event.request.mode === \"navigate\"",
  "display\": \"standalone\"",
  "versionName \"1.0.10-estavel\"",
  "versionCode 108",
  "APP_VERSION = \"1.0.10-estavel\"",
  "APP_VERSION_CODE = 108"
];

const sources = [sw, manifest, gradle, app].join("\n");
const missing = required.filter((item) => !sources.includes(item));

if (missing.length) {
  console.error("PWA/APK upgrade incompleto:", missing.join(", "));
  process.exit(1);
}

console.log("Storefront PWA upgrade: cache, manifest e versionamento 1.0.10/108 presentes.");
