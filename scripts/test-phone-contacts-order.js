const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const plugin = fs.readFileSync(path.join(root, "android/app/src/main/java/br/com/ne3d/erp/SimplificaFilesPlugin.java"), "utf8");
const manifest = fs.readFileSync(path.join(root, "android/app/src/main/AndroidManifest.xml"), "utf8");

const checks = [
  [manifest.includes("android.permission.READ_CONTACTS"), "Manifest precisa declarar READ_CONTACTS."],
  [plugin.includes('alias = "contacts"'), "Plugin precisa declarar o alias de contatos."],
  [plugin.includes("requestPermissionForAlias(\"contacts\""), "Plugin precisa solicitar a permissão em runtime."],
  [plugin.includes("boolean listAll = normalizedQuery.isEmpty() && queryPhone.isEmpty()"), "A agenda deve abrir mesmo sem filtro."],
  [app.includes("Abrir contatos do telefone"), "Pedidos precisa expor a ação da agenda."],
  [!app.includes("Digite pelo menos 2 caracteres para buscar contatos."), "A ação explícita não deve exigir texto prévio."]
];

const failures = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failures.length) {
  failures.forEach((failure) => console.error(`FALHA: ${failure}`));
  process.exit(1);
}

console.log("Pedidos/contatos: permissão, abertura direta e busca filtrada verificadas.");
