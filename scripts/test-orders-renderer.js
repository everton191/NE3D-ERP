"use strict";
const assert = require("node:assert/strict");
const { renderListaPedidos, renderOrderStatusChips, renderOrderStatusSelect, renderOrderMaterialChips, renderOrderActionIcon, renderOrderCompactAction } = require("../src/features/orders/orders-renderer.js");
assert.equal(renderListaPedidos({ telaComCarregamentoUX: () => true, renderSmartScreenSkeleton: (screen) => `loading:${screen}` }), "loading:pedidos");
const html = renderListaPedidos({
  telaComCarregamentoUX: () => false, renderSmartScreenSkeleton: () => "", permitirVisualizacaoOperacionalBasica: () => true,
  normalizarSugestaoClienteTexto: (value) => String(value || "").toLowerCase(), criarIntervaloPeriodoLocal: () => ({ start: 0, end: Date.now() }),
  pedidos: [{ id: 1, cliente: "Ana", status: "aberto", total: 15, itens: [{ nome: "Peça" }] }], pedidoJaCancelado: () => false,
  dataDentroIntervalo: () => true, getDataPedidoLocal: () => new Date(), getPedidoFiltroAtivo: () => "todos", pedidoEhHoje: () => true,
  pedidoEstaAtrasado: () => false, normalizarStatusPedidoFiltro: (item) => item.status, normalizarItensPedido: (item) => item.itens,
  clienteDoPedido: (item) => item.cliente, telefoneDoPedido: () => "", LIST_PAGE_SIZE: 10, pedidoVisualizandoId: "",
  renderDetalhePedido: () => "", escaparAttr: (value) => String(value), getNumeroSequencialPedido: (item) => item.id, totalPedido: (item) => item.total,
  classeStatusPedido: () => "order-status-open", labelStatusPedido: () => "Aberto", escaparHtml: (value) => String(value),
  formatarMoeda: (value) => `R$ ${value}`, renderUiIcon: () => "", isWebPwaProfile: () => false, isMobile: () => false,
  renderListaPedidosPwa: () => "", isSimplificaMode: () => true, renderContextualAdvancedToggle: () => "", isContextAdvancedVisible: () => false,
  renderPedidoStatusChips: () => ""
});
assert.match(html, /Pedido 1/);
assert.match(html, /Ana/);
const detail = require("../src/features/orders/orders-renderer.js").renderDetalhePedido({ id: 1, cliente: "Ana", status: "aberto", itens: [{ nome: "Peça", qtd: 1, tipoImpressao: "FDM", total: 15 }] }, {
  normalizarItensPedido: (item) => item.itens, escaparAttr: (value) => String(value), calcularResumoFinanceiroPedido: () => ({ total: 15, subtotal: 15, desconto: 0, entrada: 0, restante: 15, statusFinanceiro: "pending" }), dataPedidoIso: () => "", normalizarStatusPedidoFiltro: () => "abertos", escaparHtml: (value) => String(value), getNumeroSequencialPedido: (item) => item.id, renderUiIcon: () => "", clienteDoPedido: (item) => item.cliente, telefoneDoPedido: () => "", classeStatusPedido: () => "open", labelStatusPedido: () => "Aberto", formatarMoeda: (value) => `R$ ${value}`, classeStatusFinanceiroPedido: () => "pending", labelStatusFinanceiroPedido: () => "Pendente", renderRentabilidadeOperacionalPedido: () => "", renderPedidoRapidoTimeline: () => "", renderHistoricoOperacionalPedido: () => "", renderAcaoPedidoCompacta: () => "", getMateriaisItem: () => [], getMaterialEstoque: () => null, renderIconeAcaoPedido: () => ""
});
assert.match(detail, /Resumo do pedido/);
const filterContext = { pedidoEhHoje: () => true, pedidoEstaAtrasado: () => false, normalizarStatusPedidoFiltro: (item) => item.status, escaparAttr: (value) => String(value), escaparHtml: (value) => String(value) };
const filterOrders = [{ status: "aberto" }, { status: "producao" }];
assert.match(renderOrderStatusChips(filterOrders, "todos", filterContext), /Filtrar pedidos/);
assert.match(renderOrderStatusSelect(filterOrders, "producao", filterContext), /selected/);
assert.match(renderOrderMaterialChips({ materiais: [{ nome: "PLA" }] }, { getMateriaisItem: (item) => item.materiais, getMaterialEstoque: () => null, escaparHtml: String }), /PLA/);
assert.match(renderOrderMaterialChips({}, { getMateriaisItem: () => [], getMaterialEstoque: () => null, escaparHtml: String }), /Sem material/);
assert.match(renderOrderActionIcon("🗑", "Excluir"), /svg/);
assert.match(renderOrderCompactAction("▣", "PDF", "baixar()", "", { escaparAttr: String, escaparHtml: String }), /baixar\(\)/);
assert.match(require("../src/features/orders/orders-renderer.js").renderQuickOrderTimeline("producao", { escaparHtml: String }), /Produção/);
assert.match(require("../src/features/orders/orders-renderer.js").renderQuickOrderPwaCommands({ isWebPwaProfile: () => true, isMobile: () => false }), /Comandos rápidos/);
assert.match(require("../src/features/orders/orders-renderer.js").renderOrderOperationalHistory({}, { getEventosOperacionaisPedido: () => [], escaparAttr: String, escaparHtml: String, renderUiIcon: () => "", formatarDataEventoOperacionalPedido: String }), /Nenhum evento/);
assert.match(require("../src/features/orders/orders-renderer.js").renderOrderProfitability({}, { totalPedido: () => 20, calcularCustosPedidoAnalytics: () => ({ cost: 5 }), calcularCaixaVinculadoPedido: () => ({ entradas: 20, saidas: 0, saldo: 20, quantidade: 1 }), formatarMoeda: (value) => `R$ ${value}` }), /Lucro estimado/);
assert.match(require("../src/features/orders/orders-renderer.js").renderOrderPwaList({ podeOperar: true, lista: [], linhas: "", paginacao: "" }, { isDetailClosed: () => false, renderDetalhePedido: () => "", renderContextualAdvancedToggle: () => "", renderUiIcon: () => "", escaparAttr: String, escaparHtml: String, searchValue: () => "", isContextAdvancedVisible: () => false, renderPedidoStatusSelect: () => "" }), /Pedidos e orçamentos/);
const inventoryPreviewContext = { previewEnabled: true, podeUsarControleRolosEstoque: () => true, materialUsaControleLote: () => true, calcularPreviaConsumoPorRolo: () => ({ falta: 0, unidade: "g", sugestoes: [] }), escaparHtml: String, formatarQuantidadeEstoque: (value) => String(value) };
assert.match(require("../src/features/orders/orders-renderer.js").renderOrderRollConsumptionPreview({ batch_control_type: "rolo" }, 10, "g", inventoryPreviewContext), /Sem baixa automática/);
assert.match(require("../src/features/orders/orders-renderer.js").renderOrderMaterials({ materiais: [{ materialId: "m1", quantidade: 2, valorUnitario: 3 }] }, 0, { getMateriaisItem: (item) => item.materiais, getMaterialEstoque: () => ({ nome: "PLA", unidade: "g" }), renderUiIcon: () => "", escaparHtml: String, formatarQuantidadeEstoque: String, formatarMoeda: String, renderOrderRollConsumptionPreview: () => "" }), /PLA/);
assert.match(require("../src/features/orders/orders-renderer.js").renderOrderReview({ cliente: "Ana" }, {}, { adicionados: [], removidos: [], alterados: [] }, { totalPedido: () => 0, escaparHtml: String, clienteDoPedido: (order) => order.cliente, formatarMoeda: String }), /Revise as alterações/);
assert.match(require("../src/features/orders/orders-renderer.js").renderRecentDashboardOrders({ getPedidoRecenteDashboard: () => [{ id: 1, cliente: "Ana", itens: [] }], clienteDoPedido: (order) => order.cliente, normalizarItensPedido: (order) => order.itens, classeStatusPedido: () => "order-status-open", escaparAttr: String, escaparHtml: String, getNumeroSequencialPedido: () => 1, totalPedido: () => 10, formatarMoeda: String, labelStatusPedido: () => "Aberto" }), /Ana/);
const quickOrder = require("../src/features/orders/orders-renderer.js").renderQuickOrderOperational({
  itensPedido: [{ nome: "Peça", qtd: 1, valor: 10, total: 10 }], normalizarItensPedido: (items) => Array.isArray(items) ? items : items.itens,
  calcularResumoFinanceiroPedido: () => ({ subtotal: 10, entrada: 0, restante: 10, total: 10 }), descontoPedido: 0, entradaPedido: 0,
  pedidoEditando: null, document: { getElementById: () => null }, quickOrderStatusDraft: "aberto", getItensPedidoRapidoSelecionados: () => [],
  formatarMoeda: (value) => "R$ " + value, renderIconeAcaoPedido: () => "", isItemPedidoRapidoSelecionado: () => false,
  escaparHtml: String, escaparAttr: String, renderAppEmptyState: () => "", clientePedido: "Ana", renderCustomerSuggestions: () => "", clienteTelefonePedido: "",
  clienteEmailPedido: "", quickOrderItemDraft: {}, renderUiIcon: () => "", renderOpcoesMetodoPagamentoCaixa: () => "",
  quickOrderPaymentMethodDraft: "pix", prazoPedido: "", labelStatusPedido: () => "Aberto", observacaoPedido: "",
  renderComandosPedidoRapidoPwa: () => "", classeStatusPedido: () => "open", renderPedidoRapidoTimeline: () => "", pedidoSalvando: false, quickOrderSaveLock: false
});
assert.match(quickOrder, /Pedido rápido/);
let normalizedEditorItems = null;
const orderEditor = require("../src/features/orders/orders-renderer.js").renderOrderEditor({
  getPlanoAtual: () => ({ blockLevel: "", status: "ativo" }), renderBloqueioPlano: () => "", pedidoEditando: null,
  normalizarItensPedido: (items) => Array.isArray(items) ? items : items.itens, itemEhPlaceholderPedido: () => false,
  numeroMonetarioPedido: (value) => Number(value) || 0, descontoPedido: 0, valorDescontoPedido: () => 0,
  calcularResumoFinanceiroPedido: () => ({ subtotal: 10, desconto: 0, entrada: 0, restante: 10, total: 10, statusFinanceiro: "pending", entradaMaiorQueTotal: false }),
  entradaPedido: 0, statusPedido: "aberto", clientePedido: "Ana", clienteDoPedido: (order) => order.cliente || "", clienteTelefonePedido: "",
  clienteEmailPedido: "", observacaoPedido: "", prazoPedido: "", sugestoesInteligentesAtivas: () => false, contarEventosUso: () => 0,
  getUiTab: () => "itens", getItensPedidoSelecionados: () => [], isItemPedidoSelecionado: () => false, escaparHtml: String, escaparAttr: String,
  renderChipsMaterialPedido: () => "", formatarMoeda: (value) => "R$ " + value, renderUiIcon: () => "", renderMateriaisItemPedido: () => "",
  renderIconeAcaoPedido: () => "", labelStatusPedido: () => "Aberto", classeStatusPedido: () => "open", renderUiTabs: () => "",
  renderCustomerSuggestions: () => "", descontoTipoPedido: "fixo", descontoPercentualPedido: 0, classeStatusFinanceiroPedido: () => "pending",
  labelStatusFinanceiroPedido: () => "Pendente", renderAcaoPedidoCompacta: () => "", pedidoSalvando: false, itensPedido: [{ nome: "Peça", qtd: 1, total: 10 }],
  setItensPedido: (items) => { normalizedEditorItems = items; }, window: {}
});
assert.match(orderEditor, /Novo pedido/);
assert.equal(normalizedEditorItems.length, 1);
console.log("Orders renderer: boundary carregada e skeleton preservado.");
