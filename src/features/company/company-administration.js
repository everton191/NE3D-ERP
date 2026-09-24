(function attachCompanyAdministration(global) {
  "use strict";

  function getAdministrationSection(context = {}) {
    const { window } = context;
    const section = String(window.__adminCompanySection || "home");
    return ["home", "funcionarios", "permissoes", "caixa", "estoque", "loja", "backup", "logs"].includes(section) ? section : "home";
  }

  function openAdministrationSection(section = "home", context = {}) {
    const { trocarTela, window } = context;
    window.__adminCompanySection = section;
    trocarTela("administracao");
  }

  function backAdministration(context = {}) {
    const { renderAppComTransicaoNavegacao, resetarScrollTelaAtiva, voltarTela, window } = context;
    if (getAdministrationSection(context) !== "home") {
      window.__adminCompanySection = "home";
      renderAppComTransicaoNavegacao("back");
      resetarScrollTelaAtiva();
      return;
    }
    voltarTela();
  }

  function renderPermissionsMvp(context = {}) {
    const { escaparHtml, renderAppButton, renderUiIcon } = context;
    const roles = [
      { id: "owner", label: "Dono", permissions: ["Tudo da empresa", "Plano e cobrança", "Funcionários", "Permissões críticas"] },
      { id: "admin", label: "Administrador", permissions: ["Configurações da empresa", "Funcionários", "Pedidos", "Caixa", "Estoque"] },
      { id: "manager", label: "Gerência", permissions: ["Pedidos", "Clientes", "Relatórios", "Estoque", "Caixa"] },
      { id: "sales", label: "Atendimento", permissions: ["Pedidos", "Clientes", "Loja", "Consulta de estoque"] },
      { id: "production", label: "Produção", permissions: ["Pedidos", "Produção", "Estoque"] },
      { id: "cashier", label: "Caixa", permissions: ["Caixa", "Recebimentos", "Movimentações"] },
      { id: "viewer", label: "Visualização", permissions: ["Consulta de pedidos", "Consulta de relatórios permitidos"] }
    ];
    return `
      <div class="administration-subpage">
        <div class="card-header">
          <div><h3>Permissões por cargo</h3><p class="muted">MVP de consulta. Edição granular fica registrada como próxima etapa segura.</p></div>
          ${renderAppButton({ label: "Funcionários", variant: "secondary", action: "abrirSecaoAdministracaoEmpresa('funcionarios')" })}
        </div>
        <div class="administration-module-list">
          ${roles.map((role) => `
            <div class="administration-module-row static">
              <span class="administration-module-icon">${renderUiIcon(role.id === "owner" || role.id === "admin" ? "seguranca" : "usuarios")}</span>
              <span><strong>${escaparHtml(role.label)}</strong><small>${role.permissions.map((permission) => escaparHtml(permission)).join(" • ")}</small></span>
              <span class="status-badge">${escaparHtml(role.id)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderAdministrationSubsection(section, user, context = {}) {
    const { renderAppButton, renderCashSettings, renderInventorySettings, renderStaffAdministration } = context;
    if (section === "funcionarios") return `<div class="administration-subpage">${renderStaffAdministration(user)}</div>`;
    if (section === "permissoes") return renderPermissionsMvp(context);
    if (section === "estoque") return renderInventorySettings();
    if (section === "caixa") return renderCashSettings();
    if (section === "loja") return `<div class="administration-subpage"><div class="card-header"><div><h3>Loja online</h3><p class="muted">Editor e publicação da loja já existem no módulo Loja Online.</p></div>${renderAppButton({ label: "Abrir loja", variant: "primary", action: "trocarTela('lojaOnline')" })}</div></div>`;
    if (section === "backup") return `<div class="administration-subpage"><div class="card-header"><div><h3>Backup da empresa</h3><p class="muted">Sincronização, exportação e restauração ficam no Sistema.</p></div>${renderAppButton({ label: "Abrir backup", variant: "primary", action: "trocarTela('config')" })}</div></div>`;
    if (section === "logs") return `<div class="administration-subpage"><div class="card-header"><div><h3>Logs e relatórios</h3><p class="muted">Indicadores permitidos continuam no módulo Relatórios.</p></div>${renderAppButton({ label: "Abrir relatórios", variant: "primary", action: "trocarTela('relatorios')" })}</div></div>`;
    return "";
  }

  function renderAdministration(context = {}) {
    const { appConfig, canAccessScreen, escaparAttr, escaparHtml, getUserAccessRole, getUsuarioAtual, isMobile, podeAcessarAdministracaoEmpresa, renderAppButton, renderAppHeader, renderUiIcon } = context;
    const user = getUsuarioAtual();
    if (!podeAcessarAdministracaoEmpresa(user)) {
      return `
        <section class="card access-denied">
          <h2>Administração restrita</h2>
          <p>Somente o dono, um administrador ou alguém com permissão específica pode administrar a empresa.</p>
          ${renderAppButton({ label: "Voltar ao início", variant: "secondary", action: "trocarTela('dashboard')" })}
        </section>
      `;
    }
    const section = getAdministrationSection(context);
    const modules = [
      { action: "trocarTela('empresa')", icon: "empresa", title: "Dados da empresa", description: "Nome, documento, logo, endereço e contatos.", visible: canAccessScreen("empresa", user) },
      { action: "trocarTela('assinatura')", icon: "assinatura", title: "Plano e assinatura", description: "Plano atual, cobrança e formas de pagamento.", visible: canAccessScreen("assinatura", user) },
      { action: "abrirSecaoAdministracaoEmpresa('funcionarios')", icon: "usuarios", title: "Funcionários", description: "Equipe, cargos, acessos e limites do plano.", visible: canAccessScreen("usuarios", user) },
      { action: "abrirSecaoAdministracaoEmpresa('permissoes')", icon: "seguranca", title: "Permissões", description: "Consulta de permissões por cargo.", visible: canAccessScreen("usuarios", user) },
      { action: "trocarTela('lojaOnline')", icon: "lojaOnline", title: "Loja online", description: "Catálogo, publicação e canais de atendimento.", visible: canAccessScreen("lojaOnline", user) },
      { action: "abrirSecaoAdministracaoEmpresa('caixa')", icon: "caixa", title: "Configurações do caixa", description: "Formas de pagamento e operação financeira.", visible: canAccessScreen("caixa", user) },
      { action: "abrirSecaoAdministracaoEmpresa('estoque')", icon: "estoque", title: "Configurações de estoque", description: "Alertas, mínimos e regras seguras.", visible: canAccessScreen("estoque", user) },
      { action: "trocarTela('config')", icon: "backup", title: "Backup da empresa", description: "Cópias, sincronização e continuidade dos dados.", visible: canAccessScreen("config", user) },
      { action: "trocarTela('relatorios')", icon: "relatorios", title: "Logs e relatórios", description: "Atividade da empresa e indicadores permitidos.", visible: canAccessScreen("relatorios", user) }
    ].filter((item) => item.visible);
    return `
      <section class="ui3-real-screen ui3-page ui3-stack ui3-gap-4 ui3-administration administration-page" data-ui-version="v3" data-ui3-screen="administracao">
        ${renderAppHeader({ title: "Administração da empresa", subtitle: "Configurações da empresa separadas do seu perfil pessoal." })}
        <div class="administration-summary">
          <span>${renderUiIcon("empresa")}</span>
          <div><strong>${escaparHtml(appConfig.businessName || "Minha empresa")}</strong><small>${escaparHtml(getUserAccessRole(user))}</small></div>
          ${section !== "home" && !isMobile() ? renderAppButton({ label: "Voltar", variant: "secondary", action: "voltarAdministracaoEmpresa()" }) : ""}
        </div>
        ${section !== "home" ? renderAdministrationSubsection(section, user, context) : `<div class="administration-module-list">
          ${modules.map((item) => `
            <button class="administration-module-row" type="button" onclick="${escaparAttr(item.action)}">
              <span class="administration-module-icon">${renderUiIcon(item.icon)}</span>
              <span><strong>${escaparHtml(item.title)}</strong><small>${escaparHtml(item.description)}</small></span>
              <b aria-hidden="true">›</b>
            </button>
          `).join("")}
        </div>`}
      </section>
    `;
  }

  const api = Object.freeze({ getAdministrationSection, openAdministrationSection, backAdministration, renderPermissionsMvp, renderAdministrationSubsection, renderAdministration });
  global.SimplificaCompanyAdministration = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
