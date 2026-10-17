const assert = require("assert");
const fs = require("fs");
const path = require("path");

// Static source contracts only. Real computed sizes, overflow, theme contrast
// and operational behavior still require browser/device verification.
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const css = read("styles/ui-v3/screens/superadmin.css");
const index = read("styles/ui-v3/index.css");
const html = read("index.html");
const app = read("app.js");
const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selector: match[1].trim(),
  declarations: match[2]
}));
const scopedRoot = 'body.app-shell-ready [data-ui-version="v3"].ui3-superadmin';

function ruleContaining(selectorPart, declaration) {
  const found = rules.find((rule) => rule.selector.includes(selectorPart)
    && declaration.test(rule.declarations));
  assert.ok(found, `Contrato CSS ausente: ${selectorPart} / ${declaration}`);
  assert.ok(found.selector.includes(scopedRoot),
    `Ajuste de controles deve ficar isolado no Superadmin V3: ${found.selector}`);
  return found;
}

assert.ok(index.includes('./screens/superadmin.css'), "Módulo canônico do Superadmin deve continuar importado");
assert.ok(html.includes('/styles/ui-v3/index.css'), "Aplicação deve continuar carregando o índice V3");
assert.match(app, /class="[^"]*ui3-superadmin[^"]*" data-ui-version="v3" data-ui3-screen="superadmin"/,
  "Renderer real deve manter a raiz isolada do Superadmin V3");

