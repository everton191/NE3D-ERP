(function attachSyncRemoteCommands(global) {
  "use strict";

  async function enviarRegistroSyncSupabase(item, deps = {}) {
    const escopo = deps.getEscopoDadosAtual();
    if (escopo && item.scopeId && item.scopeId !== escopo) {
      throw new Error("Fila offline pertence a outra conta.");
    }
    const payload = deps.normalizarPayloadSync(item.collection, item.data || {});
    deps.debugInfo("[SyncQueue][send]", {
      auth_uid: deps.syncConfig.supabaseUserId || "",
      scope_id: item.scopeId || escopo || "",
      collection: item.collection,
      record_id: item.recordId,
      sync_status: payload.sync_status || "pending"
    });
    return deps.requisicaoSupabase("/rest/v1/rpc/upsert_erp_record_if_newer", {
      method: "POST",
      body: deps.JSON.stringify({
        p_collection: item.collection,
        p_record_id: deps.String(item.recordId),
        p_data: payload,
        p_deleted_at: payload.deleted_at || null
      })
    });
  }

  async function registrarSessaoSaasOnlineSilencioso(usuario, deps = {}) {
    if (usuario === undefined) usuario = deps.getUsuarioAtual();
    if (!usuario || !deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUrl || usuario.papel === "superadmin") return;
    try {
      const resultado = await deps.requisicaoSupabase("/rest/v1/rpc/register_saas_session", {
        method: "POST",
        body: deps.JSON.stringify({
          p_device_id: deps.deviceId,
          p_user_agent: deps.navigator.userAgent || ""
        })
      });
      if (deps.Number(resultado?.closed_sessions || 0) > 0) {
        deps.mostrarToast("Sua conta atingiu o limite de dispositivos conectados para este plano.", "aviso", 5200);
      }
    } catch (erro) {
      deps.registrarDiagnostico("Sessão SaaS", "Controle online de sessão não registrado", erro.message);
    }
  }

  async function persistirOnboardingSupabaseSilencioso(usuario, deps = {}) {
    if (usuario === undefined) usuario = deps.getUsuarioAtual();
    if (!usuario || !deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId || !deps.syncConfig.supabaseUrl) return false;
    const agora = new deps.Date().toISOString();
    const userId = deps.encodeURIComponent(deps.syncConfig.supabaseUserId);
    const perfil = {
      onboarding_completed: usuario.onboardingCompleted === true,
      onboarding_step: deps.etapaOnboardingAtual(usuario),
      updated_at: agora
    };
    const resultados = await deps.Promise.allSettled([
      deps.requisicaoSupabase(`/rest/v1/profiles?user_id=eq.${userId}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify(perfil)
      }),
      deps.requisicaoSupabase(`/rest/v1/erp_profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify(perfil)
      })
    ]);
    resultados.forEach((resultado, indice) => {
      if (resultado.status === "rejected") {
        deps.registrarDiagnostico("Onboarding", indice === 0 ? "profiles onboarding não sincronizado" : "erp_profiles onboarding não sincronizado", resultado.reason?.message || resultado.reason);
      }
    });

    const companyId = usuario.companyId || deps.billingConfig.companyId || "";
    if (companyId) {
      await deps.requisicaoSupabase(`/rest/v1/companies?id=eq.${deps.encodeURIComponent(companyId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({
          setup_completed: usuario.onboardingCompleted === true || deps.appConfig.companySetupCompleted === true,
          print_type: deps.appConfig.defaultPrintType || null,
          default_material: deps.appConfig.defaultMaterial || null,
          updated_at: agora
        })
      }).catch((erro) => deps.registrarDiagnostico("Onboarding", "Empresa não atualizada no Supabase", erro.message || erro));
    }
    return true;
  }

  async function salvarPerfilUsuarioRemoto({ usuario, nome = "", telefone = "", foto = "" } = {}, deps = {}) {
    if (!usuario || !deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId || !deps.estaOnline()) return false;
    const userId = deps.String(deps.syncConfig.supabaseUserId);
    const atualizadoEm = new deps.Date().toISOString();
    const nomeFinal = deps.String(nome || usuario.nome || "").trim();
    const telefoneFinal = deps.String(telefone || usuario.phone || usuario.telefone || "").trim();
    const fotoFinal = deps.String(foto || usuario.avatarUrl || usuario.avatar_url || deps.appConfig.profilePhotoDataUrl || "").trim();

    const resultados = await deps.Promise.allSettled([
      deps.requisicaoSupabase(`/rest/v1/profiles?user_id=eq.${deps.encodeURIComponent(userId)}`, {
        method: "PATCH",
        telemetry: false,
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ name: nomeFinal, phone: telefoneFinal || null, updated_at: atualizadoEm })
      }),
      deps.requisicaoSupabase(`/rest/v1/erp_profiles?id=eq.${deps.encodeURIComponent(userId)}`, {
        method: "PATCH",
        telemetry: false,
        headers: { Prefer: "return=minimal" },
        body: deps.JSON.stringify({ display_name: nomeFinal, phone: telefoneFinal || null, updated_at: atualizadoEm })
      }),
      deps.requisicaoSupabase("/rest/v1/user_profiles?on_conflict=user_id", {
        method: "POST",
        telemetry: false,
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: deps.JSON.stringify({ user_id: userId, display_name: nomeFinal, profile_photo: fotoFinal, updated_at: atualizadoEm })
      })
    ]);

    const dadosPessoaisOk = resultados[0].status === "fulfilled" || resultados[1].status === "fulfilled";
    const identidadeOk = resultados[2].status === "fulfilled";
    const falhas = resultados.filter((resultado) => resultado.status === "rejected");
    if (falhas.length) {
      deps.registrarDiagnostico("Perfil", "Sincronização parcial do perfil", falhas.map((falha) => falha.reason?.message || deps.String(falha.reason || "falha")).join(" | "));
    }
    return dadosPessoaisOk && identidadeOk;
  }

  async function carregarNotificacoesMensagensRemotas(silent = false, deps = {}) {
    if (!deps.syncConfig.supabaseAccessToken || !deps.syncConfig.supabaseUserId || !deps.estaOnline()) return [];
    if (deps.getMessageNotificationLoadState() === "loading") return deps.getSyncedMessageNotifications();
    deps.setMessageNotificationLoadState("loading");
    try {
      const now = deps.encodeURIComponent(new deps.Date().toISOString());
      const rows = await deps.requisicaoSupabase(`/rest/v1/user_message_notifications?select=id,user_id,device_id,source,sender_name,event_key,received_at,read_at&user_id=eq.${deps.encodeURIComponent(deps.syncConfig.supabaseUserId)}&expires_at=gt.${now}&read_at=is.null&order=received_at.desc&limit=60`, { method: "GET", timeoutMs: 12000 });
      deps.setSyncedMessageNotifications((deps.Array.isArray(rows) ? rows : []).map(deps.normalizarNotificacaoMensagem));
      deps.setMessageNotificationLoadState("ready");
      if (!silent && deps.document.getElementById("popup")?.querySelector(".message-center")) deps.renderCentralMensagensPopup();
      return deps.getSyncedMessageNotifications();
    } catch (erro) {
      deps.setMessageNotificationLoadState("error");
      if (!silent) deps.mostrarToast("Não foi possível atualizar os avisos de mensagens.", "aviso", 3200);
      deps.registrarDiagnostico("Mensagens", "Avisos sincronizados não carregados", erro.message || erro, { silent: true });
      return deps.getSyncedMessageNotifications();
    }
  }

  async function removerNotificacaoMensagem(id = "", deps = {}) {
    const target = deps.getSyncedMessageNotifications().find((item) => item.id === deps.String(id));
    if (!target || !deps.syncConfig.supabaseAccessToken) return;
    deps.setSyncedMessageNotifications(deps.getSyncedMessageNotifications().filter((item) => item.id !== target.id));
    deps.renderCentralMensagensPopup();
    try {
      await deps.requisicaoSupabase(`/rest/v1/user_message_notifications?id=eq.${deps.encodeURIComponent(target.id)}&user_id=eq.${deps.encodeURIComponent(deps.syncConfig.supabaseUserId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    } catch (erro) {
      deps.mostrarToast("Não foi possível remover este aviso.", "aviso", 2800);
      await carregarNotificacoesMensagensRemotas(true, deps);
      deps.renderCentralMensagensPopup();
    }
  }

  async function limparNotificacoesMensagens(deps = {}) {
    if (!deps.getSyncedMessageNotifications().length || !deps.syncConfig.supabaseAccessToken) return;
    const anteriores = deps.getSyncedMessageNotifications();
    deps.setSyncedMessageNotifications([]);
    deps.renderCentralMensagensPopup();
    try {
      await deps.requisicaoSupabase(`/rest/v1/user_message_notifications?user_id=eq.${deps.encodeURIComponent(deps.syncConfig.supabaseUserId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    } catch (erro) {
      deps.setSyncedMessageNotifications(anteriores);
      deps.renderCentralMensagensPopup();
      deps.mostrarToast("Não foi possível limpar os avisos.", "aviso", 2800);
    }
  }

  async function sincronizarRelayNotificacoesAndroid(deps = {}) {
    if (!deps.isAndroidNativeApp()) return false;
    const plugin = deps.getMessageRelayPlugin();
    if (!plugin) return false;
    const preferences = deps.getMessageRelayLocalPreferences();
    try {
      if (preferences.enabled && deps.syncConfig.supabaseAccessToken && deps.syncConfig.supabaseUserId) {
        const currentStatus = await plugin.getStatus();
        let deviceToken = "";
        if (!currentStatus.registered) {
          const registration = await deps.requisicaoSupabase("/rest/v1/rpc/register_message_notification_device", {
            method: "POST",
            body: deps.JSON.stringify({ p_device_id: deps.deviceId })
          });
          deviceToken = deps.String(deps.Array.isArray(registration) ? registration[0]?.device_token : registration?.device_token || "");
          if (!deviceToken) throw new Error("Credencial do aparelho não foi criada.");
        }
        deps.setAndroidMessageRelayStatus(await plugin.configure({
          ...preferences,
          relayUrl: `${deps.normalizarUrlSupabase()}/functions/v1/message-notification-relay`,
          anonKey: deps.syncConfig.supabaseAnonKey || deps.SUPABASE_DEFAULT_ANON_KEY,
          deviceToken,
          deviceId: deps.deviceId
        }));
        await plugin.flushPending();
      } else {
        deps.setAndroidMessageRelayStatus(await plugin.getStatus());
      }
      return true;
    } catch (erro) {
      deps.registrarDiagnostico("Mensagens", "Relé Android não configurado", erro.message || erro, { silent: true });
      return false;
    }
  }

  async function desconectarRelayNotificacoesAndroid(deps = {}) {
    const plugin = deps.getMessageRelayPlugin();
    if (!plugin) return;
    try {
      await plugin.configure({ enabled: false, whatsapp: true, instagram: true, tiktok: true });
      if (deps.syncConfig.supabaseAccessToken && deps.syncConfig.supabaseUserId) {
        await deps.requisicaoSupabase(`/rest/v1/user_message_notification_devices?user_id=eq.${deps.encodeURIComponent(deps.syncConfig.supabaseUserId)}&device_id=eq.${deps.encodeURIComponent(deps.deviceId)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
          timeoutMs: 8000
        }).catch(() => {});
      }
      deps.setAndroidMessageRelayStatus({ supported: true, permissionGranted: false, enabled: false });
    } catch (_) {}
  }

  global.SimplificaSyncRemoteCommands = {
    enviarRegistroSyncSupabase,
    registrarSessaoSaasOnlineSilencioso,
    persistirOnboardingSupabaseSilencioso,
    salvarPerfilUsuarioRemoto,
    carregarNotificacoesMensagensRemotas,
    removerNotificacaoMensagem,
    limparNotificacoesMensagens,
    sincronizarRelayNotificacoesAndroid,
    desconectarRelayNotificacoesAndroid
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.SimplificaSyncRemoteCommands;
  }
})(typeof window !== "undefined" ? window : globalThis);
