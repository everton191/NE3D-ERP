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
