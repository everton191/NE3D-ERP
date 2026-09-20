const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const outputDir = path.join(root, "output", "bambu-pilot");
const preferredDestination = path.join(outputDir, "Simplifica3D-Bambu-Pilot-0.9.0.apk");
if (!fs.existsSync(source)) throw new Error(`APK piloto nao encontrado: ${source}`);
fs.mkdirSync(outputDir, { recursive: true });
let destination = preferredDestination;
try {
  fs.copyFileSync(source, destination);
} catch (error) {
  if (!fs.existsSync(preferredDestination)) throw error;
  destination = path.join(outputDir, `Simplifica3D-Bambu-Pilot-0.9.0-${Date.now()}.apk`);
  fs.copyFileSync(source, destination);
  console.warn(`O APK anterior estava em uso; o novo build foi preservado como ${path.basename(destination)}.`);
}

const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
const aaptCandidates = fs.existsSync(path.join(sdkRoot, "build-tools"))
  ? fs.readdirSync(path.join(sdkRoot, "build-tools")).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  : [];
const aapt = aaptCandidates.map((version) => path.join(sdkRoot, "build-tools", version, "aapt.exe")).find(fs.existsSync);
if (!aapt) throw new Error("aapt nao encontrado para validar o APK piloto.");
const result = spawnSync(aapt, ["dump", "badging", destination], { encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr || "Falha ao validar APK piloto.");
const badging = String(result.stdout || "");
if (!badging.includes("package: name='br.com.ne3d.erp.pilot'") || !badging.includes("versionCode='10'") || !badging.includes("versionName='0.9.0-pilot'")) {
  throw new Error("Identidade ou versao do APK piloto nao corresponde ao contrato seguro.");
}
console.log(`APK piloto isolado criado: ${destination}`);
console.log("Pacote: br.com.ne3d.erp.pilot | versao: 0.9.0-pilot (10)");
