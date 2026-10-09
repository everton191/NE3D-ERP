const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const allowUnsigned = process.argv.includes("--allow-unsigned");
const bundle = path.join(root, "android", "app", "build", "outputs", "bundle", "playRelease", "app-play-release.aab");
const manifest = path.join(root, "android", "app", "build", "intermediates", "merged_manifests", "playRelease", "processPlayReleaseManifest", "AndroidManifest.xml");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(bundle)) fail(`AAB não encontrado: ${bundle}`);
if (!fs.existsSync(manifest)) fail("Manifesto mesclado do Play release não encontrado.");

const entries = execFileSync("jar", ["tf", bundle], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
const manifestSource = fs.readFileSync(manifest, "utf8");
const forbiddenEntries = entries.filter((entry) => /\.gguf$/i.test(entry) || /base\/lib\/[^/]+\/(?:libggml[^/]*|libllama|liblocal_llama_jni|libneedle_jni)\.so$/i.test(entry));
if (forbiddenEntries.length) fail(`artefatos da IA presentes no flavor Play: ${forbiddenEntries.join(", ")}`);
if (manifestSource.includes("android.permission.REQUEST_INSTALL_PACKAGES")) fail("Play release solicita instalação de APK.");
if (manifestSource.includes("android.permission.RECORD_AUDIO")) fail("Play release solicita microfone reservado à IA local.");

let signatureOutput = "";
try {
  signatureOutput = execFileSync("jarsigner", ["-verify", "-certs", bundle], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (error) {
  signatureOutput = `${error.stdout || ""}\n${error.stderr || ""}`;
}
const signed = !/jar is unsigned|não está assinado/i.test(signatureOutput);
if (!signed && !allowUnsigned) fail("AAB está sem assinatura de upload.");

const stats = fs.statSync(bundle);
console.log(JSON.stringify({
  bundle,
  bytes: stats.size,
  signed,
  aiNativeArtifacts: 0,
  ggufArtifacts: 0,
  requestInstallPackages: false,
  recordAudio: false,
  publishable: signed
}, null, 2));
