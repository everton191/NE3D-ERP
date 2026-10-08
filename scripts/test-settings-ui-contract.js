"use strict";

const fs = require("node:fs");
const assert = require("node:assert/strict");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles/ui-v3/screens/settings.css", "utf8");

for (const screen of ["config", "aparencia", "preferencias", "pdf", "conta", "seguranca"]) {
  assert.match(app, new RegExp(`data-ui3-screen=["']${screen}["']`), `Tela ${screen} sem contrato visual V3.`);
}

assert.match(app, /const knownIcon = UI_ICON_ALIASES\[normalizedIcon\]/, "Ícones textuais das seções não são normalizados.");
assert.match(app, /knownIcon\s*\? renderUiIcon\(knownIcon\)/, "Ícones conhecidos das seções não usam o catálogo visual.");
assert.match(css, /details\.ui-section:not\(\[open\]\) > \.ui-section-body\s*\{\s*display: none !important;/, "Conteúdo de seções fechadas pode afetar o layout.");
assert.match(css, /\.ui-section\.ui-subscreen-active[\s\S]*?background-color: var\(--ui3-bg\);/, "Subtelas móveis não herdam o fundo do tema.");
assert.match(css, /min-height: 42px !important;/, "Botões de Configurações não têm altura mínima tátil.");
assert.match(css, /grid-template-columns: repeat\(auto-fit,minmax\(min\(145px,100%\),1fr\)\) !important;/, "Ações móveis não possuem grade responsiva.");
assert.match(css, /white-space: normal !important;/, "Rótulos de ações ainda podem ser truncados.");

console.log("Settings UI contract: temas, larguras, ícones e ações responsivas verificados.");
