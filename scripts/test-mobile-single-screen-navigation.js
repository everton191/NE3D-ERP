const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const uiV3Scroll = fs.readFileSync(path.join(root, "styles", "ui-v3", "app-shell.css"), "utf8");

const required = [
  "body.mobile-mode:has(#app > .mobile-panel) #app > .mobile-home",
  "display:none !important",
  "body.mobile-mode:has(#app > .mobile-panel) #app",
  "body.mobile-mode.app-shell-ready .mobile-panel>.mobile-panel-content",
  "position:fixed !important",
  "overflow-y:auto !important",
  "scroll-padding-bottom:calc(var(--layout-bottom-nav-height)"
];

const failures = required.filter((contract) => !(css + uiV3Scroll).includes(contract));
if (failures.length) {
  failures.forEach((failure) => console.error(`FALHA: contrato ausente: ${failure}`));
  process.exit(1);
}

console.log("Navegação mobile: apenas uma tela visível por vez verificada.");
