(function attachAccountProfileModals(global) {
  "use strict";

  function abrirPerfilPremiumPainel(event, deps = {}) {
    event?.preventDefault?.();
    if (Date.now() - Number(deps.windowRef.__profileLongPressLock || 0) < 700) return;
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    const usuario = deps.getUsuarioAtual();
    const plano = deps.getPlanoAtual(usuario);
    const pro = deps.PlanService.getPolicy(usuario).isPro;
    const empresaLogo = deps.appConfig.companyLogoDataUrl || deps.appConfig.brandLogoDataUrl || "";
    popup.innerHTML = `
    <div class="modal-backdrop profile-panel-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <section class="modal-card profile-premium-panel modal-enter" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Perfil e conta</h2>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="profile-hero-card">
          <div class="profile-photo-large">
            ${deps.renderUsuarioAvatar(usuario, "profile-photo-large-img")}
          </div>
          <div>
            <span class="eyebrow">${deps.escaparHtml(deps.appConfig.businessName || "Simplifica 3D")}</span>
            <h3>${deps.escaparHtml(usuario?.nome || usuario?.email || "Usuário")}</h3>
            <button class="profile-plan-inline ${deps.classeStatusPlano(plano.status)}" type="button" onclick="abrirTelaPlanosPerfil()">${deps.escaparHtml(plano.nome || "Free")}</button>
            <p>${deps.escaparHtml(plano.descricao || "Plano ativo")}</p>
          </div>
          ${empresaLogo ? `<img class="profile-company-large" src="${deps.escaparAttr(empresaLogo)}" alt="Logo da empresa">` : ""}
        </div>
        <div class="profile-info-grid">
          <div class="metric"><span>E-mail</span><strong>${deps.escaparHtml(usuario?.email || deps.syncConfig.supabaseEmail || "-")}</strong></div>
          <div class="metric"><span>Empresa</span><strong>${deps.escaparHtml(deps.appConfig.businessName || "-")}</strong></div>
          <div class="metric"><span>Usuários</span><strong>${deps.getUsuariosContaAtiva().length || 1}</strong></div>
          <div class="metric"><span>Status</span><strong>${deps.escaparHtml(plano.descricao || plano.nome || "Free")}</strong></div>
        </div>
        <div class="profile-customization-grid">
          <button class="profile-option" type="button" onclick="abrirPersonalizacaoDoPerfil('avatar')">
            <strong>Empresa</strong><span>Logo e dados comerciais</span>
          </button>
          <button class="profile-option ${pro ? "" : "locked"}" type="button" onclick="abrirPersonalizacaoDoPerfil('pdf')">
            <strong>PDF</strong><span>${pro ? "Tema, rodapé e assinatura" : "Disponível no PRO"}</span>
          </button>
          <button class="profile-option ${pro ? "" : "locked"}" type="button" onclick="abrirPersonalizacaoDoPerfil('login')">
            <strong>Login visual</strong><span>${pro ? "Fundo e mensagem" : "Disponível no PRO"}</span>
          </button>
        </div>
        <div class="actions">
          <button class="btn secondary" type="button" onclick="abrirTelaPlanosPerfil()">Ver planos</button>
        </div>
        <div class="profile-account-actions">
          <button class="btn ghost" type="button" onclick="abrirTrocaContaPerfil()">Trocar conta</button>
          <button class="btn warning" type="button" onclick="logoutUsuario()">Sair</button>
        </div>
      </section>
    </div>
  `;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Perfil e conta" });
  }

  function abrirSeletorUsuariosPerfil(perfis, deps = {}) {
    const lista = Array.isArray(perfis) ? perfis : deps.getUsuariosContaAtiva();
    if (!Array.isArray(lista) || lista.length <= 1) return;
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    const atual = deps.getUsuarioAtual();
    popup.innerHTML = `
    <div class="modal-backdrop profile-switch-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <section class="modal-card profile-switch-panel glass-pop" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Trocar usuário</h2>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="profile-carousel-3d">
          ${lista.map((usuario, index) => `
            <button class="profile-carousel-card ${usuario.email === atual?.email ? "active" : ""}" type="button" style="--i:${index - 1}" onclick="selecionarUsuarioPerfil('${deps.escaparAttr(usuario.id)}')">
              ${deps.renderUsuarioAvatar(usuario, "profile-carousel-avatar")}
              <strong>${deps.escaparHtml(usuario.nome || usuario.email)}</strong>
              <span>${deps.escaparHtml(usuario.papel || "user")}</span>
            </button>
          `).join("")}
        </div>
      </section>
    </div>
  `;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Trocar usuário" });
  }

  function abrirFotoPerfilUsuario(deps = {}) {
    const popup = deps.documentRef.getElementById("popup");
    const usuario = deps.getUsuarioAtual();
    if (!popup || !usuario) return;
    const temFoto = !!(deps.appConfig.profilePhotoDataUrl || usuario.avatarUrl || usuario.avatar_url);
    const classePlanoAvatar = deps.getAvatarPlanoClasseUsuario(usuario);
    popup.innerHTML = `
    <div class="modal-backdrop profile-photo-modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <section class="modal-card profile-photo-modal modal-enter" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Foto do perfil</h2>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="profile-photo-view">
          <span class="profile-photo-view-image ${deps.escaparAttr(classePlanoAvatar)}">${deps.renderFotoPerfilAtualUsuario()}</span>
          <strong>${deps.escaparHtml(usuario.nome || usuario.email || "Usuário")}</strong>
          <small>${deps.escaparHtml(usuario.email || deps.syncConfig.supabaseEmail || "")}</small>
        </div>
        <input id="profilePhotoUserFile" class="file-input" type="file" accept="image/*" onchange="salvarFotoPerfilUsuario(this)">
        <div class="actions">
          <button class="btn" type="button" onclick="document.getElementById('profilePhotoUserFile')?.click()">Escolher e salvar foto</button>
          ${temFoto ? `<button class="btn danger" type="button" onclick="removerFotoPerfilUsuario()">Remover</button>` : ""}
          <button class="btn ghost" type="button" onclick="fecharPopup()">Fechar</button>
        </div>
        <p class="muted">Ao escolher a imagem, ela é otimizada, salva e sincronizada automaticamente com este perfil.</p>
      </section>
    </div>
  `;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Foto do perfil" });
  }

  function abrirAlteracaoSenhaConta(deps = {}) {
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <section class="modal-card password-change-modal modal-enter" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div><h2>Alterar senha</h2><p class="muted">Preencha somente se realmente quiser trocar a senha atual.</p></div>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        ${deps.renderFormularioAlterarSenha(false, { mostrarCancelar: false })}
      </section>
    </div>
  `;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Alterar senha" });
  }

  function abrirModalRedefinicaoSenhaSupabase(deps = {}) {
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) {
      deps.mostrarToast("Abra o app novamente e entre com sua nova senha.", "info", 6000);
      return;
    }
    popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <form class="modal-card" id="supabaseRecoveryPasswordForm">
        <div class="modal-header">
          <h2>Redefinir senha</h2>
          <button class="icon-button" type="button" id="supabaseRecoveryClose" title="Fechar">×</button>
        </div>
        <p class="muted">Crie uma nova senha para sua conta do Simplifica 3D.</p>
        <label class="field">
          <span>Nova senha</span>
          <input id="supabaseRecoveryPassword" type="password" autocomplete="new-password" required>
        </label>
        <label class="field">
          <span>Confirmar senha</span>
          <input id="supabaseRecoveryPasswordConfirm" type="password" autocomplete="new-password" required>
        </label>
        <div class="actions">
          <button class="btn ghost" type="button" id="supabaseRecoveryCancel">Depois</button>
          <button class="btn" type="submit" id="supabaseRecoverySave">Salvar senha</button>
        </div>
      </form>
    </div>
  `;
    const host = deps.promoverPopupParaDialogUiV3(popup, { title: "Redefinir senha" });
    const form = deps.documentRef.getElementById("supabaseRecoveryPasswordForm");
    const senhaInput = deps.documentRef.getElementById("supabaseRecoveryPassword");
    const confirmarInput = deps.documentRef.getElementById("supabaseRecoveryPasswordConfirm");
    const botao = deps.documentRef.getElementById("supabaseRecoverySave");
    const cancelar = () => deps.fecharPopup();
    deps.documentRef.getElementById("supabaseRecoveryClose")?.addEventListener("click", cancelar, { once: true });
    deps.documentRef.getElementById("supabaseRecoveryCancel")?.addEventListener("click", cancelar, { once: true });
    host.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) cancelar();
    });
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const senha = senhaInput?.value || "";
      const confirmar = confirmarInput?.value || "";
      const erroSenha = deps.mensagemValidacaoSenha(senha);
      if (erroSenha) {
        deps.mostrarToast(erroSenha, "erro", 5000);
        return;
      }
      if (senha !== confirmar) {
        deps.mostrarToast("As senhas não conferem.", "erro", 4500);
        return;
      }
      if (botao) {
        botao.disabled = true;
        botao.textContent = "Salvando...";
      }
      try {
        await deps.atualizarSenhaSupabaseComSessao(senha);
        deps.fecharPopup();
        deps.mostrarToast("Senha atualizada com sucesso.", "sucesso", 5000);
      } catch (erro) {
        deps.ErrorService.capture(erro, { area: "Supabase", action: "Redefinir senha por link", silent: true });
        deps.mostrarToast("Não foi possível salvar a nova senha. Solicite um novo link.", "erro", 6500);
        if (botao) {
          botao.disabled = false;
          botao.textContent = "Salvar senha";
        }
      }
    });
    setTimeout(() => senhaInput?.focus(), 120);
  }

  function solicitarPlanoSuperadmin(planoAtual, deps = {}) {
    return new Promise((resolve) => {
      const popup = deps.documentRef.getElementById("popup");
      if (!popup) {
        resolve(null);
        return;
      }
      const planos = deps.garantirPlanosSaas().filter((plano) => ["free", "start", "pro"].includes(plano.slug));
      popup.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <form class="modal-card" id="adminPlanForm">
          <div class="modal-header">
            <h2>Alterar plano</h2>
            <button class="icon-button" type="button" id="adminPlanCancelTop" title="Fechar">✕</button>
          </div>
          <label class="field">
            <span>Plano</span>
            <select id="adminPlanSelect">
              ${planos.map((plano) => `<option value="${deps.escaparAttr(plano.slug)}" ${plano.slug === planoAtual ? "selected" : ""}>${deps.escaparHtml(plano.name)}</option>`).join("")}
            </select>
          </label>
          <div class="actions">
            <button class="btn ghost" type="button" id="adminPlanCancel">Cancelar</button>
            <button class="btn" type="submit">Continuar</button>
          </div>
        </form>
      </div>
    `;
      const select = deps.documentRef.getElementById("adminPlanSelect");
      const cancelar = () => {
        deps.fecharPopup();
        resolve(null);
      };
      deps.documentRef.getElementById("adminPlanForm")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const valor = select?.value || "";
        deps.fecharPopup();
        resolve(valor);
      }, { once: true });
      deps.documentRef.getElementById("adminPlanCancel")?.addEventListener("click", cancelar, { once: true });
      deps.documentRef.getElementById("adminPlanCancelTop")?.addEventListener("click", cancelar, { once: true });
      popup.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
        if (event.target === event.currentTarget) cancelar();
      });
      setTimeout(() => select?.focus(), 50);
    });
  }

  const api = Object.freeze({
    abrirPerfilPremiumPainel,
    abrirSeletorUsuariosPerfil,
    abrirFotoPerfilUsuario,
    abrirAlteracaoSenhaConta,
    abrirModalRedefinicaoSenhaSupabase,
    solicitarPlanoSuperadmin
  });
  global.SimplificaAccountProfileModals = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
