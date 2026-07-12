const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const mainActivity = fs.readFileSync(
  path.join(root, "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "MainActivity.java"),
  "utf8"
);
const updatePlugin = fs.readFileSync(
  path.join(root, "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "SimplificaUpdatePlugin.java"),
  "utf8"
);
const manifest = fs.readFileSync(
  path.join(root, "android", "app", "src", "main", "AndroidManifest.xml"),
  "utf8"
);
const filePaths = fs.readFileSync(
  path.join(root, "android", "app", "src", "main", "res", "xml", "file_paths.xml"),
  "utf8"
);

const checks = [
  ["plugin registrado no Android", mainActivity.includes("registerPlugin(SimplificaUpdatePlugin.class)")],
  ["ponte Capacitor usada pelo app", app.includes("Capacitor?.Plugins?.SimplificaUpdate")],
  ["download e instalação nativos", updatePlugin.includes("downloadAndInstall") && updatePlugin.includes("Intent.ACTION_VIEW")],
  ["download exige HTTPS", updatePlugin.includes('downloadUrl.startsWith("https://")')],
  ["versão atual não abre instalador", updatePlugin.includes("versionCode <= currentVersionCode") && updatePlugin.includes('result.put("upToDate", true)')],
  ["versionCode atual vem do pacote instalado", updatePlugin.includes("getPackageInfo") && updatePlugin.includes("getLongVersionCode")],
  ["app informa versão mais recente sem instalar", app.includes("Você já está na versão mais recente.") && app.includes("return { upToDate: true };")],
  ["linha antiga de atualização é limpa uma vez", app.includes('ANDROID_UPDATE_LINE_ID = "package-1"') && app.includes("garantirLinhaAtualizacaoAndroidAtual")],
  ["manifesto legado do repositório principal foi removido", !app.includes("everton191/NE3D-ERP/main/downloads/update.json") && app.includes("erpne3d.vercel.app/downloads/update.json")],
  ["PWA Android mostra APK sem comparar com versão web", app.includes("!isAndroidNativeApp()") && app.includes("APK Android disponível") && app.includes("Baixar APK")],
  ["permissão de instalação declarada", manifest.includes("android.permission.REQUEST_INSTALL_PACKAGES")],
  ["APK compartilhado via FileProvider", updatePlugin.includes("FileProvider.getUriForFile") && filePaths.includes("external-files-path")],
  ["autorização do Android tratada", updatePlugin.includes("ACTION_MANAGE_UNKNOWN_APP_SOURCES") && app.includes("permissionRequired")]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  failed.forEach(([label]) => console.error(`FAIL: ${label}`));
  process.exit(1);
}

console.log("OK: atualização do APK permanece dentro do aplicativo até o instalador do Android.");
