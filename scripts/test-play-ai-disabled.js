const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const gradle = read("android/app/build.gradle");
const mainActivity = read("android/app/src/main/java/br/com/ne3d/erp/MainActivity.java");
const playManifest = read("android/app/src/play/AndroidManifest.xml");
const app = read("app.js");
const renderers = read("src/features/app-ui/app-ui-renderers.js");
const packageJson = JSON.parse(read("package.json"));
const copyApk = read("scripts/copy-android-apk.js");
const copyPilotApk = read("scripts/copy-android-pilot-apk.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(/play\s*\{[\s\S]*?buildConfigField\s+"boolean",\s*"AI_ENABLED",\s*"false"/.test(gradle), "Flavor Play deve desativar a IA no BuildConfig.");
assert(/direct\s*\{[\s\S]*?buildConfigField\s+"boolean",\s*"AI_ENABLED",\s*"true"/.test(gradle), "Flavor direto deve preservar a IA para reativacao futura.");

const registration = mainActivity.match(/if \(BuildConfig\.AI_ENABLED\) \{[\s\S]*?\n\s*\}/)?.[0] || "";
for (const plugin of ["SimplificaLocalAiPlugin", "SimplificaNeedlePlugin", "SimplificaVoicePlugin"]) {
  assert(registration.includes(`registerPlugin(${plugin}.class)`), `${plugin} deve ficar protegido pela flag central.`);
  assert((mainActivity.match(new RegExp(`registerPlugin\\(${plugin}\\.class\\)`, "g")) || []).length === 1, `${plugin} nao pode ser registrado fora da flag.`);
}

assert(app.includes('capacitor?.isPluginAvailable?.("SimplificaLocalAi") === true'), "A interface deve consultar a disponibilidade nativa real da IA.");
assert(app.includes('acao.id === "secretaria_ia" && !getPlatformAdapter().supportsLocalAI'), "Atalho rapido da IA deve desaparecer no flavor Play.");
assert(app.includes('state: "DISABLED", reason: "IA local desativada nesta versão."'), "Sondagem de configuracao deve encerrar sem acessar o provider no flavor Play.");
assert(renderers.includes("if (deps.supportsLocalAI?.() !== true) return;"), "Botao flutuante da IA deve desaparecer no flavor Play.");
assert(/android\.permission\.RECORD_AUDIO[\s\S]*?tools:node="remove"/.test(playManifest), "Flavor Play deve remover a permissao de microfone usada pela IA.");
assert(packageJson.scripts["android:apk"].includes("assembleDirectDebug"), "Build APK direto deve selecionar o flavor explicitamente.");
assert(packageJson.scripts["android:pilot"].includes("assembleDirectDebug"), "Build piloto deve selecionar o flavor direto explicitamente.");
assert(copyApk.includes('"direct"') && copyApk.includes('"app-direct-debug.apk"'), "Copia do APK direto deve usar o novo caminho do flavor.");
assert(copyPilotApk.includes('"direct"') && copyPilotApk.includes('"app-direct-debug.apk"'), "Copia do piloto deve usar o novo caminho do flavor.");

console.log("OK: flavor Play desativa registro, inicializacao, download e atalhos da IA local.");
