const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const doc = fs.readFileSync(path.join(root, "docs", "navigation-audit-stage-1-2026-07-01.md"), "utf8");

function sectionBetween(startMarker, endMarker) {
  const start = app.indexOf(startMarker);
  assert.notEqual(start, -1, `marcador inicial ausente: ${startMarker}`);
  const end = app.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `marcador final ausente: ${endMarker}`);
  return app.slice(start, end);
}

const menuGroups = sectionBetween("function getMenuGroups()", "function alternarMenuLateral");
const renderConta = sectionBetween("function renderConta()", "function abrirDadosPessoaisUsuario");
const renderConfig = sectionBetween("function renderConfig()", "function getAuthTabAtual");
const renderAdministracao = sectionBetween("function renderAdministracaoEmpresa()", "function renderConta()");
const renderMais = sectionBetween("function renderMais()", "function renderCaixa");

assert.ok(app.includes("const NAVIGATION_AUDIT_REGISTRY = Object.freeze({"), "registro de auditoria de navegação deve existir");
assert.ok(app.includes('category: "perfil"'), "registro deve mapear área de perfil");
assert.ok(app.includes('category: "administracao"'), "registro deve mapear área de administração");
assert.ok(app.includes('category: "sistema"'), "registro deve mapear área de sistema");
assert.ok(app.includes('category: "superadmin"'), "registro deve mapear área de superadmin");
assert.ok(app.includes("function getNavigationAuditEntry"), "registro deve ter consulta estável");

assert.doesNotMatch(app, /renderThemeModeButton\("topbar-theme-toggle"\)/, "topbar não deve manter seletor de tema duplicado");
assert.doesNotMatch(app, /renderThemeModeButton\("mobile-theme-toggle"\)/, "painel mobile não deve manter seletor de tema duplicado");
assert.doesNotMatch(app, /renderThemeModeButton\("dashboard-theme-toggle"\)/, "dashboard não deve manter seletor de tema duplicado");
assert.ok(renderConta.includes("Tema do ERP"), "tema deve ficar no Perfil");
assert.ok(renderConta.includes("Modo de uso"), "modo de uso deve ficar no Perfil");
assert.ok(menuGroups.includes('titulo: "Perfil"'), "menu lateral deve separar Perfil de Configurações");
assert.ok(renderMais.includes('titulo: "Perfil"'), "menu Mais deve separar Perfil de Configurações");

assert.ok(renderAdministracao.includes("Funcionários"), "administração deve incluir funcionários");
assert.ok(renderAdministracao.includes("Permissões"), "administração deve incluir permissões");
assert.ok(renderAdministracao.includes("Configurações do caixa"), "administração deve incluir caixa");
assert.ok(renderAdministracao.includes("Configurações de estoque"), "administração deve incluir estoque");
assert.ok(app.includes("function renderPermissoesEmpresaMvp"), "permissões importantes devem ter MVP funcional");
assert.ok(app.includes("function renderConfiguracoesEstoqueAdministracao"), "estoque deve ter MVP funcional em administração");
assert.ok(app.includes("function renderConfiguracoesCaixaAdministracao"), "caixa deve ter MVP funcional em administração");
assert.doesNotMatch(renderAdministracao, /trocarTela\('feedback'\)/, "administração não deve usar sugestão genérica para função importante");

assert.doesNotMatch(menuGroups, /texto: "Usuários"/, "usuários não deve aparecer como grupo admin separado no menu");
assert.doesNotMatch(renderMais, /texto: "Usuários"/, "usuários não deve aparecer duplicado no Mais");
assert.doesNotMatch(renderMais, /texto: "Planos"/, "planos não deve ficar em Principal no Mais");

assert.doesNotMatch(renderConfig, /abrirSeletorModoInterface\(\)/, "Sistema não deve controlar modo de uso");
assert.doesNotMatch(renderConfig, /Segurança da conta/, "Sistema não deve duplicar segurança pessoal");
assert.doesNotMatch(renderConfig, /Sugestões de melhorias/, "Sistema não deve apontar para sugestão genérica");
assert.ok(renderConfig.includes("Informações do aplicativo, sincronização, atualizações e documentos."), "Sistema deve ter escopo claro");

assert.ok(app.includes('if (tela === "administracao") return podeAcessarAdministracaoEmpresa(usuario)'), "administração deve continuar protegida por permissão");
assert.ok(app.includes('return tela === "superadmin" || tela === "admin" || tela === "acessoNegado"'), "superadmin deve continuar protegido");

assert.ok(doc.includes("Pendências escondidas ou não ativadas"), "auditoria deve registrar pendências");
assert.ok(doc.includes("Impressoras 3D automáticas"), "impressoras devem permanecer registradas como fase futura");

console.log("navigation_stage_1_tests_ok");
