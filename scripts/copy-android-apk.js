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
// Mantem links antigos funcionando; o app novo usa NE3D-ERP.apk.
const legacyApk = path.join(downloadsDir, "NE3D-ERP-android-users17-debug.apk");
const updateManifest = path.join(downloadsDir, "update.json");
const appJs = path.join(rootDir, "app.js");
const buildGradle = path.join(rootDir, "android", "app", "build.gradle");
const publicRepo = "everton191/NE3D-ERP.apk";
const defaultApkUrl = `https://raw.githubusercontent.com/${publicRepo}/main/NE3D-ERP.apk`;

if (!fs.existsSync(sourceApk)) {
  console.error(`APK nao encontrado: ${sourceApk}`);
  console.error("Gere o APK primeiro com npm run android:apk.");
  process.exit(1);
}

const appJsContent = fs.existsSync(appJs) ? fs.readFileSync(appJs, "utf8") : "";
const buildGradleContent = fs.existsSync(buildGradle) ? fs.readFileSync(buildGradle, "utf8") : "";
const version = appJsContent.match(/const APP_VERSION = "([^"]+)"/)?.[1] || "0.0.0";
const versionCode = Number(buildGradleContent.match(/versionCode\s+(\d+)/)?.[1] || 0) || 0;

fs.mkdirSync(downloadsDir, { recursive: true });
fs.copyFileSync(sourceApk, simpleApk);
fs.copyFileSync(sourceApk, legacyApk);
fs.writeFileSync(
  updateManifest,
  JSON.stringify(
    {
      version,
      versionCode,
      apkUrl: `${defaultApkUrl}?v=${versionCode}`,
      apkFile: "NE3D-ERP.apk",
      publicRepo,
      generatedAt: new Date().toISOString()
    },
    null,
    2
  ) + "\n"
);

const sizeMb = fs.statSync(simpleApk).size / (1024 * 1024);
console.log(`APK copiado para downloads/NE3D-ERP.apk (${sizeMb.toFixed(2)} MB)`);
console.log(`Manifesto de atualizacao gerado em downloads/update.json (${version})`);
