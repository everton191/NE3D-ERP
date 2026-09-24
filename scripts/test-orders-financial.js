"use strict";

const assert = require("node:assert/strict");
const financial = require("../src/features/orders/orders-financial.js");

assert.equal(financial.parseOrderMoney("1.234,50"), 1234.5);
assert.equal(financial.parseOrderMoney("inválido", 7), 0);
assert.equal(financial.orderDiscountValue({ discount: 3 }), 3);
assert.equal(financial.orderDownPaymentValue({ sinal: 4 }), 4);
const context = { normalizeItems: (value) => Array.isArray(value) ? value : value.itens || [], isCancelled: (order) => order.status === "cancelado" };
const summary = financial.orderFinancialSummary({ itens: [{ qtd: 2, valor: 10 }], desconto: 3, entrada: 5 }, context);
assert.deepEqual(summary, { subtotal: 20, desconto: 3, taxaExtra: 0, total: 17, entrada: 5, restante: 12, entradaMaiorQueTotal: false, statusFinanceiro: "pago_parcial" });
assert.equal(financial.orderFinancialStatusLabel("quitado"), "Pago total");
assert.equal(financial.orderFinancialStatusClass("pago_parcial"), "order-status-waiting");
const distributed = financial.distributeExtraFeeIntoCustomerItems([{ qtd: 1, total: 10 }, { qtd: 1, total: 10 }], 3, context);
assert.equal(distributed.reduce((sum, item) => sum + item.total, 0), 23);
assert.deepEqual(financial.ordersFinancialSummary([{ total: 10, entrada: 10 }, { total: 20, entrada: 0 }, { total: 9, status: "cancelado" }], context), { totalPedidos: 30, valorRecebido: 10, valorAReceber: 20, pendentes: 1, pagosParcial: 0, pagosTotal: 1 });
console.log("Orders financial: resumo, taxa, entrada e agregação preservados.");
