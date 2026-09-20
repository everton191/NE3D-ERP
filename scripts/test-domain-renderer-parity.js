"use strict";

const assert = require("node:assert/strict");
const orders = require("../src/features/orders/orders-renderer.js");
const customers = require("../src/features/customers/customers-renderer.js");
const esc = (value) => String(value ?? "");
const normalize = (value) => esc(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const baseOrderContext = (pedidos, overrides = {}) => ({
  telaComCarregamentoUX: () => false, renderSmartScreenSkeleton: () => "", permitirVisualizacaoOperacionalBasica: () => true,
  normalizarSugestaoClienteTexto: normalize, criarIntervaloPeriodoLocal: () => ({ start: 0, end: Date.now() + 86400000 }), pedidos,
  pedidoJaCancelado: (pedido) => pedido.status === "cancelado", dataDentroIntervalo: () => true, getDataPedidoLocal: () => new Date(),
  getPedidoFiltroAtivo: () => "todos", pedidoEhHoje: () => true, pedidoEstaAtrasado: () => false, normalizarStatusPedidoFiltro: (pedido) => pedido.status,
  normalizarItensPedido: (pedido) => pedido.itens || [], clienteDoPedido: (pedido) => pedido.cliente || "", telefoneDoPedido: (pedido) => pedido.telefone || "",
  LIST_PAGE_SIZE: 10, pedidoVisualizandoId: "", renderDetalhePedido: () => "", escaparAttr: esc, getNumeroSequencialPedido: (pedido) => pedido.id,
  totalPedido: (pedido) => pedido.total, classeStatusPedido: (status) => `order-status-${status}`, labelStatusPedido: (status) => String(status || "aberto"),
  escaparHtml: esc, formatarMoeda: (value) => `R$ ${Number(value).toFixed(2)}`, renderUiIcon: () => "", isWebPwaProfile: () => false,
  isMobile: () => false, renderListaPedidosPwa: () => "", isSimplificaMode: () => true, renderContextualAdvancedToggle: () => "",
  isContextAdvancedVisible: () => false, renderPedidoStatusChips: () => "", ...overrides
});
const fixtureOrders = [
  { id: 1, cliente: "Ana", telefone: "85 9999", status: "aberto", total: 15, prazo: "amanhã", itens: [{ nome: "Peça", qtd: 1, tipoImpressao: "FDM", total: 15 }] },
  { id: 2, cliente: "Beto", status: "em_producao", total: 28, itens: [{ nome: "Suporte", qtd: 2, tipoImpressao: "RESINA", total: 28, materiais: [{ nome: "Resina", gramas: 10 }] }] },
  { id: 3, cliente: "Cris", status: "cancelado", total: 9, itens: [] }
];
global.__pedidosBusca = "";
assert.match(orders.renderListaPedidos(baseOrderContext([])), /Nenhum pedido fechado ainda/);
const orderList = orders.renderListaPedidos(baseOrderContext(fixtureOrders));
for (const expected of ["Pedido 3", "Pedido 2", "Ana", "Prazo: amanhã", "R$ 28.00", "Mais ações do Pedido 1"]) assert.ok(orderList.includes(expected), `lista de pedidos deve conter: ${expected}`);
global.__pedidosBusca = "suporte";
assert.match(orders.renderListaPedidos(baseOrderContext(fixtureOrders)), /Beto/);
assert.doesNotMatch(orders.renderListaPedidos(baseOrderContext(fixtureOrders)), /Pedido 1/);
global.__pedidosBusca = "";
const detail = orders.renderDetalhePedido(fixtureOrders[1], {
  normalizarItensPedido: (pedido) => pedido.itens, escaparAttr: esc, calcularResumoFinanceiroPedido: () => ({ total: 28, subtotal: 28, desconto: 0, entrada: 0, restante: 28, statusFinanceiro: "pending" }),
  dataPedidoIso: () => "", normalizarStatusPedidoFiltro: (pedido) => pedido.status, escaparHtml: esc, getNumeroSequencialPedido: (pedido) => pedido.id,
  renderUiIcon: () => "", clienteDoPedido: (pedido) => pedido.cliente, telefoneDoPedido: () => "", classeStatusPedido: () => "open", labelStatusPedido: () => "Em produção",
  formatarMoeda: (value) => `R$ ${value}`, classeStatusFinanceiroPedido: () => "pending", labelStatusFinanceiroPedido: () => "Pendente", renderRentabilidadeOperacionalPedido: () => "",
  renderPedidoRapidoTimeline: () => "", renderHistoricoOperacionalPedido: () => "", renderAcaoPedidoCompacta: (_, label) => `<button>${label}</button>`, getMateriaisItem: (item) => item.materiais || [],
  getMaterialEstoque: () => null, renderIconeAcaoPedido: () => ""
});
for (const expected of ["Resumo do pedido", "Beto", "Suporte", "Resina", "Voltar à lista"]) assert.match(detail, new RegExp(expected));
const customerContext = { telaComCarregamentoUX: () => false, renderSmartScreenSkeleton: () => "", pedidos: fixtureOrders, clienteDoPedido: (pedido) => pedido.cliente, totalPedido: (pedido) => pedido.total, telefoneDoPedido: (pedido) => pedido.telefone || "", pedidoJaCancelado: (pedido) => pedido.status === "cancelado", normalizarSugestaoClienteTexto: normalize, escaparAttr: esc, escaparHtml: esc, getUserInitials: (name) => name.slice(0, 1), formatarMoeda: (value) => `R$ ${value}`, renderUiIcon: () => "" };
global.__clientesBusca = "";
assert.match(customers.renderClientes({ ...customerContext, pedidos: [] }), /Clientes aparecem automaticamente/);
const customerList = customers.renderClientes(customerContext);
for (const expected of ["Clientes", "Ana", "Beto", "3", "Em aberto"]) assert.match(customerList, new RegExp(expected));
global.__clientesBusca = "beto";
assert.match(customers.renderClientes(customerContext), /Beto/);
assert.doesNotMatch(customers.renderClientes(customerContext), /Ana/);
delete global.__pedidosBusca; delete global.__clientesBusca;
console.log("Domain renderer parity: pedidos (vazio, lista, status, busca, detalhe/material/voltar) e clientes (vazio, lista, busca, métricas e ações) validados.");
