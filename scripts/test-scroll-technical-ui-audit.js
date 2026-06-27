const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const requiredApp = [
  "function renderComandosPedidoRapidoPwa()",
  "function gerenciarDirecionaisPwa(event, { editavel = false } = {})",
  "function navegarPwaPorDirecional(delta = 1)",
  'if (!isWebPwaProfile() || isMobile()) return "";',
  "quick-order-command-panel",
  "Comandos rápidos",
  "Navegar telas",
  "Menu lateral",
  "const mostrarLogsSistema = isSuperAdmin() || APP_DEBUG_MODE;",
  "Gerencie seus dados, segurança, atualizações e documentos.",
  "Conta e cópias de segurança",
  "Ajuda e documentos",
  "Baixar e instalar",
  "Atualizar agora"
];

const requiredCss = [
  "body.mobile-mode.app-shell-ready .mobile-panel{",
  "body.mobile-mode.app-shell-ready:not(.settings-subscreen-open) .mobile-panel-content{",
  "overflow-y:auto !important;",
  ".quick-order-layout{\n  min-height:0;\n  height:100%;",
  "touch-action:pan-y;",
  ".quick-order-command-panel{"
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
  "Os registros técnicos ficam separados no Log do sistema."
];

const missing = [
  ...requiredApp.filter((snippet) => !app.includes(snippet)),
  ...requiredCss.filter((snippet) => !css.includes(snippet)),
  ...forbidden.filter((snippet) => app.includes(snippet) || css.includes(snippet)).map((snippet) => `conteúdo antigo ainda presente: ${snippet}`)
];

if (missing.length) {
  console.error("Auditoria de scroll e mensagens técnicas incompleta:", missing);
  process.exit(1);
}

console.log("Scroll e mensagens técnicas: contratos de APK/PWA validados.");
