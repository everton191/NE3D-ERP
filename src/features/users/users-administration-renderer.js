(function attachUsersAdministrationRenderer(global) {
  "use strict";

  function planAllowsEmployees(user, context = {}) {
    const { getCurrentPlanSlug, getPlanEntitlements, getUsuarioAtual, isSuperAdmin } = context;
    const currentUser = user || getUsuarioAtual();
    if (isSuperAdmin(currentUser)) return true;
    return getPlanEntitlements(getCurrentPlanSlug(currentUser)).employees === true;
  }

  function renderEmployeeAdministration(currentUser, context = {}) {
    const { escaparHtml, getPlanoAtual, getUiLayoutRelation, renderAppButton, renderUiIcon, renderUiLayoutAttributes } = context;
    if (!planAllowsEmployees(currentUser, context)) {
      const plan = getPlanoAtual(currentUser);
      return `
        <div class="admin-plan-lock">
          <span class="status-badge badge-warning">${escaparHtml(plan.nome || "Plano atual")}</span>
          <strong>Funcionários disponíveis no plano Pro</strong>
          <p class="muted">A conta principal continua ativa. O plano Pro libera a criação e a gestão dos funcionários do ERP.</p>
          <button class="btn secondary" type="button" data-action="open-payment" data-slug="pro">Ver plano Pro</button>
        </div>
      `;
    }
    return `
      <div class="admin-employee-form">
        <h3>Adicionar funcionário</h3>
        <div class="sync-grid ${getUiLayoutRelation("formSingleColumn").className}" ${renderUiLayoutAttributes("formSingleColumn")}>
          <label class="field"><span>Nome</span><input id="novoUsuarioNome" placeholder="Nome do funcionário"></label>
          <label class="field"><span>E-mail</span><input id="novoUsuarioEmail" type="email" placeholder="funcionario@email.com"></label>
          <label class="field"><span>Telefone opcional</span><input id="novoUsuarioTelefone" inputmode="tel" placeholder="5585999999999"></label>
          <label class="field"><span>Senha inicial</span><div class="password-row"><input id="novoUsuarioSenha" type="password" placeholder="Senha temporária" oninput="renderIndicadorForcaSenha('novoUsuarioSenha')"><button class="icon-button password-visibility-button" type="button" onclick="alternarSenhaVisivel('novoUsuarioSenha')" title="Mostrar/ocultar senha">👁</button></div><small class="password-strength" data-strength-for="novoUsuarioSenha">Digite uma senha forte</small></label>
          <label class="field"><span>Função</span><select id="novoUsuarioPapel"><option value="sales" selected>Atendimento e vendas</option><option value="production">Produção</option><option value="cashier">Caixa</option><option value="manager">Gerência</option><option value="admin">Administrador</option><option value="viewer">Somente visualização</option></select></label>
          <label class="field"><span>Status</span><select id="novoUsuarioStatus"><option value="ativo" selected>Ativo</option><option value="inativo">Inativo</option></select></label>
        </div>
        <div class="actions ui3-action-row" ${renderUiLayoutAttributes("actionRow")}>
          ${renderAppButton({ label: "Adicionar funcionário", icon: renderUiIcon("usuarios"), variant: "secondary", action: "adicionarUsuario()" })}
        </div>
      </div>
      ${renderAdminUsers(context)}
    `;
  }

  function renderAdminUsers(context = {}) {
    const { escaparAttr, escaparHtml, getClientUsers, getUsers, renderUiIcon, setUsers, userIsBlocked, normalizeUsers } = context;
    setUsers(normalizeUsers(getUsers()));
    const employeeRoles = new Set(["admin", "manager", "cashier", "production", "sales", "viewer"]);
    const roleLabels = { admin: "Administrador", manager: "Gerência", cashier: "Caixa", production: "Produção", sales: "Atendimento", viewer: "Visualização" };
    const users = getClientUsers().filter((user) => employeeRoles.has(user.papel));
    if (!users.length) return `<p class="empty">Nenhum usuário cadastrado ainda.</p>`;
    return `
      <div class="history-list users-list">
        ${users.map((user) => `
          <div class="user-row admin-user-row">
            <div><strong>${escaparHtml(user.nome)}</strong><span class="muted">${escaparHtml(user.email)}${user.phone ? " • " + escaparHtml(user.phone) : ""}</span></div>
            <span class="status-badge ${userIsBlocked(user) ? "badge-danger" : "badge-ativo"}">${escaparHtml(roleLabels[user.papel] || user.papel)} • ${user.ativo === false ? "inativo" : "ativo"}</span>
            <div class="row-actions"><button class="btn ghost" onclick="redefinirSenhaUsuario('${escaparAttr(user.id)}')">${renderUiIcon("seguranca")} Senha</button><button class="btn warning" onclick="alternarStatusUsuario('${escaparAttr(user.id)}')">${user.ativo === false ? "Reativar" : "Desativar"}</button><button class="icon-action-button danger" onclick="removerUsuario('${escaparAttr(user.id)}')" title="Remover">${renderUiIcon("trash")}</button></div>
          </div>
        `).join("")}
      </div>
    `;
  }

  const api = Object.freeze({ planAllowsEmployees, renderEmployeeAdministration, renderAdminUsers });
  global.SimplificaUsersAdministrationRenderer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
