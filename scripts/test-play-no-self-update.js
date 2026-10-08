const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const gradle = read("android/app/build.gradle");
const mainActivity = read("android/app/src/main/java/br/com/ne3d/erp/MainActivity.java");
const mainManifest = read("android/app/src/main/AndroidManifest.xml");
const directManifest = read("android/app/src/direct/AndroidManifest.xml");
const app = read("app.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(/play\s*\{[\s\S]*?buildConfigField\s+"boolean",\s*"SELF_UPDATE_ENABLED",\s*"false"/.test(gradle), "Flavor Play deve desativar o atualizador próprio.");
assert(/direct\s*\{[\s\S]*?buildConfigField\s+"boolean",\s*"SELF_UPDATE_ENABLED",\s*"true"/.test(gradle), "Flavor direto deve preservar o atualizador próprio.");
assert(/if \(BuildConfig\.SELF_UPDATE_ENABLED\) \{[\s\S]*?registerPlugin\(SimplificaUpdatePlugin\.class\)/.test(mainActivity), "Registro do plugin deve respeitar a flag central.");
assert(!mainManifest.includes("android.permission.REQUEST_INSTALL_PACKAGES"), "Manifesto comum não pode solicitar instalação de APK.");
assert(directManifest.includes("android.permission.REQUEST_INSTALL_PACKAGES"), "Somente o flavor direto deve solicitar instalação de APK.");
assert(app.includes('isPluginAvailable?.("SimplificaUpdate") !== true'), "Aplicação deve verificar a disponibilidade nativa do atualizador.");
assert(app.includes("function atualizacaoAndroidGerenciadaPelaLoja()"), "Aplicação deve reconhecer atualização gerenciada pela loja.");
assert(app.includes('if (atualizacaoAndroidGerenciadaPelaLoja()) return "";'), "Aviso legado de APK deve ficar oculto no flavor Play.");
assert(app.includes('salvarStatusAtualizacao("Atualizações pela Google Play")'), "Flavor Play deve orientar atualizações pela loja.");

console.log("OK: flavor Play não registra, não executa e não solicita permissão para o atualizador próprio de APK.");
