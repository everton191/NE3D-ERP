const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const requiredApp = [
  "function getItensPedidoRapidoSelecionados()",
  "function alternarSelecaoItemPedidoRapido(index, checked = null)",
  "function selecionarTodosItensPedidoRapido()",
  "function removerItensSelecionadosPedidoRapido()",
  "function aplicarQuantidadeItensSelecionadosPedidoRapido()",
  "function getItensPedidoSelecionados()",
  "function alternarSelecaoItemPedido(index, checked = null)",
  "function aplicarQuantidadeItensSelecionadosPedido()",
  "function removerItensSelecionadosPedido()",
  "quick-order-bulkbar",
  "order-bulkbar",
  "quick-order-item-select",
  "order-item-multi-select",
  "quickOrderBulkQty",
  "orderBulkQty",
  "Aplicar qtd",
  "window.__pedidoItensSelecionados = []",
  "window.__pedidoRapidoItensSelecionados = []",
  "Duplicar pedido foi desativado para evitar pedidos repetidos"
];

const requiredCss = [
  ".quick-order-items article.is-selected",
  ".order-item-card.is-multi-selected",
  ".quick-order-item-select input:checked + span",
  ".order-item-multi-select input:checked + span",
  ".quick-order-bulk-actions",
  ".order-bulk-actions",
  ".bulk-qty-field",
  "grid-template-columns:repeat(2, minmax(0, 1fr));"
];

const forbiddenApp = [
  "duplicarItensSelecionadosPedidoRapido()",
  "async function duplicarItensSelecionadosPedidoRapido",
  "duplicarItemPedidoRapido(",
  "async function duplicarItemPedidoRapido",
  "duplicarItemPedido(",
  "async function duplicarItemPedido",
  "Repetir último",
  "Duplicar pedido\", classe"
];

const missing = [
  ...requiredApp.filter((snippet) => !app.includes(snippet)),
  ...requiredCss.filter((snippet) => !css.includes(snippet)),
  ...forbiddenApp.filter((snippet) => app.includes(snippet)).map((snippet) => `duplicação ainda exposta: ${snippet}`)
];

if (missing.length) {
  console.error("Multiseleção do Pedido Rápido incompleta:", missing);
  process.exit(1);
}

console.log("Quick order multiselect: seleção múltipla e ações em lote validadas.");
