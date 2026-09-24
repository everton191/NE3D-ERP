(function attachAuthSession(global) {
  "use strict";

  async function verifyRlsHealth(deps = {}) {
      if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId || !deps.syncConfig.supabaseUrl) {
        return { ok: true, skipped: true };
      }
      const checks = [
        {
          name: "erp_profiles.select",
          run: () => deps.requisicaoSupabase(`/rest/v1/erp_profiles?select=id,email,client_id&id=eq.${deps.encodeURIComponent(deps.syncConfig.supabaseUserId)}&limit=1`, { method: "GET" })
        },
        {
          name: "profiles.select",
          run: () => deps.requisicaoSupabase(`/rest/v1/profiles?select=id,user_id,client_id&user_id=eq.${deps.encodeURIComponent(deps.syncConfig.supabaseUserId)}&limit=1`, { method: "GET" })
        },
        {
          name: "get_effective_license.rpc",
          run: () => deps.requisicaoSupabase("/rest/v1/rpc/get_effective_license", { method: "POST", body: deps.JSON.stringify({}) })
        }
      ];
      const falhas = [];
      for (const check of checks) {
        try {
          await check.run();
        } catch (erro) {
          falhas.push(`${check.name}: ${erro.message}`);
        }
      }
      if (falhas.length) {
        deps.registrarDiagnostico("Supabase/RLS", "Verificação RLS pós-login", falhas.join(" | "));
        deps.registrarErroAplicacaoSilencioso("SUPABASE_RLS_DENIED", new Error(falhas.join(" | ")), "Verificação RLS pós-login", { falhas });
        return { ok: false, falhas };
      }
      deps.registrarDiagnostico("Supabase/RLS", "Verificação RLS pós-login", "OK");
      return { ok: true, falhas: [] };
  }

  async function signupSaas({ nome, email, senha, negocio, telefone, cnpj = "" }, deps = {}) {
      if (!deps.emailValido(email)) {
        throw new deps.AppError("E-mail inválido", {
          code: "AUTH_INVALID_EMAIL",
          userMessage: "Informe um e-mail válido."
        });
      }
      if (!deps.estaOnline()) {
        throw new deps.AppError("Conexão necessária para criar sua conta.", {
          code: "AUTH_ONLINE_REQUIRED",
          userMessage: "Conexão necessária para criar sua conta."
        });
      }

      let cadastroOnline = null;
      let cadastroAguardandoConfirmacao = false;
      const emailNormalizado = deps.normalizarEmail(email);
      deps.limparResiduosCadastroLocal(emailNormalizado, { onlyPending: true });

      try {
        deps.syncConfig.supabaseUrl = deps.normalizarUrlSupabase(deps.syncConfig.supabaseUrl || deps.SUPABASE_DEFAULT_URL);
        deps.syncConfig.supabaseAnonKey = deps.syncConfig.supabaseAnonKey || deps.SUPABASE_DEFAULT_ANON_KEY;
        const dados = await deps.requisicaoSupabase("/auth/v1/signup", {
          method: "POST",
          auth: false,
          body: deps.JSON.stringify({
            email,
            password: senha,
            redirect_to: deps.montarRedirectSupabaseEmail("signup"),
            data: {
              owner_name: nome,
              name: nome,
              company_name: negocio,
              business_name: negocio,
              phone: telefone,
              cnpj,
              accepted_terms: true
            }
          })
        });

        const usuarioAuth = deps.obterUsuarioAuthResposta(dados);
        const identidadesAuth = deps.Array.isArray(usuarioAuth?.identities) ? usuarioAuth.identities : null;
        if (usuarioAuth?.id && identidadesAuth && identidadesAuth.length === 0) {
          throw new deps.AppError("E-mail já cadastrado no Supabase", {
            code: "AUTH_ALREADY_REGISTERED",
            userMessage: "Este e-mail já possui uma conta. Entre com sua senha ou use Recuperar senha."
          });
        }
        if (deps.salvarSessaoSupabase(dados, email)) {
          cadastroOnline = await deps.registrarClienteSaasSupabase({ nome, email, negocio, telefone, planSlug: "free" });
        } else if (usuarioAuth?.id) {
          deps.syncConfig.supabaseUserId = "";
          deps.syncConfig.supabaseAccessToken = "";
          deps.syncConfig.supabaseRefreshToken = "";
          deps.syncConfig.supabaseTokenExpiresAt = 0;
          deps.syncConfig.supabaseEmail = email;
          deps.salvarDados();
          cadastroAguardandoConfirmacao = true;
          deps.registrarDiagnostico("Supabase", "Cadastro aguardando confirmação de e-mail", emailNormalizado, { silent: true });
        }

        if (!cadastroAguardandoConfirmacao && !cadastroOnline?.client_id) {
          throw new deps.AppError("Cadastro SaaS remoto não retornou cliente", {
            code: "AUTH_REMOTE_PROFILE_FAILED",
            userMessage: "Não foi possível concluir o cadastro online. Tente novamente."
          });
        }
      } catch (erro) {
        const appError = deps.ErrorService.capture(erro, { area: "Supabase", action: "Cadastro online", errorKey: "SIGNUP_FAILED", silent: true });
        if (appError.code !== "AUTH_ALREADY_REGISTERED") deps.limparResiduosCadastroLocal(emailNormalizado, { onlyPending: true });
        throw appError;
      }

      const local = deps.criarClienteSaasLocal({ nome, email, senha, negocio, telefone, planSlug: "free" });
      if (cadastroOnline?.client_id) {
        const clientIdOnline = deps.String(cadastroOnline.client_id);
        local.cliente.id = clientIdOnline;
        local.assinatura.clientId = clientIdOnline;
        local.usuario.clientId = clientIdOnline;
        deps.getBillingConfig().clientId = clientIdOnline;
      }
      if (cadastroOnline?.company_id) {
        const companyIdOnline = deps.String(cadastroOnline.company_id);
        local.cliente.companyId = companyIdOnline;
        local.assinatura.companyId = companyIdOnline;
        local.usuario.companyId = companyIdOnline;
        deps.getBillingConfig().companyId = companyIdOnline;
      }
      if (cadastroOnline?.client_code) {
        local.cliente.clientCode = deps.String(cadastroOnline.client_code);
      }
      if (cadastroOnline?.subscription_id) {
        local.assinatura.id = deps.String(cadastroOnline.subscription_id);
        deps.getBillingConfig().subscriptionId = local.assinatura.id;
      }
      local.usuario.supabasePending = cadastroAguardandoConfirmacao || !cadastroOnline?.client_id;
      local.usuario.supabaseUserId = deps.syncConfig.supabaseUserId || local.usuario.supabaseUserId || "";
      local.usuario.supabaseLastSyncAt = cadastroOnline?.client_id ? new deps.Date().toISOString() : "";
      const syncStatusCadastro = cadastroAguardandoConfirmacao ? "pending_confirmation" : "synced";
      local.cliente.sync_status = syncStatusCadastro;
      local.assinatura.sync_status = syncStatusCadastro;
      local.usuario.sync_status = syncStatusCadastro;
      await deps.definirSenhaUsuario(local.usuario, senha, false);
      if (!cadastroAguardandoConfirmacao) {
        await deps.consultarLicencaSupabaseSilencioso().catch((erro) => deps.registrarDiagnostico("Supabase", "Licença pós-cadastro não carregada", erro.message));
        await deps.sincronizarFilaOfflinePendente("signup").catch((erro) => deps.registrarDiagnostico("sync", "Fila offline pós-cadastro falhou", erro.message));
      }
      deps.salvarDados();
      deps.debugInfo("[Auth][signup]", { email, auth_uid: deps.syncConfig.supabaseUserId, client_id: cadastroOnline?.client_id || "", sync_status: syncStatusCadastro });
      return { ...local, cadastroOnline, cadastroAguardandoConfirmacao };
    }

  async function recordAiTelemetryUsage(event = {}, deps = {}) {
        const ownerId = deps.String(deps.syncConfig.supabaseUserId || "");
        if (!ownerId || !deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl || !deps.estaOnline()) return false;
        await deps.requisicaoSupabase("/rest/v1/app_ai_usage_logs", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: deps.JSON.stringify({
            owner_id: ownerId, user_id: ownerId, context_type: deps.String(event.intent || "unknown"),
            action_type: deps.String(event.function_id || ""), provider: deps.String(event.route_type || "functiongemma"),
            model: event.route_type === "functiongemma" ? "functiongemma-270m-it-q8_0" : null,
            input_tokens: 0, output_tokens: 0, estimated_cost: 0,
            status: event.success ? "success" : "fallback", blocked_reason: event.fallback ? deps.String(event.error_type || "NO_TOOL") : null,
            error_message: null, metadata: event
          })
        });
        return true;
      }

  global.SimplificaAuthSession = {
    verifyRlsHealth,
    signupSaas,
    recordAiTelemetryUsage
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaAuthSession;
  }
})(typeof window !== "undefined" ? window : globalThis);
