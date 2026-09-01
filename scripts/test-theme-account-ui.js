const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");
const lightTokens = fs.readFileSync(path.join(root, "themes", "light", "tokens.css"), "utf8");

assert.ok(app.includes("const PRINTER_FEATURE_ENABLED = true"), "impressoras devem permanecer habilitadas para o piloto controlado");
assert.ok(app.includes('if (tela === "impressoras" && !PRINTER_FEATURE_ENABLED) return false'), "acesso direto deve conservar a chave de rollback");
assert.ok(app.includes("function renderThemeModeButton"), "controle único de tema deve existir");
assert.ok(app.includes('data-theme-mode-toggle'), "controle de tema deve ter contrato estável");
assert.ok(app.includes('data-ui-token-set="${escaparAttr(relation.tokenSet)}"'), "controle de tema deve usar tokens do registro");
assert.ok(app.includes('const ordem = ["light", "dark", "system"]'), "tema deve alternar entre claro, escuro e automático");
assert.ok(app.includes('ERP_THEME_PREFERENCE_STORAGE_KEY = "simplifica3d:erp-theme-preference"'), "preferência de tema deve ter armazenamento próprio");
assert.ok(app.includes("localStorage.setItem(ERP_THEME_PREFERENCE_STORAGE_KEY, tema)"), "troca de tema deve persistir no aparelho");
assert.ok(app.includes('agendarSincronizacaoPersonalizacaoRapida("Tema")'), "troca rápida de tema deve sincronizar com a conta");
assert.ok(app.includes("async function salvarPreferenciasBasicasFree"), "preferências visuais do Free devem aguardar persistência remota");
assert.ok(app.includes('registrarFluxoSalvamento("Aparência", "Salvar preferências básicas", { remotoOk })'), "preferências do Free devem registrar o resultado remoto");
for (const campo of ["motion_level", "compact_mode", "show_brand_in_header", "interface_density", "screen_fit", "ui_scale", "desktop_card_min_width", "desktop_max_width"]) {
  assert.ok(app.includes(`${campo}:`), `${campo} deve fazer parte da personalização sincronizada`);
}
assert.ok(app.includes('registrarFluxoSalvamento("Aparência", "Remover logo do PDF", { remotoOk })'), "remoção de logo deve sincronizar com a conta");
assert.ok(app.includes('registrarFluxoSalvamento("Aparência", "Remover fundo do PDF", { remotoOk })'), "remoção de fundo deve sincronizar com a conta");
assert.ok(app.includes('registrarFluxoSalvamento("Aparência", "Restaurar personalização padrão", { remotoOk })'), "restauração padrão deve sincronizar com a conta");
assert.ok(app.includes("salvarDados();"), "troca de tema deve ser persistida");
assert.ok(style.includes(".theme-mode-disc"), "ícone circular de duas cores deve existir");
assert.ok(app.includes("function abrirSeletorTemaRapido"), "pressionar o tema deve abrir seletor direto");
const themeDialog = app.slice(app.indexOf("function abrirSeletorTemaRapido"), app.indexOf("function selecionarTemaRapido"));
assert.ok(themeDialog.includes("window.UiV3.Dialog") && !themeDialog.includes('getElementById("popup")'), "seletor de tema deve usar Portal V3");
assert.ok(app.includes("onpointerdown=\"iniciarPressTema(event)\""), "botão de tema deve reconhecer pressão longa");
assert.ok(app.includes('primary: "#72E6E8"'), "tema claro deve usar #72e6e8 como cor principal");
assert.ok(lightTokens.includes("--accent-primary:#72e6e8"), "tokens claros devem usar a nova cor principal");
assert.ok(style.includes("--s3d-button-secondary-bg"), "controle de tema deve consumir tokens de botão");
assert.ok(app.includes("Segurança, dados e exclusão da conta"), "perfil deve encaminhar para segurança e exclusão");
assert.ok(app.includes("async function salvarPerfilUsuarioRemoto"), "perfil deve possuir sincronizacao remota explicita");
assert.ok(app.includes("/rest/v1/profiles?user_id=eq."), "nome e telefone devem sincronizar com profiles");
assert.ok(app.includes("/rest/v1/erp_profiles?id=eq."), "nome e telefone devem sincronizar com erp_profiles");
assert.ok(app.includes("/rest/v1/user_profiles?on_conflict=user_id"), "identidade e foto devem sincronizar com user_profiles");
assert.ok(app.includes("async function salvarDadosPessoaisUsuario"), "salvamento de dados pessoais deve aguardar a sincronizacao");
assert.ok(app.includes("Escolher e salvar foto"), "acao de foto deve deixar claro que a imagem sera salva");
assert.ok(app.includes("select=display_name,profile_photo,updated_at"), "carregamento do perfil deve recuperar identidade e foto remotas");
assert.ok(app.includes("function getAtividadeUsuarioSuperadmin"), "lista de usuarios deve consolidar o ultimo acesso");
assert.ok(app.includes("Sem acesso registrado"), "usuario sem atividade deve ser identificado sem inventar acesso");
assert.ok(app.includes("const resumoEmpresa = clienteUsuario ? getResumoEmpresaSaas(clienteUsuario) : null"), "card de usuario deve usar o plano efetivo da empresa");
assert.ok(app.includes("normalizarEmail(cliente.email) === normalizarEmail(usuario.email)"), "card de usuario legado deve localizar a empresa pelo e-mail");
assert.ok(app.includes("depois volta ao Free"), "card de usuario deve informar o retorno ao Free");
assert.ok(app.includes("function agendarSincronizacaoSaasSuperadmin"), "Superadmin deve atualizar assinaturas ao abrir o painel");
assert.ok(app.includes("function abrirWidgetModuloSuperadmin"), "Widgets operacionais devem abrir suas telas de detalhe");
assert.ok(app.includes('label: "Bugs"') && app.includes('label: "Melhorias"') && app.includes('label: "Diagnósticos"') && app.includes('label: "Manutenção"'), "Mais deve priorizar os quatro widgets operacionais");
assert.ok(app.includes("sugestoes: renderSuperAdminFeedbackReports"), "Widget de melhorias deve abrir a tela correta");
assert.ok(!app.includes('class="superadmin-secondary-shortcuts"'), "Carrossel horizontal antigo do Superadmin deve ser removido");
assert.ok(app.includes("ajustarDiasUsuario('${escaparAttr(usuario.id)}', 7)") && app.includes("ajustarDiasUsuario('${escaparAttr(usuario.id)}', 15)") && app.includes("ajustarDiasUsuario('${escaparAttr(usuario.id)}', 30)"), "Menu do usuario deve reunir opcoes de 7, 15 e 30 dias");
assert.ok(app.includes("Abrir ajustes da conta"), "Menu do usuario deve abrir os ajustes completos da conta");
assert.ok(style.includes(".superadmin-module-widgets") && style.includes("grid-template-columns:repeat(2,minmax(0,1fr))"), "Widgets do Superadmin devem formar grade mobile sem trilho horizontal");
assert.match(app, /function abrirSegurancaPerfil\(\)\s*\{\s*trocarTela\("seguranca"\)/, "atalho do perfil deve abrir a tela dedicada de segurança");
assert.ok(app.includes('data-profile-action="security"'), "ação de segurança do perfil deve usar ligação declarativa");
for (const [start, end, label] of [
  ["function abrirPerfilPremiumPainel", "function abrirTrocaContaPerfil", "painel de perfil"],
  ["function abrirSeletorUsuariosPerfil", "function selecionarUsuarioPerfil", "troca de usuário"],
  ["function abrirDadosPessoaisUsuario", "function salvarDadosPessoaisUsuario", "dados pessoais"],
  ["function abrirFotoPerfilUsuario", "async function salvarFotoPerfilUsuario", "foto do perfil"]
]) {
  const flow = app.slice(app.indexOf(start), app.indexOf(end));
  assert.ok(flow.includes("promoverPopupParaDialogUiV3"), `${label} deve ser promovido ao Portal V3`);
}
assert.ok(app.includes("function configurarAcoesPerfil"), "ações do perfil devem ser vinculadas após cada renderização");
assert.match(app, /<section class="[^"]*security-account-online-section[^"]*">/, "tela dedicada deve exibir segurança online");
assert.ok(app.includes('data-ui3-screen="seguranca"'), "segurança deve consumir a raiz UI V3");
assert.ok(app.includes('data-ui3-screen="conta"'), "conta deve consumir a raiz UI V3");
assert.ok(app.includes("window.UiV3.Dialog"), "modo de uso deve abrir no Dialog oficial");
assert.ok(app.includes('data-ui3-screen="config"'), "configurações deve consumir a raiz UI V3");
assert.ok(app.includes('data-ui3-screen="empresa"'), "empresa deve consumir a raiz UI V3");
assert.ok(app.includes('data-ui3-screen="aparencia"'), "aparência deve consumir a raiz UI V3");
assert.ok(app.includes("function renderTelaComUiV3"), "rotas secundárias de configurações devem consumir PageContainer V3");
for (const route of ["mais", "administracao", "backup", "preferencias", "personalizacao", "pdf", "usuarios", "ajuda", "sobre"]) {
  assert.ok(app.includes(`"${route}"`), `${route} deve estar no limite migrado V3`);
}
assert.match(app, /function abrirNotificacoesOperacionais[\s\S]*?window\.UiV3\?\.Dialog/, "notificações deve usar Dialog oficial");
assert.ok(app.includes("Solicitar exclusão da conta"), "exclusão de conta deve permanecer disponível na segurança");
assert.ok(app.includes("Ativar 2FA por e-mail"), "2FA por e-mail deve permanecer disponível");
assert.doesNotMatch(app, /renderProfileMenuRow\("personalizacao",\s*"Aparência do app"/, "perfil não deve duplicar o seletor de tema");

console.log("theme_account_ui_tests_ok");