ruleContaining(scopedRoot, /--sa-control-height\s*:\s*40px\s*;/);
assert.match(source, /@media\s*\(max-width\s*:\s*767px\)\s*\{\s*body\.app-shell-ready\s+\[data-ui-version="v3"\]\.ui3-superadmin\s*\{\s*--sa-control-height\s*:\s*44px\s*[;}]/,
  "Escala mobile deve preservar alvos de toque de 44 px sem alterar a escala desktop");
const controls = ruleContaining('.superadmin-platform-content :is(.btn,',
  /min-height\s*:\s*var\(--sa-control-height\)\s*!important/);
assert.match(controls.declarations, /height\s*:\s*auto\s*!important/,
  "Altura dos controles deve crescer quando o texto precisar quebrar");
assert.match(controls.declarations, /white-space\s*:\s*normal\s*!important/,
  "Rótulos de ações não devem ser forçados a uma linha");

// Protect the source-level correction for two conflicts observed in-browser:
// inherited ERP grid placement, and legacy tiny buttons in company rows.
const topbar = ruleContaining('.superadmin-platform-topbar',
  /grid-template-areas\s*:\s*"title actions"\s*"search search"\s*"erp erp"/);
assert.match(topbar.declarations, /grid-template-columns\s*:\s*minmax\(0,\s*1fr\)\s+auto\s*!important/,
  "Cabeçalho mobile deve separar título, ações, busca e sistema interno em áreas próprias");
const erpButton = ruleContaining('.superadmin-platform-erp', /grid-area\s*:\s*erp(?:\s*;|\s*$)/);
assert.match(erpButton.declarations, /grid-column\s*:\s*1\s*\/\s*-1/,
  "Acesso ao sistema interno deve ocupar sua própria linha, não a linha do título");
const companyRowControls = ruleContaining('.client-admin-row :is(.row-actions .btn,.superadmin-action-menu-trigger)',
  /min-height\s*:\s*var\(--sa-control-height\)\s*!important/);
assert.match(companyRowControls.declarations, /height\s*:\s*auto\s*!important/,
  "Ações de empresa devem permitir crescimento do conteúdo sem voltar à altura legada");
assert.match(companyRowControls.declarations, /font-size\s*:\s*13px\s*!important/,
  "Ações de empresa não devem herdar a fonte minúscula do legado");
ruleContaining('.client-admin-row .row-actions',
  /grid-template-columns\s*:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s+44px/);
ruleContaining('.client-admin-row .superadmin-action-menu-trigger', /min-width\s*:\s*44px\s*!important/);
ruleContaining(':is(.superadmin-action-menu.is-compact,.superadmin-user-actions)',
  /width\s*:\s*var\(--sa-control-height\)\s*!important/);
ruleContaining('.superadmin-user-card',
  /grid-template-columns\s*:\s*minmax\(0,\s*1fr\)\s+auto\s+var\(--sa-control-height\)\s*!important/);

const actionGroups = rules.filter((rule) => rule.selector.includes(scopedRoot)
  && rule.selector.includes('.superadmin-company-actions,.superadmin-profile-hero-actions,.superadmin-plan-actions'));
const group = actionGroups.find((rule) => /display\s*:\s*flex\s*!important/.test(rule.declarations));
assert.ok(group, "Grupos de ação devem substituir a grade genérica de quatro colunas somente no Superadmin");
assert.match(group.declarations, /flex-wrap\s*:\s*wrap/,
  "Ações devem reorganizar-se sem esconder comandos");
const action = actionGroups.find((rule) => />\s*:is\(button,\.btn\)/.test(rule.selector));
assert.ok(action, "Controles dos grupos de ação devem possuir contrato próprio");
for (const [declaration, label] of [
  [/width\s*:\s*auto\s*!important/, "largura proporcional ao conteúdo"],
  [/grid-column\s*:\s*auto\s*!important/, "nenhuma ação presa à quarta coluna"],
  [/overflow\s*:\s*visible\s*!important/, "rótulos sem corte"],
  [/min-height\s*:\s*var\(--sa-control-height\)\s*!important/, "mesma escala dos controles"]
]) assert.match(action.declarations, declaration, `Ações devem manter ${label}`);

ruleContaining('.superadmin-module-widget', /min-height\s*:\s*80px/);
assert.match(source, /@media\s*\(max-width\s*:\s*767px\)[\s\S]*?\.superadmin-module-widget\s*\{\s*min-height\s*:\s*76px/,
  "Widgets devem possuir escala mobile compacta sem remoção de conteúdo");
ruleContaining('.superadmin-plan-remote-price', /display\s*:\s*grid/);
ruleContaining(':is(.superadmin-plan-price,.superadmin-plan-remote-price)', /overflow-wrap\s*:\s*anywhere/);
ruleContaining('.superadmin-action-menu-panel .btn', /width\s*:\s*100%/);
for (const menuRule of rules.filter((rule) => /\.superadmin-action-menu(?:-panel|-trigger)?(?:[\s.:[>]|$)/.test(rule.selector))) {
  assert.doesNotMatch(menuRule.declarations, /(?:display\s*:\s*none|visibility\s*:\s*hidden|max-height\s*:\s*0(?:px)?(?:\s|;|$))/,
    "A simplificação visual não pode ocultar menus administrativos");
}

assert.match(app, /<details class="ui-context-menu superadmin-action-menu/,
  "Menu administrativo deve manter o mecanismo expansível existente");
assert.match(app, /<summary[^\n]*superadmin-action-menu-trigger[^\n]*aria-label=/,
  "Menu de ações deve preservar o acionador identificado");
assert.match(app, /<div class="ui-context-menu-panel superadmin-action-menu-panel">\$\{conteudo\}<\/div>/,
  "Conteúdo completo do menu deve continuar disponível");
for (const handler of [
  'atualizarClientesSaasRemoto()', 'marcarClientesInativosAcao()', 'exportarClientesSaas()',
  'editarPlanoApresentacaoSuperadmin(', 'editarPrecoExibidoPlanoSuperadmin(',
  'entrarManutencaoClienteSaas(', 'editarClienteSaas(', 'exportarClienteSaas(',
  'ajustarDiasUsuario(', 'alternarBloqueioUsuario(', 'excluirUsuarioSuperAdmin('
]) assert.ok(app.includes(`onclick="${handler}`), `Ação administrativa deve permanecer no markup: ${handler}`);

console.log("PASS Superadmin: contratos estáticos de escopo V3, escala, ações proporcionais e presença dos menus. Não mede DOM nem certifica funcionamento visual.");
