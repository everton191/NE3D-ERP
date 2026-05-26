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
  "async function duplicarItensSelecionadosPedidoRapido()",
  "quick-order-bulkbar",
  "quick-order-item-select",
  "window.__pedidoRapidoItensSelecionados = []"
];

const requiredCss = [
  ".quick-order-items article.is-selected",
  ".quick-order-item-select input:checked + span",
  ".quick-order-bulk-actions",
  "grid-template-columns:repeat(2, minmax(0, 1fr));"
];

const missing = [
  ...requiredApp.filter((snippet) => !app.includes(snippet)),
  ...requiredCss.filter((snippet) => !css.includes(snippet))
];

if (missing.length) {
  console.error("Multiseleção do Pedido Rápido incompleta:", missing);
  process.exit(1);
}

console.log("Quick order multiselect: seleção múltipla e ações em lote validadas.");
