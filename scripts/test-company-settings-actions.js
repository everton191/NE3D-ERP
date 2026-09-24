"use strict";

const assert = require("node:assert/strict");
const actions = require("../src/features/company/company-settings-actions.js");

const html = actions.renderSaveCompanySection("empresa-dados", "Salvar", {
  escaparAttr: String,
  renderAppButton: ({ label, action }) => `<button data-action="${action}">${label}</button>`,
  renderUiLayoutAttributes: () => ""
});
assert.match(html, /editarSecaoEmpresa\('empresa-dados'\)/);
assert.match(html, /salvarPersonalizacao\(\)/);

let focused = false;
const panel = { open: false, classList: { add: () => {} }, querySelector: () => ({ focus: () => { focused = true; } }) };
actions.editCompanySection("empresa-dados", { CSS: { escape: String }, document: { querySelector: () => panel } });
assert.equal(panel.open, true);
assert.equal(focused, true);
console.log("company_settings_actions_tests_ok");
