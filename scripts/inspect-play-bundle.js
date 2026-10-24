const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const { JARSIGNER_VERIFY_LOCALE_ARGS, validateJarsignerVerification, verifyUploadCertificate } = require("./lib/play-bundle-signature");

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
const leakedSecrets = entries.filter(entry => /(?:^|\/)(?:[^/]+\.(?:p12|jks|keystore)|\.env(?:\.[^/]*)?|upload-credential\.xml|upload-key\.json)$/i.test(entry));
if (leakedSecrets.length) fail("Arquivo de credenciais/chave encontrado no AAB.");

const verification = spawnSync("jarsigner", [...JARSIGNER_VERIFY_LOCALE_ARGS, "-verify", "-certs", bundle], { encoding: "utf8" });
if (verification.error) fail("Não foi possível executar jarsigner; assinatura NÃO verificada.");
const signed = validateJarsignerVerification({ exitCode: verification.status, stdout: verification.stdout, stderr: verification.stderr }).verified;
const explicitlyUnsigned = verification.status === 0 && /jar is unsigned/i.test(`${verification.stdout}\n${verification.stderr}`);
if (!signed && !(allowUnsigned && explicitlyUnsigned)) fail("AAB sem verificação positiva de assinatura válida.");
let signer = null;
if (signed) {
  const expectedSha256 = process.env.SIMPLIFICA_PLAY_UPLOAD_CERT_SHA256;
  const certificates = execFileSync("keytool", ["-printcert", "-jarfile", bundle, "-rfc"], { encoding: "utf8" });
  const pems = certificates.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
  if (pems.length !== 1) fail("Exigido exatamente um certificado de upload no AAB.");
  signer = verifyUploadCertificate({ certificatePem: pems[0], expectedSha256 });
  if (!signer.verified) fail(`Certificado de upload não confirmado: ${signer.reason}. Defina SIMPLIFICA_PLAY_UPLOAD_CERT_SHA256.`);
}

let bundleIdentity = null;
let nativeAlignment = [];
const bundletool = process.env.SIMPLIFICA_BUNDLETOOL_JAR;
if (signed && !bundletool) fail("Defina SIMPLIFICA_BUNDLETOOL_JAR para validar o AAB real.");
if (bundletool) {
  execFileSync("java", ["-jar", bundletool, "validate", `--bundle=${bundle}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const actualManifest = execFileSync("java", ["-jar", bundletool, "dump", "manifest", `--bundle=${bundle}`, "--module=base"], { encoding: "utf8" });
  const attribute = name => actualManifest.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
  bundleIdentity = { applicationId: attribute("package"), versionCode: Number(attribute("android:versionCode")),
    versionName: attribute("android:versionName"), minSdk: Number(attribute("android:minSdkVersion")), targetSdk: Number(attribute("android:targetSdkVersion")) };
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const expectedVersion = app.match(/const APP_VERSION = "([^"]+)"/)?.[1];
  const expectedCode = Number(app.match(/const APP_VERSION_CODE = (\d+)/)?.[1]);
  if (bundleIdentity.applicationId !== "br.com.ne3d.erp" || bundleIdentity.versionName !== expectedVersion
    || bundleIdentity.versionCode !== expectedCode || bundleIdentity.minSdk !== 24 || bundleIdentity.targetSdk !== 36) fail("Identidade/versão/API do AAB diverge do esperado.");
  if (/android.permission.(?:REQUEST_INSTALL_PACKAGES|RECORD_AUDIO)/.test(actualManifest) || /android:debuggable="true"/.test(actualManifest)) fail("Manifesto real contém permissão proibida ou modo debug.");
  const configuration = execFileSync("java", ["-jar", bundletool, "dump", "config", `--bundle=${bundle}`], { encoding: "utf8" });
  for (const entry of entries.filter(value => /^base\/lib\/[^/]+\/[^/]+\.so$/.test(value))) {
    const elf = execFileSync("tar.exe", ["-xOf", bundle, entry], { maxBuffer: 16 * 1024 * 1024 });
    if (elf.length < 64 || elf.subarray(0, 4).toString("hex") !== "7f454c46" || elf[4] !== 2 || elf[5] !== 1) fail(`ELF64 inválido: ${entry}`);
    const offset = Number(elf.readBigUInt64LE(32));
    const entrySize = elf.readUInt16LE(54), count = elf.readUInt16LE(56);
    const alignments = [];
    if (entrySize < 56 || offset + entrySize * count > elf.length) fail(`Program headers inválidos: ${entry}`);
    for (let index = 0; index < count; index++) {
      const start = offset + index * entrySize;
      if (elf.readUInt32LE(start) === 1) alignments.push(Number(elf.readBigUInt64LE(start + 48)));
    }
    if (!alignments.length || alignments.some(value => value < 16384)) fail(`Segmento nativo sem alinhamento 16 KB: ${entry}`);
    nativeAlignment.push({ entry, minimumLoadAlignment: Math.min(...alignments) });
  }
  if (nativeAlignment.length && !configuration.includes("PAGE_ALIGNMENT_16K")) fail("Configuração do AAB não solicita alinhamento de páginas 16 KB.");
}

const stats = fs.statSync(bundle);
console.log(JSON.stringify({
  bundle,
  bytes: stats.size,
  signed,
  signer,
  bundleIdentity,
  nativeAlignment,
  sha256: crypto.createHash("sha256").update(fs.readFileSync(bundle)).digest("hex"),
  aiNativeArtifacts: 0,
  ggufArtifacts: 0,
  requestInstallPackages: false,
  recordAudio: false,
  artifactSignatureVerified: signed && signer?.verified === true,
  publishable: false,
  publicationReadiness: "NOT_ASSESSED_BY_ARTIFACT_INSPECTION"
}, null, 2));
