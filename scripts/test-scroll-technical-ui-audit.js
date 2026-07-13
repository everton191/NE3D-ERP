const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const uiV3Scroll = fs.readFileSync(path.join(root, "styles", "ui-v3", "app-shell.css"), "utf8");
const uiV3LegacyBridge = fs.readFileSync(path.join(root, "styles", "ui-v3", "legacy-bridge.css"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");

const requiredApp = [
  "function renderComandosPedidoRapidoPwa()",
  "function gerenciarDirecionaisPwa(event, { editavel = false } = {})",
  "function navegarPwaPorDirecional(delta = 1)",
  'if (!isWebPwaProfile() || isMobile()) return "";',
  "quick-order-command-panel",
  'class="mobile-panel-content app-content" tabindex="0"',
  "function gerenciarScrollContainerTeclado(event)",
  'onkeydown="gerenciarScrollContainerTeclado(event)"',
  "Comandos rápidos",
  "Navegar telas",
  "Menu lateral",
  "const mostrarLogsSistema = isSuperAdmin() || APP_DEBUG_MODE;",
  "Informações do aplicativo, sincronização, atualizações e documentos.",
  "Conta e cópias de segurança",
  "Ajuda e documentos",
  "Baixar e instalar",
  "Atualizar agora"
];

const requiredCss = [
  "body.mobile-mode.app-shell-ready .mobile-panel{",
  "#app-shell.ui3-app-shell-host>#app-content.ui3-content-scroller",
  "overflow-y:auto !important;",
  ".quick-order-layout{\n  min-height:0;\n  height:100%;",
  "touch-action:pan-y;",
  "overflow-x:clip !important;",
  "overscroll-behavior:contain;",
  ".reports-kpi-slide{",
  ".quick-order-command-panel{",
  "Central responsive layout authority: one vertical scroll owner per screen.",
  "Mobile routed screens share one bounded vertical scroll owner.",
  "body :where(.side-menu, .app-sidebar, .desktop-sidebar)::-webkit-scrollbar",
  ".stock-list,\n.smart-stock-row {\n  overflow: visible !important;",
  ".smart-stock-row:has(.stock-item-menu[open])",
  "body[data-ui-profile=\"web_pwa\"]:not(.mobile-mode) .metric-card.desktop-dashboard-metric",
  "min-height: 104px !important;"
];

const forbidden = [
  "operational-shortcuts",
  "Enter adiciona item",
  "Ctrl+Enter salva",
  "Esc fecha",
  "Comportamento interno do app: backup, sincronização, atualizações, cache",
  'title: "Log do sistema"',
  'title: "Cache, offline e suporte"',
  "Checar a cada minutos",
  "Baixar APK</button>",
  "Os registros técnicos ficam separados no Log do sistema.",
  ".mobile-home,\n  .mobile-panel,\n  .mobile-panel-content"
];

const missing = [
  ...requiredApp.filter((snippet) => !app.includes(snippet)),
  ...requiredCss.filter((snippet) => !(css + uiV3Scroll).includes(snippet)),
  ...forbidden.filter((snippet) => app.includes(snippet) || css.includes(snippet)).map((snippet) => `conteúdo antigo ainda presente: ${snippet}`)
];

const mobileScrollAuthority = uiV3Scroll.lastIndexOf("Mobile routed screens share one bounded vertical scroll owner.");
const lastLegacyVisibleOverflow = uiV3Scroll.lastIndexOf("overflow:visible");
if (mobileScrollAuthority < 0 || mobileScrollAuthority < lastLegacyVisibleOverflow) {
  missing.push("a autoridade final de scroll mobile deve permanecer depois das regras legadas com overflow visível");
}
if (!serviceWorker.includes("1.0.12-orders-no-popup-20260713")) {
  missing.push("o cache do service worker precisa acompanhar a autoridade de scroll mobile");
}
if (!uiV3LegacyBridge.includes("V3 compatibility bridge") || !uiV3LegacyBridge.includes("body.app-shell-ready")) {
  missing.push("a ponte de tema V3 precisa cobrir as telas legadas do shell");
}

if (missing.length) {
  console.error("Auditoria de scroll e mensagens técnicas incompleta:", missing);
  process.exit(1);
}

console.log("Scroll e mensagens técnicas: contratos de APK/PWA validados.");
