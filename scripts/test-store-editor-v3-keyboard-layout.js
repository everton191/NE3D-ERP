const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'document.documentElement.style.setProperty("--store-editor-v3-keyboard-inset", `${Math.round(teclado)}px`);',
  'document.documentElement.setAttribute("data-store-editor-keyboard-open", teclado > 120 ? "true" : "false");',
  "window.visualViewport?.addEventListener(\"resize\", agendarAtualizacaoViewportOperacionalMobile, { passive: true });",
  "window.visualViewport?.addEventListener(\"scroll\", atualizarViewportOperacionalMobile, { passive: true });"
].forEach((marker) => assert(app.includes(marker), `Keyboard layout ausente em app.js: ${marker}`));

[
  "bottom:var(--store-editor-v3-keyboard-inset, 0px);",
  "padding:10px 2px calc(112px + var(--store-editor-v3-keyboard-inset, 0px) + var(--app-safe-bottom, 0px));",
  "scroll-padding-bottom:calc(124px + var(--store-editor-v3-keyboard-inset, 0px) + var(--app-safe-bottom, 0px));",
  'html[data-store-editor-keyboard-open="true"] .store-guided-compact-preview'
].forEach((marker) => assert(css.includes(marker), `Keyboard layout ausente em style.css: ${marker}`));

console.log("Store editor V3 keyboard layout: viewport, footer e preview reduzido validados.");
