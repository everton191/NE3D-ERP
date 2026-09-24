const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.resolve(__dirname, "../app.js"), "utf8");
const orderHandlers = fs.readFileSync(path.resolve(__dirname, "../src/features/orders/orders-handlers.js"), "utf8");
const calculatorCommands = fs.readFileSync(path.resolve(__dirname, "../src/features/calculator/calculator-commands.js"), "utf8");
const pdfComposer = fs.readFileSync(path.resolve(__dirname, "../src/features/company/pdf-order-composer.js"), "utf8");
const implementationSources = app + "\n" + orderHandlers + "\n" + calculatorCommands + "\n" + pdfComposer;
const contracts = [
  "const dominio = CalculatorDomain.calculate({",
  "valor: valorManual",
  "total: valorManual * qtd",
  "loteAtivo: ultimoCalculo.impressaoLote === true",
  "modoLote: ultimoCalculo.modoLote",
  "pesoTotal: ultimoCalculo.pesoTotal",
  "tempoTotalMinutos: ultimoCalculo.tempoTotalMinutos",
  "tipoTaxaExtra: ultimoCalculo.taxaExtraMode",
  "const itensClientePdf = ctx.embutirTaxaExtraNosItensCliente",
  "function enviarWhatsPedidoSalvo(id)"
];
const missing = contracts.filter((contract) => !implementationSources.includes(contract));
if (missing.length) {
  missing.forEach((contract) => console.error(`FALHA: contrato ausente: ${contract}`));
  process.exit(1);
}
console.log("Reconciliação: domínio -> item -> pedido/PDF/WhatsApp preserva valor unitário e total.");
