const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'window.matchMedia?.("(hover: hover) and (pointer: fine)")',
  "abrirMenuContextualUi(menu, 100)",
  "fecharMenuContextualUi(menu, 180)",
  'document.addEventListener("focusin"',
  'document.addEventListener("focusout"',
  'document.addEventListener("pointerover"',
  'document.addEventListener("pointerout"',
  'document.addEventListener("keydown"',
  'event.key !== "Escape"',
  "fecharMenusContextuaisUi();",
  'summary.setAttribute("aria-expanded"',
  'summary.setAttribute("aria-controls"',
  'summary.setAttribute("aria-haspopup", "menu")',
  'panel.setAttribute("role", "menu")',
  'item.setAttribute("role", "menuitem")'
].forEach((marker) => assert(app.includes(marker), `Contrato de menu ausente: ${marker}`));

assert(
  app.indexOf("if (fecharMenusContextuaisUi())") < app.indexOf("if (fecharNavegacaoContextualLojaSeExistir())"),
  "Botao voltar nao prioriza o fechamento do popup contextual."
);
assert(
  app.includes('<nav class="mobile-bottom-nav app-bottom-navigation'),
  "Barra inferior mobile deixou de ser navegacao direta."
);

[
  ".ui-context-menu-panel{",
  "position:absolute",
  "overscroll-behavior:contain",
  "min-height:44px",
  "var(--app-safe-bottom, 0px)",
  "bottom:calc(var(--app-safe-bottom, 0px) + 12px)"
].forEach((marker) => assert(css.includes(marker), `CSS de popup ausente: ${marker}`));

console.log("Context menu contract: hover/focus/touch, acessibilidade, back e safe area verificados.");
