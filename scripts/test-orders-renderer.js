"use strict";
const assert = require("node:assert/strict");
const { renderListaPedidos } = require("../src/features/orders/orders-renderer.js");
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
console.log("Orders renderer: boundary carregada e skeleton preservado.");
