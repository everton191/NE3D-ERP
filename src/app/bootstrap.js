(function attachAppBootstrap(global) {
  "use strict";

  let started = false;
  let startAuthenticated = () => false;

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
      storefrontFlushAutosaveNow();
      salvarRascunhoPedidoRapidoLocal({ force: true });
      salvarCacheSessaoLocal();
      salvarDados();
    };

    global.addEventListener("pagehide", persistLocalState);
    documentRef.addEventListener("visibilitychange", () => {
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
      if (authenticatedStarted || !getUsuarioAtual()) return false;
      authenticatedStarted = true;
      iniciarAutoBackup();
      iniciarMonitorPlanoSaas();
      iniciarMonitorLicencaOnline();
      iniciarLembreteBackupPlanoFree();
      iniciarMonitorPromocoes3d();
      setTimeoutRef(verificarBancosDadosAoEntrar, 1800);
      monitorarSessao();
      return true;
    };
    documentRef.addEventListener("DOMContentLoaded", async () => {
      documentRef.documentElement.dataset.simplificaBootstrap = "restoring";
      if (global.UiV3Dev?.isRoute) {
        global.UiV3Dev.mount();
        return;
      }
      configurarTelemetriaErros();
      processarRetornoOAuthMercadoLivre();
      configurarMonetizacaoAds();
      ensureAppShellLayers();
      iniciarIntroAbertura();
      // Mesmo com a sessão ainda válida, a abertura passa por uma tela de
      // verificação. Isso deixa explícito que a identidade foi conferida antes
      // de liberar a Home e dá uma base visual para o prompt biométrico.
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
          renderApp();
        }, delay);
      });
      await new Promise((resolve) => {
        const afterFrame = () => setTimeoutRef(resolve, 3000);
        if (typeof global.requestAnimationFrame === "function") global.requestAnimationFrame(afterFrame);
        else afterFrame();
      });
      configurarEventListenersArquitetura();
      configurarGestosDrawerLateral();
      configurarMenusContextuaisProdutosLoja();
      configurarAtalhosOperacionais();
      configurarViewportOperacionalMobile();
      configurarNavegacaoInternaApp();
      configurarProtecaoGestosMobile();
      processarRotaPublicaLegal();
      processarParametrosAssinaturaUrl();
      processarRetornoOAuthSupabase().then(async (processou) => {
        if (!processou) {
          await restaurarCacheSessaoLocal();
          processarRotaSuperadminInicial();
          normalizarTelaInicialAndroid();
          if (!getUsuarioAtual() && !getAdminLogado() && getTelaAtual() === "dashboard") setTelaAtual("admin");
          if (getUsuarioAtual()) {
            startAuthenticated();
            recuperarPedidoRapidoAposReabertura();
          }
        }
      }).catch((erro) => {
        registrarDiagnostico("Bootstrap", "Restauração inicial não concluída", erro?.message || String(erro), { silent: true });
      }).finally(() => {
        delete global.__simplificaSessionCheckVisualState;
        delete documentRef.documentElement.dataset.simplificaBootstrap;
        renderApp();
      });
      iniciarMonitorAtualizacao();
      documentRef.addEventListener("pointermove", moverJanelaDashboard);
      documentRef.addEventListener("pointermove", moverCalculadora);
      documentRef.addEventListener("pointerdown", verificarDuploToqueForaCalculadora);
      documentRef.addEventListener("pointerup", finalizarJanelaDashboard);
      documentRef.addEventListener("pointerup", finalizarCalculadora);
      documentRef.addEventListener("pointercancel", finalizarJanelaDashboard);
      documentRef.addEventListener("pointercancel", finalizarCalculadora);
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

  global.SimplificaAppBootstrap = Object.freeze({ start, startAuthenticated: () => startAuthenticated() });
})(window);
