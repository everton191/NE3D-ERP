const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");
const tokens = fs.readFileSync(path.join(root, "src/shared/design-system/tokens/index.js"), "utf8");
const baselinePath = path.join(root, "docs/quality/manual-ui-baseline.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

function countManualButtons(source) {
  return [...source.matchAll(/<button\b([^>]*)>/g)]
    .filter(([, attrs]) => {
      const value = String(attrs || "");
      return !/data-ui-component=["']Button["']/.test(value)
        && !/\bapp-button\b/.test(value)
        && !/\bs3d-button\b/.test(value)
        && !/renderAppButton\(/.test(value);
    }).length;
}

function countManualInputs(source) {
  return [...source.matchAll(/<(input|select|textarea)\b([^>]*)>/g)]
    .filter(([, tag, attrs]) => {
      const value = String(attrs || "");
      return !/data-ui-component=["'](Input|Select|Textarea)["']/.test(value)
        && !/\b(ds-input|ds-select|ds-textarea|app-input|app-select|app-textarea)\b/.test(value)
        && !["hidden", "checkbox", "radio"].includes((/type=["']([^"']+)["']/.exec(value)?.[1] || "").toLowerCase());
    }).length;
}

function countManualCards(source) {
  return [...source.matchAll(/<(section|article|div)\b([^>]*)class=["']([^"']*\b(card|kpi-card|metric|summary-card|row|tile)[^"']*)["'][^>]*>/g)]
    .filter(([, , attrs, classes]) => {
      const value = `${attrs || ""} ${classes || ""}`;
      return !/data-ui-component=["']Card["']/.test(value)
        && !/\b(ds-card|s3d-card|app-card)\b/.test(value);
    }).length;
}

const current = {
  manualButtons: countManualButtons(app),
  manualInputs: countManualInputs(app),
  manualCards: countManualCards(app),
  hardcodedColors: countMatches(style, /#[0-9a-fA-F]{3,8}\b/g)
};

assert(fs.existsSync(baselinePath), "Baseline de UI manual ausente.");
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

for (const key of Object.keys(current)) {
  assert(
    current[key] <= baseline[key],
    `Quality gate DS falhou: ${key} aumentou de ${baseline[key]} para ${current[key]}. Use src/shared/design-system ou atualize o baseline com justificativa.`
  );
}

[
  "src/shared/design-system/index.js",
  "src/shared/design-system/components/Button.js",
  "src/shared/design-system/components/Card.js",
  "src/shared/design-system/components/Input.js",
  "src/shared/design-system/layouts/templates.js",
  "src/shared/design-system/profiles/mobile-simple.js",
  "src/shared/design-system/profiles/mobile-professional.js",
  "src/shared/design-system/profiles/desktop.js"
].forEach((file) => {
  assert(fs.existsSync(path.join(root, file)), `Componente real ausente: ${file}`);
});

assert(!style.includes(".ds-stock-pilot-template"), "Quality gate nao deve exigir redesign de uma tela real.");
assert(fs.existsSync(path.join(root, "docs/quality/screen-inventory.md")), "Inventario de telas ausente.");
[
  "--page-max-width",
  "--form-max-width",
  "--mobile-bottom-nav-height",
  "--control-height-sm",
  "--control-height-md",
  "--control-height-lg",
  ".ds-template-content"
].forEach((contract) => assert(style.includes(contract), `Contrato visual central ausente: ${contract}`));
[
  "breakpoint: Object.freeze",
  "layout: Object.freeze",
  "control: Object.freeze"
].forEach((contract) => assert(tokens.includes(contract), `Token estrutural ausente: ${contract}`));

[
  'icone: "📊"',
  'icone: "📦"',
  'icone: "📋"',
  'icone: "💰"',
  'icone: "🧮"',
  'icone: "🖨️"',
  '<p class="muted">👤',
  '<p class="muted">📅'
].forEach((legacyIcon) => assert(!app.includes(legacyIcon), `Icone legado fora do registro: ${legacyIcon}`));

console.log("Design System quality gate validado.", current);
