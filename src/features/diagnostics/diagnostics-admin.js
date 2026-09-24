(function attachDiagnosticsAdmin(global) {
  "use strict";

  function configurarTelemetriaErros(deps = {}) {
    try {
      if (!deps.window.ErrorTelemetry?.configure) return;
      deps.window.appConfig = deps.appConfig;
      deps.window.ErrorTelemetry.configure({
        getContext: () => {
          const usuario = deps.getUsuarioAtual();
          return {
            userEmail: deps.normalizarEmail(deps.syncConfig.supabaseEmail || usuario?.email || deps.billingConfig.licenseEmail || ""),
            appVersion: deps.APP_VERSION,
            screenName: deps.telaAtual || "",
            deviceModel: deps.syncConfig.deviceName || deps.deviceId || deps.navigator.platform || "",
            osVersion: deps.navigator.userAgent || "",
            platform: deps.window.Capacitor?.getPlatform?.() || (deps.navigator.userAgentData?.mobile ? "mobile-web" : "web")
          };
        },
        send: (payload) => deps.requisicaoSupabase("/rest/v1/rpc/register_app_error", {
          method: "POST",
          telemetry: false,
          body: deps.JSON.stringify(payload)
        })
      });
    } catch (_) {}
    try {
      if (!deps.window.DiagnosticsService?.configure) return;
      deps.window.DiagnosticsService.configure({
        getContext: () => {
          const usuario = deps.getUsuarioAtual();
          const planState = deps.getPlanAccessState(usuario || {});
          return {
            userId: deps.pareceUuid(deps.syncConfig.supabaseUserId) ? deps.syncConfig.supabaseUserId : "",
            userEmail: deps.normalizarEmail(deps.syncConfig.supabaseEmail || usuario?.email || deps.billingConfig.licenseEmail || ""),
            appVersion: deps.APP_VERSION,
            buildNumber: deps.String(deps.APP_VERSION_CODE || ""),
            screen: deps.telaAtual || "",
            action: "",
            deviceModel: deps.syncConfig.deviceName || deps.deviceId || deps.navigator.platform || "",
            os: deps.navigator.userAgent || "",
            browser: deps.navigator.userAgent || "",
            platform: deps.window.Capacitor?.getPlatform?.() || (deps.navigator.userAgentData?.mobile ? "mobile-web" : "web"),
            isPwa: deps.window.matchMedia?.("(display-mode: standalone)")?.matches || false,
            isApk: !!deps.window.Capacitor?.isNativePlatform?.(),
            route: deps.location.pathname || "",
            planAtTime: planState.currentPlan || "",
            subscriptionStatusAtTime: planState.subscriptionStatus || "",
            paymentStatusAtTime: planState.paymentStatus || ""
          };
        },
        send: (kind, payload) => {
          if (kind === "error") {
            return deps.requisicaoSupabase("/rest/v1/rpc/register_app_error", {
              method: "POST",
              telemetry: false,
              body: deps.JSON.stringify({
                p_error_key: payload.fingerprint || payload.error_type || "APP_ERROR",
                p_error_message: payload.error_message,
                p_screen_name: payload.screen || payload.screen_name,
                p_action_name: payload.action || payload.action_name,
                p_app_version: payload.app_version,
                p_device_model: payload.device_model,
                p_os_version: payload.os,
                p_platform: payload.platform,
                p_metadata: payload.metadata_json || {},
                p_user_email: payload.user_email || ""
              })
            });
          }
          if (kind === "feedback") {
            return deps.requisicaoSupabase("/rest/v1/app_feedback_reports", {
              method: "POST",
              headers: { Prefer: "return=minimal" },
              telemetry: false,
              body: deps.JSON.stringify(payload)
            });
          }
          if (kind === "event") {
            return deps.requisicaoSupabase("/rest/v1/app_diagnostic_events", {
              method: "POST",
              headers: { Prefer: "return=minimal" },
              telemetry: false,
              body: deps.JSON.stringify(payload)
            });
          }
          return deps.Promise.resolve(false);
        }
      });
    } catch (_) {}
  }

  async function carregarRelatoriosAutomaticosSupabase(opcoes = {}, deps = {}) {
    const estado = deps.getEstadoTelemetriaSuperadmin();
    if (!deps.isSuperAdmin()) return;
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) {
      estado.erros = "missing-token";
      estado.errosMessage = "Entre com a conta Supabase do superadmin para carregar relatórios automáticos.";
      if (opcoes.renderizar) deps.renderApp();
      return;
    }
    estado.erros = "loading";
    estado.errosMessage = "Carregando relatórios automáticos...";
    if (opcoes.renderizar) deps.renderApp();
    try {
      const linhas = await deps.requisicaoSupabase("/rest/v1/app_error_logs?select=*&order=last_seen_at.desc&limit=120", { method: "GET" });
      deps.setAppErrorLogsRemotos(deps.Array.isArray(linhas) ? linhas : []);
      estado.erros = "loaded";
      estado.errosMessage = "";
    } catch (erro) {
      deps.setAppErrorLogsRemotos([]);
      estado.erros = "error";
      estado.errosMessage = deps.ErrorService.toAppError(erro).userMessage || "Não foi possível carregar relatórios automáticos.";
      deps.registrarErroAplicacaoSilencioso("LOAD_ERROR_REPORTS_FAILED", erro, "Carregar relatórios automáticos");
    }
    if (opcoes.renderizar) deps.renderApp();
  }

  async function carregarFeedbackReportsSupabase(opcoes = {}, deps = {}) {
    const estado = deps.getEstadoTelemetriaSuperadmin();
    if (!deps.isSuperAdmin()) return;
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) {
      estado.feedback = "missing-token";
      estado.feedbackMessage = "Entre com a conta Supabase do superadmin para carregar feedbacks.";
      if (opcoes.renderizar) deps.renderApp();
      return;
    }
    estado.feedback = "loading";
    estado.feedbackMessage = "Carregando feedbacks...";
    if (opcoes.renderizar) deps.renderApp();
    try {
      const linhas = await deps.requisicaoSupabase("/rest/v1/app_feedback_reports?select=*&order=created_at.desc&limit=120", { method: "GET" });
      deps.setAppFeedbackReportsRemotos(deps.Array.isArray(linhas) ? linhas : []);
      estado.feedback = "loaded";
      estado.feedbackMessage = "";
    } catch (erro) {
      deps.setAppFeedbackReportsRemotos([]);
      estado.feedback = "error";
      estado.feedbackMessage = deps.ErrorService.toAppError(erro).userMessage || "Não foi possível carregar feedbacks.";
      deps.registrarErroAplicacaoSilencioso("LOAD_FEEDBACK_REPORTS_FAILED", erro, "Carregar feedbacks superadmin");
    }
    if (opcoes.renderizar) deps.renderApp();
  }

  async function carregarSugestoesSupabase(opcoes = {}, deps = {}) {
    const estado = deps.getEstadoTelemetriaSuperadmin();
    if (!deps.isSuperAdmin()) return;
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) {
      estado.sugestoes = "missing-token";
      estado.sugestoesMessage = "Entre com a conta Supabase do superadmin para carregar sugestões.";
      if (opcoes.renderizar) deps.renderApp();
      return;
    }
    estado.sugestoes = "loading";
    estado.sugestoesMessage = "Carregando sugestões...";
    if (opcoes.renderizar) deps.renderApp();
    try {
      const linhas = await deps.requisicaoSupabase("/rest/v1/app_suggestions?select=*&order=created_at.desc&limit=200", { method: "GET" });
      deps.setAppSuggestionsRemotas(deps.Array.isArray(linhas) ? linhas : []);
      estado.sugestoes = "loaded";
      estado.sugestoesMessage = "";
    } catch (erro) {
      deps.setAppSuggestionsRemotas([]);
      estado.sugestoes = "error";
      estado.sugestoesMessage = deps.ErrorService.toAppError(erro).userMessage || "Não foi possível carregar sugestões.";
      deps.registrarErroAplicacaoSilencioso("LOAD_APP_SUGGESTIONS_FAILED", erro, "Carregar sugestões superadmin");
    }
    if (opcoes.renderizar) deps.renderApp();
  }

  async function carregarDiagnosticosSuperadminSupabase(opcoes = {}, deps = {}) {
    const estado = deps.getEstadoTelemetriaSuperadmin();
    if (!deps.isSuperAdmin()) return;
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) {
      estado.diagnosticos = "missing-token";
      estado.diagnosticosMessage = "Entre com a conta Supabase do superadmin para carregar diagnósticos.";
      if (opcoes.renderizar) deps.renderApp();
      return;
    }
    estado.diagnosticos = "loading";
    estado.diagnosticosMessage = "Carregando diagnósticos...";
    if (opcoes.renderizar) deps.renderApp();
    try {
      const [eventos, clusters, exports] = await deps.Promise.all([
        deps.requisicaoSupabase("/rest/v1/app_diagnostic_events?select=*&order=created_at.desc&limit=160", { method: "GET" }),
        deps.requisicaoSupabase("/rest/v1/app_bug_clusters?select=*&order=last_seen_at.desc&limit=120", { method: "GET" }),
        deps.requisicaoSupabase("/rest/v1/app_bug_reports_exports?select=*&order=created_at.desc&limit=80", { method: "GET" })
      ]);
      deps.setAppDiagnosticEventsRemotos(deps.Array.isArray(eventos) ? eventos : []);
      deps.setAppBugClustersRemotos(deps.Array.isArray(clusters) ? clusters : []);
      deps.setAppBugReportsExportsRemotos(deps.Array.isArray(exports) ? exports : []);
      estado.diagnosticos = "loaded";
      estado.diagnosticosMessage = "";
    } catch (erro) {
      deps.setAppDiagnosticEventsRemotos([]);
      deps.setAppBugClustersRemotos([]);
      deps.setAppBugReportsExportsRemotos([]);
      estado.diagnosticos = "error";
      estado.diagnosticosMessage = deps.ErrorService.toAppError(erro).userMessage || "Não foi possível carregar diagnósticos.";
      deps.registrarErroAplicacaoSilencioso("LOAD_DIAGNOSTICS_FAILED", erro, "Carregar diagnósticos superadmin");
    }
    if (opcoes.renderizar) deps.renderApp();
  }

  async function atualizarStatusRelatorioAutomatico(id, status, deps = {}) {
    if (!deps.isSuperAdmin() || !id) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_error_logs?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ status })
      });
      deps.setAppErrorLogsRemotos(deps.getAppErrorLogsRemotos().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, status } : item));
      deps.mostrarToast("Status do relatório atualizado.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar status relatório", errorKey: "UPDATE_ERROR_REPORT_STATUS_FAILED" });
    }
  }

  async function atualizarSeveridadeRelatorioAutomatico(id, severity, deps = {}) {
    if (!deps.isSuperAdmin() || !id || !severity) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_error_logs?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ severity })
      });
      deps.setAppErrorLogsRemotos(deps.getAppErrorLogsRemotos().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, severity } : item));
      deps.mostrarToast("Severidade do bug atualizada.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar severidade bug", errorKey: "UPDATE_ERROR_REPORT_SEVERITY_FAILED" });
    }
  }

  async function atualizarNotaAdminBug(id, deps = {}) {
    if (!deps.isSuperAdmin() || !id) return;
    const atual = deps.getAppErrorLogsRemotos().find((item) => deps.String(item.id) === deps.String(id))?.admin_notes || "";
    const admin_notes = deps.prompt("Nota administrativa do bug", atual);
    if (admin_notes === null) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_error_logs?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ admin_notes })
      });
      deps.setAppErrorLogsRemotos(deps.getAppErrorLogsRemotos().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, admin_notes } : item));
      deps.mostrarToast("Nota administrativa salva.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar nota bug", errorKey: "UPDATE_ERROR_REPORT_NOTE_FAILED" });
    }
  }

  async function atualizarStatusFeedbackReport(id, status, deps = {}) {
    if (!deps.isSuperAdmin() || !id) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_feedback_reports?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ status })
      });
      deps.setAppFeedbackReportsRemotos(deps.getAppFeedbackReportsRemotos().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, status } : item));
      deps.mostrarToast("Status do feedback atualizado.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar status feedback", errorKey: "UPDATE_FEEDBACK_STATUS_FAILED" });
    }
  }

  async function atualizarNotaAdminFeedback(id, deps = {}) {
    if (!deps.isSuperAdmin() || !id) return;
    const atual = deps.getAppFeedbackReportsRemotos().find((item) => deps.String(item.id) === deps.String(id))?.admin_notes || "";
    const admin_notes = deps.prompt("Nota administrativa do feedback", atual);
    if (admin_notes === null) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_feedback_reports?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ admin_notes })
      });
      deps.setAppFeedbackReportsRemotos(deps.getAppFeedbackReportsRemotos().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, admin_notes } : item));
      deps.mostrarToast("Nota administrativa salva.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar nota feedback", errorKey: "UPDATE_FEEDBACK_NOTE_FAILED" });
    }
  }

  async function atualizarStatusSugestaoApp(id, status, deps = {}) {
    if (!deps.isSuperAdmin() || !id) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_suggestions?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ status })
      });
      deps.setAppSuggestionsRemotas(deps.getAppSuggestionsRemotas().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, status } : item));
      deps.mostrarToast("Status da sugestão atualizado.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar status sugestão", errorKey: "UPDATE_APP_SUGGESTION_STATUS_FAILED" });
    }
  }

  async function atualizarStatusClusterDiagnostico(id, status, deps = {}) {
    if (!deps.isSuperAdmin() || !id || !status) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_bug_clusters?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ status })
      });
      deps.setAppBugClustersRemotos(deps.getAppBugClustersRemotos().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, status } : item));
      deps.mostrarToast("Status do cluster atualizado.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar status cluster", errorKey: "UPDATE_BUG_CLUSTER_STATUS_FAILED" });
    }
  }

  async function atualizarSeveridadeClusterDiagnostico(id, severity, deps = {}) {
    if (!deps.isSuperAdmin() || !id || !severity) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_bug_clusters?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ severity })
      });
      deps.setAppBugClustersRemotos(deps.getAppBugClustersRemotos().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, severity } : item));
      deps.mostrarToast("Severidade do cluster atualizada.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar severidade cluster", errorKey: "UPDATE_BUG_CLUSTER_SEVERITY_FAILED" });
    }
  }

  async function atualizarNotaAdminCluster(id, deps = {}) {
    if (!deps.isSuperAdmin() || !id) return;
    const atual = deps.getAppBugClustersRemotos().find((item) => deps.String(item.id) === deps.String(id))?.admin_notes || "";
    const admin_notes = deps.prompt("Nota administrativa do cluster", atual);
    if (admin_notes === null) return;
    try {
      await deps.requisicaoSupabase(`/rest/v1/app_bug_clusters?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ admin_notes })
      });
      deps.setAppBugClustersRemotos(deps.getAppBugClustersRemotos().map((item) => deps.String(item.id) === deps.String(id) ? { ...item, admin_notes } : item));
      deps.mostrarToast("Nota administrativa salva.", "sucesso", 3500);
      deps.renderApp();
    } catch (erro) {
      deps.ErrorService.notify(erro, { area: "Superadmin", action: "Atualizar nota cluster", errorKey: "UPDATE_BUG_CLUSTER_NOTE_FAILED" });
    }
  }

  async function gerarRelatorioCodexDiagnostico(id = "", tipo = "bug", deps = {}) {
    if (!deps.isSuperAdmin()) return;
    const bugsValidos = deps.filtrarRelatoriosAutomaticos(deps.getAppErrorLogsRemotos());
    const clustersValidos = deps.filtrarBugClusters(deps.getAppBugClustersRemotos());
    const feedbacksValidos = deps.filtrarFeedbackReports(deps.getAppFeedbackReportsRemotos());
    const bug = tipo === "cluster"
      ? clustersValidos.find((item) => deps.String(item.id) === deps.String(id)) || clustersValidos[0]
      : bugsValidos.find((item) => deps.String(item.id) === deps.String(id)) || bugsValidos[0] || clustersValidos[0];
    if (!bug) {
      deps.mostrarToast("Nenhum diagnóstico disponível para gerar relatório.", "info");
      return;
    }
    const report = deps.window.DiagnosticsService?.generateCodexTechnicalReport
      ? deps.window.DiagnosticsService.generateCodexTechnicalReport({
        bug,
        events: deps.getAppDiagnosticEventsRemotos().filter((event) => event.fingerprint && event.fingerprint === bug.fingerprint).slice(0, 8),
        feedbacks: feedbacksValidos.slice(0, 5)
      })
      : `# Relatório técnico para correção\n\n## Resumo\n${bug.error_message || bug.summary || bug.fingerprint || "Diagnóstico coletado."}`;
    deps.window.__codexDiagnosticsReport = report;
    try {
      deps.navigator.clipboard?.writeText(report).catch(() => {});
    } catch (_) {}
    const exportPayload = {
      created_by: deps.pareceUuid(deps.syncConfig.supabaseUserId) ? deps.syncConfig.supabaseUserId : null,
      report_title: `Relatório Codex - ${bug.title || bug.error_key || bug.fingerprint || "diagnóstico"}`.slice(0, 180),
      filters_json: {
        type: tipo,
        generated_from_id: id || bug.id || null,
        severity: bug.severity || null,
        status: bug.status || null
      },
      summary: deps.String(bug.summary || bug.error_message || bug.error_key || bug.fingerprint || "Diagnóstico").slice(0, 900),
      technical_report: report,
      related_error_ids: tipo === "bug" && bug.id ? [bug.id] : [],
      related_feedback_ids: feedbacksValidos.slice(0, 5).map((item) => item.id).filter(Boolean),
      related_cluster_ids: tipo === "cluster" && bug.id ? [bug.id] : [],
      status: "generated"
    };
    try {
      if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) throw new Error("Supabase indisponível para salvar relatório técnico.");
      const salvo = await deps.requisicaoSupabase("/rest/v1/app_bug_reports_exports?select=*", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: deps.JSON.stringify(exportPayload)
      });
      const item = deps.Array.isArray(salvo) ? salvo[0] : salvo;
      if (item?.id) deps.setAppBugReportsExportsRemotos([item, ...appBugReportsExportsRemotos.filter((registro) => deps.String(registro.id) !== deps.String(item.id))].slice(0, 80));
      deps.mostrarToast("Relatório técnico para Codex gerado e salvo.", "sucesso", 4200);
    } catch (erro) {
      deps.setAppBugReportsExportsRemotos([{ ...exportPayload, id: `local-${deps.Date.now()}`, created_at: new deps.Date().toISOString() }, ...appBugReportsExportsRemotos].slice(0, 80));
      deps.mostrarToast("Relatório gerado localmente. Não foi possível salvar no Supabase agora.", "aviso", 5200);
      deps.registrarErroAplicacaoSilencioso("SAVE_CODEX_REPORT_EXPORT_FAILED", erro, "Salvar relatório Codex");
    }
    deps.renderApp();
  }

  async function salvarFeedbackManualSupabase(form, deps = {}) {
    if (deps.window.DiagnosticsService?.reportFeedback) {
      const resultado = await deps.window.DiagnosticsService.reportFeedback(deps.montarPayloadFeedbackManual(form));
      if (resultado?.queued || resultado?.ok) return resultado;
    }
    return deps.requisicaoSupabase("/rest/v1/app_feedback_reports", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: deps.JSON.stringify(deps.montarPayloadFeedbackManual(form))
    });
  }

  async function salvarSugestaoSupabase(payload, deps = {}) {
    return deps.requisicaoSupabase("/rest/v1/app_suggestions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: deps.JSON.stringify(payload)
    });
  }

  global.SimplificaDiagnosticsAdmin = {
    configurarTelemetriaErros,
    carregarRelatoriosAutomaticosSupabase,
    carregarFeedbackReportsSupabase,
    carregarSugestoesSupabase,
    carregarDiagnosticosSuperadminSupabase,
    atualizarStatusRelatorioAutomatico,
    atualizarSeveridadeRelatorioAutomatico,
    atualizarNotaAdminBug,
    atualizarStatusFeedbackReport,
    atualizarNotaAdminFeedback,
    atualizarStatusSugestaoApp,
    atualizarStatusClusterDiagnostico,
    atualizarSeveridadeClusterDiagnostico,
    atualizarNotaAdminCluster,
    gerarRelatorioCodexDiagnostico,
    salvarFeedbackManualSupabase,
    salvarSugestaoSupabase
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaDiagnosticsAdmin;
  }
})(typeof window !== "undefined" ? window : globalThis);
