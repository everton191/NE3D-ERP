(function attachAuthRemote(global) {
  "use strict";

  async function atualizarSenhaSupabaseComSessao(novaSenha, deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId) {
      throw new Error("Sessão de recuperação inválida.");
    }
    await deps.requisicaoSupabase("/auth/v1/user", {
      method: "PUT",
      body: deps.JSON.stringify({ password: novaSenha })
    });
    await deps.limparTrocaSenhaObrigatoriaSupabase();
    deps.setUsuarios(deps.normalizarUsuarios(deps.getUsuarios()));
    const email = deps.normalizarEmail(deps.syncConfig.supabaseEmail || "");
    const usuario = deps.getUsuarios().find((item) =>
      deps.String(item.supabaseUserId || "") === deps.String(deps.syncConfig.supabaseUserId)
      || (email && item.email === email)
    );
    if (usuario) {
      await deps.definirSenhaUsuario(usuario, novaSenha, false);
      deps.salvarDados();
    }
    deps.registrarSeguranca("Senha redefinida", "sucesso", "Link de recuperação Supabase", deps.syncConfig.supabaseEmail);
    deps.registrarAuditoria("senha_redefinida", { origem: "supabase_recovery_link" });
  }

  function loginGoogleSupabase(deps = {}) {
    deps.syncConfig.supabaseUrl = deps.normalizarUrlSupabase(deps.syncConfig.supabaseUrl || deps.SUPABASE_DEFAULT_URL);
    deps.syncConfig.supabaseAnonKey = deps.syncConfig.supabaseAnonKey || deps.SUPABASE_DEFAULT_ANON_KEY;
    if (!deps.GOOGLE_AUTH_ENABLED) {
      deps.mostrarToast("Login Google desativado até o provedor ser habilitado no Supabase.", "erro", 7000);
      deps.registrarDiagnostico("Supabase", "Login Google bloqueado localmente", "Provider desativado na configuração do app");
      return;
    }
    const redirectTo = deps.montarRedirectSupabaseOAuth();
    const url = `${deps.syncConfig.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${deps.encodeURIComponent(redirectTo)}&prompt=select_account`;
    deps.salvarEstadoOAuthSupabase("google", redirectTo);
    deps.registrarAuditoria("login", { provider: "google_redirect" });
    deps.mostrarToast("Abrindo login com Google...", "info", 2500);
    deps.window.location.assign(url);
  }

  async function validarSenhaSupabaseUsuarioAtual(senha, deps = {}) {
    if (!senha) return false;
    const usuario = deps.getUsuarioAtual();
    const email = deps.normalizarEmail(usuario?.email || deps.usuarioAtualEmail || deps.syncConfig.supabaseEmail || "");
    if (!email || !deps.syncConfig.supabaseUrl || !deps.syncConfig.supabaseAnonKey || !deps.syncConfig.supabaseUserId || !deps.estaOnline()) {
      return deps.validarSenhaLocalUsuarioAtual(senha);
    }

    try {
      const dados = await deps.requisicaoSupabase("/auth/v1/token?grant_type=password", {
        method: "POST",
        auth: false,
        telemetry: false,
        body: deps.JSON.stringify({ email, password: senha })
      }, false);
      const authUser = deps.obterUsuarioAuthResposta(dados);
      if (deps.String(authUser?.id || "") === deps.String(deps.syncConfig.supabaseUserId || "")) return true;
    } catch (erro) {
      deps.registrarDiagnostico("Auth", "Senha administrativa remota falhou", erro.message, { silent: true });
    }
    return deps.validarSenhaLocalUsuarioAtual(senha);
  }

  global.SimplificaAuthRemote = {
    atualizarSenhaSupabaseComSessao,
    loginGoogleSupabase,
    validarSenhaSupabaseUsuarioAtual
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaAuthRemote;
  }
})(typeof window !== "undefined" ? window : globalThis);
