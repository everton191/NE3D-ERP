const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const gradle = read("android/app/build.gradle");
const mainActivity = read("android/app/src/main/java/br/com/ne3d/erp/MainActivity.java");
const markerPlugin = read("android/app/src/main/java/br/com/ne3d/erp/SimplificaExternalCheckoutPlugin.java");
const app = read("app.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(/play\s*\{[\s\S]*?buildConfigField\s+"boolean",\s*"EXTERNAL_CHECKOUT_ENABLED",\s*"false"/.test(gradle), "Flavor Play deve desativar checkout externo.");
assert(/direct\s*\{[\s\S]*?buildConfigField\s+"boolean",\s*"EXTERNAL_CHECKOUT_ENABLED",\s*"true"/.test(gradle), "Distribuição direta deve preservar Mercado Pago web/APK.");
assert(/if \(BuildConfig\.EXTERNAL_CHECKOUT_ENABLED\) \{[\s\S]*?registerPlugin\(SimplificaExternalCheckoutPlugin\.class\)/.test(mainActivity), "Marcador nativo deve respeitar a flag central.");
assert(markerPlugin.includes('@CapacitorPlugin(name = "SimplificaExternalCheckout")'), "Marcador de checkout deve ser um plugin Capacitor explícito.");
assert(app.includes('isPluginAvailable?.("SimplificaExternalCheckout") === true'), "Aplicação deve ler a capacidade nativa real.");
for (const functionName of ["abrirLinkMercadoPago", "criarPagamentoUnicoMercadoPago"]) {
  const start = app.indexOf(`function ${functionName}`);
  const body = app.slice(start, start + 700);
  assert(start >= 0 && body.includes("!checkoutExternoDisponivel()"), `${functionName} deve bloquear checkout no Play.`);
}
assert(app.includes("Esta versão reconhece normalmente assinaturas existentes, mas não inicia novas compras ou upgrades."), "Tela de planos deve explicar o modo somente gerenciamento.");
assert(app.includes('apresentacaoFinal.cta = "Contratação indisponível nesta versão"'), "CTAs pagos devem ficar indisponíveis no Play.");

console.log("OK: flavor Play preserva assinaturas existentes e bloqueia checkout externo no código e na interface.");
