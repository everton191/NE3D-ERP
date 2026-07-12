const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const lightTokens = fs.readFileSync("themes/light/tokens.css", "utf8");
const designSystem = fs.readFileSync("themes/base/design-system-v2.css", "utf8");

function assert(source, marker, message) {
  if (!source.includes(marker)) throw new Error(message);
}

[
  '--text", usarClaro ? "#000000" : "#ffffff"',
  '--color-text-primary", usarClaro ? "#000000" : "#ffffff"',
  '--text-primary", usarClaro ? "#000000" : "#ffffff"'
].forEach((marker) => assert(app, marker, `Autoridade runtime ausente: ${marker}`));

[
  "--text-primary:#000000",
  "--text-secondary:#000000",
  "--text-muted:#000000"
].forEach((marker) => assert(lightTokens, marker, `Token claro nao padronizado: ${marker}`));

assert(designSystem, "--erp-text:#000000", "Design System ERP claro deve usar texto preto.");
assert(css, "Final ERP typography authority", "Autoridade CSS final de tipografia ausente.");
assert(css, "body.theme-light:not(.visitor-public-screen)", "Tema claro deve permanecer isolado da loja publica.");
assert(css, "color:#ffffff !important", "Botoes escuros precisam preservar texto branco contrastante.");
assert(css, "body:not(.theme-light):not(.visitor-public-screen)", "Tema escuro deve ter autoridade de contraste equivalente.");

console.log("System font colors: tema claro preto, botoes contrastantes e tema escuro padronizado.");
