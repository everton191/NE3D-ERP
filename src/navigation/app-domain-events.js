(function attachAppDomainEvents(global) {
  "use strict";

  function onceFlag(window, key) {
    if (window[key]) return false;
    window[key] = true;
    return true;
  }

  function resolveContext(context = {}) {
    const win = context.window || globalThis.window;
    const doc = context.document || win.document;
    const deps = context.deps || context;
    return { window: win, document: doc, deps };
  }

  function configureNavigationPopstate(context = {}) {
    const { window, deps } = resolveContext(context);
    if (!onceFlag(window, "__simplificaNavigationConfigured")) return;
    deps.atualizarHistoricoBrowserApp(true);
    window.addEventListener("popstate", (event) => {
      if (deps.fecharPainelGuiadoLojaPorHistorico()) return;
      const adminRoute = deps.parseStorefrontAdminRoute(deps.location.pathname);
      if (adminRoute) {
        deps.setStorefrontPublicRouteState(deps.getStorefrontPublicRouteFromAdminRoute(adminRoute));
        deps.setStorefrontPublicLastPath(deps.getStorefrontPublicRoutePath(deps.getStorefrontPublicRouteState()));
        deps.setStorefrontGuidedHistoryStateActive(false);
        deps.setTelaAtual("lojaPublica");
        deps.renderApp();
        return;
      }
      const publicRoute = deps.parseStorefrontPublicRoute(deps.location.pathname);
      if (publicRoute) {
        deps.salvarScrollLojaPublica();
        deps.setStorefrontPublicRouteState(publicRoute);
        deps.setStorefrontPublicLastPath(deps.getStorefrontPublicRoutePath(publicRoute));
        const history = deps.getStorefrontPublicInternalHistory();
        const last = deps.getStorefrontPublicLastPath();
        if (history[history.length - 1] === last) history.pop();
        deps.setTelaAtual("lojaPublica");
        deps.marcarLojaPublicaNavegando();
        deps.renderApp();
        deps.restaurarScrollLojaPublica(last, 0);
        return;
      }
      deps.handleAndroidBackPress({ source: "popstate", event });
    });
    deps.configurarNavegacaoLojaPublica();
    deps.registrarAndroidBackHandler();
    window.addEventListener("beforeunload", deps.removerAndroidBackHandler);
  }

  function configureGestureGuard(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!onceFlag(window, "__simplificaGestureGuardConfigured")) return;
    let inicioX = 0;
    let inicioY = 0;
    let protegendoToque = false;
    let ponteiroProtegidoId = null;
    let ponteiroInicioX = 0;
    let ponteiroInicioY = 0;

    const deveProteger = () => deps.isMobile() || deps.isAndroidNativeApp() || deps.getPlatformAdapter().isPWA;
    const permiteHorizontal = (alvo) => !!alvo?.closest?.([
      "[data-allow-horizontal-scroll]",
      ".order-filter-chips",
      ".reports-period-tabs",
      ".reports-period-table",
      ".material-chip-row",
      ".filter-chip-row",
      ".table-scroll",
      ".scroll-x"
    ].join(","));
    const gestoHorizontalDominante = (dx, dy, limite = 18) => Math.abs(dx) > limite && Math.abs(dx) > Math.abs(dy) * 1.15;

    document.addEventListener("touchstart", (event) => {
      if (!deveProteger() || !event.touches?.length) return;
      const toque = event.touches[0];
      inicioX = toque.clientX;
      inicioY = toque.clientY;
      const largura = window.innerWidth || document.documentElement.clientWidth || 0;
      const toqueNaBorda = inicioX <= 28 || (largura > 0 && inicioX >= largura - 28);
      protegendoToque = !toqueNaBorda && !!event.target?.closest?.(".mobile-panel, .side-drawer, .modal-backdrop");
    }, { passive: true, capture: true });

    document.addEventListener("touchmove", (event) => {
      if (!protegendoToque || !event.touches?.length || permiteHorizontal(event.target)) return;
      const toque = event.touches[0];
      const dx = toque.clientX - inicioX;
      const dy = toque.clientY - inicioY;
      if (gestoHorizontalDominante(dx, dy)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false, capture: true });

    document.addEventListener("touchend", () => {
      protegendoToque = false;
    }, { passive: true, capture: true });

    document.addEventListener("touchcancel", () => {
      protegendoToque = false;
    }, { passive: true, capture: true });

    document.addEventListener("pointerdown", (event) => {
      if (!deveProteger() || event.pointerType === "mouse") return;
      const largura = window.innerWidth || document.documentElement.clientWidth || 0;
      const toqueNaBorda = event.clientX <= 28 || (largura > 0 && event.clientX >= largura - 28);
      if (toqueNaBorda || !event.target?.closest?.(".mobile-panel, .side-drawer, .modal-backdrop")) return;
      ponteiroProtegidoId = event.pointerId;
      ponteiroInicioX = event.clientX;
      ponteiroInicioY = event.clientY;
    }, { passive: true, capture: true });

    document.addEventListener("pointermove", (event) => {
      if (ponteiroProtegidoId !== event.pointerId || event.pointerType === "mouse" || permiteHorizontal(event.target)) return;
      const dx = event.clientX - ponteiroInicioX;
      const dy = event.clientY - ponteiroInicioY;
      if (gestoHorizontalDominante(dx, dy, 22)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false, capture: true });

    const limparPonteiro = (event) => {
      if (ponteiroProtegidoId === event.pointerId) ponteiroProtegidoId = null;
    };
    document.addEventListener("pointerup", limparPonteiro, { passive: true, capture: true });
    document.addEventListener("pointercancel", limparPonteiro, { passive: true, capture: true });
  }

  function configureDrawerGestures(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!deps.DRAWER_EDGE_SWIPE_ENABLED) return;
    if (!onceFlag(window, "__drawerGestureConfigured")) return;
    document.addEventListener("pointerdown", deps.iniciarGestoDrawerLateral, { passive: true });
    document.addEventListener("pointermove", deps.moverGestoDrawerLateral, { passive: false });
    document.addEventListener("pointerup", deps.finalizarGestoDrawerLateral);
    document.addEventListener("pointercancel", deps.finalizarGestoDrawerLateral);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.querySelector(".side-drawer")) deps.fecharDrawerLateral();
    });
  }

  function configureOperationalShortcuts(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!onceFlag(window, "__simplificaOperationalShortcutsConfigured")) return;
    document.addEventListener("keydown", (event) => {
      const key = String(event.key || "").toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const editavel = deps.elementoEditavelOperacional(event.target);

      if (deps.gerenciarDirecionaisPwa(event, { editavel })) return;

      if (key === "escape" && deps.fecharCamadaAtualSeExistir()) {
        event.preventDefault();
        return;
      }

      if (ctrl && key === "k") {
        event.preventDefault();
        deps.focarBuscaRapidaOperacional();
        return;
      }

      if (ctrl && key === "enter") {
        if (deps.salvarFluxoOperacionalAtivo(event)) event.preventDefault();
        return;
      }

      if (ctrl && key === "s") {
        if (deps.salvarFluxoOperacionalAtivo(event)) event.preventDefault();
        return;
      }

      if (!editavel && ctrl && key === "n") {
        event.preventDefault();
        deps.abrirPedidoRapidoOperacional();
      }
    });
  }

  function configureOperationalViewport(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!onceFlag(window, "__simplificaOperationalViewportConfigured")) return;
    deps.agendarAtualizacaoViewportOperacionalMobile();
    window.addEventListener("resize", deps.agendarAtualizacaoViewportOperacionalMobile, { passive: true });
    window.addEventListener("pageshow", deps.agendarAtualizacaoViewportOperacionalMobile, { passive: true });
    window.addEventListener("focus", deps.agendarAtualizacaoViewportOperacionalMobile, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) deps.agendarAtualizacaoViewportOperacionalMobile();
    }, { passive: true });
    window.addEventListener("orientationchange", () => deps.setTimeoutRef(deps.agendarAtualizacaoViewportOperacionalMobile, 240), { passive: true });
    window.visualViewport?.addEventListener("resize", deps.agendarAtualizacaoViewportOperacionalMobile, { passive: true });
    window.visualViewport?.addEventListener("scroll", deps.atualizarViewportOperacionalMobile, { passive: true });
  }

  function configureThemeSystemListener(context = {}) {
    const { window, deps } = resolveContext(context);
    if (!onceFlag(window, "__simplificaThemeSystemListenerConfigured")) return;
    window.addEventListener("simplifica-theme-system-change", () => deps.aplicarPersonalizacao());
  }

  function configureSessionMonitor(context = {}) {
    const { document, deps } = resolveContext(context);
    ["click", "keydown", "pointerdown", "touchstart"].forEach((evento) => {
      document.addEventListener(evento, deps.registrarAtividadeSessao, { passive: true });
    });
  }

  function configureStockMenuClose(context = {}) {
    const { window, document } = resolveContext(context);
    if (!onceFlag(window, "__stockOutsideMenuHandlerReady")) return;
    document.addEventListener("pointerdown", (event) => {
      document.querySelectorAll(".stock-item-menu[open]").forEach((menu) => {
        if (!menu.contains(event.target)) menu.removeAttribute("open");
      });
    }, { passive: true });
  }

  function configureMobileSettingsSubmenus(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!onceFlag(window, "__simplificaSubmenuMobileListener")) return;
    document.addEventListener("click", (event) => {
      const summary = event.target?.closest?.(".settings-accordion-list > .ui-section > summary");
      if (!summary) return;
      const section = summary.parentElement;
      if (deps.isMobile()) {
        deps.abrirSubmenuConfiguracao(event, section);
        return;
      }
      if (deps.isPwaSettingsSplitPane(section) && section.open) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }

  function configureCalculatorMobileInteraction(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!onceFlag(window, "__calcKeyboardInteractionReady")) return;
    document.addEventListener("focusin", (event) => {
      const campo = event.target;
      if (!(campo instanceof HTMLElement) || !campo.matches("input, textarea, select") || !campo.closest?.("[data-ui3-screen=\"calculadora\"]")) return;
      deps.prepararEdicaoCalculadora(campo);
    });
    document.addEventListener("pointerdown", (event) => {
      const ativo = document.activeElement;
      if (!(ativo instanceof HTMLElement) || !ativo.closest?.("[data-ui3-screen=\"calculadora\"]")) return;
      const alvo = event.target;
      if (!(alvo instanceof Element) || alvo.closest("input, textarea, select, label, .calc-keyboard-result-bar")) return;
      deps.ocultarTecladoCalculadora();
    }, { capture: true });
  }

  function configureAiShortcutResize(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!onceFlag(window, "__aiAssistantShortcutResizeReady")) return;
    window.addEventListener("resize", () => {
      const botao = document.querySelector("[data-ai-assistant-shortcut] .ai-assistant-status");
      if (botao) deps.aplicarPosicaoAtalhoAssistenteIa(botao);
    }, { passive: true });
  }

  function configureBambuLoginDraftResume(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!onceFlag(window, "__bambuLoginDraftResumeBound")) return;
    document.addEventListener("visibilitychange", () => {
    const draft = deps.bambuLoginDraftState;
    if (document.hidden || !draft.active || document.getElementById("bambuLoginForm")) return;
    const printerId = draft.printerId;
    (deps.setTimeoutRef || window.setTimeout)(() => {
      if (!document.hidden && draft.active && !document.getElementById("bambuLoginForm")) deps.abrirLoginBambu(printerId);
    }, 120);
    });
  }

  function configureActionDispatcher(context = {}) {
    const { window, document, deps } = resolveContext(context);
    if (!onceFlag(window, "__simplificaArchitectureListeners")) return;
    document.addEventListener("click", (event) => {
      const elemento = event.target.closest("[data-action]");
      if (!elemento) return;
      const acao = elemento.dataset.action;
      deps.dispatchDataAction(acao, elemento, event);
    });
  }

  const api = Object.freeze({
    configureNavigationPopstate,
    configureGestureGuard,
    configureDrawerGestures,
    configureOperationalShortcuts,
    configureOperationalViewport,
    configureThemeSystemListener,
    configureSessionMonitor,
    configureStockMenuClose,
    configureMobileSettingsSubmenus,
    configureCalculatorMobileInteraction,
    configureAiShortcutResize,
    configureBambuLoginDraftResume,
    configureActionDispatcher
  });
  global.SimplificaAppDomainEvents = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
