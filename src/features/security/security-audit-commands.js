(function attachSecurityAudit(global) {
  "use strict";

  async function registrarSecurityLogSupabaseSilencioso(log, deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId || !deps.syncConfig.supabaseUrl) return;
    try {
      await deps.requisicaoSupabase("/rest/v1/security_logs", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({
          user_id: deps.syncConfig.supabaseUserId,
          actor_email: log.usuario,
          action: log.acao,
          result: log.resultado,
          details: log.detalhes,
          device_id: log.dispositivo,
          user_agent: log.userAgent
        })
      });
    } catch (_) {}
  }

  async function registrarAuditLogSupabaseSilencioso(log, deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) return;
    try {
      await deps.requisicaoSupabase("/rest/v1/audit_logs", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({
          user_id: deps.syncConfig.supabaseUserId || null,
          client_id: log.clientId || null,
          action: log.acao,
          details: log.detalhes || {}
        })
      });
    } catch (_) {}
  }

  async function tocarAcessoClienteSupabaseSilencioso(deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) return;
    try {
      await deps.requisicaoSupabase("/rest/v1/rpc/touch_client_access", {
        method: "POST",
        body: deps.JSON.stringify({})
      });
    } catch (_) {}
  }

  async function carregarSaasSupabaseSilencioso(opcoes = {}, deps = {}) {
    const renderizar = !!opcoes.renderizar;
    const feedback = !!opcoes.feedback;
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) {
      deps.definirEstadoClientesSaasRemoto({
        status: "missing-token",
        message: "Entre com a conta Supabase do Superadmin para carregar empresas.",
        detail: "NO_ACCESS_TOKEN"
      });
      deps.logSuperadminSupabaseDebug("clientes não carregados", { code: "NO_ACCESS_TOKEN" });
      if (feedback) deps.mostrarToast("Entre com a conta Supabase do Superadmin para carregar empresas.", "info", 6500);
      if (renderizar && deps.telaAtual === "clientes" && deps.isSuperAdmin()) deps.renderApp();
      return { ok: false, code: "NO_ACCESS_TOKEN" };
    }
    deps.definirEstadoClientesSaasRemoto({
      status: "loading",
      message: "Carregando empresas do Supabase...",
      detail: ""
    });
    if (renderizar && deps.telaAtual === "clientes" && deps.isSuperAdmin()) deps.renderApp();
    try {
      const avisosPermissao = [];
      const carregarPerfis = (rota, nome) => deps.requisicaoSupabase(rota).catch((erro) => {
        deps.registrarDiagnostico("Supabase/RLS", `${nome} não carregados`, erro.message);
        deps.registrarErroAplicacaoSilencioso("SUPABASE_RLS_DENIED", erro, `${nome} não carregados`, { rota });
        const classificado = deps.classificarFalhaClientesSaasRemoto(erro);
        avisosPermissao.push({ nome, status: classificado.status, detail: classificado.detail });
        deps.logSuperadminSupabaseDebug(`${nome} não carregados`, classificado.log);
        return [];
      });
      const [clientesOnline, assinaturasOnline, pagamentosOnline, planosOnline, perfisOnline, perfisErpOnline, sessoesOnline] = await deps.Promise.all([
        deps.requisicaoSupabase(`/rest/v1/clients?select=*&order=created_at.desc&limit=${deps.SUPERADMIN_PAGE_SIZE}`),
        deps.requisicaoSupabase(`/rest/v1/subscriptions?select=*,plans(*)&order=created_at.desc&limit=${deps.SUPERADMIN_PAGE_SIZE}`),
        deps.requisicaoSupabase(`/rest/v1/payments?select=*&order=created_at.desc&limit=${deps.SUPERADMIN_PAGE_SIZE}`),
        deps.requisicaoSupabase("/rest/v1/plans?select=*&order=price.asc"),
        carregarPerfis(`/rest/v1/profiles?select=*&order=created_at.desc&limit=${deps.SUPERADMIN_PAGE_SIZE}`, "profiles"),
        carregarPerfis(`/rest/v1/erp_profiles?select=*&order=created_at.desc&limit=${deps.SUPERADMIN_PAGE_SIZE}`, "erp_profiles"),
        carregarPerfis(`/rest/v1/saas_sessions?select=*&order=last_seen_at.desc&limit=200`, "saas_sessions")
      ]);
      deps.setSaasClients(deps.mesclarListaPorId(deps.getSaasClients(), clientesOnline, deps.normalizarClienteSaas));
      deps.setSaasSubscriptions(deps.mesclarAssinaturasPorCliente(deps.getSaasSubscriptions(), assinaturasOnline));
      deps.setSaasPayments(deps.mesclarListaPorId(deps.getSaasPayments(), pagamentosOnline, deps.normalizarPagamentoSaas));
      deps.setSaasPlans(deps.mesclarListaPorId(deps.getSaasPlans(), planosOnline, deps.normalizarPlanoSaas));
      deps.setSaasSessions(deps.mesclarListaPorId(deps.getSaasSessions(), sessoesOnline, deps.normalizarSessaoSaas));
      deps.setUsuarios(deps.mesclarUsuariosSupabase(deps.getUsuarios(), [...perfisOnline, ...perfisErpOnline]));
      deps.restringirDadosSaasAoEscopoAtual();
      deps.StateStore.set("usuarios", deps.getUsuarios());
      deps.salvarDados();
      if (avisosPermissao.some((aviso) => aviso.status === "permission-error")) {
        deps.definirEstadoClientesSaasRemoto({
          status: "permission-warning",
          message: "Clientes carregados, mas parte dos perfis foi bloqueada por permissão/RLS.",
          detail: "PARTIAL_RLS"
        });
      } else {
        deps.definirEstadoClientesSaasRemoto({
          status: "success",
          message: "Empresas atualizadas.",
          detail: ""
        });
      }
      if (feedback) deps.mostrarToast("Empresas Supabase atualizadas.", "sucesso", 4000);
      if (renderizar && deps.telaAtual === "clientes" && deps.isSuperAdmin()) deps.renderApp();
      return { ok: true, clientes: deps.Array.isArray(clientesOnline) ? clientesOnline.length : 0 };
    } catch (erro) {
      const classificado = deps.classificarFalhaClientesSaasRemoto(erro);
      deps.definirEstadoClientesSaasRemoto({
        status: classificado.status,
        message: classificado.message,
        detail: classificado.detail
      });
      deps.logSuperadminSupabaseDebug("clientes não carregados", classificado.log);
      deps.registrarDiagnostico("Supabase", "Dados SaaS online não carregados", erro.message);
      deps.registrarErroAplicacaoSilencioso("LOAD_CLIENTS_FAILED", erro, "Carregar clientes Supabase", { status: classificado.status, detail: classificado.detail });
      if (feedback) deps.mostrarToast(classificado.message, "erro", 6500);
      if (renderizar && deps.telaAtual === "clientes" && deps.isSuperAdmin()) deps.renderApp();
      return { ok: false, code: classificado.detail };
    }
  }

  async function registrarClienteSaasSupabase({ nome, email, negocio, telefone }, deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) return null;
    return await deps.requisicaoSupabase("/rest/v1/rpc/register_saas_client", {
      method: "POST",
      body: deps.JSON.stringify({
        p_name: negocio,
        p_responsible_name: nome,
        p_email: email,
        p_phone: telefone || null,
        p_plan_slug: "free",
        p_trial_days: 0
      })
    });
  }

  async function sincronizarUsuarioSaasAposLoginSupabase(usuario = getUsuarioAtual(), deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl || !deps.syncConfig.supabaseUserId) return null;
    const email = deps.normalizarEmail(usuario?.email || deps.syncConfig.supabaseEmail || "");
    const nome = usuario?.nome || email.split("@")[0] || "Usuario";
    const negocio = deps.appConfig.businessName || deps.getSaasClients().find((cliente) => deps.normalizarEmail(cliente.email) === email)?.name || "Minha empresa 3D";
    const telefone = usuario?.phone || "";
    try {
      const resultado = await deps.requisicaoSupabase("/rest/v1/rpc/sync_saas_user_after_login", {
        method: "POST",
        body: deps.JSON.stringify({
          p_name: nome,
          p_business_name: negocio,
          p_phone: telefone
        })
      });
      if (resultado?.client_id) {
        const clientId = deps.String(resultado.client_id);
        const companyId = resultado.company_id ? deps.String(resultado.company_id) : "";
        if (usuario) usuario.clientId = clientId;
        if (usuario && companyId) usuario.companyId = companyId;
        deps.billingConfig.clientId = clientId;
        if (companyId) deps.billingConfig.companyId = companyId;
        deps.billingConfig.licenseEmail = email || deps.billingConfig.licenseEmail;
        if (resultado.subscription_id) deps.billingConfig.subscriptionId = deps.String(resultado.subscription_id);
        if (resultado.plan_slug) deps.billingConfig.planSlug = deps.String(resultado.plan_slug);
        if (resultado.status) deps.billingConfig.licenseStatus = deps.String(resultado.status);
        deps.marcarUsuarioSupabaseSincronizado(usuario);
        deps.salvarDados();
      }
      deps.debugInfo("[Supabase pós-login] sync_saas_user_after_login OK", {
        clientId: resultado?.client_id || "",
        companyId: resultado?.company_id || "",
        subscriptionId: resultado?.subscription_id || "",
        plan: resultado?.plan_slug || ""
      });
      return resultado;
    } catch (erro) {
      deps.logFalhaSyncSaas("sync_saas_user_after_login", erro);
      deps.registrarDiagnostico("Supabase", "Sincronização pós-login falhou", erro.message);
      throw erro;
    }
  }

  async function consultarLicencaSupabaseSilencioso(options = {}, deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) return null;
    const targetUserId = deps.String(options.targetUserId || options.userId || "").trim();
    const body = targetUserId ? { p_user_id: targetUserId } : {};
    try {
      const licenca = await deps.requisicaoSupabase("/rest/v1/rpc/get_effective_license", {
        method: "POST",
        body: deps.JSON.stringify(body)
      });
      if (options.aplicar !== false) deps.aplicarLicencaSaasOnline(licenca, { stale: false, source: "backend-rpc" });
      return licenca;
    } catch (erroNovo) {
      try {
        const licencaLegada = await deps.requisicaoSupabase("/rest/v1/rpc/get_saas_license", {
          method: "POST",
          body: deps.JSON.stringify({})
        });
        if (options.aplicar !== false) deps.aplicarLicencaSaasOnline(licencaLegada, { stale: false, source: "backend-rpc-legacy" });
        return licencaLegada;
      } catch (erro) {
        deps.registrarDiagnostico("Supabase", "Licença online não carregada", erro.message);
        deps.registrarErroAplicacaoSilencioso("LOAD_SUBSCRIPTION_FAILED", erro, "Carregar licença SaaS", { newRpcError: erroNovo.message || deps.String(erroNovo) });
        const cache = deps.getLicencaEfetivaSnapshotLocal();
        if (cache && options.aplicar !== false) {
          deps.billingConfig.effectiveLicenseStale = true;
          deps.billingConfig.effectiveLicenseSource = "backend-rpc-cache-stale";
          deps.salvarDados();
          return cache;
        }
        return null;
      }
    }
  }

  global.SimplificaSecurityAudit = {
    registrarSecurityLogSupabaseSilencioso,
    registrarAuditLogSupabaseSilencioso,
    tocarAcessoClienteSupabaseSilencioso,
    carregarSaasSupabaseSilencioso,
    registrarClienteSaasSupabase,
    sincronizarUsuarioSaasAposLoginSupabase,
    consultarLicencaSupabaseSilencioso
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaSecurityAudit;
  }
})(typeof window !== "undefined" ? window : globalThis);
