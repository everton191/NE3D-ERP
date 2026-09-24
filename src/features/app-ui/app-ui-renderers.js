"use strict";

(function attachAppUiRenderers(global) {
  function renderAiShortcut(deps) {
    const layer = deps.document.getElementById(deps.appLayerIds.shell) || deps.document.body;
    if (!layer) return;
    deps.document.querySelector("[data-ai-assistant-shortcut]")?.remove();
    const telasSemAssistente = new Set(["admin", "superadmin", "privacy", "terms", "lojaPublica", "onboarding", "acessoNegado"]);
    if (!deps.getUsuarioAtual() || telasSemAssistente.has(deps.getTelaAtual())) return;
    const shortcut = deps.document.createElement("div");
    shortcut.className = "ai-assistant-shortcut-layer";
    shortcut.dataset.aiAssistantShortcut = "true";
    shortcut.innerHTML = deps.getAssistantUiComponents3d()?.launcher({
      state: deps.getEstadoVisualSecretariaIa(),
      description: `${deps.getDescricaoEstadoSecretariaIa()} Toque para abrir ou arraste para mover.`,
      iconHtml: deps.renderUiIcon("assistente"),
      onActivate: "acionarAtalhoAssistenteIa",
      onDrag: "iniciarArrastoAtalhoAssistenteIa"
    }) || "";
    layer.appendChild(shortcut);
    deps.configurarReposicionamentoAtalhoAssistenteIa();
    deps.window.requestAnimationFrame(() => deps.aplicarPosicaoAtalhoAssistenteIa(shortcut.querySelector(".ai-assistant-status")));
  }

  function renderApp(deps) {
    deps.ensureAppShellLayers();
    const app = deps.document.getElementById("app");
    if (!app) return;
    const stage = deps.window.SimplificaAuthCommands.getLoginStage();
    const preparing = stage === "SESSION_PREPARING" || stage === "PROFILE_READY";
    if ((!deps.getUsuarioAtual() && !deps.getAdminLogado() && !deps.isTelaPublica(deps.getTelaAtual())) || preparing) {
      deps.setTelaAtual("admin");
      deps.aplicarPersonalizacao();
      deps.applyViewportModeClasses(deps.document.body);
      deps.document.body.classList.add("auth-screen-active");
      deps.document.querySelector("[data-ai-assistant-shortcut]")?.remove();
      if (!app.querySelector(".auth-page") || !preparing) {
        deps.atualizarArvoreInterface(app, deps.renderAuthPublica(), { chaveEstrutural: "pre-auth" });
      }
      if (!preparing) deps.window.SimplificaAuthCommands.traceLogin("LOGIN_FORM_VISIBLE");
      return;
    }
    deps.realtimeSyncState.pendingVisualRefresh = false;
    delete deps.document.documentElement.dataset.backgroundDataUpdated;
    deps.garantirSubmenusMobileComoTelas();
    deps.applyViewportModeClasses(deps.document.body);
    if (deps.window.__simplificaLocalLockActive && deps.getUsuarioAtual()) {
      deps.aplicarPersonalizacao();
      const inputExistente = deps.document.getElementById("localUnlockPassword");
      if (!inputExistente || !app.querySelector(".auth-card")) {
        app.innerHTML = deps.renderTravaLocal();
        deps.renderCalculadoraFlutuante();
        deps.sincronizarBannersSeNecessario();
      }
      deps.focarCampoSenha(deps.document.getElementById("localUnlockPassword"), false);
      return;
    }
    let telaAtual = deps.getTelaAtual();
    if (!deps.getUsuarioAtual() && !deps.getAdminLogado() && !deps.isTelaPublica(telaAtual)) telaAtual = deps.setTelaAtual("admin");
    if (deps.getUsuarioAtual() && deps.isSuperAdmin() && !deps.isModoErpSuperadminAtivo() && !["superadmin", "admin", "privacy", "terms", "sobre"].includes(telaAtual)) {
      deps.setTelaAnterior("superadmin");
      telaAtual = deps.setTelaAtual("superadmin");
      deps.window.__superAdminTab = deps.normalizarAbaSuperAdmin(deps.window.__superAdminTab || "dashboard");
    }
    if (telaAtual === "dashboard" && deps.deveMostrarOnboarding()) telaAtual = deps.setTelaAtual("onboarding");
    deps.aplicarPersonalizacao();
    const viewportMode = deps.applyViewportModeClasses(deps.document.body);
    const mobile = viewportMode === "mobile";
    deps.document.body.classList.toggle("mobile-mode", mobile);
    deps.document.body.classList.toggle("tablet-mode", viewportMode === "tablet");
    deps.document.body.classList.toggle("desktop-mode", viewportMode === "desktop");
    deps.document.body.dataset.interfaceMode = deps.getInterfaceMode();
    deps.document.body.classList.toggle("auth-screen-active", !deps.getUsuarioAtual() && telaAtual === "admin");
    deps.document.body.classList.toggle("visitor-public-screen", !deps.getUsuarioAtual() && deps.isTelaPublica(telaAtual));
    const modoSuperadminIsolado = deps.isSuperAdmin() && telaAtual === "superadmin";
    const homeDestination = telaAtual === "dashboard" || telaAtual === "superadmin";
    if (homeDestination) deps.window.SimplificaAuthCommands.traceLogin(telaAtual === "dashboard" ? "NAV_HOME" : "NAV_SUPERADMIN");
    deps.unmountHomeCarousel();
    deps.atualizarArvoreInterface(app, mobile ? deps.renderMobile() : deps.renderDesktop(), { chaveEstrutural: deps.getChaveEstruturalInterface(mobile) });
    if (telaAtual === "dashboard") deps.mountHomeCarousel(app.querySelector("[data-home-carousel-host]"));
    deps.compactarBarrasAcoesMobile(); deps.sincronizarShellUiV3(); deps.renderizarFabEstoqueGlobal(); deps.renderizarAtalhoSecretariaIaGlobal(); deps.configurarFechamentoMenusEstoque(); deps.configurarAcoesCadastroImpressora(); deps.configurarAcoesPerfil(); deps.atualizarMenu();
    if (!modoSuperadminIsolado) {
      deps.ajustarJanelasDashboardAoWorkspace(false); deps.renderCalculadoraFlutuante(); deps.sincronizarBannersSeNecessario(); deps.hidratarLojaPublicaSeNecessario(); deps.preencherImpressoras(); deps.preencherMateriaisCalculadora();
      if (telaAtual === "calculadora") { deps.atualizarVisualTaxaExtraCalculadora(); deps.atualizarResumoLoteCalculadora(); }
      if (deps.getUsuarioAtual() && deps.getSyncConfig().supabaseAccessToken && !deps.printerMonitoringState.loaded) deps.setTimeout(() => deps.hidratarImpressorasSeNecessario(false), 0);
      if (deps.getUsuarioAtual() && deps.getBambuLanPlugin() && !deps.bambuLanState.listenerReady) deps.setTimeout(() => deps.hidratarBambuLanState(), 0);
      if (deps.getUsuarioAtual() && deps.getSyncConfig().supabaseAccessToken && deps.interfaceModePreferenceState.loadedUserId !== deps.getSyncConfig().supabaseUserId) deps.setTimeout(() => deps.sincronizarPreferenciaModoInterface(), 0);
    }
    deps.aplicarMotionSequenciado();
    if (!modoSuperadminIsolado) deps.hidratarLojaOnlineAdmin();
    if (homeDestination) deps.window.SimplificaAuthCommands.traceLogin(telaAtual === "dashboard" ? "HOME_RENDERED" : "SUPERADMIN_RENDERED");
  }

  function applyCustomersSaasFilter(deps) {
    const container = deps.document.getElementById("clientesSaasLista");
    if (container) { const total = deps.saasClients.filter((cliente) => deps.normalizarEmail(cliente.email) !== deps.superadminBootstrapEmail && !cliente.archivedAt).length; container.innerHTML = deps.renderListaClientesSaasConteudo(total); return; }
    const filtros = deps.window.__clientesSaasFiltros || {}; let visiveis = 0;
    Array.from(deps.document.querySelectorAll("[data-client-row='saas']")).forEach((linha) => { const cliente = deps.getClienteSaasPorId(linha.dataset.clientId || ""); const mostrar = cliente ? deps.clientePassaFiltrosSaas(cliente, filtros) : false; linha.hidden = !mostrar; if (mostrar) visiveis += 1; });
    const vazio = deps.document.getElementById("clientesSaasFiltroVazio"); if (vazio) vazio.hidden = visiveis !== 0;
  }

  function showToast(mensagem, tipo, duracao, deps) {
    if (typeof deps.document === "undefined" || !deps.document.body || !mensagem) return;
    const tipoNormalizado = deps.normalizarTipoToast(tipo); let texto = String(mensagem || "").trim(); if (!texto) return;
    if (tipoNormalizado === "silencioso") { deps.registrarDiagnostico("Toast", "Mensagem silenciosa", texto); return null; }
    if (deps.mensagemToastTecnica(texto)) { deps.registrarDiagnostico("Toast", "Mensagem técnica ocultada", texto); if (tipoNormalizado !== "erro") return null; texto = "Não foi possível concluir esta ação. Tente novamente."; }
    const agora = Date.now(); const holder = deps.window.__simplificaToastState || { last: new Map() }; deps.window.__simplificaToastState = holder; const chave = `${tipoNormalizado}:${texto.toLowerCase()}`; if (agora - Number(holder.last.get(chave) || 0) < deps.toastDebounceMs) return null; holder.last.set(chave, agora);
    let area = deps.document.getElementById("toastArea"); if (!area) { area = deps.document.createElement("div"); area.id = "toastArea"; area.className = "toast-area"; }
    const toastLayer = deps.getAppLayer("toast"); if (toastLayer && area.parentElement !== toastLayer) toastLayer.appendChild(area); if (!area.parentElement) deps.document.body.appendChild(area);
    const existentes = Array.from(area.querySelectorAll(".app-toast:not(.toast-loading)")); while (existentes.length >= 3) existentes.shift()?.remove();
    const toast = deps.document.createElement("div"); toast.className = "app-toast toast-" + tipoNormalizado; toast.dataset.toastType = tipoNormalizado; toast.dataset.toastCreatedAt = String(agora); const icone = tipoNormalizado === "erro" ? "×" : tipoNormalizado === "sucesso" ? "✓" : tipoNormalizado === "loading" ? "•••" : tipoNormalizado === "warning" ? "!" : "i"; toast.innerHTML = `<span class="toast-icon">${icone}</span><strong>${deps.escaparHtml(texto)}</strong>`; area.appendChild(toast);
    const informada = Number(duracao); const segura = tipoNormalizado === "loading" ? Math.max(6000, Math.min(Number.isFinite(informada) ? informada : 12000, 15000)) : Math.max(1800, Number.isFinite(informada) ? informada : 4200);
    toast.__simplificaToastTimer = deps.setTimeout(() => { if (!toast.isConnected) return; toast.classList.add("leaving"); deps.setTimeout(() => toast.remove(), 240); }, segura); return toast;
  }

  function showAdminOnDemand(deps) {
    const popup = deps.document.getElementById("popup"); if (!popup) { deps.trocarTela("admin"); return; }
    popup.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true" data-action="modal-close"><div class="modal-card admin-demand-modal"><div class="modal-header"><h2>Configure um administrador para continuar</h2><button class="icon-button" type="button" data-action="modal-close" title="Fechar">✕</button></div>${deps.renderAdminSobDemanda("")}</div></div>`;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Configurar administrador" });
  }

  function renderDashboardMobileAdvancedPanel(stats, totaisCaixa, deps) {
    if (!deps.isProfissionalMode()) return "";
    const itens = [{ tela: "producao", icon: "producao", label: "Produção", detail: `${stats.producoesAtivas || 0} em produção`, live: [`Abertos ${stats.pedidosAbertos || 0}`, `Prontos ${stats.pedidosConcluidos || 0}`] }, { tela: "caixa", icon: "caixa", label: "Caixa", detail: deps.formatarMoeda(totaisCaixa.saldo), live: [`Entradas ${deps.formatarMoeda(totaisCaixa.entradas)}`, `Saídas ${deps.formatarMoeda(totaisCaixa.saidas)}`, `Lucro ${deps.formatarMoeda(stats.lucroDiaEstimado || 0)}`] }, { tela: "relatorios", icon: "relatorios", label: "Relatórios", detail: deps.formatarMoeda(stats.faturamentoDia || 0), live: [`Lucro ${deps.formatarMoeda(stats.lucroEstimado || 0)}`, `Ticket ${deps.formatarMoeda(stats.pedidosHoje ? (stats.faturamentoDia || 0) / stats.pedidosHoje : 0)}`] }, { tela: "estoque", icon: "estoque", label: "Estoque", detail: stats.estoqueBaixo ? `${stats.estoqueBaixo} alerta(s)` : "OK", live: [`Materiais ${stats.totalMateriais || 0}`, `Consumo ${(Number(stats.consumoHojeKg) || 0).toFixed(3)} kg`] }, { tela: "administracao", icon: "empresa", label: "Administração", detail: "Empresa", live: [`Clientes com pedidos ${stats.clientesAtivos || 0}`, `Pedidos ${deps.pedidos.length}`] }].filter((item) => deps.canAccessScreen(item.tela));
    if (!itens.length) return "";
    return `<section class="home-carousel-3d-screen" aria-label="Carrossel de ações"><div class="home-carousel-3d-host" data-home-carousel-host></div></section>`;
  }

  global.SimplificaAppUiRenderers = { renderAiShortcut, renderApp, applyCustomersSaasFilter, showToast, showAdminOnDemand, renderDashboardMobileAdvancedPanel };
})(window);
