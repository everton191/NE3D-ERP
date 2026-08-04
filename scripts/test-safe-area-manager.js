const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const safeArea = read("src/services/safeAreaManager.js");
const css = read("style.css");
const app = read("app.js");
const index = read("index.html");
const sw = read("sw.js");
const mainActivity = read("android/app/src/main/java/br/com/ne3d/erp/MainActivity.java");
const prepareWeb = read("scripts/prepare-web.js");

[
  "global.safeArea = state",
  "visualViewport",
  "orientationchange",
  "simplifica-native-insets-change",
  "CONTENT_TOP_INSET_RATIO = 0.25",
  "rawTopInset * CONTENT_TOP_INSET_RATIO",
  "--viewport-height",
  "--app-safe-bottom",
  "--safe-area-inset-bottom",
  "--keyboard-inset"
].forEach((marker) => assert(safeArea.includes(marker), `safeAreaManager incompleto: ${marker}`));

assert(!safeArea.includes("MIN_SYSTEM_NAV_BOTTOM"), "safeAreaManager nao deve usar margem minima fixa de Android");
assert(!safeArea.includes("getSystemBottomInset"), "safeAreaManager nao deve somar inset nativo como altura de UI");

assert(index.indexOf("/src/services/safeAreaManager.js") > -1, "index.html nao carrega safeAreaManager");
assert(index.indexOf("/src/services/safeAreaManager.js") < index.indexOf("/app.js?v="), "safeAreaManager deve carregar antes do app.js");
assert(sw.includes("./src/services/safeAreaManager.js"), "safeAreaManager nao entra no cache PWA");
assert(prepareWeb.includes("src/services/safeAreaManager.js"), "prepare-web nao publica safeAreaManager");

assert(app.includes("function getManagedSafeAreaInsets"), "app.js nao usa safe area gerenciada");
assert(app.includes("safeAreaInsets?.bottom"), "app.js nao aplica bottom inset gerenciado");
assert(app.includes("focarCampoSenha(document.getElementById(\"localUnlockPassword\")"), "desbloqueio local nao preserva foco do input");
assert(app.includes("Tema ${tema === \"system\""), "troca de tema nao confirma sucesso de forma amigavel");

assert(mainActivity.includes("getDisplayMetrics().density"), "MainActivity deve converter px nativo para px CSS");
assert(mainActivity.includes("simplifica-native-insets-change"), "MainActivity nao dispara evento de insets");

[
  "--app-safe-bottom",
  "--bottom-nav-height:72px",
  "bottom:0 !important",
  "padding-bottom:var(--app-safe-bottom) !important",
  "bottom:calc(var(--app-safe-bottom) + 16px) !important",
  "padding-bottom:calc(var(--bottom-nav-height) + var(--app-safe-bottom) + var(--content-ad-banner-space) + 16px) !important",
  "body.keyboard-visible.mobile-mode .mobile-bottom-nav",
  ".toast-area",
  ".store-context-edit-fab",
  ".store-product-action-sheet",
  ".storefront-root",
  ".storefront-bottom-bar",
  ".store-cart-bar",
  ".store-public-product-actions",
  ".store-public-floating-cart",
  ".store-cart-drawer",
  ".store-lead-modal",
  "padding-bottom:calc(var(--app-safe-bottom) + 96px)"
].forEach((marker) => assert(css.includes(marker), `CSS safe area incompleto: ${marker}`));

assert(!css.includes("--bottom-nav-visual-gap"), "Bottom nav nao deve usar gap visual fixo");
assert(!css.includes("bottom:calc(var(--bottom-nav-visual-gap)"), "Bottom nav nao deve ser elevada por gap fixo");
assert(!css.includes("bottom:8px !important;\n}"), "Bottom nav nao deve voltar para margem fixa de 8px");

console.log("Safe area manager: PWA/APK, bottom nav, teclado e desbloqueio validados.");
