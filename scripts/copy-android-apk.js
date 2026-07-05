const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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
const expectedSignerSha256 = "1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a";

if (!fs.existsSync(sourceApk)) {
  console.error(`APK nao encontrado: ${sourceApk}`);
  console.error("Gere o APK primeiro com npm run android:apk.");
  process.exit(1);
}

function findApkSigner() {
  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Android", "Sdk")
  ].filter(Boolean);

  for (const sdkRoot of sdkRoots) {
    const buildToolsDir = path.join(sdkRoot, "build-tools");
    if (!fs.existsSync(buildToolsDir)) continue;
    const versions = fs.readdirSync(buildToolsDir).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const version of versions) {
      const executable = path.join(buildToolsDir, version, process.platform === "win32" ? "apksigner.bat" : "apksigner");
      if (fs.existsSync(executable)) return executable;
    }
  }
  return "";
}

const apkSigner = findApkSigner();
if (!apkSigner) {
  console.error("apksigner não encontrado. A assinatura do APK não pode ser validada.");
  process.exit(1);
}

const apkSignerJar = path.join(path.dirname(apkSigner), "lib", "apksigner.jar");
const javaExecutable = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java")
  : "java";
const signatureCheck = fs.existsSync(apkSignerJar)
  ? spawnSync(javaExecutable, ["-jar", apkSignerJar, "verify", "--print-certs", sourceApk], { encoding: "utf8" })
  : spawnSync(apkSigner, ["verify", "--print-certs", sourceApk], { encoding: "utf8" });
const signatureOutput = `${signatureCheck.stdout || ""}\n${signatureCheck.stderr || ""}`;
const signerSha256 = signatureOutput.match(/certificate SHA-256 digest:\s*([a-f0-9]+)/i)?.[1]?.toLowerCase();
if (signatureCheck.status !== 0 || signerSha256 !== expectedSignerSha256) {
  console.error("Assinatura Android incompatível. O APK não será publicado.");
  console.error(`Esperada: ${expectedSignerSha256}`);
  console.error(`Encontrada: ${signerSha256 || "não identificada"}`);
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
