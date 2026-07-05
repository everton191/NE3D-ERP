const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "const INTERFACE_MODES = Object.freeze",
  "const INTERFACE_MODE_VALUES = Object.freeze",
  "const FEATURE_MATRIX = Object.freeze",
  "function getInterfaceMode()",
  "function setInterfaceMode(mode",
  "function isFeatureVisibleByMode",
  "function isFeatureLockedByPlan",
  "function isAdvancedFeatureVisible",
  "function shouldShowMenuItem",
  "interfaceMode: \"simplifica\""
].forEach((marker) => assert(app.includes(marker), `Base de modo ausente: ${marker}`));

[
  "dashboardBasic",
  "ordersBasic",
  "calculatorBasic",
  "productsAndStockBasic",
  "cashBasic",
  "storeSimple",
  "productionAdvanced",
  "reportsAdvanced",
  "usersAdvanced"
].forEach((featureKey) => assert(app.includes(featureKey), `Feature matrix incompleta: ${featureKey}`));

assert(app.includes("shouldShowMenuItem(item, modo) && canAccessScreen(item.tela)"), "Menu lateral deve filtrar por modo e permissao");
assert(app.includes("isSimplificaMode() ? itensSimplifica : itensProfissional"), "Bottom nav deve alternar por modo");
assert(app.includes('{ acao: "abrirMenuPopup()", iconKey: "plus", icone: "+", texto: "Mais" }'), "Bottom nav simples deve abrir o menu pelo botao Mais");
assert(!app.includes('{ tela: "lojaOnline", icone: "🛍️", texto: "Loja" }'), "Bottom nav simples nao deve fixar Loja");
assert(app.includes("function abrirSeletorModoInterface()"), "Perfil deve abrir seletor de modo");
assert(app.includes('function renderDashboardInterfaceModeButton() {\n  if (!isSimplificaMode()) return "";'), "Engrenagem rápida deve aparecer somente na Home simples");
assert(app.includes("selecionarModoInterface('simple')"), "Seletor deve expor Modo simples");
assert(app.includes("selecionarModoInterface('advanced')"), "Seletor deve expor Modo avancado");
assert(app.includes('profile-list-row compact" type="button" onclick="abrirSeletorModoInterface()"'), "Perfil deve usar botao discreto para o modo");
assert(app.includes("Preferências da interface"), "Perfil deve agrupar tema e modo em preferências da interface");
assert(!app.includes("settings-mode-trigger"), "Configuracoes nao devem duplicar o modo de uso");
assert(app.includes('const INTERFACE_MODE_STORAGE_KEY = "simplifica_interface_mode"'), "Modo deve usar a chave local solicitada");
assert(app.includes('const INTERFACE_MODE_UPDATED_AT_STORAGE_KEY = "simplifica_interface_mode_updated_at"'), "Modo deve registrar quando a preferencia local foi alterada");
assert(app.includes("if (localTime > remoteTime)"), "Preferencia remota antiga nao deve sobrescrever escolha local recente");
assert(app.includes("localStorage.setItem(INTERFACE_MODE_STORAGE_KEY, serializeInterfaceMode(appConfig.interfaceMode))"), "Restauracao/importacao deve persistir simple/advanced");
assert(app.includes("function sincronizarPreferenciaModoInterface()"), "Modo deve sincronizar com preferencia remota");
assert(app.includes('/rest/v1/user_preferences?on_conflict=user_id'), "Modo deve salvar em user_preferences");
assert(app.includes("function renderDashboardSimplifica"), "Modo Simplifica deve ter dashboard simples dedicado");
assert(app.includes("if (isSimplificaMode()) return renderDashboardSimplifica(payload);"), "Dashboard deve escolher a versao Simplifica");
assert(app.includes('if (!isContextAdvancedVisible("caixa")) return "movimentos";'), "Caixa simplificado deve evitar extrato avancado");
assert(app.includes('class="stock-item-menu"') && app.includes('data-action="stock-edit"'), "Acoes avancadas do estoque devem ficar no menu contextual de tres pontos");
assert(app.includes("function renderContextualAdvancedToggle"), "Telas principais devem permitir mostrar mais opcoes sem trocar o modo global");
assert(app.includes("function selecionarPresetMargemCalculadora"), "Calculadora deve ter presets de margem no front-end");
assert(app.includes("[30, 50, 100].map"), "Presets de margem 30/50/100 devem existir");
assert(app.includes("function renderEstoqueRolosPreview"), "Estoque deve ter previa visual de rolos");
assert(app.includes("<section class=\"security-account-online-section\">"), "Seguranca deve manter area online dedicada");
assert(app.includes("Ativar 2FA por e-mail"), "Seguranca deve manter 2FA por e-mail");
assert(app.includes("Solicitar exclusão da conta"), "Seguranca deve manter exclusao de conta");
assert(app.includes("document.body.dataset.interfaceMode = getInterfaceMode();"), "Body deve receber o modo atual para ajustes visuais");
assert(css.includes(".dashboard-simplifica"), "CSS do dashboard Simplifica deve existir");
assert(css.includes(".stock-roll-preview"), "CSS deve contemplar previa de rolos");
assert(css.includes(".account-security-roadmap"), "CSS deve contemplar seguranca futura");
assert(css.includes("body.theme-light :where(.calc-modern-screen,.calc-input-panel"), "Tema claro deve reforcar superficies solidas nos pontos desfocados");
assert(css.includes("backdrop-filter:none !important"), "Tema claro deve remover blur residual de componentes operacionais");
assert(css.includes(".interface-mode-modal"), "Seletor de modo deve ter modal proprio");
assert(css.includes("body.theme-light .interface-mode-option"), "Seletor de modo deve ter contraste no tema claro");
assert(!app.includes("Ativar modo avançado"), "Home nao deve exibir troca global de modo");
assert(!app.includes("Você está usando o Modo Simples"), "Home nao deve exibir aviso de modo simples");
assert(!css.includes(".simple-mode-notice"), "Home nao deve manter CSS de card de modo");

console.log("Interface modes: matriz, menus e configuracao validados.");
