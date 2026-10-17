(function attachSaasAdmin(global) {
  "use strict";

  async function atualizarClienteSaasSupabaseParcial(id, payload = {}, deps = {}) {
    if (!deps.podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
    await deps.requisicaoSupabase(`/rest/v1/clients?id=eq.${deps.encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: deps.JSON.stringify({ ...payload, updated_at: new deps.Date().toISOString() })
    });
    return { ok: true };
  }

  async function atualizarStatusPerfisClienteSupabase(id, status, deps = {}) {
    if (!deps.podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
    const statusPerfil = status === "blocked" ? "blocked" : "active";
    await deps.Promise.all([
      deps.requisicaoSupabase(`/rest/v1/profiles?client_id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ status: statusPerfil, updated_at: new deps.Date().toISOString() })
      }).catch((erro) => deps.registrarDiagnostico("Supabase", "Status profiles não atualizado", erro.message)),
      deps.requisicaoSupabase(`/rest/v1/erp_profiles?client_id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ status: statusPerfil, updated_at: new deps.Date().toISOString() })
      }).catch((erro) => deps.registrarDiagnostico("Supabase", "Status erp_profiles não atualizado", erro.message))
    ]);
    return { ok: true };
  }

  async function atualizarDadosPerfisClienteSupabase(id, payload = {}, deps = {}) {
    if (!deps.podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
    const atualizadoEm = new deps.Date().toISOString();
    await deps.Promise.all([
      deps.requisicaoSupabase(`/rest/v1/profiles?client_id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({
          ...(payload.name ? { name: payload.name } : {}),
          ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
          updated_at: atualizadoEm
        })
      }).catch((erro) => deps.registrarDiagnostico("Supabase", "Dados profiles não atualizados", erro.message)),
      deps.requisicaoSupabase(`/rest/v1/erp_profiles?client_id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({
          ...(payload.name ? { display_name: payload.name } : {}),
          ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
          updated_at: atualizadoEm
        })
      }).catch((erro) => deps.registrarDiagnostico("Supabase", "Dados erp_profiles não atualizados", erro.message))
    ]);
    return { ok: true };
  }

  async function atualizarFlagTesteClienteSaasSupabase(id, isTestUser, deps = {}) {
    if (!deps.podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
    await deps.Promise.all([
      deps.requisicaoSupabase(`/rest/v1/clients?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ is_test_user: isTestUser === true, updated_at: new deps.Date().toISOString() })
      }),
      deps.requisicaoSupabase(`/rest/v1/profiles?client_id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ is_test_user: isTestUser === true, updated_at: new deps.Date().toISOString() })
      }).catch((erro) => deps.registrarDiagnostico("Supabase", "Flag teste profiles não atualizada", erro.message)),
      deps.requisicaoSupabase(`/rest/v1/erp_profiles?client_id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ is_test_user: isTestUser === true, updated_at: new deps.Date().toISOString() })
      }).catch((erro) => deps.registrarDiagnostico("Supabase", "Flag teste erp_profiles não atualizada", erro.message))
    ]);
    return { ok: true };
  }

  async function atualizarAnonimizacaoClienteSaasSupabase(id, emailAnonimo, deps = {}) {
    if (!deps.podeSalvarAdminSupabaseRemoto()) return { ok: false, skipped: true, reason: "NO_SUPABASE_SESSION" };
    const atualizadoEm = new deps.Date().toISOString();
    await deps.Promise.all([
      deps.requisicaoSupabase(`/rest/v1/clients?id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({
          name: "Cliente anonimizado",
          responsible_name: null,
          nome_responsavel: null,
          email: emailAnonimo,
          phone: null,
          status: "anonymized",
          anonymized_at: atualizadoEm,
          updated_at: atualizadoEm
        })
      }),
      deps.requisicaoSupabase(`/rest/v1/profiles?client_id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ name: "Usuário anonimizado", email: emailAnonimo, phone: null, status: "inactive", updated_at: atualizadoEm })
      }).catch((erro) => deps.registrarDiagnostico("Supabase", "Profiles não anonimizados", erro.message)),
      deps.requisicaoSupabase(`/rest/v1/erp_profiles?client_id=eq.${deps.encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ display_name: "Usuário anonimizado", email: emailAnonimo, phone: null, status: "inactive", updated_at: atualizadoEm })
      }).catch((erro) => deps.registrarDiagnostico("Supabase", "ERP profiles não anonimizados", erro.message))
    ]);
    return { ok: true };
  }

  async function obterPlanIdSupabase(slug, deps = {}) {
    const plano = deps.getPlanoSaas(slug);
    if (deps.pareceUuid(plano.id)) return plano.id;
    if (!deps.podeSalvarAdminSupabaseRemoto()) return "";
    const linhas = await deps.requisicaoSupabase(`/rest/v1/plans?select=id,slug&slug=eq.${deps.encodeURIComponent(slug)}&limit=1`, {
      method: "GET"
    });
    const remoto = deps.Array.isArray(linhas) ? linhas[0] : null;
    if (remoto?.id) {
      deps.setSaasPlans(deps.mesclarListaPorId(deps.getSaasPlans(), [remoto], deps.normalizarPlanoSaas));
      deps.salvarDados();
      return deps.String(remoto.id);
    }
    return "";
  }

  async function excluirUsuarioTesteSaas(id, deps = {}) {
    if (!deps.isSuperAdmin()) return;
    const cliente = deps.getClienteSaasPorId(id);
    if (!cliente) return;
    if (cliente.isTestUser !== true) {
      deps.alert("Exclusão completa bloqueada. Marque o cliente como usuário de teste antes de excluir.");
      return;
    }

    const resumo = deps.contarResumoExclusaoClienteTesteLocal(id);
    const confirmacao = await deps.solicitarEntradaTexto({
      titulo: "Excluir usuário de teste",
      mensagem: deps.textoResumoExclusaoClienteTeste(cliente, resumo),
      valor: "",
      obrigatorio: true
    });
    if (confirmacao === null) return;
    if (deps.String(confirmacao).trim() !== "EXCLUIR TESTE") {
      deps.mostrarToast("Confirmação inválida. Nada foi excluído.", "erro", 5500);
      return;
    }

    const toast = deps.mostrarToast("Salvando...", "loading");
    try {
      if (!deps.podeSalvarAdminSupabaseRemoto()) {
        throw new Error("Sessão Supabase de superadmin indisponível.");
      }
      const remoto = await deps.requisicaoSupabase("/rest/v1/rpc/delete_test_user_client", {
        method: "POST",
        body: deps.JSON.stringify({ p_client_id: id, p_confirmation: "EXCLUIR TESTE" })
      });
      if (remoto?.ok !== true) throw new Error("RPC não confirmou a exclusão remota.");
      const authConfirmado = remoto?.auth_verified_absent === true || remoto?.auth_deleted === true;
      if (!authConfirmado) {
        throw new Error(remoto?.auth_delete_error || "Auth não confirmou a remoção do usuário. Exclusão local cancelada.");
      }
      const residuos = remoto?.remaining && typeof remoto.remaining === "object" ? remoto.remaining : {};
      const totalResiduos = deps.Object.values(residuos).reduce((total, valor) => total + (deps.Number(valor) || 0), 0);
      if (totalResiduos > 0) {
        throw new Error("Exclusão remota deixou resíduos. Exclusão local cancelada.");
      }
      const resumoLocal = deps.removerDadosLocaisUsuarioTesteSaas(id);
      deps.registrarAuditoria("exclusão usuário teste", {
        email: cliente.email,
        resumo: resumoLocal,
        remoto: remoto?.ok === true,
        authDeleted: remoto?.auth_deleted === true,
        authVerifiedAbsent: remoto?.auth_verified_absent === true
      }, id);
      deps.mostrarToast("Usuário de teste excluído com segurança.", "sucesso", 4200);
      deps.renderApp();
    } catch (erro) {
      deps.registrarDiagnostico("Superadmin", "Erro ao excluir usuário de teste", erro.message);
      deps.mostrarToast(`Falha ao atualizar: ${erro.message}`, "erro", 6500);
    } finally {
      toast?.remove?.();
    }
  }

  async function carregarCatalogoPlanosSuperadminRemoto({ feedback = true } = {}, deps = {}) {
    if (!deps.isSuperAdmin()) return null;
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl) {
      deps.setSuperAdminPlanCatalogRemoteState({
        status: "missing-token",
        message: "Entre com a conta Supabase do superadmin para carregar o catálogo remoto.",
        updatedAt: "",
        data: null
      });
      if (feedback) deps.mostrarToast(deps.getSuperAdminPlanCatalogRemoteState().message, "info", 5200);
      deps.renderApp();
      return null;
    }
    deps.setSuperAdminPlanCatalogRemoteState({
      ...deps.getSuperAdminPlanCatalogRemoteState(),
      status: "loading",
      message: "Carregando catálogo remoto de planos..."
    });
    deps.renderApp();
    try {
      const data = await deps.requisicaoSupabase("/rest/v1/rpc/get_superadmin_plan_catalog", {
        method: "POST",
        body: deps.JSON.stringify({})
      });
      deps.setSuperAdminPlanCatalogRemoteState({
        status: "success",
        message: "Catálogo remoto carregado.",
        updatedAt: new deps.Date().toISOString(),
        data: data && typeof data === "object" ? data : null
      });
      if (feedback) deps.mostrarToast("Catálogo remoto de planos atualizado.", "sucesso", 3600);
      deps.renderApp();
      return data;
    } catch (erro) {
      deps.setSuperAdminPlanCatalogRemoteState({
        status: "error",
        message: deps.ErrorService.toAppError(erro).userMessage || "Não foi possível carregar o catálogo remoto de planos.",
        updatedAt: "",
        data: null
      });
      deps.registrarDiagnostico("Superadmin Planos", "Catálogo remoto não carregado", erro.message || deps.String(erro));
      deps.registrarErroAplicacaoSilencioso("LOAD_PLAN_CATALOG_FAILED", erro, "Carregar catálogo remoto de planos");
      if (feedback) deps.mostrarToast(deps.getSuperAdminPlanCatalogRemoteState().message, "erro", 5200);
      deps.renderApp();
      return null;
    }
  }

  async function carregarHistoricoComunicacaoSuperadmin(deps = {}) {
    const state = deps.getEstadoComunicacaoSuperadmin();
    if (!deps.isSuperAdmin() || state.loading) return;
    state.loading = true;
    deps.renderApp();
    try {
      const rows = await deps.requisicaoSupabase("/rest/v1/email_broadcasts?select=*&order=created_at.desc&limit=30", { method: "GET" });
      state.history = deps.Array.isArray(rows) ? rows : [];
    } catch (erro) {
      state.history = [];
      deps.registrarDiagnostico("Superadmin", "Histórico de e-mails indisponível", erro.message);
    } finally {
      state.loading = false;
      deps.renderApp();
    }
  }

  global.SimplificaSaasAdmin = {
    atualizarClienteSaasSupabaseParcial,
    atualizarStatusPerfisClienteSupabase,
    atualizarDadosPerfisClienteSupabase,
    atualizarFlagTesteClienteSaasSupabase,
    atualizarAnonimizacaoClienteSaasSupabase,
    obterPlanIdSupabase,
    excluirUsuarioTesteSaas,
    carregarCatalogoPlanosSuperadminRemoto,
    carregarHistoricoComunicacaoSuperadmin
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaSaasAdmin;
  }
})(typeof window !== "undefined" ? window : globalThis);
