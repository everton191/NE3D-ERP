const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const doc = fs.readFileSync(path.join(root, "docs", "visual-polish-stage-2026-07-01.md"), "utf8");
const reportsRenderer = fs.readFileSync(path.join(root, "src", "features", "reports", "reports-renderer.js"), "utf8");
const settingsCss = fs.readFileSync(path.join(root, "styles", "ui-v3", "screens", "settings.css"), "utf8");

function sectionBetween(startMarker, endMarker) {
  const start = app.indexOf(startMarker);
  assert.notEqual(start, -1, `marcador inicial ausente: ${startMarker}`);
  const end = app.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `marcador final ausente: ${endMarker}`);
  return app.slice(start, end);
}

const dashboardSimplifica = sectionBetween("function renderDashboardSimplifica", "function renderDashboard()");
const profileMenu = sectionBetween("function abrirMenuUsuarioTopo", "function buscarGlobal");
const profileScreen = sectionBetween("function renderConta()", "function renderProfileUsageTile");
const reportsScreen = sectionBetween("function renderRelatorios()", "function getCaixaFiltroAtivo()");

assert.ok(dashboardSimplifica.includes("<h1>Olá, ${escaparHtml(nome)}!</h1>"), "Home deve manter título direto");
assert.ok(dashboardSimplifica.includes("Bem-vindo. Aqui está o resumo do seu negócio hoje."), "Home deve manter subtítulo operacional");
assert.doesNotMatch(dashboardSimplifica, /simple-mode-notice/, "Home não deve renderizar card de modo");
assert.doesNotMatch(dashboardSimplifica, /Ativar modo avançado/, "Home não deve renderizar botão de modo avançado");
assert.doesNotMatch(dashboardSimplifica, /Você está usando o Modo Simples/, "Home não deve explicar modo de uso");
assert.doesNotMatch(dashboardSimplifica, /trocarTela\('config'\)/, "Home não deve ter botão grande de Configurações no topo");
assert.doesNotMatch(dashboardSimplifica, /Modo Simplifica/, "Home não deve exibir banner/cabeçalho de modo");

assert.match(profileMenu, /abrirSeletorModoInterface/, "Menu do perfil deve permitir trocar o modo de uso");
assert.match(profileMenu, /abrirSeletorTemaRapido/, "Menu do perfil deve permitir trocar o tema");
assert.match(profileMenu, /Modo de uso/, "Menu do perfil deve exibir a preferência de modo");
assert.ok(profileMenu.includes("Meu perfil"), "Avatar deve manter Meu perfil");
assert.ok(profileMenu.includes("Segurança da conta"), "Avatar deve manter Segurança da conta");
assert.ok(profileMenu.includes("Notificações"), "Avatar deve manter Notificações");

assert.ok(profileScreen.includes("Preferências da interface"), "Perfil deve ter área de preferências da interface");
assert.ok(profileScreen.includes("<strong>Tema do ERP</strong>"), "Perfil deve exibir Tema do ERP discretamente");
assert.ok(profileScreen.includes("<strong>Modo de uso</strong>"), "Perfil deve exibir Modo de uso discretamente");
assert.ok(profileScreen.includes('class="ui3-section ui3-profile-section profile-interface-preferences"'), "Preferências devem usar linhas compactas");
assert.doesNotMatch(profileScreen, /Plano e assinatura|Funcionários|Mercado Pago|Webhooks|Superadmin/, "Perfil não deve misturar administração da empresa");

assert.match(reportsRenderer, /title="Abrir sugestões"/, "Sino dos relatórios deve abrir Sugestões");
assert.match(reportsRenderer, /onclick="trocarTela\('feedback'\)"/, "Sino deve navegar para a tela de Sugestões");
assert.doesNotMatch(reportsRenderer, /renderContextualAdvancedToggle\("relatorios"\)/, "Relatórios não deve repetir configuração avançada no cabeçalho");
assert.doesNotMatch(reportsRenderer, /reports-filter-button/, "Relatórios não deve repetir botão de filtros no cabeçalho");

assert.doesNotMatch(css, /\.simple-mode-notice/, "CSS não deve manter card de modo da Home");
assert.ok(css.includes("padding-bottom: calc(80px + env(safe-area-inset-bottom))"), "Mobile deve reservar espaço para bottom navigation");
assert.ok(settingsCss.includes(".ui3-profile-section .ui3-settings-row"), "Perfil deve ter acabamento compacto para preferências");
assert.ok(css.includes("body.mobile-mode .reports-kpi-slide .reports-kpi-card"), "Cards dos relatórios devem possuir contrato móvel compacto");
assert.ok(css.includes("body.mobile-mode .reports-summary-panel"), "Resumo dos relatórios deve possuir contrato móvel compacto");
assert.doesNotMatch(app, /Função Simplifica|Itens básicos|Coming soon|Lorem ipsum|Página exemplo|Módulo teste/, "Interface não deve expor textos de teste conhecidos");

assert.ok(doc.includes("Home compacta"), "documento deve registrar revisão da Home");
assert.ok(doc.includes("Preferências da interface"), "documento deve registrar preferência somente no Perfil");

console.log("visual_polish_stage_tests_ok");
