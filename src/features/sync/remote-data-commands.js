(function attachRemoteData(global) {
  "use strict";

  async function enviarAnalyticsDashboardSilencioso(analytics, deps = {}) {
    if (!analytics || !deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId) return false;
    await deps.requisicaoSupabase("/rest/v1/rpc/upsert_dashboard_analytics_snapshot", {
      method: "POST",
      telemetry: false,
      body: deps.JSON.stringify({
        p_period_type: analytics.period_type,
        p_period_reference: analytics.period_reference,
        p_company_id: deps.billingConfig.companyId || deps.getUsuarioAtual()?.companyId || null,
        p_total_sales: deps.Number(analytics.total_sales) || 0,
        p_total_profit: deps.Number(analytics.total_profit) || 0,
        p_total_orders: deps.Number(analytics.total_orders) || 0,
        p_material_cost: deps.Number(analytics.material_cost) || 0,
        p_energy_cost: deps.Number(analytics.energy_cost) || 0,
        p_printer_hours: deps.Number(analytics.printer_hours) || 0,
        p_cash_balance: deps.Number(analytics.cash_balance) || 0,
        p_chart_series: analytics.chart_series || [],
        p_insights: analytics.insights || []
      })
    });
    return true;
  }

  async function carregarAnalyticsBackendSilencioso(periodo, deps = {}) {
    if (deps.getDashboardAnalyticsRequest() || !deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId || !deps.estaOnline()) return null;
    const periodType = deps.normalizarPeriodoDashboard(periodo);
    const periodReference = deps.getPeriodoReferenciaIso(periodType);
    deps.setDashboardAnalyticsRequest(deps.requisicaoSupabase("/rest/v1/rpc/get_dashboard_analytics", {
      method: "POST",
      telemetry: false,
      body: deps.JSON.stringify({
        p_period_type: periodType,
        p_period_reference: periodReference
      })
    }).then((dados) => {
      if (dados && dados.source && dados.source !== "empty") {
        deps.dashboardAnalyticsCache[deps.getDashboardAnalyticsCacheKey(periodType)] = {
          ...deps.dashboardAnalyticsCache[deps.getDashboardAnalyticsCacheKey(periodType)],
          ...dados
        };
        deps.salvarDados();
        if (deps.telaAtual === "dashboard") deps.agendarRenderizacaoPreservandoScroll(180);
      }
      return dados;
    }).catch((erro) => {
      deps.registrarDiagnostico("Analytics", "Leitura remota do dashboard indisponível", erro.message);
      return null;
    }).finally(() => {
      deps.setDashboardAnalyticsRequest(null);
    }));
    return deps.getDashboardAnalyticsRequest();
  }

  async function obterBackupSupabase(deps = {}) {
    const userId = deps.encodeURIComponent(deps.syncConfig.supabaseUserId);
    const linhas = await deps.requisicaoSupabase(`/rest/v1/erp_backups?select=payload,updated_at&user_id=eq.${userId}&limit=1`, {
      method: "GET"
    });
    return Array.isArray(linhas) && linhas[0] ? linhas[0].payload : null;
  }

  async function obterRegistrosErpSupabase(deps = {}) {
    const userId = deps.encodeURIComponent(deps.syncConfig.supabaseUserId);
    const pageSize = 1000;
    const resultado = [];
    for (let offset = 0; offset < 10000; offset += pageSize) {
      const linhas = await deps.requisicaoSupabase(`/rest/v1/erp_records?select=collection,record_id,user_id,owner_id,data,created_at,updated_at,deleted_at&user_id=eq.${userId}&deleted_at=is.null&order=updated_at.asc&limit=${pageSize}&offset=${offset}`, {
        method: "GET"
      });
      const pagina = Array.isArray(linhas) ? linhas : [];
      resultado.push(...pagina);
      if (pagina.length < pageSize) break;
    }
    return resultado;
  }

  async function salvarBackupSupabase(opcoes = {}, deps = {}) {
    if (deps.window.__simplificaOrderValidationSandbox === true || deps.localStorage.getItem("simplifica_order_validation_sandbox") === "1") return false;
    const contexto = opcoes.contexto || "supabase-upload";
    const avisarLimite = opcoes.avisarLimite !== false;
    const payload = deps.criarSnapshotBackupUsuarioAtual();
    if (!deps.verificarLimiteBackupPlano(payload, avisarLimite, contexto)) {
      deps.syncConfig.autoBackupStatus = deps.backupEmModoSomenteLeitura(payload) ? "Backup em somente leitura" : "Limite de backup atingido";
      deps.salvarDados();
      return false;
    }
    await deps.requisicaoSupabase("/rest/v1/erp_backups?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: deps.JSON.stringify({
        user_id: deps.syncConfig.supabaseUserId,
        owner_id: deps.getDataOwnerId(),
        device_id: deps.deviceId,
        payload
      })
    });
    return true;
  }

  async function limparTrocaSenhaObrigatoriaSupabase(deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId) return false;
    await deps.requisicaoSupabase(`/rest/v1/erp_profiles?id=eq.${deps.encodeURIComponent(deps.syncConfig.supabaseUserId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: deps.JSON.stringify({
        must_change_password: false,
        updated_at: new deps.Date().toISOString()
      })
    });
    return true;
  }

  global.SimplificaRemoteData = {
    enviarAnalyticsDashboardSilencioso,
    carregarAnalyticsBackendSilencioso,
    obterBackupSupabase,
    obterRegistrosErpSupabase,
    salvarBackupSupabase,
    limparTrocaSenhaObrigatoriaSupabase
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaRemoteData;
  }
})(typeof window !== "undefined" ? window : globalThis);
