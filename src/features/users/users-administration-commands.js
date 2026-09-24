(function attachUsersAdministrationCommands(global) {
  "use strict";

  async function addUser(context = {}) {
    const { alert, billingConfig, criarIdUsuario, definirSenhaUsuario, document, emailValido, exigirAdminParaAcao, getClientIdAtual, getClientUsers, getUsuarioAtual, getUsers, isSuperAdmin, isSuperAdminPrincipal, limiteUsuariosAtingido, mensagemValidacaoSenha, mostrarModalLimitePlano, normalizarEmail, normalizarPapel, normalizarUsuario, normalizarUsuarios, normalizePhoneBR, planoPermiteRecurso, planAllowsEmployees, registrarAuditoria, registrarHistorico, registrarSeguranca, renderApp, salvarDados, setUsers } = context;
    if (!exigirAdminParaAcao()) return;
    if (!planAllowsEmployees()) return mostrarModalLimitePlano("A criação de funcionários está disponível no plano Pro.");
    const nome = (document.getElementById("novoUsuarioNome")?.value || "").trim();
    const email = normalizarEmail(document.getElementById("novoUsuarioEmail")?.value || "");
    const phone = normalizePhoneBR(document.getElementById("novoUsuarioTelefone")?.value || "");
    const senha = document.getElementById("novoUsuarioSenha")?.value || "";
    const papel = normalizarPapel(document.getElementById("novoUsuarioPapel")?.value || "sales");
    const ativo = (document.getElementById("novoUsuarioStatus")?.value || "ativo") === "ativo";
    if (!nome || !email || !senha) return alert("Campo obrigatório");
    if (!emailValido(email)) return alert("Informe um e-mail válido.");
    let users = normalizarUsuarios(getUsers());
    setUsers(users);
    const usuarioGlobal = users.find((user) => user.email === email);
    const usuarioExistente = getClientUsers().find((user) => user.email === email);
    if (usuarioGlobal && !usuarioExistente) return alert("Este e-mail já pertence a outra conta.");
    if (!usuarioExistente && limiteUsuariosAtingido()) return mostrarModalLimitePlano("Você atingiu o limite de usuários do seu plano. Faça upgrade para continuar.");
    const erroSenha = mensagemValidacaoSenha(senha);
    if (erroSenha) return alert(erroSenha);
    if (["superadmin", "owner"].includes(papel)) return alert("Use uma função de funcionário para este acesso.");
    if (!planoPermiteRecurso("permissions") && !["operador", "visualizador"].includes(papel) && !isSuperAdmin()) return mostrarModalLimitePlano("Permissões avançadas fazem parte do plano Pro.");
    users = normalizarUsuarios(getUsers());
    const existente = usuarioExistente;
    if (existente) {
      if (existente.papel === "superadmin" && (!isSuperAdmin() || isSuperAdminPrincipal(existente))) return alert("O superadmin principal não pode ser rebaixado ou alterado por este painel.");
      existente.nome = nome || existente.nome;
      existente.phone = phone;
      await definirSenhaUsuario(existente, senha, true);
      existente.papel = papel;
      existente.ativo = ativo;
      existente.bloqueado = !ativo;
      existente.clientId = existente.clientId || getClientIdAtual();
      existente.companyId = existente.companyId || getUsuarioAtual()?.companyId || billingConfig.companyId || "";
    } else {
      const novo = normalizarUsuario({ id: criarIdUsuario(), clientId: getClientIdAtual(), companyId: getUsuarioAtual()?.companyId || billingConfig.companyId || "", nome: nome || email.split("@")[0], email, phone, papel, ativo, bloqueado: !ativo, criadoEm: new Date().toISOString() });
      await definirSenhaUsuario(novo, senha, true);
      users.push(novo);
    }
    setUsers(users);
    salvarDados();
    registrarHistorico("Usuários", `Usuário ${email} salvo como ${papel}`);
    registrarSeguranca("Usuário salvo", "sucesso", `${email} como ${papel}`);
    registrarAuditoria("criação usuário", { email, papel });
    renderApp();
  }

  function removeUser(id, context = {}) {
    const { alert, confirm, getClientUsers, getCurrentUserEmail, getUsers, isSuperAdmin, isSuperAdminPrincipal, normalizarEmail, normalizarUsuarios, podeGerenciarUsuarios, registrarHistorico, registrarSeguranca, renderApp, salvarDados, setCurrentUserEmail, setUsers, sessionStorage } = context;
    if (!podeGerenciarUsuarios()) return alert("Entre como admin para remover usuários.");
    let users = normalizarUsuarios(getUsers()); setUsers(users);
    const usuario = getClientUsers().find((item) => String(item.id) === String(id));
    if (!usuario) return alert("Usuário fora da empresa atual.");
    if (isSuperAdminPrincipal(usuario)) return alert("O superadmin principal não pode ser removido.");
    if (usuario.papel === "superadmin" && !isSuperAdmin()) return alert("Somente superadmin pode remover outro superadmin.");
    if (!confirm(`Remover o usuário ${usuario.email}?`)) return;
    users = users.filter((item) => String(item.id) !== String(id)); setUsers(users);
    if (normalizarEmail(getCurrentUserEmail()) === normalizarEmail(usuario.email)) { setCurrentUserEmail(""); sessionStorage.removeItem("usuarioAtualEmail"); }
    salvarDados(); registrarHistorico("Usuários", `Usuário removido: ${usuario.email}`); registrarSeguranca("Usuário removido", "sucesso", usuario.email); renderApp();
  }

  async function resetUserPassword(id, context = {}) {
    const { alert, definirSenhaUsuario, getClientUsers, getUsers, isSuperAdmin, isSuperAdminPrincipal, mensagemValidacaoSenha, normalizarUsuarios, podeGerenciarUsuarios, registrarHistorico, registrarSeguranca, renderApp, salvarDados, setUsers, solicitarEntradaTexto } = context;
    if (!podeGerenciarUsuarios()) return alert("Acesso negado");
    const users = normalizarUsuarios(getUsers()); setUsers(users);
    const usuario = getClientUsers().find((item) => String(item.id) === String(id));
    if (!usuario || isSuperAdminPrincipal(usuario) && !isSuperAdmin()) return alert("Acesso negado");
    const senha = await solicitarEntradaTexto({ titulo: "Nova senha temporária", mensagem: "Digite a nova senha temporária para " + usuario.email, tipo: "password", obrigatorio: true });
    if (senha === null) return;
    const erroSenha = mensagemValidacaoSenha(senha); if (erroSenha) return alert(erroSenha);
    await definirSenhaUsuario(usuario, senha, true); salvarDados(); registrarHistorico("Usuários", `Senha temporária redefinida: ${usuario.email}`); registrarSeguranca("Redefinição de senha", "sucesso", usuario.email); alert("Senha redefinida. O usuário deverá trocar no próximo acesso."); renderApp();
  }

  function toggleUserStatus(id, context = {}) {
    const { alert, getClientUsers, getUsers, isSuperAdminPrincipal, normalizarUsuarios, podeGerenciarUsuarios, registrarHistorico, registrarSeguranca, renderApp, salvarDados, setUsers } = context;
    if (!podeGerenciarUsuarios()) return alert("Acesso negado");
    const users = normalizarUsuarios(getUsers()); setUsers(users);
    const usuario = getClientUsers().find((item) => String(item.id) === String(id));
    if (!usuario || isSuperAdminPrincipal(usuario)) return alert("O superadmin principal não pode ser desativado.");
    usuario.ativo = usuario.ativo === false; usuario.bloqueado = !usuario.ativo; usuario.atualizadoEm = new Date().toISOString();
    salvarDados(); registrarHistorico("Usuários", `${usuario.ativo ? "Reativado" : "Desativado"}: ${usuario.email}`); registrarSeguranca(usuario.ativo ? "Usuário reativado" : "Usuário desativado", "sucesso", usuario.email); alert(usuario.ativo ? "Usuário reativado" : "Usuário desativado"); renderApp();
  }

  const api = Object.freeze({ addUser, removeUser, resetUserPassword, toggleUserStatus });
  global.SimplificaUsersAdministrationCommands = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
