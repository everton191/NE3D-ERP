(function attachAppBootstrap(global) {
  "use strict";

  let started = false;
  let startupFailed = false;
  let bootstrapDocument = global.document;
  let startAuthenticated = () => false;

  function renderFailure() {
    if (!startupFailed) return false;
    const root = bootstrapDocument.getElementById?.("app")
      || bootstrapDocument.getElementById?.("app-shell") || bootstrapDocument.body;
    if (!root) return true;
    bootstrapDocument.body?.classList?.add("auth-screen-active");
    for (const id of ["modal-layer", "drawer-layer", "overlay-layer", "toast-layer"]) {
      const layer = bootstrapDocument.getElementById?.(id);
      if (!layer) continue;
      layer.innerHTML = "";
      layer.classList?.remove?.("is-active");
    }
    bootstrapDocument.body?.classList?.remove?.("app-modal-open", "app-drawer-open", "app-layer-open");
    bootstrapDocument.getElementById?.("introOverlay")?.remove?.();
    bootstrapDocument.querySelector?.("[data-ai-assistant-shortcut]")?.remove();
    // Independente dos inicializadores e do renderer que podem ter falhado.
    // Só uma nova abertura reinicia o fluxo; cache não equivale a sessão validada.
    root.innerHTML = `<section class="auth-page" aria-label="Falha na abertura">
      <div class="auth-card card" role="alert">
        <h1>Não foi possível abrir o aplicativo</h1>
        <p>Não conseguimos concluir a verificação com segurança. Tente novamente.</p>
        <button id="bootstrapRetryBtn" class="btn auth-primary primary" type="button" onclick="location.reload()">Tentar novamente</button>
      </div>
    </section>`;
    return true;
  }

  function start(context = {}) {
    if (started) return false;
    started = true;

    const {
      document: documentRef = global.document,
      clearTimeout: clearTimeoutRef = global.clearTimeout.bind(global),
      setTimeout: setTimeoutRef = global.setTimeout.bind(global),
      getResizeTimer,
      setResizeTimer,
      sincronizarModoInterfaceComViewport,
      agendarAtualizacaoViewportOperacionalMobile,
      storefrontFlushAutosaveNow,
      salvarRascunhoPedidoRapidoLocal,
      salvarCacheSessaoLocal,
      salvarDados,
      sincronizarRelayNotificacoesAndroid,
      getTelaAtual,
      agendarRenderizacaoPreservandoScroll,
      carregarNotificacoesMensagensRemotas,
      sincronizarLicencaEfetivaSePossivel,
      sincronizarAlteracoesLocaisSilencioso,
      registrarDiagnostico,
      estaOnline,
      monitorPromocoes3dPrecisaAtualizar,
      carregarPromocoes3d,
      atualizarIndicadorSincronizacao,
      atualizarStorefrontConnectionBadge,
      mostrarToast,
      storefrontFlushPendingQueue,
      sincronizarLojaOnlineAdminRemoto,
      getStorefrontAutosaveDraft,
      storefrontQueuePendingAction,
      getStorefrontSessionRecoveryState,
      recomporFilaSyncPendente,
      getSyncConfig,
      processarRetornoOAuthMercadoLivre,
      configurarTelemetriaErros,
      configurarMonetizacaoAds,
      ensureAppShellLayers,
      iniciarIntroAbertura,
      configurarEventListenersArquitetura,
      configurarGestosDrawerLateral,
      configurarMenusContextuaisProdutosLoja,
      configurarAtalhosOperacionais,
      configurarViewportOperacionalMobile,
      configurarNavegacaoInternaApp,
      configurarProtecaoGestosMobile,
      processarRotaPublicaLegal,
      processarParametrosAssinaturaUrl,
      processarRetornoOAuthSupabase,
      restaurarCacheSessaoLocal,
      processarRotaSuperadminInicial,
      normalizarTelaInicialAndroid,
      getUsuarioAtual,
      getAdminLogado,
      setTelaAtual,
      renderApp,
      recuperarPedidoRapidoAposReabertura,
      iniciarAutoBackup,
      iniciarMonitorAtualizacao,
      iniciarMonitorPlanoSaas,
      iniciarMonitorLicencaOnline,
      iniciarLembreteBackupPlanoFree,
      iniciarMonitorPromocoes3d,
      verificarBancosDadosAoEntrar,
      monitorarSessao,
      moverJanelaDashboard,
      moverCalculadora,
      verificarDuploToqueForaCalculadora,
      finalizarJanelaDashboard,
      finalizarCalculadora
    } = context;
    bootstrapDocument = documentRef;

    const failStartup = (erro) => {
      if (startupFailed) return;
      startupFailed = true;
      documentRef.documentElement.dataset.simplificaBootstrap = "failed";
      delete global.__simplificaSessionCheckVisualState;
      renderFailure();
      try {
        // Mensagens arbitrárias de erro podem carregar dados da sessão.
        registrarDiagnostico("Bootstrap", "Abertura interrompida com acesso bloqueado", erro instanceof TypeError ? "TypeError" : "STARTUP_FAILED", { silent: true });
      } catch (_) { /* A falha da telemetria não pode impedir a recuperação. */ }
    };

    global.addEventListener("resize", () => {
      clearTimeoutRef(getResizeTimer());
      setResizeTimer(setTimeoutRef(() => sincronizarModoInterfaceComViewport(), 120));
    });

    global.addEventListener("orientationchange", () => {
      [120, 360, 700].forEach((atraso, index) => {
        setTimeoutRef(() => {
          agendarAtualizacaoViewportOperacionalMobile();
          sincronizarModoInterfaceComViewport({ forcarRender: index === 1 });
        }, atraso);
      });
    }, { passive: true });

    if (global.screen?.orientation?.addEventListener) {
      global.screen.orientation.addEventListener("change", () => {
        setTimeoutRef(() => {
          agendarAtualizacaoViewportOperacionalMobile();
          sincronizarModoInterfaceComViewport({ forcarRender: true });
        }, 220);
      }, { passive: true });
    }

    const persistLocalState = () => {
      if (startupFailed) return;
      storefrontFlushAutosaveNow();
      salvarRascunhoPedidoRapidoLocal({ force: true });
      salvarCacheSessaoLocal();
      salvarDados();
    };

    global.addEventListener("pagehide", persistLocalState);
    documentRef.addEventListener("visibilitychange", () => {
      if (startupFailed) return;
      if (documentRef.visibilityState === "hidden") {
        persistLocalState();
      } else if (documentRef.visibilityState === "visible" && getUsuarioAtual()) {
        sincronizarRelayNotificacoesAndroid().then(() => {
          if (getTelaAtual() === "config") agendarRenderizacaoPreservandoScroll(80);
        }).catch(() => {});
        carregarNotificacoesMensagensRemotas(true).catch(() => {});
        sincronizarLicencaEfetivaSePossivel("visible").catch((erro) => registrarDiagnostico("Supabase", "Licença ao voltar para o app falhou", erro.message));
        sincronizarAlteracoesLocaisSilencioso("visible").catch((erro) => registrarDiagnostico("sync", "Sync ao voltar para o app falhou", erro.message));
        if (estaOnline() && monitorPromocoes3dPrecisaAtualizar()) carregarPromocoes3d({ force: true, background: true });
      }
    });

    global.addEventListener("online", () => {
      if (startupFailed) return;
      if (!getUsuarioAtual()) return;
      atualizarIndicadorSincronizacao("syncing", "Reconectando");
      atualizarStorefrontConnectionBadge();
      mostrarToast("Conexão restaurada. Sincronizando alterações pendentes.", "info", 3200);
      storefrontFlushPendingQueue()
        .then((result) => (!result?.pending ? sincronizarLojaOnlineAdminRemoto(false) : null))
        .catch((erro) => registrarDiagnostico("Storefront", "Fila da loja não sincronizada", erro.message));
      sincronizarLicencaEfetivaSePossivel("online").catch((erro) => registrarDiagnostico("Supabase", "Licença ao voltar internet falhou", erro.message));
      sincronizarAlteracoesLocaisSilencioso("online").catch((erro) => registrarDiagnostico("sync", "Sync ao voltar internet falhou", erro.message));
      carregarPromocoes3d({ force: true, background: true });
    });

    global.addEventListener("offline", () => {
      if (startupFailed) return;
      if (!getUsuarioAtual()) return;
      salvarRascunhoPedidoRapidoLocal({ force: true });
      atualizarStorefrontConnectionBadge();
      if (getStorefrontAutosaveDraft()) storefrontQueuePendingAction("session-offline-recovery", getStorefrontSessionRecoveryState());
      recomporFilaSyncPendente();
      getSyncConfig().autoBackupStatus = "Offline - fila pendente";
      salvarDados();
      atualizarIndicadorSincronizacao("pending", "Offline");
      mostrarToast("Sem internet. O app manterá rascunhos e alterações locais.", "aviso", 4200);
    });

    let authenticatedStarted = false;
    startAuthenticated = () => {
      if (startupFailed || documentRef.documentElement?.dataset.simplificaBootstrap === "restoring"
        || authenticatedStarted || !getUsuarioAtual()) return false;
      authenticatedStarted = true;
      iniciarAutoBackup();
      iniciarMonitorPlanoSaas();
      iniciarMonitorLicencaOnline();
      iniciarLembreteBackupPlanoFree();
      iniciarMonitorPromocoes3d();
      setTimeoutRef(() => {
        if (!startupFailed) verificarBancosDadosAoEntrar();
      }, 1800);
      monitorarSessao();
      return true;
    };
    documentRef.addEventListener("DOMContentLoaded", async () => {
      documentRef.documentElement.dataset.simplificaBootstrap = "restoring";
      try {
        if (global.UiV3Dev?.isRoute) {
          global.UiV3Dev.mount();
          return;
        }
        configurarTelemetriaErros();
        processarRetornoOAuthMercadoLivre();
        configurarMonetizacaoAds();
        ensureAppShellLayers();
        iniciarIntroAbertura();
        // Inicie a restauração imediatamente. As etapas são apenas informativas
        // enquanto login/biometria estiverem pendentes, sem duração mínima.
        const etapasVerificacao = [
          { title: "Verificando sessão", message: "Conferindo o acesso deste dispositivo...", progress: 16, step: 1 },
          { title: "Confirmando sua conta", message: "Validando credenciais protegidas...", progress: 38, step: 2 },
          { title: "Preparando seu espaço", message: "Restaurando suas preferências...", progress: 66, step: 3 },
          { title: "Quase pronto", message: "Finalizando a entrada com segurança...", progress: 90, step: 4 }
        ];
        global.__simplificaSessionCheckVisualState = etapasVerificacao[0];
        renderApp();
        [700, 1500, 2300].forEach((delay, index) => {
          setTimeoutRef(() => {
            if (documentRef.documentElement.dataset.simplificaBootstrap !== "restoring") return;
            global.__simplificaSessionCheckVisualState = etapasVerificacao[index + 1];
            try { renderApp(); } catch (erro) { failStartup(erro); }
          }, delay);
        });
        if (startupFailed) return;
        configurarEventListenersArquitetura();
        configurarGestosDrawerLateral();
        configurarMenusContextuaisProdutosLoja();
        configurarAtalhosOperacionais();
        configurarViewportOperacionalMobile();
        configurarNavegacaoInternaApp();
        configurarProtecaoGestosMobile();
        processarRotaPublicaLegal();
        processarParametrosAssinaturaUrl();
        iniciarMonitorAtualizacao();
        documentRef.addEventListener("pointermove", moverJanelaDashboard);
        documentRef.addEventListener("pointermove", moverCalculadora);
        documentRef.addEventListener("pointerdown", verificarDuploToqueForaCalculadora);
        documentRef.addEventListener("pointerup", finalizarJanelaDashboard);
        documentRef.addEventListener("pointerup", finalizarCalculadora);
        documentRef.addEventListener("pointercancel", finalizarJanelaDashboard);
        documentRef.addEventListener("pointercancel", finalizarCalculadora);
        processarRetornoOAuthSupabase().then(async (processou) => {
          if (startupFailed) return;
          if (!processou) {
            await restaurarCacheSessaoLocal();
            if (startupFailed) return;
            processarRotaSuperadminInicial();
            normalizarTelaInicialAndroid();
            if (!getUsuarioAtual() && !getAdminLogado() && getTelaAtual() === "dashboard") setTelaAtual("admin");
            if (getUsuarioAtual()) {
              recuperarPedidoRapidoAposReabertura();
            }
          }
        }).catch(failStartup).finally(() => {
          delete global.__simplificaSessionCheckVisualState;
          if (startupFailed) { renderFailure(); return; }
          delete documentRef.documentElement.dataset.simplificaBootstrap;
          try {
            renderApp();
            startAuthenticated();
          } catch (erro) { failStartup(erro); }
        });
      } catch (erro) {
        failStartup(erro);
      }
    });

    global.addEventListener("error", (event) => {
      registrarDiagnostico("erro", event.message || "Erro de execução", `${event.filename || ""}:${event.lineno || ""}:${event.colno || ""}`);
    });
    global.addEventListener("unhandledrejection", (event) => {
      const motivo = event.reason?.message || String(event.reason || "Promessa rejeitada");
      registrarDiagnostico("promessa", motivo, event.reason?.stack || "");
    });
    return true;
  }

  global.SimplificaAppBootstrap = Object.freeze({ start, startAuthenticated: () => startAuthenticated(), hasFailed: () => startupFailed, renderFailure });
})(window);
