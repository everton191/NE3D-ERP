const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourceApk = path.join(
  rootDir,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "debug",
  "app-debug.apk"
);
const downloadsDir = path.join(rootDir, "downloads");
const simpleApk = path.join(downloadsDir, "NE3D-ERP.apk");
const legacyApk = path.join(downloadsDir, "NE3D-ERP-android-users17-debug.apk");

if (!fs.existsSync(sourceApk)) {
  console.error(`APK nao encontrado: ${sourceApk}`);
  console.error("Gere o APK primeiro com npm run android:apk.");
  process.exit(1);
}

fs.mkdirSync(downloadsDir, { recursive: true });
fs.copyFileSync(sourceApk, simpleApk);
fs.copyFileSync(sourceApk, legacyApk);

const sizeMb = fs.statSync(simpleApk).size / (1024 * 1024);
console.log(`APK copiado para downloads/NE3D-ERP.apk (${sizeMb.toFixed(2)} MB)`);
