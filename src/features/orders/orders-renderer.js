(function attachOrdersRenderer(global) {
  "use strict";
  function renderListaPedidos(context = {}) {
    const { telaComCarregamentoUX, renderSmartScreenSkeleton, permitirVisualizacaoOperacionalBasica, normalizarSugestaoClienteTexto, criarIntervaloPeriodoLocal, pedidos = [], pedidoJaCancelado, dataDentroIntervalo, getDataPedidoLocal, getPedidoFiltroAtivo, pedidoEhHoje, pedidoEstaAtrasado, normalizarStatusPedidoFiltro, normalizarItensPedido, clienteDoPedido, telefoneDoPedido, LIST_PAGE_SIZE, pedidoVisualizandoId, renderDetalhePedido, escaparAttr, getNumeroSequencialPedido, totalPedido, classeStatusPedido, labelStatusPedido, escaparHtml, formatarMoeda, renderUiIcon, isWebPwaProfile, isMobile, renderListaPedidosPwa, isSimplificaMode, renderContextualAdvancedToggle, isContextAdvancedVisible, renderPedidoStatusChips } = context;
    if (telaComCarregamentoUX("pedidos")) return renderSmartScreenSkeleton("pedidos");
    const podeOperar = permitirVisualizacaoOperacionalBasica();
    const filtroDashboard = String(global.__pedidosFiltroDashboard || "");
    const filtroCliente = String(global.__pedidosFiltroCliente || "");
    const buscaPedidos = String(global.__pedidosBusca || "");
    const termoBuscaPedidos = normalizarSugestaoClienteTexto(buscaPedidos);
    const periodoHoje = criarIntervaloPeriodoLocal("hoje");
    const listaPorOrigem = filtroDashboard === "abertos" ? pedidos.filter((pedido) => !pedidoJaCancelado(pedido) && !["entregue", "cancelado", "finalizado"].includes(String(pedido.status || "aberto"))) : filtroDashboard === "hoje" ? pedidos.filter((pedido) => dataDentroIntervalo(getDataPedidoLocal(pedido), periodoHoje.start, periodoHoje.end)) : pedidos;
    const listaBaseInicial = filtroCliente ? listaPorOrigem.filter((pedido) => normalizarSugestaoClienteTexto(clienteDoPedido(pedido)) === normalizarSugestaoClienteTexto(filtroCliente)) : listaPorOrigem;
    const filtroAtivo = getPedidoFiltroAtivo();
    const listaBase = filtroAtivo === "todos" ? listaBaseInicial : filtroAtivo === "hoje" ? listaBaseInicial.filter(pedidoEhHoje) : filtroAtivo === "atrasados" ? listaBaseInicial.filter(pedidoEstaAtrasado) : listaBaseInicial.filter((pedido) => normalizarStatusPedidoFiltro(pedido) === filtroAtivo);
    const listaFiltrada = termoBuscaPedidos ? listaBase.filter((pedido) => { const itens = normalizarItensPedido(pedido).map((item) => `${item.nome || item.descricao || ""} ${item.materialNome || ""}`).join(" "); const texto = `${pedido.id || ""} ${clienteDoPedido(pedido)} ${telefoneDoPedido(pedido)} ${pedido.status || ""} ${itens}`; return normalizarSugestaoClienteTexto(texto).includes(termoBuscaPedidos); }) : listaBase;
    const lista = [...listaFiltrada].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    const limitePedidos = Math.max(LIST_PAGE_SIZE, Number(global.__pedidosLimite) || LIST_PAGE_SIZE);
    const listaPaginada = lista.slice(0, limitePedidos);
    const pedidoSelecionado = pedidos.find((pedido) => String(pedido.id) === String(pedidoVisualizandoId));
    const detalhe = pedidoSelecionado ? renderDetalhePedido(pedidoSelecionado) : "";
    const linhas = lista.length ? listaPaginada.map((pedido) => { const id = String(pedido.id ?? ""); const idJs = escaparAttr(JSON.stringify(id)); const numeroPedido = getNumeroSequencialPedido(pedido); const itens = Array.isArray(pedido.itens) ? pedido.itens.length : 1; const status = pedido.status || "aberto"; const total = totalPedido(pedido); const prazo = pedido.prazo || pedido.dataPrazo || pedido.data || ""; const telefone = telefoneDoPedido(pedido); return `
          <div class="list-row clickable-row order-list-card smart-order-row order-card-tone-${escaparAttr(classeStatusPedido(status).replace("order-status-", ""))}" role="button" tabindex="0" aria-label="Abrir Pedido ${escaparAttr(String(numeroPedido))} de ${escaparAttr(clienteDoPedido(pedido))}. Toque longo para mais ações." title="Toque para abrir. Toque longo para editar ou ver mais ações." onpointerdown="iniciarToqueLongoPedido(event, ${idJs})" onpointermove="atualizarToqueLongoPedido(event, ${idJs})" onpointerup="finalizarToqueLongoPedido(event, ${idJs})" onpointercancel="cancelarToqueLongoPedido(${idJs}, true)" onpointerleave="cancelarToqueLongoPedido(${idJs}, event.pointerType !== 'mouse')" oncontextmenu="abrirMenuContextualPedido(event, ${idJs})" onclick="acionarToquePedido(event, ${idJs})" onkeydown="acionarPedidoPorTeclado(event, ${idJs})">
            <div class="smart-order-main"><div class="smart-order-head"><span class="smart-order-number">Pedido ${escaparHtml(numeroPedido)}</span><span class="order-status-badge ${classeStatusPedido(status)}">${escaparHtml(labelStatusPedido(status))}</span><strong class="smart-order-contact-name">${escaparHtml(clienteDoPedido(pedido))}</strong></div><div class="smart-order-meta"><span>${itens} item(ns)</span>${prazo ? `<span>Prazo: ${escaparHtml(prazo)}</span>` : ""}${telefone ? `<span>${escaparHtml(telefone)}</span>` : ""}</div></div>
            <div class="smart-order-side"><strong>${formatarMoeda(total)}</strong><button class="icon-button ui-context-menu-trigger smart-order-more-button" type="button" aria-label="Mais ações do Pedido ${escaparAttr(String(numeroPedido))}" title="Mais ações" onclick="event.preventDefault(); event.stopPropagation(); abrirMaisOpcoesPedido(${idJs})">${renderUiIcon("more")}</button></div>
          </div>`; }).join("") : `<p class="empty">${termoBuscaPedidos ? "Nenhum pedido encontrado." : "Nenhum pedido fechado ainda."}</p>`;
    const paginacao = lista.length > listaPaginada.length ? `<div class="actions pagination-actions"><span class="muted">Mostrando ${listaPaginada.length} de ${lista.length}</span><button class="btn ghost" onclick="carregarMaisPedidos()">Carregar mais</button></div>` : "";
    if (isWebPwaProfile() && !isMobile()) return renderListaPedidosPwa({ podeOperar, filtroDashboard, filtroCliente, lista, listaPaginada, pedidoSelecionado, filtroAtivo, listaBaseInicial, linhas, paginacao });
    const modoSimples = isSimplificaMode();
    const acaoNovoPedido = podeOperar ? `<button class="btn primary ui3-simple-orders-new" type="button" data-action="open-order-editor">${renderUiIcon("pedido")} Novo pedido</button>` : `<button class="btn ghost" onclick="trocarTela('assinatura')">Pagar agora</button>`;
    return `
      <section class="ui3-real-screen ui3-page ui3-stack ui3-gap-4 ui3-orders ${pedidoSelecionado ? "ui3-orders-has-detail" : ""}" data-ui-version="v3" data-ui3-screen="pedidos">
        ${modoSimples ? `<div class="ui3-simple-orders-toolbar">${acaoNovoPedido}</div>` : `<div class="card-header"><h2>${renderUiIcon("pedidos")} Pedidos</h2><div class="actions compact-actions">${renderContextualAdvancedToggle("pedidos")}${podeOperar ? `<button class="icon-button" type="button" data-action="open-order-editor" title="Novo pedido">${renderUiIcon("plus")}</button>` : `<button class="btn ghost" onclick="trocarTela('assinatura')">Pagar agora</button>`}</div></div>`}
        ${filtroDashboard ? `<div class="filter-chip-row"><span class="status-badge">Filtro: ${filtroDashboard === "hoje" ? "pedidos de hoje" : "pedidos em aberto"}</span><button class="btn ghost" onclick="window.__pedidosFiltroDashboard=''; renderApp()">Ver todos</button></div>` : ""}
        ${podeOperar ? "" : `<p class="muted">Seu plano está inativo. Você pode visualizar seus dados e regularizar o pagamento para continuar.</p>`}
        <label class="dashboard-search stock-search-field" onclick="this.querySelector('input')?.focus()"><span class="search-lens-icon" aria-hidden="true">${renderUiIcon("search")}</span><input data-search-context="pedidos" data-preserve-focus-key="pedidos-busca" value="${escaparAttr(buscaPedidos)}" placeholder="Buscar pedido, cliente ou item..." oninput="window.__pedidosBusca=this.value; agendarRenderizacaoPreservandoScroll(180); reabrirAutocompletePesquisaAposRender(this)" onblur="agendarFechamentoAutocompletePesquisa(this)" autocomplete="off"></label>
        ${(isMobile() || isContextAdvancedVisible("pedidos")) ? renderPedidoStatusChips(listaBaseInicial, filtroAtivo) : ""}${detalhe}${linhas}${paginacao}
      </section>`;
  }
  function renderDetalhePedido(pedido = {}, context = {}) {
    const { normalizarItensPedido, escaparAttr, calcularResumoFinanceiroPedido, dataPedidoIso, normalizarStatusPedidoFiltro, escaparHtml, getNumeroSequencialPedido, renderUiIcon, clienteDoPedido, telefoneDoPedido, classeStatusPedido, labelStatusPedido, formatarMoeda, classeStatusFinanceiroPedido, labelStatusFinanceiroPedido, renderRentabilidadeOperacionalPedido, renderPedidoRapidoTimeline, renderHistoricoOperacionalPedido, renderAcaoPedidoCompacta, getMateriaisItem, getMaterialEstoque, renderIconeAcaoPedido } = context;
    const itens = normalizarItensPedido(pedido); const pedidoIdJs = escaparAttr(JSON.stringify(String(pedido.id ?? ""))); const resumoFinanceiro = calcularResumoFinanceiroPedido(pedido); const total = resumoFinanceiro.total; const data = pedido.data || dataPedidoIso(pedido) || ""; const cancelado = normalizarStatusPedidoFiltro(pedido) === "cancelados";
    return `<div class="detail-panel order-detail-panel"><div class="order-detail-hero"><div><span class="eyebrow">Pedido</span><h2>Pedido ${escaparHtml(getNumeroSequencialPedido(pedido))}</h2><p class="muted order-detail-meta-line">${renderUiIcon("conta")} ${escaparHtml(clienteDoPedido(pedido))}${telefoneDoPedido(pedido) ? " • " + escaparHtml(telefoneDoPedido(pedido)) : ""}</p>${data ? `<p class="muted order-detail-meta-line">${renderUiIcon("agenda")} ${escaparHtml(data)}</p>` : ""}</div><div class="order-detail-hero-actions"><span class="order-status-badge ${classeStatusPedido(pedido.status || "aberto")}">${escaparHtml(labelStatusPedido(pedido.status || "aberto"))}</span><button class="btn secondary" type="button" onclick="event.preventDefault(); event.stopPropagation(); fecharDetalhesPedido()">Voltar à lista</button></div></div><div class="order-detail-total"><div><span>Resumo do pedido</span><strong>${itens.length} item(ns)</strong></div><div><span>Total</span><strong>${formatarMoeda(total)}</strong></div></div><div class="order-financial-summary compact"><div><span>Subtotal dos itens</span><strong>${formatarMoeda(resumoFinanceiro.subtotal)}</strong></div>${resumoFinanceiro.desconto > 0 ? `<div><span>Desconto</span><strong>${formatarMoeda(resumoFinanceiro.desconto)}</strong></div>` : ""}<div><span>Total do pedido</span><strong>${formatarMoeda(resumoFinanceiro.total)}</strong></div><div><span>Entrada paga</span><strong>${formatarMoeda(resumoFinanceiro.entrada)}</strong></div><div><span>Valor restante</span><strong>${formatarMoeda(resumoFinanceiro.restante)}</strong></div><div><span>Status financeiro</span><strong class="order-status-badge ${classeStatusFinanceiroPedido(resumoFinanceiro.statusFinanceiro)}">${escaparHtml(labelStatusFinanceiroPedido(resumoFinanceiro.statusFinanceiro))}</strong></div>${resumoFinanceiro.entradaMaiorQueTotal ? `<p class="order-finance-warning">A entrada é maior que o total do pedido</p>` : ""}</div>${renderRentabilidadeOperacionalPedido(pedido)}${renderPedidoRapidoTimeline(pedido.status || "aberto")}${renderHistoricoOperacionalPedido(pedido)}${itens.length ? `<div class="compact-action-grid order-detail-actions">${renderAcaoPedidoCompacta("☘", "WhatsApp", `enviarWhatsPedidoSalvo(${pedidoIdJs})`)}${renderAcaoPedidoCompacta("▣", "PDF", `baixarPdfPedidoSalvo(${pedidoIdJs})`)}${cancelado ? renderAcaoPedidoCompacta("⎙", "Imprimir", `imprimirPedidoSalvo(${pedidoIdJs})`) : renderAcaoPedidoCompacta("✎", "Editar", `editarPedido(${pedidoIdJs})`)}${renderAcaoPedidoCompacta("⋯", "Mais", `abrirMaisOpcoesPedido(${pedidoIdJs})`)}</div>` : `<p class="muted">Adicione pelo menos 1 item para liberar PDF e WhatsApp.</p>`}${cancelado ? "" : `<div class="order-status-action-strip"><button type="button" onclick="abrirEtapasPedido(${pedidoIdJs})" aria-haspopup="dialog">Atualizar etapa</button></div>`}<div class="history-list order-detail-items">${itens.map((item) => `<div class="history-item premium-order-item"><div><strong>${escaparHtml(item.nome)}</strong><span class="muted">Qtd ${item.qtd} • ${escaparHtml(item.tipoImpressao)} • ${Number(item.tempoHoras || 0).toFixed(2)}h</span><div class="material-chip-row">${getMateriaisItem(item).map((material) => `<span class="order-chip">${escaparHtml(material.nome || getMaterialEstoque(material.materialId)?.nome || "Material")} • ${Number(material.gramas).toFixed(0)}g</span>`).join("") || `<span class="order-chip muted-chip">Sem material</span>`}</div></div><strong class="item-price">${formatarMoeda(item.total)}</strong></div>`).join("")}</div>${cancelado ? "" : `<button class="btn danger compact-danger-action" onclick="removerPedido(${pedidoIdJs})">${renderIconeAcaoPedido("🗑", "Cancelar")} Cancelar pedido</button>`}</div>`;
  }
  function getOrderFilterDefs() {
    return [
      { id: "todos", label: "Todos" }, { id: "hoje", label: "Hoje" }, { id: "pendentes", label: "Pendentes" },
      { id: "producao", label: "Em produção" }, { id: "atrasados", label: "Atrasados", className: "danger" },
      { id: "prontos", label: "Prontos" }, { id: "entregues", label: "Entregues" }, { id: "pagos", label: "Pagos" },
      { id: "cancelados", label: "Cancelados" }
    ];
  }
  function countOrdersByFilter(list = [], context = {}) {
    const { pedidoEhHoje, pedidoEstaAtrasado, normalizarStatusPedidoFiltro } = context;
    const counters = { todos: 0, hoje: 0, pendentes: 0, producao: 0, atrasados: 0, prontos: 0, entregues: 0, pagos: 0, cancelados: 0 };
    list.forEach((order) => {
      counters.todos += 1;
      if (pedidoEhHoje(order)) counters.hoje += 1;
      if (pedidoEstaAtrasado(order)) counters.atrasados += 1;
      const filter = normalizarStatusPedidoFiltro(order);
      counters[filter] = (counters[filter] || 0) + 1;
    });
    return counters;
  }
  function renderOrderStatusChips(list = [], active = "todos", context = {}) {
    const { escaparAttr, escaparHtml } = context;
    const counters = countOrdersByFilter(list, context);
    return `<div class="order-filter-chips" role="tablist" aria-label="Filtrar pedidos">${getOrderFilterDefs().map((item) => `<button class="order-filter-chip ${item.className || ""} ${active === item.id ? "active" : ""}" type="button" role="tab" aria-selected="${active === item.id}" onclick="trocarFiltroPedidos('${escaparAttr(item.id)}')"><span>${escaparHtml(item.label)}</span><strong>${Number(counters[item.id] || 0)}</strong></button>`).join("")}</div>`;
  }
  function renderOrderStatusSelect(list = [], active = "todos", context = {}) {
    const { escaparAttr, escaparHtml } = context;
    const counters = countOrdersByFilter(list, context);
    return `<label class="order-filter-compact"><span>Status</span><select aria-label="Filtrar pedidos por status" onchange="trocarFiltroPedidos(this.value)">${getOrderFilterDefs().map((item) => `<option value="${escaparAttr(item.id)}" ${active === item.id ? "selected" : ""}>${escaparHtml(item.label)} (${Number(counters[item.id] || 0)})</option>`).join("")}</select></label>`;
  }
  function renderOrderMaterialChips(item = {}, context = {}) {
    const { getMateriaisItem, getMaterialEstoque, escaparHtml } = context;
    const chips = getMateriaisItem(item).slice(0, 3).map((material) => material.nome || getMaterialEstoque(material.materialId)?.nome || "Material").filter(Boolean);
    return chips.length ? chips.map((chip) => `<span class="order-chip">${escaparHtml(chip)}</span>`).join("") : `<span class="order-chip muted-chip">Sem material</span>`;
  }
  function renderOrderActionIcon(icon, label = "") {
    const key = `${label} ${icon}`.toLowerCase();
    const type = key.includes("whatsapp") || icon === "☘" ? "whatsapp" : key.includes("duplicar") || key.includes("copiar") ? "copy" : key.includes("pdf") || icon === "▣" ? "pdf" : key.includes("editar") || icon === "✎" ? "edit" : key.includes("imprimir") || icon === "⎙" ? "print" : key.includes("calcul") || icon === "🧮" ? "calc" : key.includes("excluir") || icon === "🗑" ? "trash" : key.includes("ver") || icon === "👁" ? "view" : key.includes("mais") || icon === "⋯" ? "more" : "plus";
    const attrs = `width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"`;
    const icons = { whatsapp: `<svg ${attrs}><path d="M20 11.6a8 8 0 0 1-11.8 7l-3.2.9.9-3.1A8 8 0 1 1 20 11.6Z"/><path d="M9.5 8.8c.2 3 2 4.8 5 5.7l1.1-1.1c.3-.3.8-.4 1.2-.2l1.2.6"/><path d="M8.5 7.1l.9 1.7"/></svg>`, pdf: `<svg ${attrs}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M8.5 16h7"/><path d="M8.5 12h7"/></svg>`, edit: `<svg ${attrs}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>`, copy: `<svg ${attrs}><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>`, print: `<svg ${attrs}><path d="M7 8V3h10v5"/><path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/></svg>`, calc: `<svg ${attrs}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 15h.01"/><path d="M12 15h.01"/><path d="M16 15h.01"/></svg>`, trash: `<svg ${attrs}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`, view: `<svg ${attrs}><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v5h5"/><path d="M9 13h5"/><path d="M9 17h7"/></svg>`, more: `<svg ${attrs}><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>`, plus: `<svg ${attrs}><path d="M12 5v14"/><path d="M5 12h14"/></svg>` };
    return icons[type] || icons.plus;
  }
  function renderOrderCompactAction(icon, label, onclick, variant = "", context = {}) {
    return `<button class="action-tile ${variant ? `action-${variant}` : ""}" type="button" onclick="${onclick}" title="${context.escaparAttr(label)}"><span class="action-symbol" aria-hidden="true">${renderOrderActionIcon(icon, label)}</span><small>${context.escaparHtml(label)}</small></button>`;
  }
  function renderQuickOrderTimeline(status = "aberto", context = {}) {
    const statusAtual = String(status || "aberto").toLowerCase();
    const stages = [{ id: "aberto", label: "Criado" }, { id: "producao", label: "Produção" }, { id: "pronto", label: "Pronto" }, { id: "entregue", label: "Entregue" }, { id: "pago", label: "Pago" }];
    const currentIndex = Math.max(0, stages.findIndex((stage) => stage.id === statusAtual));
    return `<div class="order-operational-timeline" aria-label="Linha do tempo do pedido">${stages.map((stage, index) => `<span class="${index <= currentIndex ? "done" : ""}"><i></i><small>${context.escaparHtml(stage.label)}</small></span>`).join("")}</div>`;
  }
  function renderQuickOrderPwaCommands(context = {}) {
    if (!context.isWebPwaProfile() || context.isMobile()) return "";
    return `<aside class="quick-order-command-panel" aria-label="Comandos rápidos"><strong>Comandos rápidos</strong><ul><li><kbd>Enter</kbd><span>Adicionar item</span></li><li><kbd>Ctrl</kbd><b>+</b><kbd>Enter</kbd><span>Salvar pedido</span></li><li><kbd>Esc</kbd><span>Fechar</span></li><li><kbd>←</kbd><b>/</b><kbd>→</kbd><span>Navegar telas</span></li><li><kbd>↑</kbd><b>/</b><kbd>↓</kbd><span>Menu lateral</span></li></ul></aside>`;
  }
  function renderOrderOperationalHistory(order = {}, context = {}) {
    const events = context.getEventosOperacionaisPedido(order);
    const icons = { pedido: "historico", estoque: "estoqueMovimento", producao: "statusProducao", caixa: "caixa" };
    return `<section class="order-operational-history"><div class="order-operational-history-head"><div><span class="eyebrow">Rastreabilidade</span><h3>Histórico operacional</h3></div><small>${events.length} evento${events.length === 1 ? "" : "s"}</small></div>${events.length ? `<div class="order-operational-history-list">${events.map((event) => `<article class="order-operational-history-item order-event-${context.escaparAttr(event.tipo)}"><span class="order-operational-history-icon">${context.renderUiIcon(icons[event.tipo] || "historico")}</span><div><strong>${context.escaparHtml(event.titulo)}</strong>${event.detalhe ? `<p>${context.escaparHtml(event.detalhe)}</p>` : ""}<time datetime="${context.escaparAttr(event.data)}">${context.escaparHtml(context.formatarDataEventoOperacionalPedido(event.data))}</time></div></article>`).join("")}</div>` : `<p class="muted">Nenhum evento operacional registrado para este pedido.</p>`}</section>`;
  }
  function renderOrderProfitability(order = {}, context = {}) {
    const receita = Math.max(0, context.totalPedido(order));
    const costs = context.calcularCustosPedidoAnalytics(order);
    const custo = Math.max(0, Number(costs?.cost) || 0);
    const lucro = receita - custo;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;
    const realizado = context.calcularCaixaVinculadoPedido(order);
    return `<section class="order-profitability-summary" aria-label="Rentabilidade estimada do pedido"><div><span>Receita</span><strong>${context.formatarMoeda(receita)}</strong></div><div><span>Custo estimado</span><strong>${context.formatarMoeda(custo)}</strong></div><div class="${lucro < 0 ? "is-negative" : ""}"><span>Lucro estimado</span><strong>${context.formatarMoeda(lucro)}</strong></div><div class="${margem < 0 ? "is-negative" : ""}"><span>Margem estimada</span><strong>${margem.toFixed(1)}%</strong></div></section><section class="order-profitability-summary" aria-label="Caixa vinculado ao pedido"><div><span>Entradas vinculadas</span><strong>${context.formatarMoeda(realizado.entradas)}</strong></div><div><span>Saídas vinculadas</span><strong>${context.formatarMoeda(realizado.saidas)}</strong></div><div class="${realizado.saldo < 0 ? "is-negative" : ""}"><span>Saldo de caixa vinculado</span><strong>${context.formatarMoeda(realizado.saldo)}</strong></div><div><span>Lançamentos válidos</span><strong>${realizado.quantidade}</strong></div></section><p class="muted">${realizado.quantidade ? "Somente lançamentos com vínculo explícito a este pedido." : "Nenhum lançamento com vínculo explícito a este pedido. Isso não comprova ausência de pagamento."} Saldo de caixa não é lucro realizado; custos não lançados e movimentos sem vínculo não estão incluídos.</p>`;
  }
  function renderOrderPwaList(args = {}, context = {}) {
    const { podeOperar, filtroDashboard, filtroCliente = "", lista = [], pedidoSelecionado, filtroAtivo = "todos", listaBaseInicial = [], linhas, paginacao } = args;
    const selecionado = context.isDetailClosed() ? null : (pedidoSelecionado || null);
    const detalhe = selecionado ? context.renderDetalhePedido(selecionado) : `<div class="order-empty-detail"><strong>Selecione um pedido</strong><span>Os detalhes, itens, status e ações aparecem neste painel.</span></div>`;
    return `<section class="ui3-real-screen ui3-page ui3-stack ui3-gap-4 ui3-orders orders-pwa-page ${pedidoSelecionado ? "ui3-orders-has-detail" : ""}" data-ui-version="v3" data-ui3-screen="pedidos"><header class="pwa-page-header"><div><span class="eyebrow">Pedidos</span><h2>Pedidos e orçamentos</h2><p class="muted">Lista, detalhes e ações em painéis separados para evitar mistura com a Home.</p></div><div class="actions compact-actions">${context.renderContextualAdvancedToggle("pedidos")}${podeOperar ? `<button class="btn" type="button" data-action="open-order-editor">${context.renderUiIcon("pedido")} Novo pedido</button>` : `<button class="btn ghost" onclick="trocarTela('assinatura')">Pagar agora</button>`}</div></header><div class="orders-pwa-layout"><section class="orders-pwa-list card"><div class="card-header"><div><h2>Lista de pedidos</h2><span class="muted">${lista.length} registro(s)</span></div><label class="dashboard-search search-compact" onclick="expandirBuscaGlobal(this)"><button class="search-action-button" type="button" onclick="event.preventDefault();event.stopPropagation();expandirBuscaGlobal(this)" title="Buscar pedido" aria-label="Abrir pesquisa de pedidos"><span class="search-lens-icon" aria-hidden="true">${context.renderUiIcon("search")}</span></button><input data-search-context="pedidos" data-preserve-focus-key="pedidos-busca" value="${context.escaparAttr(String(context.searchValue() || ""))}" placeholder="Buscar pedido, cliente ou item..." oninput="window.__pedidosBusca=this.value; agendarRenderizacaoPreservandoScroll(180); reabrirAutocompletePesquisaAposRender(this)" onblur="agendarFechamentoAutocompletePesquisa(this)" autocomplete="off"></label></div>${(filtroDashboard || filtroCliente) ? `<div class="filter-chip-row"><span class="status-badge">Filtro: ${filtroCliente ? context.escaparHtml(filtroCliente) : filtroDashboard === "hoje" ? "pedidos de hoje" : "pedidos em aberto"}</span><button class="btn ghost" onclick="window.__pedidosFiltroDashboard=''; window.__pedidosFiltroCliente=''; renderApp()">Ver todos</button></div>` : ""}${podeOperar ? "" : `<p class="muted">Seu plano está inativo. Você pode visualizar seus dados e regularizar o pagamento para continuar.</p>`}${context.isContextAdvancedVisible("pedidos") ? context.renderPedidoStatusSelect(listaBaseInicial, filtroAtivo) : ""}<div class="orders-pwa-list-scroll">${linhas}</div>${paginacao}</section><aside class="orders-pwa-detail card">${detalhe}</aside></div></section>`;
  }
  function renderOrderRollConsumptionPreview(stockItem = {}, quantity = 0, unit = "", context = {}) {
    if (!context.previewEnabled || !context.podeUsarControleRolosEstoque() || !context.materialUsaControleLote(stockItem)) return "";
    const preview = context.calcularPreviaConsumoPorRolo(stockItem, quantity, unit);
    const type = stockItem.batch_control_type || "rolo";
    return `<div class="stock-batch-preview"><div class="stock-batch-preview-head"><strong>Prévia de consumo por ${context.escaparHtml(type)}</strong><span class="status-badge badge-alerta">Sem baixa automática</span></div><small>Simulação visual. Nenhum saldo de rolo/lote será alterado nesta etapa.</small>${preview.falta > 0 ? `<p class="stock-batch-warning">Estoque insuficiente. Disponível: ${context.formatarQuantidadeEstoque(preview.disponivel, preview.unidade)}. Necessário: ${context.formatarQuantidadeEstoque(preview.necessario, preview.unidade)}.</p>` : ""}<div class="stock-batch-preview-list">${preview.sugestoes.length ? preview.sugestoes.map(({ lote, quantidade: consumir, saldoAtual, saldoSimulado }) => `<div class="stock-batch-preview-row"><span>${context.escaparHtml(lote.batch_code || `${type} ${lote.id}`)}</span><strong>${context.formatarQuantidadeEstoque(consumir, preview.unidade)}</strong><small>${context.formatarQuantidadeEstoque(saldoAtual, preview.unidade)} → ${context.formatarQuantidadeEstoque(saldoSimulado, preview.unidade)}</small></div>`).join("") : `<p class="empty">Nenhum ${context.escaparHtml(type)} ativo para simular.</p>`}</div></div>`;
  }
  function renderOrderMaterials(item = {}, itemIndex, context = {}) {
    const materials = context.getMateriaisItem(item);
    return `<div class="order-stock-materials-title"><div><strong>Materiais e itens do estoque</strong><small>Adicione filamentos, cores, pingentes, sacolas e outros itens.</small></div><button class="btn ghost" type="button" onclick="adicionarMaterialProduto(${itemIndex})" ${materials.length >= 4 ? "disabled" : ""}>${context.renderUiIcon("plus")} Adicionar material</button></div>${materials.length ? materials.slice(0, 4).map((material, materialIndex) => { const stockItem = context.getMaterialEstoque(material.materialId); const unit = material.unidade || stockItem?.unidade || "un"; return `<div class="material-line"><div class="row-title"><strong>${context.escaparHtml(stockItem?.nome || material.nome || "Item do estoque")}</strong><span class="muted">${context.formatarQuantidadeEstoque(material.quantidade, unit)} • ${context.formatarMoeda(Number(material.valorUnitario) || 0)} por ${context.escaparHtml(unit)}</span></div><strong>${context.formatarMoeda((Number(material.quantidade) || 0) * (Number(material.valorUnitario) || 0))}</strong><details class="stock-item-menu"><summary class="icon-action-button" title="Ações do material" aria-label="Ações do material">${context.renderUiIcon("more")}</summary><div class="stock-item-menu-popover"><button type="button" onclick="abrirPopupMaterialPedido(${itemIndex}, ${materialIndex})">${context.renderUiIcon("edit")} Editar</button><button type="button" onclick="removerMaterialProduto(${itemIndex}, ${materialIndex})">${context.renderUiIcon("trash")} Excluir</button></div></details></div>${stockItem ? context.renderOrderRollConsumptionPreview(stockItem, Number(material.quantidade) || 0, unit) : ""}`; }).join("") : `<p class="empty">Nenhum material adicionado.</p>`}`;
  }
  function renderOrderReview(nextOrder = {}, previousOrder = {}, diff = {}, context = {}) {
    const totalAnterior = context.totalPedido(previousOrder); const novoTotal = context.totalPedido(nextOrder); const list = (items) => items.length ? items.map(context.escaparHtml).join(", ") : "Nenhum";
    return `<div class="modal-backdrop" role="dialog" aria-modal="true"><div class="modal-card order-review-box"><div class="modal-header"><h2>Revise as alterações do pedido</h2><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div><div class="sync-grid"><div class="metric"><span>Cliente</span><strong>${context.escaparHtml(context.clienteDoPedido(nextOrder))}</strong></div><div class="metric"><span>Total anterior</span><strong>${context.formatarMoeda(totalAnterior)}</strong></div><div class="metric"><span>Novo total</span><strong>${context.formatarMoeda(novoTotal)}</strong></div><div class="metric"><span>Diferença</span><strong>${context.formatarMoeda(novoTotal - totalAnterior)}</strong></div></div><div class="history-list"><div class="history-item"><strong>Itens adicionados</strong><span class="muted">${list(diff.adicionados || [])}</span></div><div class="history-item"><strong>Itens removidos</strong><span class="muted">${list(diff.removidos || [])}</span></div><div class="history-item"><strong>Itens alterados</strong><span class="muted">${list(diff.alterados || [])}</span></div></div><div class="actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Voltar e editar</button><button class="btn" type="button" onclick="confirmarRevisaoAlteracoesPedido()">Confirmar alterações</button><button class="btn danger" type="button" onclick="cancelarEdicaoPedido();fecharPopup()">Cancelar</button></div></div></div>`;
  }
  function renderRecentDashboardOrders(context = {}) {
    const list = context.getPedidoRecenteDashboard().slice(0, 4);
    if (!list.length) return `<section class="dashboard-recent-orders card"><div class="card-header"><h2>Pedidos recentes</h2><button class="text-link" type="button" onclick="acionarAtalhoRapido('novo_pedido')">Criar pedido</button></div><div class="empty-state compact-empty">Nenhum pedido recente ainda.</div></section>`;
    return `<section class="dashboard-recent-orders card"><div class="card-header"><h2>Pedidos recentes</h2><button class="text-link" type="button" onclick="trocarTela('pedidos')">Ver todos ›</button></div><div class="dashboard-order-list">${list.map((order) => { const customer = context.clienteDoPedido(order) || "Cliente"; const items = context.normalizarItensPedido(order); const dueDate = order.prazo || order.dataPrazo || order.data || ""; const status = order.status || "aberto"; const tone = context.classeStatusPedido(status).replace("order-status-", ""); const id = Number(order.id); return `<button class="dashboard-order-row order-card-tone-${context.escaparAttr(tone)}" type="button" title="Toque para abrir. Toque longo para editar ou ver mais ações." onpointerdown="iniciarToqueLongoPedido(event, ${id})" onpointermove="atualizarToqueLongoPedido(event, ${id})" onpointerup="finalizarToqueLongoPedido(event, ${id})" onpointercancel="cancelarToqueLongoPedido(${id}, true)" onpointerleave="cancelarToqueLongoPedido(${id}, event.pointerType !== 'mouse')" oncontextmenu="abrirMenuContextualPedido(event, ${id})" onclick="acionarToquePedido(event, ${id})"><span class="dashboard-order-main"><strong>${context.escaparHtml(customer)}</strong><small>Pedido ${context.escaparHtml(context.getNumeroSequencialPedido(order))} • ${items.length} item(ns)${dueDate ? ` • Prazo: ${context.escaparHtml(dueDate)}` : ""}</small></span><span class="dashboard-order-total"><strong>${context.formatarMoeda(context.totalPedido(order))}</strong><small>${context.escaparHtml(context.labelStatusPedido(status))}</small></span></button>`; }).join("")}</div></section>`;
  }
function renderQuickOrderOperational(context = {}) {
    const { normalizarItensPedido, calcularResumoFinanceiroPedido, descontoPedido, entradaPedido, pedidoEditando, document, quickOrderStatusDraft, getItensPedidoRapidoSelecionados, formatarMoeda, renderIconeAcaoPedido, isItemPedidoRapidoSelecionado, escaparHtml, escaparAttr, renderAppEmptyState, clientePedido, renderCustomerSuggestions, clienteTelefonePedido, clienteEmailPedido, quickOrderItemDraft, renderUiIcon, renderOpcoesMetodoPagamentoCaixa, quickOrderPaymentMethodDraft, prazoPedido, labelStatusPedido, observacaoPedido, renderComandosPedidoRapidoPwa, classeStatusPedido, renderPedidoRapidoTimeline, pedidoSalvando, quickOrderSaveLock } = context;
    const items = Array.isArray(context.itensPedido) ? context.itensPedido : [];
  const total = normalizarItensPedido(items).reduce((soma, item) => soma + (Number(item.total) || 0), 0);
  const resumo = calcularResumoFinanceiroPedido({
    itens: items,
    subtotalItens: total,
    desconto: descontoPedido,
    down_payment: entradaPedido
  });
  const statusAtual = pedidoEditando?.status || document.getElementById("pedidoStatus")?.value || quickOrderStatusDraft || "aberto";
  const selecionadosPedidoRapido = getItensPedidoRapidoSelecionados();
  const totalSelecionadoPedidoRapido = selecionadosPedidoRapido.reduce((soma, index) => soma + (Number(normalizarItensPedido(items)[index]?.total) || 0), 0);
  const barraSelecaoPedidoRapido = items.length ? `
    <div class="quick-order-bulkbar ${selecionadosPedidoRapido.length ? "is-active" : ""}">
      <div>
        <strong>${selecionadosPedidoRapido.length ? `${selecionadosPedidoRapido.length} selecionado${selecionadosPedidoRapido.length > 1 ? "s" : ""}` : "Seleção múltipla"}</strong>
        <small>${selecionadosPedidoRapido.length ? `Total selecionado: ${formatarMoeda(totalSelecionadoPedidoRapido)}` : "Marque itens para agir em lote."}</small>
      </div>
      <div class="quick-order-bulk-actions">
        <button class="btn ghost" type="button" onclick="selecionarTodosItensPedidoRapido()">Todos</button>
        <button class="btn ghost" type="button" onclick="limparSelecaoItensPedidoRapido()" ${selecionadosPedidoRapido.length ? "" : "disabled"}>Limpar</button>
        <label class="bulk-qty-field">
          <span>Qtd</span>
          <input id="quickOrderBulkQty" type="number" min="1" step="1" value="1" ${selecionadosPedidoRapido.length ? "" : "disabled"}>
        </label>
        <button class="btn secondary" type="button" onclick="aplicarQuantidadeItensSelecionadosPedidoRapido()" ${selecionadosPedidoRapido.length ? "" : "disabled"}>Aplicar qtd</button>
        <button class="btn danger" type="button" onclick="removerItensSelecionadosPedidoRapido()" ${selecionadosPedidoRapido.length ? "" : "disabled"}>${renderIconeAcaoPedido("🗑", "Excluir")} Remover</button>
      </div>
    </div>
  ` : "";
  const itensHtml = items.length
    ? `<div class="quick-order-items">${normalizarItensPedido(items).map((item, index) => `
        <article class="${isItemPedidoRapidoSelecionado(index) ? "is-selected" : ""}">
          <label class="quick-order-item-select" title="Selecionar item ${index + 1}">
            <input type="checkbox" ${isItemPedidoRapidoSelecionado(index) ? "checked" : ""} onchange="alternarSelecaoItemPedidoRapido(${index}, this.checked)">
            <span>${isItemPedidoRapidoSelecionado(index) ? "✓" : index + 1}</span>
          </label>
          <div>
            <strong>${escaparHtml(item.nome || "Item do pedido")}</strong>
            <small>Qtd ${Number(item.qtd) || 1} • ${formatarMoeda(Number(item.valor) || 0)} un. • ${Number(item.tempoHoras || 0).toFixed(2)}h${Number(item.materialGramsTotal || 0) > 0 ? ` • ${Number(item.materialGramsTotal).toFixed(1)} g` : ""}</small>
          </div>
          <b>${formatarMoeda(Number(item.total) || 0)}</b>
          <button class="icon-action-button danger" type="button" onclick="removerItemRapidoOperacional(${index})" title="Remover item">${renderIconeAcaoPedido("🗑", "Excluir")}</button>
        </article>
      `).join("")}</div>`
    : renderAppEmptyState({
        title: "Nenhum item ainda",
        description: "Adicione um item manual ou use a calculadora inline para continuar sem sair do fluxo."
      });

  return `
    <div class="modal-backdrop operational-drawer-backdrop" role="dialog" aria-modal="true">
      <section class="modal-card operational-drawer quick-order-drawer">
        <div class="modal-header">
          <div>
            <h2>${pedidoEditando ? "Editar pedido rápido" : "Pedido rápido"}</h2>
            <p class="muted">Cliente, item, entrada e status em um fluxo contínuo.</p>
          </div>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="quick-order-layout">
          <form class="quick-order-form" id="quickOrderForm" onsubmit="salvarPedidoRapidoOperacional(event)" onkeydown="gerenciarTecladoPedidoRapido(event)">
            <section class="quick-order-section">
              <div class="quick-order-section-title">
                <span>1</span>
                <strong>Cliente rápido</strong>
              </div>
              <div class="form-grid">
                <label class="field customer-field">
                  <span>Cliente</span>
                  <input id="clienteNome" value="${escaparAttr(clientePedido)}" placeholder="Nome do cliente" autocomplete="off" oninput="atualizarClientePedido(this.value)">
                  <div id="customerSuggestionPanel">${renderCustomerSuggestions()}</div>
                </label>
                <label class="field">
                  <span>WhatsApp</span>
                  <input id="clienteTelefone" inputmode="tel" value="${escaparAttr(clienteTelefonePedido)}" placeholder="5585999999999" oninput="atualizarTelefoneClientePedido(this.value)">
                </label>
                <label class="field">
                  <span>E-mail</span>
                  <input id="clienteEmail" inputmode="email" value="${escaparAttr(clienteEmailPedido)}" placeholder="cliente@email.com" oninput="atualizarEmailClientePedido(this.value)">
                </label>
              </div>
            </section>

            <section class="quick-order-section">
              <div class="quick-order-section-title">
                <span>2</span>
                <strong>Adicionar item</strong>
              </div>
              <div class="quick-item-grid">
                <label class="field quick-item-name">
                  <span>Item</span>
                  <input id="quickItemNome" value="${escaparAttr(quickOrderItemDraft.nome)}" placeholder="Ex.: suporte personalizado" onfocus="fecharSugestoesClientePedido()" oninput="sincronizarItemRapidoDraft()">
                </label>
                <label class="field">
                  <span>Qtd</span>
                  <input id="quickItemQtd" type="number" min="1" step="1" value="${escaparAttr(quickOrderItemDraft.qtd || "1")}" onfocus="fecharSugestoesClientePedido()" oninput="sincronizarItemRapidoDraft()">
                </label>
                <label class="field">
                  <span>Valor un.</span>
                  <input id="quickItemValor" type="number" min="0" step="0.01" value="${escaparAttr(quickOrderItemDraft.valor)}" placeholder="0,00" onfocus="fecharSugestoesClientePedido()" oninput="sincronizarItemRapidoDraft()">
                </label>
                <label class="field quick-item-half">
                  <span>Tempo de impressão (h)</span>
                  <input id="quickItemTempo" type="number" min="0" step="0.01" value="${escaparAttr(quickOrderItemDraft.tempoHoras)}" placeholder="0" onfocus="fecharSugestoesClientePedido()" oninput="sincronizarItemRapidoDraft()">
                </label>
                <label class="field quick-item-half">
                  <span>Peso (g)</span>
                  <input id="quickItemPeso" type="number" min="0" step="0.1" value="${escaparAttr(quickOrderItemDraft.pesoGramas)}" placeholder="0" onfocus="fecharSugestoesClientePedido()" oninput="sincronizarItemRapidoDraft()">
                </label>
              </div>
              <div class="actions quick-order-inline-actions">
                <button class="btn secondary" type="button" onclick="fecharSugestoesClientePedido();adicionarItemRapidoOperacional(event)">${renderIconeAcaoPedido("✚", "Adicionar")} Adicionar item</button>
                <button class="btn ghost" type="button" onclick="abrirCalculadoraPedidoRapido()">${renderUiIcon("calculadora")} Calculadora inline</button>
              </div>
            </section>

            <section class="quick-order-section">
              <div class="quick-order-section-title">
                <span>3</span>
                <strong>Entrada e status</strong>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>Entrada / sinal</span>
                  <input id="pedidoEntrada" type="number" min="0" step="0.01" value="${resumo.entrada > 0 ? resumo.entrada.toFixed(2) : ""}" placeholder="0,00" oninput="atualizarEntradaPedido(this.value); atualizarPedidoRapidoResumo()">
                </label>
                <label class="field">
                  <span>Forma da entrada</span>
                  <select id="pedidoMetodoPagamento" class="cash-payment-method-select" onchange="sincronizarPedidoRapidoOperacional({ syncItemDraft:false })">
                    ${renderOpcoesMetodoPagamentoCaixa(quickOrderPaymentMethodDraft || pedidoEditando?.paymentMethodId || pedidoEditando?.payment_method_id || pedidoEditando?.paymentMethod || "pix")}
                  </select>
                  <small class="field-hint">Aparece no Caixa quando houver entrada.</small>
                </label>
                <label class="field">
                  <span>Prazo</span>
                  <input id="pedidoPrazo" type="date" value="${escaparAttr(prazoPedido || pedidoEditando?.prazo || pedidoEditando?.dataPrazo || "")}" oninput="atualizarPrazoPedido(this.value)">
                </label>
                <label class="field">
                  <span>Status</span>
                  <select id="pedidoStatus" onchange="atualizarPedidoRapidoOperacional()">
                    ${["aberto", "producao", "pronto", "entregue", "pago"].map((status) => `<option value="${status}" ${statusAtual === status ? "selected" : ""}>${labelStatusPedido(status)}</option>`).join("")}
                  </select>
                </label>
              </div>
              <label class="field">
                <span>Observação</span>
                <textarea id="pedidoObservacao" rows="2" placeholder="Cor, acabamento, prazo combinado" oninput="atualizarObservacaoPedido(this.value)">${escaparHtml(observacaoPedido || pedidoEditando?.observacao || pedidoEditando?.observacoes || "")}</textarea>
              </label>
            </section>
          </form>

          <aside class="quick-order-summary">
            ${renderComandosPedidoRapidoPwa()}
            <div>
              <span class="status-badge ${classeStatusPedido(statusAtual)}">${escaparHtml(labelStatusPedido(statusAtual))}</span>
              <h3>Revisão final</h3>
            <p class="muted">Confira os itens e valores antes de salvar o pedido.</p>
          </div>
          ${renderPedidoRapidoTimeline(statusAtual)}
          ${barraSelecaoPedidoRapido}
          ${itensHtml}
            <div class="order-financial-summary compact quick-order-finance" data-quick-order-summary>
              <div><span>Subtotal</span><strong>${formatarMoeda(resumo.subtotal)}</strong></div>
              <div><span>Entrada</span><strong>${formatarMoeda(resumo.entrada)}</strong></div>
              <div><span>Restante</span><strong>${formatarMoeda(resumo.restante)}</strong></div>
              <div><span>Total</span><strong>${formatarMoeda(resumo.total)}</strong></div>
            </div>
            <div class="actions quick-order-final-actions">
              <button class="btn ghost" type="button" onclick="limparRascunhoPedidoRapido()">Limpar</button>
              <button class="btn secondary" type="button" onclick="continuarPedidoRapidoOperacional()">Continuar no editor</button>
              <button class="btn" type="submit" form="quickOrderForm" ${pedidoSalvando || quickOrderSaveLock ? "disabled" : ""}>${pedidoSalvando || quickOrderSaveLock ? "Salvando..." : "Salvar pedido"}</button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  `;
}
function renderOrderEditor(context = {}) {
    const { getPlanoAtual, renderBloqueioPlano, pedidoEditando, normalizarItensPedido, itemEhPlaceholderPedido, numeroMonetarioPedido, descontoPedido, valorDescontoPedido, calcularResumoFinanceiroPedido, entradaPedido, statusPedido, clientePedido, clienteDoPedido, clienteTelefonePedido, clienteEmailPedido, observacaoPedido, prazoPedido, sugestoesInteligentesAtivas, contarEventosUso, getUiTab, getItensPedidoSelecionados, isItemPedidoSelecionado, escaparHtml, escaparAttr, renderChipsMaterialPedido, formatarMoeda, renderUiIcon, renderMateriaisItemPedido, renderIconeAcaoPedido, labelStatusPedido, classeStatusPedido, renderUiTabs, renderCustomerSuggestions, descontoTipoPedido, descontoPercentualPedido, classeStatusFinanceiroPedido, labelStatusFinanceiroPedido, renderAcaoPedidoCompacta, pedidoSalvando, setItensPedido } = context;
    const window = context.window || global;
    const items = normalizarItensPedido(context.itensPedido || []).filter((item) => !itemEhPlaceholderPedido(item));
    setItensPedido(items);
  const planoAtual = getPlanoAtual();
  if (planoAtual.blockLevel === "total" || planoAtual.status === "bloqueado") return renderBloqueioPlano("Novo pedido");
  const titulo = pedidoEditando ? "Editar pedido" : "Novo pedido";
  const botao = pedidoEditando ? "Confirmar alterações" : "Finalizar pedido";
  const itemSelecionadoAtual = Number(window.__pedidoItemSelecionado);
  if (!items.length) {
    window.__pedidoItemSelecionado = null;
  } else if (!Number.isInteger(itemSelecionadoAtual) || itemSelecionadoAtual < 0 || itemSelecionadoAtual >= items.length) {
    window.__pedidoItemSelecionado = 0;
  }
  const total = items.reduce((soma, item) => soma + (Number(item.total) || 0), 0);
  const descontoAtual = Math.max(0, numeroMonetarioPedido(descontoPedido, valorDescontoPedido(pedidoEditando || {})));
  const resumoFinanceiro = calcularResumoFinanceiroPedido({
    itens: items,
    subtotalItens: total,
    desconto: descontoAtual,
    down_payment: entradaPedido
  });
  const entradaCampoValor = resumoFinanceiro.entrada > 0 ? resumoFinanceiro.entrada.toFixed(2) : "";
  const statusAtual = statusPedido || pedidoEditando?.status || "aberto";
  const clienteResumo = clientePedido || clienteDoPedido(pedidoEditando || {}) || "Cliente não informado";
  const observacaoAtual = observacaoPedido || pedidoEditando?.observacao || pedidoEditando?.observacoes || "";
  const prazoAtual = prazoPedido || pedidoEditando?.prazo || pedidoEditando?.dataPrazo || "";
  const destacarAdicionarItem = pedidoEditando && sugestoesInteligentesAtivas() && contarEventosUso("item_adicionado", 20) >= 3;
  const pedidoTabs = [
    { id: "cliente", label: "Cliente", icon: "◉" },
    { id: "itens", label: "Itens", icon: "▦" },
    { id: "producao", label: "Produção", icon: "⎙" },
    { id: "financeiro", label: "Financeiro", icon: "R$" }
  ];
  const pedidoTab = pedidoTabs.some((tab) => tab.id === getUiTab("pedidoEditor", "")) ? getUiTab("pedidoEditor") : (items.length ? "itens" : "cliente");
  const pedidoTabIndex = Math.max(0, pedidoTabs.findIndex((tab) => tab.id === pedidoTab));
  const pedidoTabAnterior = pedidoTabs[pedidoTabIndex - 1] || null;
  const pedidoTabProxima = pedidoTabs[pedidoTabIndex + 1] || null;
  const itensSelecionadosPedido = getItensPedidoSelecionados();

  const itensHtml = items.length
    ? items.map((item, i) => `
        <details class="order-item-card ${Number(window.__pedidoItemSelecionado) === i ? "selected" : ""} ${isItemPedidoSelecionado(i) ? "is-multi-selected" : ""}" data-order-item-index="${i}" ${items.length === 1 || Number(window.__pedidoItemSelecionado) === i ? "open" : ""}>
          <summary class="order-item-summary" onclick="selecionarItemPedido(${i})">
            <span class="order-item-multi-select" aria-hidden="true"><span>${i + 1}</span></span>
            <span class="order-item-main">
              <strong>${escaparHtml(item.nome || "Item do pedido")}</strong>
              <small>Qtd ${Number(item.qtd) || 1} • ${renderChipsMaterialPedido(item)}</small>
            </span>
            <span class="order-item-total" data-item-total-index="${i}">${formatarMoeda(Number(item.total) || 0)}</span>
            <button class="icon-action-button order-item-more-button" type="button" title="Ações do item" aria-label="Ações do item" onclick="event.preventDefault();event.stopPropagation();abrirAcoesItemPedido(${i})">${renderUiIcon("more")}</button>
          </summary>
          <div class="order-item-details">
            <div class="order-item-edit-grid">
              <label class="field">
                <span>Item</span>
                <input value="${escaparAttr(item.nome)}" oninput="editarNome(${i}, this.value)">
              </label>
              <label class="field compact-field">
                <span>Qtd</span>
                <input type="number" min="1" step="1" value="${Number(item.qtd) || 1}" onchange="editarQtd(${i}, this.value)">
              </label>
              <label class="field compact-field">
                <span>Valor unitário</span>
                <input type="text" inputmode="decimal" value="${escaparAttr((Number(item.valor) || 0).toFixed(2).replace('.', ','))}" placeholder="0,00" onchange="editarPreco(${i}, this.value)">
              </label>
            </div>
            <div class="order-material-compact">
              ${renderMateriaisItemPedido(item, i)}
            </div>
            <div class="order-item-actions">
              <div class="item-subtotal">
                <span>Subtotal</span>
                <strong data-item-subtotal-index="${i}">${formatarMoeda(Number(item.total) || 0)}</strong>
              </div>
            </div>
          </div>
        </details>
      `).join("")
    : `<div class="order-empty-state">
        <strong>Nenhum item ainda</strong>
        <span>Preencha o cabeçalho e adicione o primeiro item quando estiver pronto.</span>
        <div class="order-empty-actions">
          <button class="btn secondary" type="button" onclick="iniciarAdicionarItemPedido()">${renderIconeAcaoPedido("✚", "Adicionar item")} Adicionar item</button>
          <button class="btn ghost" type="button" onclick="openCalculatorForOrder()">${renderUiIcon("calculadora")} Calcular preço do item</button>
        </div>
      </div>`;

  return `
    <section class="ui3-real-screen ui3-page ui3-stack ui3-gap-4 ui3-order-editor" data-ui-version="v3" data-ui3-screen="pedido">
      <div class="card-header order-edit-header">
        <h2>${titulo}</h2>
        ${pedidoEditando ? `<button class="icon-button" onclick="cancelarEdicaoPedido()" title="Cancelar edição">↩</button>` : ""}
      </div>
      <div class="order-mini-summary">
        <div>
          <strong>${escaparHtml(clienteResumo)}</strong>
          <span>${items.length} item(ns) • ${escaparHtml(labelStatusPedido(statusAtual))} • ${formatarMoeda(total)}</span>
        </div>
        <span class="order-status-badge ${classeStatusPedido(statusAtual)}">${escaparHtml(labelStatusPedido(statusAtual))}</span>
      </div>

      ${renderUiTabs("pedidoEditor", pedidoTabs, pedidoTab)}
      <div class="ui-tab-panel order-tab-panel">
      ${pedidoTab === "cliente" ? `<section class="order-step-panel">
        <div class="order-step-title">
          <span>1</span>
          <strong>Cliente</strong>
        </div>
        <div class="order-summary-grid order-customer-grid">
          <label class="field customer-field">
            <span>Cliente</span>
            <input id="clienteNome" placeholder="Nome do cliente" value="${escaparAttr(clientePedido)}" oninput="atualizarClientePedido(this.value)" autocomplete="off">
            <div id="customerSuggestionPanel">${renderCustomerSuggestions()}</div>
          </label>
          <label class="field">
            <span>WhatsApp</span>
            <input id="clienteTelefone" inputmode="tel" placeholder="5585999999999" value="${escaparAttr(clienteTelefonePedido)}" oninput="atualizarTelefoneClientePedido(this.value)">
          </label>
          <label class="field">
            <span>E-mail</span>
            <input id="clienteEmail" inputmode="email" placeholder="cliente@email.com" value="${escaparAttr(clienteEmailPedido)}" oninput="atualizarEmailClientePedido(this.value)">
          </label>
        </div>
      </section>` : ""}

      ${pedidoTab === "itens" ? `<section class="order-step-panel">
        <div class="order-step-title">
          <span>2</span>
          <strong>Itens</strong>
          <small>${items.length} item(ns)</small>
        </div>
        <div class="order-items-list">${itensHtml}</div>
      </section>` : ""}

      ${pedidoTab === "producao" ? `<section class="order-step-panel">
        <div class="order-step-title">
          <span>3</span>
          <strong>Produção</strong>
        </div>
        <div class="order-summary-grid">
          <label class="field">
            <span>Prazo/data</span>
            <input id="pedidoPrazo" type="date" value="${escaparAttr(prazoAtual)}" oninput="atualizarPrazoPedido(this.value)">
          </label>
          <label class="field compact-field">
            <span>Status</span>
            <select id="pedidoStatus" onchange="atualizarStatusPedido(this.value)">
              ${["aberto", "producao", "pausado", "entregue", "cancelado"].map((status) => `<option value="${status}" ${statusAtual === status ? "selected" : ""}>${labelStatusPedido(status)}</option>`).join("")}
            </select>
          </label>
          <label class="field order-observation-field">
            <span>Observação de produção</span>
            <textarea id="pedidoObservacao" rows="3" placeholder="Ex.: cor, acabamento, prazo combinado" oninput="atualizarObservacaoPedido(this.value)">${escaparHtml(observacaoAtual)}</textarea>
          </label>
        </div>
      </section>` : ""}

      ${pedidoTab === "financeiro" ? `<section class="order-step-panel">
        <div class="order-step-title">
          <span>4</span>
          <strong>Financeiro</strong>
        </div>
        <label class="field compact-field order-down-payment-field">
          <span>Entrada / sinal</span>
          <input id="pedidoEntrada" type="text" inputmode="decimal" placeholder="0,00" value="${escaparAttr(entradaCampoValor.replace('.', ','))}" oninput="atualizarEntradaPedido(this.value)">
        </label>
        <div class="order-item-edit-grid">
          <label class="field compact-field">
            <span>Tipo de desconto</span>
            <select id="pedidoDescontoTipo" onchange="atualizarTipoDescontoPedido(this.value)">
              <option value="fixo" ${descontoTipoPedido !== "porcentagem" ? "selected" : ""}>Valor fixo (R$)</option>
              <option value="porcentagem" ${descontoTipoPedido === "porcentagem" ? "selected" : ""}>Porcentagem (%)</option>
            </select>
          </label>
          <label class="field compact-field">
            <span>${descontoTipoPedido === "porcentagem" ? "Desconto (%)" : "Desconto (R$)"}</span>
            <input id="pedidoDesconto" type="text" inputmode="decimal" placeholder="0,00" value="${descontoTipoPedido === "porcentagem" ? (descontoPercentualPedido > 0 ? escaparAttr(descontoPercentualPedido.toFixed(2).replace('.', ',')) : '') : (descontoAtual > 0 ? escaparAttr(descontoAtual.toFixed(2).replace('.', ',')) : '')}" oninput="atualizarDescontoPedido(this.value)">
          </label>
        </div>
        <label class="field compact-field order-down-payment-field">
          <span>Valor final do pedido</span>
          <input id="pedidoValorFinal" type="text" inputmode="decimal" value="${escaparAttr(resumoFinanceiro.total.toFixed(2).replace('.', ','))}" oninput="atualizarValorFinalPedido(this.value)">
          <small>Ao reduzir o valor final, o desconto é calculado automaticamente.</small>
        </label>
        <div class="order-financial-summary">
          <div><span>Subtotal dos itens</span><strong>${formatarMoeda(resumoFinanceiro.subtotal)}</strong></div>
          <div><span>Desconto</span><strong data-order-discount>${formatarMoeda(resumoFinanceiro.desconto)}</strong></div>
          <div><span>Total do pedido</span><strong data-order-total>${formatarMoeda(resumoFinanceiro.total)}</strong></div>
          <div><span>Entrada paga</span><strong data-order-down-payment>${formatarMoeda(resumoFinanceiro.entrada)}</strong></div>
          <div><span>Valor restante</span><strong data-order-remaining>${formatarMoeda(resumoFinanceiro.restante)}</strong></div>
          <div><span>Status financeiro</span><strong class="order-status-badge ${classeStatusFinanceiroPedido(resumoFinanceiro.statusFinanceiro)}" data-order-financial-status>${escaparHtml(labelStatusFinanceiroPedido(resumoFinanceiro.statusFinanceiro))}</strong></div>
        </div>
        <p class="order-finance-warning" data-order-down-payment-warning ${resumoFinanceiro.entradaMaiorQueTotal ? "" : "hidden"}>A entrada é maior que o total do pedido</p>
        <div class="order-secondary-actions">
          ${items.length ? renderAcaoPedidoCompacta("▣", "PDF", "gerarPDF()") : ""}
          ${items.length ? renderAcaoPedidoCompacta("⎙", "Imprimir", "imprimirPedidoAtual()") : ""}
          ${items.length ? renderAcaoPedidoCompacta("☘", "WhatsApp", "enviarWhats()") : ""}
        </div>
      </section>` : ""}
      </div>

      <div class="ui3-sticky-actions ui3-order-final-bar">
        <div>
          <span>Total</span>
          <strong data-order-total>${formatarMoeda(resumoFinanceiro.total)}</strong>
          ${resumoFinanceiro.entrada > 0 ? `<small>Restante: <em data-order-remaining>${formatarMoeda(resumoFinanceiro.restante)}</em></small>` : ""}
        </div>
        ${pedidoTabAnterior ? `<button class="btn ghost" type="button" onclick="navegarEtapaPedido('${escaparAttr(pedidoTabAnterior.id)}')">← Voltar</button>` : ""}
        ${pedidoTab === "itens" ? `<button class="btn secondary ${destacarAdicionarItem ? "smart-highlight" : ""}" type="button" onclick="iniciarAdicionarItemPedido()">${renderIconeAcaoPedido("✚", "Adicionar item")} Adicionar item</button>` : ""}
        ${pedidoTabProxima
          ? `<button class="btn" type="button" onclick="avancarEtapaPedido('${escaparAttr(pedidoTab)}','${escaparAttr(pedidoTabProxima.id)}')">Próximo →</button>`
          : `<button class="btn" type="button" onclick="fecharPedido()" ${pedidoSalvando ? "disabled" : ""}>${pedidoSalvando ? "Salvando pedido..." : botao}</button>`}
      </div>

      <div class="order-secondary-actions" data-order-item-actions ${pedidoTab === "itens" ? "" : "hidden"}>
        ${pedidoTab === "itens" ? renderAcaoPedidoCompacta("✚", "Manual", "return abrirItemManualPedido(event)") : ""}
        ${pedidoTab === "itens" ? renderAcaoPedidoCompacta("calculadora", "Calcular", "openCalculatorForOrder()") : ""}
        ${items.length && pedidoTab !== "financeiro" ? renderAcaoPedidoCompacta("▣", "PDF", "gerarPDF()") : ""}
        ${items.length && pedidoTab !== "financeiro" ? renderAcaoPedidoCompacta("⎙", "Imprimir", "imprimirPedidoAtual()") : ""}
        ${items.length && pedidoTab !== "financeiro" ? renderAcaoPedidoCompacta("☘", "WhatsApp", "enviarWhats()") : ""}
      </div>
    </section>
  `;
}
function updateOrderEditorSummary(itemIndex = null, context = {}) {
    const { calculateFinancialSummary, items = [], itemsSubtotal, discount, downPayment, formatMoney, document, markUpdated, financialStatusLabel, financialStatusClass } = context;
  const resumo = calculateFinancialSummary({
    itens: items,
    subtotalItens: itemsSubtotal(),
    desconto: discount,
    down_payment: downPayment
  });
  const totalFormatado = formatMoney(resumo.total);
  document.querySelectorAll("[data-order-total]").forEach((elemento) => {
    elemento.textContent = totalFormatado;
    markUpdated(elemento);
  });
  document.querySelectorAll("[data-order-down-payment]").forEach((elemento) => {
    elemento.textContent = formatMoney(resumo.entrada);
    markUpdated(elemento);
  });
  const valorFinalInput = document.getElementById("pedidoValorFinal");
  if (valorFinalInput && document.activeElement !== valorFinalInput) valorFinalInput.value = resumo.total.toFixed(2).replace(".", ",");
  document.querySelectorAll("[data-order-discount]").forEach((elemento) => {
    elemento.textContent = formatMoney(resumo.desconto);
    markUpdated(elemento);
  });
  document.querySelectorAll("[data-order-remaining]").forEach((elemento) => {
    elemento.textContent = formatMoney(resumo.restante);
    markUpdated(elemento);
  });
  document.querySelectorAll("[data-order-financial-status]").forEach((elemento) => {
    elemento.textContent = financialStatusLabel(resumo.statusFinanceiro);
    elemento.className = `order-status-badge ${financialStatusClass(resumo.statusFinanceiro)}`;
  });
  document.querySelectorAll("[data-order-down-payment-warning]").forEach((elemento) => {
    elemento.hidden = !resumo.entradaMaiorQueTotal;
  });
  const indice = Number(itemIndex);
  if (Number.isInteger(indice) && items[indice]) {
    const subtotal = formatMoney(Number(items[indice].total) || 0);
    document.querySelectorAll(`[data-item-total-index="${indice}"], [data-item-subtotal-index="${indice}"]`).forEach((elemento) => {
      elemento.textContent = subtotal;
      markUpdated(elemento);
    });
  }
}
const api = Object.freeze({ renderListaPedidos, renderDetalhePedido, getOrderFilterDefs, countOrdersByFilter, renderOrderStatusChips, renderOrderStatusSelect, renderOrderMaterialChips, renderOrderActionIcon, renderOrderCompactAction, renderQuickOrderTimeline, renderQuickOrderPwaCommands, renderOrderOperationalHistory, renderOrderProfitability, renderOrderPwaList, renderOrderRollConsumptionPreview, renderOrderMaterials, renderOrderReview, renderRecentDashboardOrders, renderQuickOrderOperational, renderOrderEditor, updateOrderEditorSummary });
  global.SimplificaOrdersRenderer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
