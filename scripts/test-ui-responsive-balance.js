const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const motion = fs.readFileSync(path.join(root, "src/styles/google-expressive-motion.css"), "utf8");

const required = [
  "@media (max-width: 820px)",
  "@media (min-width: 1280px)",
  "overflow-x:hidden",
  "overflow-x:clip",
  "grid-template-columns:repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  ".store-context-access-actions{\n    display:grid;\n    grid-template-columns:1fr;"
];

const missing = required.filter((snippet) => !css.includes(snippet));
if (missing.length) {
  console.error("UI responsive balance incompleto:", missing);
  process.exit(1);
}

const requiredSuperadmin = [
  "function renderMenuAcoesSuperadmin",
  "Adicionar dias ao acesso",
  "Anonimizar dados pessoais",
  "aria-label=\"Abrir menu principal\"",
  "role=\"tablist\" aria-label=\"Áreas do Superadmin\""
];
const missingSuperadmin = requiredSuperadmin.filter((snippet) => !app.includes(snippet));
if (missingSuperadmin.length) {
  console.error("Superadmin responsivo incompleto:", missingSuperadmin);
  process.exit(1);
}

const requiredNotifications = [
  "<h2>Notificações</h2>",
  "pedido${leadsLoja.length === 1 ? \"\" : \"s\"} da loja aguardando",
  "trocarTela('lojaAdmin')"
];
const forbiddenNotificationContext = [
  "dashboard-message-button",
  "Origens e celular conectado",
  "Configurar celular",
  "<h2>Mensagens</h2>",
  "Somente origem, nome disponível e horário",
  "Alertas que precisam da sua atenção",
  "Os avisos desaparecem quando a notificação é lida",
  "Não há pedidos atrasados, estoque baixo ou sincronizações pendentes"
];
if (requiredNotifications.some((snippet) => !app.includes(snippet)) || forbiddenNotificationContext.some((snippet) => app.includes(snippet))) {
  console.error("Mensagens e notificações ainda possuem contexto redundante.");
  process.exit(1);
}

if (!motion.includes("gxm-screen-in-mobile") || !motion.includes("--gxm-slow:300ms")) {
  console.error("Motion mobile ainda usa transições pesadas.");
  process.exit(1);
}

const requiredMobileOrganization = [
  "Organização mobile: somente submenus de ajustes usam listas compactas",
  "function garantirSubmenusMobileComoTelas",
  "function isPwaSettingsSplitPane",
  "body[data-ui-profile=\"web_pwa\"]:not(.mobile-mode) .settings-accordion-list > .ui-section[open] > .ui-section-body",
  ".settings-page .settings-accordion-list > .ui-section:not(.ui-subscreen-active) > .ui-section-body",
  ".intro-skip{\n  inset-inline:auto;\n  left:50vw;",
  "function abrirSubmenuConfiguracao",
  "function fecharSubmenuConfiguracaoAtivo",
  "function renderAppComTransicaoNavegacao",
  ".settings-accordion-list > .ui-section > summary .ui-section-chevron{\n    display:none;",
  "body.mobile-mode .expand-toggle-indicator{\n    display:none;",
  ".ui-section.ui-subscreen-active > .ui-section-body :where(\n    .settings-group,",
  "body[data-ui-profile=\"android_apk\"].mobile-mode .ui-section.ui-subscreen-active > .ui-section-body",
  "body[data-ui-profile=\"android_apk\"].mobile-mode .profile-usage-grid",
  "security-password-card security-mobile-card\" name=\"account-security\"",
  "body.mobile-mode .security-page .security-settings-card{\n    border:0;",
  "systemViewOverFade"
];
if (requiredMobileOrganization.some((snippet) => !(app + css).includes(snippet))) {
  console.error("Organização dos menus mobile incompleta.");
  process.exit(1);
}

console.log("UI responsive balance: mobile, desktop, Superadmin e motion validados.");
