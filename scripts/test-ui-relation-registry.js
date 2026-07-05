const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const style = fs.readFileSync("style.css", "utf8");
const designSystem = fs.readFileSync("themes/base/design-system-v2.css", "utf8");

assert.ok(app.includes("const UI_BUTTON_RELATIONS = Object.freeze"), "Registro de variantes de botão ausente.");
assert.ok(app.includes("const UI_COMPONENT_SIZE_RELATIONS = Object.freeze"), "Registro de tamanhos de botão e card ausente.");
assert.ok(app.includes("const UI_SCREEN_RELATIONS = Object.freeze"), "Registro de telas ausente.");
assert.ok(
  app.includes("const telas = Object.freeze(Object.fromEntries("),
  "Rótulos de tela devem ser derivados do registro central."
);
assert.ok(
  app.includes('data-ui-variant="${escaparAttr(relation.className)}"')
    && app.includes('data-ui-size="${escaparAttr(size)}"')
    && app.includes('data-ui-token-set="${escaparAttr(relation.tokenSet)}"'),
  "Botão-base deve declarar sua variante e conjunto de tokens."
);

const screenBlock = app.slice(
  app.indexOf("const UI_SCREEN_RELATIONS = Object.freeze"),
  app.indexOf("const telas = Object.freeze", app.indexOf("const UI_SCREEN_RELATIONS = Object.freeze"))
);
const screenEntries = [...screenBlock.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*): Object\.freeze\(\{([^}]+)\}\)/gm)];
assert.ok(screenEntries.length >= 30, "Registro central deve cobrir todas as telas atuais.");
screenEntries.forEach(([, screen, relation]) => {
  assert.match(relation, /label:\s*"/, `${screen} precisa de label.`);
  assert.match(relation, /icon:\s*"/, `${screen} precisa de ícone.`);
  assert.match(relation, /tokenSet:\s*"/, `${screen} precisa de conjunto de tokens.`);
});

[
  "--s3d-button-primary-bg",
  "--s3d-button-secondary-bg",
  "--s3d-button-ghost-bg",
  "--s3d-button-danger-bg",
  "--s3d-button-success-bg"
].forEach((token) => assert.ok(designSystem.includes(token), `Token-base ausente: ${token}`));

[
  '.app-button[data-ui-variant="primary"]',
  '.app-button[data-ui-variant="secondary"]',
  '.app-button[data-ui-variant="ghost"]',
  '.app-button[data-ui-variant="danger"]',
  '.app-button[data-ui-variant="success"]'
].forEach((selector) => assert.ok(style.includes(selector), `Relação visual ausente: ${selector}`));

[
  "--s3d-button-height-compact",
  "--s3d-button-height-standard",
  "--s3d-button-height-large",
  "--s3d-card-min-height-compact",
  "--s3d-card-min-height-standard",
  "--s3d-card-min-height-large"
].forEach((token) => assert.ok(style.includes(token), `Token de tamanho ausente: ${token}`));

assert.ok(style.includes('.s3d-button[data-ui-size="compact"]'), "Contrato de botão compacto ausente.");
assert.ok(style.includes('.s3d-card[data-ui-size="large"]'), "Contrato de card grande ausente.");

console.log("UI relation registry: telas, botões e tokens estão vinculados.");
