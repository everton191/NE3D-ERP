"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const companyAdministration = require(path.join(__dirname, "..", "src", "features", "company", "company-administration.js"));

const windowMock = {};
let navigatedTo = "";
const baseContext = {
  appConfig: { businessName: "Empresa teste" },
  canAccessScreen: () => true,
  escaparAttr: (value) => String(value),
  escaparHtml: (value) => String(value),
  getUserAccessRole: () => "admin",
  getUsuarioAtual: () => ({ id: "u-1" }),
  isMobile: () => false,
  podeAcessarAdministracaoEmpresa: () => true,
  renderAppButton: ({ label }) => `<button>${label}</button>`,
  renderAppHeader: ({ title }) => `<h1>${title}</h1>`,
  renderCashSettings: () => "<section>caixa</section>",
  renderInventorySettings: () => "<section>estoque</section>",
  renderStaffAdministration: () => "<section>funcionarios</section>",
  renderUiIcon: () => "<i></i>",
  trocarTela: (screen) => { navigatedTo = screen; },
  voltarTela: () => { navigatedTo = "voltar"; },
  renderAppComTransicaoNavegacao: () => {},
  resetarScrollTelaAtiva: () => {},
  window: windowMock
};

assert.equal(companyAdministration.getAdministrationSection(baseContext), "home");
companyAdministration.openAdministrationSection("caixa", baseContext);
assert.equal(windowMock.__adminCompanySection, "caixa");
assert.equal(navigatedTo, "administracao");
assert.match(companyAdministration.renderAdministrationSubsection("caixa", {}, baseContext), /caixa/);
assert.match(companyAdministration.renderPermissionsMvp(baseContext), /Permissões por cargo/);
windowMock.__adminCompanySection = "home";
assert.match(companyAdministration.renderAdministration(baseContext), /Configurações do caixa/);
console.log("company_administration_tests_ok");
