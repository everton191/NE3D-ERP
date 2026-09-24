(function attachAuthCommands(global) {
  "use strict";

  let loginStage = "PRE_AUTH";
  function traceLogin(stage) {
    if (loginStage === stage) return;
    loginStage = stage;
    global.console?.info(`[AUTH_FLOW] ${stage}`);
  }
  function traceLoginFailure(error) {
    global.console?.error(`[AUTH_FLOW] FAILED_AFTER_${loginStage}`);
    const frames = String(error?.stack || "").match(/(?:app\.js|src\/[\w/.-]+\.js)(?:\?[^\s):]*)?:\d+:\d+/g) || [];
    for (const frame of frames.slice(0, 6)) global.console?.error(`[AUTH_FLOW] ${frame.replace(/\?[^:]*:/, ":")}`);
  }

  function iniciarVerificacao2FA(deps = {}) {

  if (!deps.whatsapp2FABackendDisponivel()) {
    deps.setTwoFactorPending(null);
    return false;
  }
  return false;

  }

  async function preparar2FAAposPrimeiroFator(usuario, deps = {}) {

  const state = await deps.carregarSegurancaConta(true);
  if (!state.settings?.two_factor_enabled || state.mfa_session_verified) return false;
  const challenge = await deps.accountSecurityRequest("request_2fa_login");
  deps.setTwoFactorPending({
    tipo: "usuario",
    purpose: "login",
    email: usuario?.email || deps.syncConfig.supabaseEmail || "",
    usuario,
    challengeId: challenge.id,
    expiraEm: Date.parse(challenge.expires_at)
  });
  deps.renderApp();
  return true;

  }

  async function confirmarCodigo2FA(deps = {}) {

  if (!deps.getTwoFactorPending()) {
    deps.alert("Nenhuma verificação pendente.");
    return;
  }

  if (Date.now() > deps.getTwoFactorPending().expiraEm) {
    deps.setTwoFactorPending(null);
    deps.alert("Código expirado. Tente entrar novamente.");
    deps.renderApp();
    return;
  }

  const codigo = (deps.document.getElementById("twoFactorCode")?.value || "").replace(/\D/g, "").slice(0, 6);
  if (codigo.length !== 6) return deps.mostrarToast("Digite os 6 dígitos do código.", "aviso");
  try {
    const pendente = deps.getTwoFactorPending();
    const data = await deps.accountSecurityRequest("verify_2fa", { challenge_id: pendente.challengeId, code: codigo });
    if (!salvarSessaoSupabase(data.session, pendente.email, deps)) throw new Error("INVALID_VERIFIED_SESSION");
    deps.setTwoFactorPending(null);
    deps.accountSecurityState.loaded = false;
    await concluirLoginUsuario(pendente.usuario, deps);
  } catch (erro) {
    deps.mostrarToast(deps.mensagemErroSegurancaConta(erro?.message), "erro", 5500);
  }

  }

  async function loginAdmin(deps = {}) {

  const senha = deps.document.getElementById("adminSenha")?.value || "";
  if (!deps.podeUsarAdminLocalManutencao()) {
    deps.alert("Acesso de manutenção local indisponível neste ambiente. Use e-mail e senha do usuário.");
    deps.registrarSeguranca("Acesso admin local negado", "erro", "Ambiente sem manutenção local", "admin-local");
    return;
  }
  if (deps.loginEstaBloqueado("admin-local")) return;
  deps.setBotaoLoading("loginAdminBtn", true);
  if (senha !== "123") {
    deps.registrarFalhaLogin("admin-local", "Senha local incorreta");
    deps.alert("Usuário ou senha inválidos");
    deps.setBotaoLoading("loginAdminBtn", false);
    return;
  }

  if (deps.precisa2FA()) {
    iniciarVerificacao2FA("admin", deps);
    deps.setBotaoLoading("loginAdminBtn", false);
    return;
  }

  deps.limparFalhasLogin("admin-local");
  concluirLoginAdmin(deps);
  deps.setBotaoLoading("loginAdminBtn", false);

  }

  function concluirLoginAdmin(deps = {}) {

  deps.setAdminLogado(true);
  deps.setUsuarioAtualEmail("");
  deps.sessionStorage.setItem("adminLogado", "sim");
  deps.sessionStorage.removeItem("usuarioAtualEmail");
  deps.registrarHistorico("Admin", "Login realizado");
  deps.registrarSeguranca("Login admin local", "sucesso", "Manutenção local", "admin-local");
  deps.registrarAtividadeSessao();
  deps.renderApp();

  }

  function logoutAdmin(deps = {}) {

  deps.setAdminLogado(false);
  deps.setUsuarioAtualEmail("");
  deps.sessionStorage.removeItem("adminLogado");
  deps.sessionStorage.removeItem("usuarioAtualEmail");
  deps.registrarSeguranca("Logout admin local", "sucesso", "", "admin-local");
  deps.renderApp();

  }

  async function loginUsuario(deps = {}) {
  traceLogin("LOGIN_SUBMIT");

  const email = deps.normalizarEmail(deps.document.getElementById("usuarioLoginEmail")?.value || "");
  const senha = deps.document.getElementById("usuarioLoginSenha")?.value || "";
  deps.setUsuarios(deps.normalizarUsuarios(deps.getUsuarios()));

  if (!email || !senha) {
    traceLogin("VALIDATION_FAIL");
    deps.alert("Campo obrigatório");
    deps.registrarSeguranca("Falha de login", "erro", "Campo obrigatório", email);
    return;
  }
  if (!deps.emailValido(email)) {
    traceLogin("VALIDATION_FAIL");
    deps.alert("Informe um e-mail válido.");
    deps.registrarSeguranca("Falha de login", "erro", "E-mail inválido", email);
    return;
  }
  if (deps.loginEstaBloqueado(email)) return;
  traceLogin("VALIDATION_OK");

  deps.setBotaoLoading("loginUsuarioBtn", true);
  const operacaoUX = deps.iniciarOperacaoUX({
    name: "login",
    title: "Entrando",
    message: "Validando seus dados...",
    context: "login",
    steps: ["Validando dados", "Confirmando acesso", "Carregando ambiente", "Finalizando"],
    progress: 15
  });
  try {
    const { usuario, source } = await deps.AuthService.login(email, senha);
    deps.atualizarOperacaoUX(operacaoUX, { stepIndex: 1, message: "Acesso confirmado.", progress: 50 });

    if (await preparar2FAAposPrimeiroFator(usuario, deps)) {
      deps.atualizarOperacaoUX(operacaoUX, { stepIndex: 2, message: "Preparando verificação adicional...", progress: 85 });
      deps.concluirOperacaoUX(operacaoUX, "Verificação necessária");
      return;
    }

    deps.atualizarOperacaoUX(operacaoUX, { stepIndex: 2, message: "Carregando seu ambiente...", progress: 80 });
    deps.limparFalhasLogin(email);
    deps.oferecerSalvarCredencialNavegador(email, senha);
    await concluirLoginUsuario(usuario, deps);
    deps.atualizarOperacaoUX(operacaoUX, { stepIndex: 3, message: "Acesso concluído.", progress: 100 });
    deps.concluirOperacaoUX(operacaoUX, "Acesso liberado");
  } catch (erro) {
    traceLoginFailure(erro);
    deps.falharOperacaoUX(operacaoUX, erro, "Erro ao entrar");
    deps.ErrorService.notify(erro, { area: "Autenticação", action: "Login", userMessage: "Não foi possível preparar seu acesso. Tente novamente." });
  } finally {
    deps.setBotaoLoading("loginUsuarioBtn", false);
  }

  }

  async function concluirLoginUsuario(usuario, deps = {}) {

  if (!deps.syncConfig.supabaseUserId) {
    deps.alert("Não foi possível validar o auth.uid no Supabase. Faça login online novamente.");
    deps.registrarSeguranca("Login bloqueado", "erro", "Sem auth.uid Supabase", usuario?.email || "");
    return;
  }
  traceLogin("AUTH_OK");
  traceLogin("SESSION_PREPARING");
  usuario = await deps.AuthService.hydrateAuthenticatedUser(usuario, { source: "login" });
  traceLogin("PROFILE_READY");
  if (deps.usuarioEstaBloqueado(usuario)) {
    deps.alert("Este usuário está bloqueado. Fale com o administrador.");
    return;
  }
  if (deps.isSuperAdmin(usuario)) {
    deps.billingConfig.clientId = "";
    deps.billingConfig.companyId = "";
  } else {
    if (usuario.clientId) deps.billingConfig.clientId = usuario.clientId;
    if (usuario.companyId) deps.billingConfig.companyId = usuario.companyId;
  }
  if (usuario.papel !== "superadmin" && !deps.registrarDispositivoLicenca(usuario.email)) return;
  if (!deps.registrarSessaoSaasLocal(usuario)) return;
  deps.setSessaoManutencaoSuperadmin(null);
  deps.setUsuarioAtualEmail(usuario.email);
  deps.sessionStorage.setItem("usuarioAtualEmail", deps.getUsuarioAtualEmail());
  if (deps.isSuperAdmin(usuario)) deps.sessionStorage.setItem("simplificaSuperadminAuthenticated", "true");
  else deps.sessionStorage.removeItem("simplificaSuperadminAuthenticated");
  deps.salvarCacheSessaoLocal({ novaAutenticacao: true });
  deps.desativarTravaLocal("login");
  deps.setAdminLogado(false);
  deps.sessionStorage.removeItem("adminLogado");
  usuario.lastLoginAt = new Date().toISOString();
  deps.registrarAtividadeUsuarioAtual("login", false);
  if (usuario.clientId) {
    deps.billingConfig.clientId = usuario.clientId;
    const cliente = deps.getSaasClients().find((item) => item.id === usuario.clientId);
    if (cliente) {
      cliente.lastAccessAt = usuario.lastLoginAt;
      if (cliente.status === "inactive") cliente.status = "active";
      cliente.updatedAt = usuario.lastLoginAt;
    }
  }
  deps.marcarClientesInativosLocal();
  deps.salvarDados();
  deps.registrarHistorico("Usuário", `Login de ${usuario.nome}`);
  deps.registrarSeguranca("Login realizado", "sucesso", usuario.papel, usuario.email);
  deps.registrarAuditoria("login", { papel: usuario.papel }, usuario.clientId || deps.billingConfig.clientId);
  executarPosLoginAssincrono(usuario, deps);
  deps.registrarAtividadeSessao();
  sincronizarAposLogin(deps);
  deps.oferecerAtivarBiometriaAposLogin();
  deps.reconciliarOnboardingConcluido(usuario);
  traceLogin("SESSION_READY");
  deps.window.SimplificaAppBootstrap.startAuthenticated?.();
  if (deps.isSuperAdmin(usuario)) {
    deps.setModoErpSuperadmin(false);
    deps.setTelaAnterior(deps.getTelaAtual());
    deps.setTelaAtual("superadmin");
    deps.window.__superAdminTab = deps.window.__superAdminTab || "dashboard";
  } else if (deps.deveMostrarOnboarding(usuario)) {
    deps.setTelaAnterior("dashboard");
    deps.setTelaAtual("onboarding");
  } else {
    // A senha já foi validada; exiba o ambiente imediatamente e deixe sincronizações lentas em segundo plano.
    deps.setTelaAnterior("dashboard");
    // Gestão de usuários é uma guia opcional: nunca é o destino automático do login.
    deps.setTelaAtual("dashboard");
  }
  deps.renderApp();

  }

  async function alterarSenhaAtual(obrigatoria = false, botao = null, deps = {}) {

  const usuario = deps.getUsuarioAtual();
  if (!usuario) {
    deps.alert("Sessão expirada");
    deps.trocarTela("admin");
    return;
  }
  const formulario = botao?.closest?.(".password-change-form") || deps.document.querySelector(".password-change-form");
  const atual = deps.getCampoSenhaFormulario(formulario, "atual", "senhaAtualUsuario");
  const nova = deps.getCampoSenhaFormulario(formulario, "nova", "novaSenhaUsuario");
  const confirmar = deps.getCampoSenhaFormulario(formulario, "confirmar", "confirmarNovaSenhaUsuario");
  if (!atual || !nova || !confirmar) {
    deps.alert("Campo obrigatório");
    return;
  }
  if (nova !== confirmar) {
    deps.alert("As senhas não conferem.");
    return;
  }
  const erroSenha = deps.mensagemValidacaoSenha(nova);
  if (erroSenha) {
    deps.alert(erroSenha);
    return;
  }
  deps.setBotaoLoading(botao || "alterarSenhaBtn", true, "Salvando...");
  try {
    if (!await deps.verificarSenhaUsuario(usuario, atual)) {
      deps.registrarSeguranca("Troca de senha", "erro", "Senha atual inválida", usuario.email);
      deps.alert("Usuário ou senha inválidos");
      return;
    }
    await deps.definirSenhaUsuario(usuario, nova, false);
    await alterarSenhaSupabaseSeConectado(nova, deps);
    deps.salvarDados();
    deps.registrarFluxoSalvamento("Segurança", "Alterar senha", { usuarioId: usuario.id || "", email: usuario.email || "" });
    deps.registrarHistorico("Segurança", "Senha alterada");
    deps.registrarSeguranca("Troca de senha", "sucesso", "", usuario.email);
    deps.alert("Senha alterada com sucesso");
    if (obrigatoria) deps.trocarTela("dashboard");
    else {
      deps.fecharPopup();
      deps.renderApp();
    }
  } catch (erro) {
    deps.registrarFluxoSalvamento("Segurança", "Alterar senha", { usuarioId: usuario.id || "", email: usuario.email || "" }, erro);
    deps.ErrorService.notify(erro, { area: "Segurança", action: "Alterar senha", errorKey: "CHANGE_PASSWORD_FAILED" });
  } finally {
    deps.setBotaoLoading(botao || "alterarSenhaBtn", false);
  }

  }

  async function alterarSenhaSupabaseSeConectado(novaSenha, deps = {}) {

  if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId) return false;
  try {
    await deps.requisicaoSupabase("/auth/v1/user", {
      method: "PUT",
      body: JSON.stringify({ password: novaSenha })
    });
    await deps.limparTrocaSenhaObrigatoriaSupabase();
    return true;
  } catch (erro) {
    deps.registrarDiagnostico("Supabase", "Senha local alterada, Supabase não atualizado", erro.message);
    return false;
  }

  }

  async function solicitarRecuperacaoSenha(deps = {}) {

  const emailInformado = await deps.solicitarEntradaTexto({
    titulo: "Recuperar senha",
    mensagem: "Informe o e-mail para recuperação de senha.",
    tipo: "email"
  });
  const email = deps.normalizarEmail(emailInformado || "");
  if (!email || !deps.emailValido(email)) {
    deps.alert("Se este e-mail existir, enviaremos instruções de recuperação.");
    return;
  }

  const token = "reset-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  deps.setPasswordResetTokens(deps.getPasswordResetTokens().filter((item) => Date.parse(item.expiresAt || 0) > Date.now() && item.email !== email));
  if (deps.getUsuarios().some((usuario) => usuario.email === email)) {
    deps.getPasswordResetTokens().push({
      email,
      token,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      usado: false
    });
  }

  try {
    deps.atualizarConfigSupabaseCampos();
    if (deps.syncConfig.supabaseUrl && deps.syncConfig.supabaseAnonKey) {
      await deps.requisicaoSupabase("/auth/v1/recover", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          redirect_to: deps.montarRedirectSupabaseEmail("recovery")
        })
      });
    }
  } catch (erro) {
    deps.registrarDiagnostico("Supabase", "Recuperação online não enviada", erro.message);
  }

  deps.salvarDados();
  deps.registrarSeguranca("Recuperação de senha solicitada", "sucesso", "Mensagem genérica", email);
  deps.alert("Se este e-mail existir, enviaremos instruções de recuperação.");

  }

  function salvarSessaoSupabase(dados, email, deps = {}) {

  const sessao = dados?.session || dados || {};
  const usuario = deps.obterUsuarioAuthResposta(dados) || {};
  if (!sessao.access_token || !usuario.id) return false;

  deps.syncConfig.supabaseAccessToken = sessao.access_token;
  deps.syncConfig.supabaseRefreshToken = sessao.refresh_token || deps.syncConfig.supabaseRefreshToken || "";
  deps.syncConfig.supabaseTokenExpiresAt = sessao.expires_at ? sessao.expires_at * 1000 : Date.now() + (Number(sessao.expires_in) || 3600) * 1000;
  deps.syncConfig.supabaseUserId = usuario.id;
  deps.syncConfig.supabaseEmail = deps.normalizarEmail(usuario.email || email || deps.syncConfig.supabaseEmail);
  deps.syncConfig.supabaseEnabled = true;
  deps.syncConfig.supabaseLastLogin = new Date().toISOString();
  deps.registrarAtividadeUsuarioAtual("login", false);
  deps.ativarEscopoDadosUsuarioAtual("supabase-session", { persistir: false });
  deps.salvarSessaoSensivelSupabase();
  deps.salvarDados();
  deps.sincronizarRelayNotificacoesAndroid().catch(() => {});
  return true;

  }

  async function autenticarSupabase(criarConta = false, deps = {}) {

  if (!deps.validarSupabase(false)) return;

  const email = deps.normalizarEmail(deps.document.getElementById("supabaseEmail")?.value || deps.syncConfig.supabaseEmail || deps.getEmailLicencaAtual());
  const senha = deps.document.getElementById("supabasePassword")?.value || "";
  if (!email || !senha) {
    deps.alert("Informe e-mail e senha do Supabase.");
    return;
  }

  try {
    const caminho = criarConta ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
    const payload = { email, password: senha };
    if (criarConta) payload.redirect_to = deps.montarRedirectSupabaseEmail("signup");
    const dados = await deps.requisicaoSupabase(caminho, {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload)
    });

    if (!salvarSessaoSupabase(dados, email, deps)) {
      deps.syncConfig.supabaseEmail = email;
      deps.salvarDados();
      deps.alert("Conta criada. Se o Supabase pedir confirmação de e-mail, confirme antes de entrar.");
      return;
    }

    await deps.salvarPerfilSupabase();
    deps.registrarHistorico("Supabase", criarConta ? "Conta criada/conectada" : "Login realizado");
    deps.alert("Supabase conectado");
    deps.renderApp();
  } catch (erro) {
    deps.alert("Não foi possível autenticar no Supabase: " + erro.message);
  }

  }

  async function loginUsuarioSupabase(email, senha, { deferPostLogin = false } = {}, deps = {}) {

  deps.syncConfig.supabaseUrl = deps.normalizarUrlSupabase(deps.syncConfig.supabaseUrl || deps.SUPABASE_DEFAULT_URL);
  deps.syncConfig.supabaseAnonKey = deps.syncConfig.supabaseAnonKey || deps.SUPABASE_DEFAULT_ANON_KEY;
  traceLogin("AUTH_REQUEST");
  let dados;
  try {
  dados = await deps.requisicaoSupabase("/auth/v1/token?grant_type=password", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password: senha })
  });
  } catch (error) {
    traceLogin("AUTH_RESPONSE_FAIL");
    throw error;
  }
  traceLogin("AUTH_RESPONSE_OK");
  if (!salvarSessaoSupabase(dados, email, deps)) return null;
  traceLogin("SESSION_CREATED");

  const sincronizarUsuario = () => deps.sincronizarUsuarioSaasAposLoginSupabase({ nome: email.split("@")[0], email })
    .catch((erro) => deps.logFalhaSyncSaas("loginUsuarioSupabase", erro));
  if (!deferPostLogin) await sincronizarUsuario();

  let perfil = null;
  try {
    const linhas = await deps.requisicaoSupabase(`/rest/v1/erp_profiles?select=*&id=eq.${encodeURIComponent(deps.syncConfig.supabaseUserId)}&limit=1`, {
      method: "GET"
    });
    perfil = Array.isArray(linhas) ? linhas[0] : null;
  } catch (erro) {
    deps.registrarDiagnostico("Supabase", "Perfil online não carregado", erro.message);
  }

  deps.setUsuarios(deps.normalizarUsuarios(deps.getUsuarios()));
  let usuario = deps.getUsuarios().find((item) => item.email === email);
  if (!usuario) {
    usuario = deps.normalizarUsuario({
      nome: perfil?.display_name || email.split("@")[0],
      email,
      clientId: perfil?.client_id || "",
      companyId: perfil?.company_id || "",
      phone: deps.normalizePhoneBR(perfil?.phone || "") || perfil?.phone || "",
      papel: deps.normalizarPapel(perfil?.role || "user"),
      ativo: perfil?.status !== "blocked" && perfil?.status !== "inactive",
      bloqueado: perfil?.status === "blocked" || perfil?.status === "inactive",
      mustChangePassword: !!perfil?.must_change_password,
      acceptedTermsAt: perfil?.accepted_terms_at || ""
    });
    deps.getUsuarios().push(usuario);
  } else {
    usuario.nome = perfil?.display_name || usuario.nome;
    usuario.phone = deps.normalizePhoneBR(perfil?.phone || usuario.phone || "") || perfil?.phone || usuario.phone || "";
    usuario.papel = deps.normalizarPapel(perfil?.role || usuario.papel);
    usuario.ativo = perfil?.status ? perfil.status === "active" : usuario.ativo;
    usuario.bloqueado = perfil?.status ? perfil.status !== "active" : usuario.bloqueado;
    usuario.mustChangePassword = perfil && "must_change_password" in perfil ? perfil.must_change_password === true && !usuario.passwordUpdatedAt : usuario.mustChangePassword;
    usuario.clientId = perfil?.client_id || usuario.clientId || "";
    usuario.companyId = perfil?.company_id || usuario.companyId || "";
    usuario.acceptedTermsAt = perfil?.accepted_terms_at || usuario.acceptedTermsAt || "";
  }

  if (!deferPostLogin) {
    await carregarPerfilSaasSupabase(usuario, deps);
    deps.marcarUsuarioSupabaseSincronizado(usuario);
  }
  await deps.definirSenhaUsuario(usuario, senha, !!usuario.mustChangePassword);
  deps.salvarDados();
  return usuario;

  }

  async function criarContaSupabaseParaUsuarioLocal(usuario, senha, deps = {}) {

  if (!usuario || !senha || deps.normalizarEmail(usuario.email) === deps.SUPERADMIN_BOOTSTRAP_EMAIL) return null;
  deps.syncConfig.supabaseUrl = deps.normalizarUrlSupabase(deps.syncConfig.supabaseUrl || deps.SUPABASE_DEFAULT_URL);
  deps.syncConfig.supabaseAnonKey = deps.syncConfig.supabaseAnonKey || deps.SUPABASE_DEFAULT_ANON_KEY;

  const email = deps.normalizarEmail(usuario.email);
  const clienteLocal = deps.getSaasClients().find((cliente) => String(cliente.id) === String(usuario.clientId))
    || deps.getSaasClients().find((cliente) => deps.normalizarEmail(cliente.email) === email);
  const nome = usuario.nome || clienteLocal?.responsibleName || email.split("@")[0];
  const negocio = clienteLocal?.name || deps.appConfig.businessName || "Minha empresa 3D";
  const telefone = usuario.phone || clienteLocal?.phone || "";
  const dados = await deps.requisicaoSupabase("/auth/v1/signup", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email,
      password: senha,
      redirect_to: deps.montarRedirectSupabaseEmail("signup"),
      data: {
        owner_name: nome,
        name: nome,
        company_name: negocio,
        business_name: negocio,
        phone: telefone,
        cnpj: clienteLocal?.cnpj || "",
        accepted_terms: true
      }
    })
  });

  if (!salvarSessaoSupabase(dados, email, deps)) {
    deps.syncConfig.supabaseEmail = email;
    deps.marcarUsuarioSupabasePendente(usuario, "Aguardando confirmação de e-mail");
    deps.salvarDados();
    return null;
  }

  const cadastroOnline = await deps.registrarClienteSaasSupabase({
    nome,
    email,
    negocio,
    telefone,
    planSlug: deps.normalizarSlugPlano(clienteLocal?.planoAtual || deps.billingConfig.planSlug || "free")
  });

  if (cadastroOnline?.client_id) {
    const clientIdOnline = String(cadastroOnline.client_id);
    usuario.clientId = clientIdOnline;
    deps.billingConfig.clientId = clientIdOnline;
    deps.billingConfig.licenseEmail = email;
    if (clienteLocal) {
      clienteLocal.id = clientIdOnline;
      if (cadastroOnline.client_code) clienteLocal.clientCode = String(cadastroOnline.client_code);
    }
    if (cadastroOnline.subscription_id) deps.billingConfig.subscriptionId = String(cadastroOnline.subscription_id);
    deps.marcarUsuarioSupabaseSincronizado(usuario);
    await deps.salvarPerfilSupabase();
    deps.salvarDados();
  }

  return usuario;

  }

  async function verificarSuperadminSupabaseSilencioso(deps = {}) {

  if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId || !deps.syncConfig.supabaseUrl) return false;
  try {
    const resultado = await deps.requisicaoSupabase("/rest/v1/rpc/erp_is_superadmin", {
      method: "POST",
      body: JSON.stringify({}),
      telemetry: false
    });
    if (resultado === true) return true;
    if (Array.isArray(resultado)) return resultado.some((item) => item === true || item?.erp_is_superadmin === true);
    if (resultado && typeof resultado === "object") return Object.values(resultado).some((valor) => valor === true);
  } catch (erro) {
    deps.ErrorService.capture(erro, {
      area: "Supabase",
      action: "Verificar permissão superadmin",
      errorKey: "SUPERADMIN_RPC_UNAVAILABLE",
      silent: true
    });
  }

  const userId = encodeURIComponent(deps.syncConfig.supabaseUserId);
  const consultas = [
    `/rest/v1/erp_profiles?select=role,status&id=eq.${userId}&limit=1`,
    `/rest/v1/profiles?select=role,status&user_id=eq.${userId}&limit=1`
  ];
  for (const caminho of consultas) {
    try {
      const linhas = await deps.requisicaoSupabase(caminho, { method: "GET" });
      const perfil = Array.isArray(linhas) ? linhas[0] : null;
      if (perfil?.role === "superadmin" && perfil.status !== "blocked" && perfil.status !== "inactive") {
        return true;
      }
    } catch (erro) {
      deps.ErrorService.capture(erro, {
        area: "Supabase",
        action: "Verificar perfil superadmin",
        errorKey: "SUPERADMIN_PROFILE_UNAVAILABLE",
        silent: true
      });
    }
  }
  return false;

  }

  async function renovarSessaoSupabase(deps = {}) {

  if (!deps.syncConfig.supabaseRefreshToken) return false;
  try {
    const dados = await deps.requisicaoSupabase("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refresh_token: deps.syncConfig.supabaseRefreshToken })
    }, false);
    return salvarSessaoSupabase(dados, deps.syncConfig.supabaseEmail, deps);
  } catch (erro) {
    deps.registrarDiagnostico("Supabase", "Sessão expirada", erro.message);
    return false;
  }

  }

  async function carregarPerfilSaasSupabase(usuario, deps = {}) {

  if (!deps.syncConfig.supabaseUserId || !usuario) return usuario;
  let perfil = null;
  let identidadePerfil = null;
  try {
    const linhas = await deps.requisicaoSupabase(`/rest/v1/erp_profiles?select=*&id=eq.${encodeURIComponent(deps.syncConfig.supabaseUserId)}&limit=1`, {
      method: "GET"
    });
    perfil = Array.isArray(linhas) ? linhas[0] : null;
  } catch (erro) {
    deps.registrarDiagnostico("Supabase", "Perfil online não carregado", erro.message);
  }

  if (!perfil) {
    try {
      const linhas = await deps.requisicaoSupabase(`/rest/v1/profiles?select=*&user_id=eq.${encodeURIComponent(deps.syncConfig.supabaseUserId)}&limit=1`, {
        method: "GET"
      });
      perfil = Array.isArray(linhas) ? linhas[0] : null;
    } catch (_) {}
  }

  if (perfil) {
    usuario.nome = perfil.display_name || perfil.name || usuario.nome;
    usuario.phone = deps.normalizePhoneBR(perfil.phone || usuario.phone || "") || perfil.phone || usuario.phone || "";
    usuario.papel = deps.normalizarPapel(perfil.role || usuario.papel);
    usuario.ativo = perfil.status ? perfil.status === "active" : usuario.ativo;
    usuario.bloqueado = perfil.status ? perfil.status !== "active" : usuario.bloqueado;
    usuario.mustChangePassword = perfil.must_change_password === true && !usuario.passwordUpdatedAt;
    usuario.senhaTemporaria = usuario.mustChangePassword;
    usuario.clientId = perfil.client_id || usuario.clientId || deps.billingConfig.clientId || "";
    usuario.companyId = perfil.company_id || usuario.companyId || deps.billingConfig.companyId || "";
    usuario.acceptedTermsAt = perfil.accepted_terms_at || usuario.acceptedTermsAt || "";
    const onboardingRemotoConcluido = perfil.onboarding_completed === true || perfil.onboardingCompleted === true;
    usuario.onboardingCompleted = usuario.onboardingCompleted === true || onboardingRemotoConcluido || deps.onboardingConcluidoLocalmente(usuario);
    usuario.onboardingStep = usuario.onboardingCompleted
      ? 4
      : Math.max(Number(usuario.onboardingStep) || 0, Number(perfil.onboarding_step ?? perfil.onboardingStep) || 0);
    if (usuario.onboardingCompleted) {
      deps.appConfig.companySetupCompleted = true;
      deps.registrarOnboardingConcluidoLocalmente(usuario, true);
    }
  }

  try {
    const linhasIdentidade = await deps.requisicaoSupabase(`/rest/v1/user_profiles?select=display_name,profile_photo,updated_at&user_id=eq.${encodeURIComponent(deps.syncConfig.supabaseUserId)}&limit=1`, {
      method: "GET",
      telemetry: false
    });
    identidadePerfil = Array.isArray(linhasIdentidade) ? linhasIdentidade[0] : null;
  } catch (erro) {
    deps.registrarDiagnostico("Supabase", "Identidade do perfil online não carregada", erro.message);
  }

  if (identidadePerfil) {
    usuario.nome = identidadePerfil.display_name || usuario.nome;
    const fotoPerfil = String(identidadePerfil.profile_photo || "").trim();
    usuario.avatarUrl = fotoPerfil;
    usuario.avatar_url = fotoPerfil;
    deps.appConfig.profilePhotoDataUrl = fotoPerfil;
    deps.appConfig.appearanceSettings = deps.normalizarAppearanceSettings({
      ...(deps.appConfig.appearanceSettings || {}),
      profile_photo: fotoPerfil
    });
  }

  if (await verificarSuperadminSupabaseSilencioso(deps)) {
    usuario.papel = "superadmin";
    usuario.ativo = true;
    usuario.bloqueado = false;
  }

  if (usuario.clientId) {
    deps.billingConfig.clientId = usuario.clientId;
    if (usuario.companyId) deps.billingConfig.companyId = usuario.companyId;
    try {
      const clientesOnline = await deps.requisicaoSupabase(`/rest/v1/clients?select=*&id=eq.${encodeURIComponent(usuario.clientId)}&limit=1`, {
        method: "GET"
      });
      const clienteOnline = Array.isArray(clientesOnline) ? clientesOnline[0] : null;
      if (clienteOnline) {
        const cliente = deps.normalizarClienteSaas(clienteOnline);
        deps.setSaasClients(deps.getSaasClients().filter((item) => item.id !== cliente.id));
        deps.getSaasClients().push(cliente);
      }
    } catch (_) {}

    try {
      const assinaturasOnline = await deps.requisicaoSupabase(`/rest/v1/subscriptions?select=*,plans(*)&client_id=eq.${encodeURIComponent(usuario.clientId)}&limit=1`, {
        method: "GET"
      });
      const assinaturaOnline = Array.isArray(assinaturasOnline) ? assinaturasOnline[0] : null;
      if (assinaturaOnline) {
        const planoOnline = assinaturaOnline.plans ? deps.normalizarPlanoSaas(assinaturaOnline.plans) : deps.getPlanoSaas(deps.billingConfig.planSlug);
        deps.setSaasPlans(deps.getSaasPlans().filter((item) => item.slug !== planoOnline.slug));
        deps.getSaasPlans().push(planoOnline);
        const assinatura = deps.normalizarAssinaturaSaas({
          ...assinaturaOnline,
          clientId: assinaturaOnline.client_id,
          planSlug: planoOnline.slug
        });
        deps.setSaasSubscriptions(deps.getSaasSubscriptions().filter((item) => item.id !== assinatura.id && item.clientId !== assinatura.clientId));
        deps.getSaasSubscriptions().push(assinatura);
        deps.billingConfig.subscriptionId = assinatura.id;
        deps.billingConfig.planSlug = planoOnline.slug;
        deps.billingConfig.licenseStatus = assinatura.status;
        deps.billingConfig.paidUntil = assinatura.expiresAt;
        usuario.planStatus = assinatura.status;
        usuario.planExpiresAt = assinatura.expiresAt;
      }
    } catch (_) {}
  }

  await deps.consultarLicencaSupabaseSilencioso().catch((erro) => {
    deps.registrarDiagnostico("Supabase", "Licença efetiva não carregada após perfil", erro.message || erro);
  });
  deps.salvarDados();
  return usuario;

  }

  async function processarRetornoOAuthSupabase(deps = {}) {

  const tipoRetorno = deps.obterTipoRetornoAuthSupabase();
  const providerRetorno = deps.obterEstadoOAuthSupabase().provider;
  const erroOAuth = deps.obterErroOAuthSupabase();
  if (erroOAuth) {
    deps.registrarDiagnostico("Supabase", "Retorno de autenticação recusado", `${erroOAuth.erro}: ${erroOAuth.descricao}`);
    const textoErro = `${erroOAuth.erro} ${erroOAuth.descricao}`.toLowerCase();
    const mensagem = textoErro.includes("access_denied") || textoErro.includes("cancel")
      ? "Login com Google cancelado. Nenhuma informação foi compartilhada."
      : deps.erroLinkAuthExpirado(erroOAuth)
      ? "Este link expirou. Solicite um novo e-mail."
      : textoErro.includes("unsupported provider")
        ? "Login Google ainda não está ativado no Supabase."
        : providerRetorno === "google"
          ? "Não foi possível concluir o login com Google. Tente novamente."
          : "Não foi possível concluir a autenticação.";
    deps.mostrarToast(mensagem, "erro", 7000);
    deps.limparEstadoOAuthSupabase();
    deps.limparParametrosOAuthSupabase();
    return false;
  }

  const hash = new URLSearchParams(String(deps.location.hash || "").replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  if (!accessToken) return false;

  const refreshToken = hash.get("refresh_token") || "";
  const expiresIn = Number(hash.get("expires_in") || 3600) || 3600;
  try {
    deps.syncConfig.supabaseUrl = deps.normalizarUrlSupabase(deps.syncConfig.supabaseUrl || deps.SUPABASE_DEFAULT_URL);
    deps.syncConfig.supabaseAnonKey = deps.syncConfig.supabaseAnonKey || deps.SUPABASE_DEFAULT_ANON_KEY;
    const resposta = await deps.fetch(deps.syncConfig.supabaseUrl + "/auth/v1/user", {
      headers: {
        apikey: deps.syncConfig.supabaseAnonKey,
        Authorization: "Bearer " + accessToken
      }
    });
    if (!resposta.ok) throw new Error("OAuth inválido");
    const user = await resposta.json();
    const sessaoSalva = salvarSessaoSupabase({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      user
    }, user.email);
    if (!sessaoSalva) throw new Error("Sessão de autenticação inválida.");

    const usuario = await deps.garantirUsuarioLocalParaAuthSupabase(user);
    deps.limparEstadoOAuthSupabase();
    deps.limparParametrosOAuthSupabase();
    if (usuario && !await preparar2FAAposPrimeiroFator(usuario, deps)) concluirLoginUsuario(usuario, deps);
    if (tipoRetorno === "recovery") {
      setTimeout(abrirModalRedefinicaoSenhaSupabase, 250);
    } else if (["signup", "email", "email_change"].includes(tipoRetorno)) {
      deps.mostrarToast("Conta confirmada no Simplifica 3D.", "sucesso", 5000);
    }
    return true;
  } catch (erro) {
    deps.registrarDiagnostico("Supabase", "Retorno de autenticação não concluído", erro.message);
    deps.limparEstadoOAuthSupabase();
    deps.limparParametrosOAuthSupabase();
    deps.mostrarToast("Não foi possível concluir a autenticação. Tente entrar novamente.", "erro", 6500);
    return false;
  }

  }

  function loginComoDono(deps = {}) {

  deps.alert("Login de dono foi removido. Entre com admin do cliente ou superadmin definido no banco.");

  }

  function executarPosLoginAssincrono(usuario, deps = {}) {

  const tarefas = [
    ["Cadastro SaaS pós-login", () => deps.garantirCadastroSaasOnlineAposLogin(usuario)],
    ["Segurança da conta", () => deps.carregarSegurancaConta(true).then(() => deps.renderApp())],
    ["Toque de acesso Supabase", () => deps.tocarAcessoClienteSupabaseSilencioso()],
    ["Licença Supabase", () => deps.consultarLicencaSupabaseSilencioso()],
    ["Carga SaaS Supabase", () => deps.carregarSaasSupabaseSilencioso()],
    ["Produção manual Supabase", () => deps.carregarProducaoManualSupabaseSilencioso().then(() => deps.renderizarPreservandoScroll())],
    ["Sessão SaaS Supabase", () => deps.registrarSessaoSaasOnlineSilencioso(usuario)]
  ];
  tarefas.forEach(([nome, tarefa]) => {
    Promise.resolve()
      .then(tarefa)
      .catch((erro) => deps.ErrorService.capture(erro, { area: "Pós-login", action: nome, silent: true }));
  });

  }

  function sincronizarAposLogin(deps = {}) {

  if (!deps.temAcessoNuvem()) return;
  const plano = deps.getPlanoAtual();
  if (deps.syncConfig.supabaseAccessToken && deps.syncConfig.supabaseUserId) {
    deps.syncConfig.supabaseEnabled = true;
    deps.syncConfig.autoBackupTarget = "supabase";
    deps.sincronizarAlteracoesLocaisSilencioso("login").catch((erro) => deps.registrarDiagnostico("sync", "Sync Supabase pós-login falhou", erro.message));
    return;
  }
  if (deps.isPlanoPagoSlug(plano.slug)) {
    deps.syncConfig.supabaseEnabled = true;
    deps.syncConfig.autoBackupTarget = "supabase";
    deps.sincronizarSupabaseSilencioso().catch((erro) => deps.registrarDiagnostico("sync", "Sync de plano pós-login falhou", erro.message));
    return;
  }
  if (deps.syncConfig.autoBackupTarget === "supabase" && deps.syncConfig.supabaseEnabled) {
    deps.sincronizarSupabaseSilencioso().catch((erro) => deps.registrarDiagnostico("sync", "Sync Supabase pós-login falhou", erro.message));
    return;
  }
  if (deps.syncConfig.autoBackupTarget === "url" && deps.syncConfig.cloudUrl) {
    deps.sincronizarUrlSilencioso().catch((erro) => deps.registrarDiagnostico("sync", "Sync pós-login falhou", erro.message));
    return;
  }
  if (deps.ENABLE_GOOGLE_DRIVE_BACKUP && deps.driveFolderHandle) {
    deps.sincronizarGoogleDriveSilencioso().catch((erro) => deps.registrarDiagnostico("sync", "Sync Drive pós-login falhou", erro.message));
  }

  }

  global.SimplificaAuthCommands = {
    traceLogin,
    getLoginStage: () => loginStage,
    iniciarVerificacao2FA,
    preparar2FAAposPrimeiroFator,
    confirmarCodigo2FA,
    loginAdmin,
    concluirLoginAdmin,
    logoutAdmin,
    loginUsuario,
    concluirLoginUsuario,
    alterarSenhaAtual,
    alterarSenhaSupabaseSeConectado,
    solicitarRecuperacaoSenha,
    salvarSessaoSupabase,
    autenticarSupabase,
    loginUsuarioSupabase,
    criarContaSupabaseParaUsuarioLocal,
    verificarSuperadminSupabaseSilencioso,
    renovarSessaoSupabase,
    carregarPerfilSaasSupabase,
    processarRetornoOAuthSupabase,
    loginComoDono,
    executarPosLoginAssincrono,
    sincronizarAposLogin
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaAuthCommands;
  }
})(typeof window !== "undefined" ? window : globalThis);
