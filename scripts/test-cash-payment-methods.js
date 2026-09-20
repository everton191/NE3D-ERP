"use strict";

const assert = require("node:assert/strict");
const cash = require("../src/features/cash/cash-payment-methods.js");
const methods = [{ id: "dinheiro", type: "cash" }, { id: "pix", type: "instant" }];
const helpers = { getMetodosPagamentoCaixa: () => methods };

assert.equal(cash.normalizarMetodoPagamentoCaixa("PIX", helpers).id, "pix");
assert.equal(cash.normalizarMetodoPagamentoCaixa("unknown", helpers).id, "dinheiro");
assert.equal(cash.getMetodoPagamentoMovimento({ paymentMethodType: "instant" }, helpers).id, "pix");
assert.deepEqual(cash.normalizarMetodoPagamentoCaixa("", { getMetodosPagamentoCaixa: () => [] }), { id: "dinheiro", name: "Dinheiro", type: "cash" });
const movements = [{ tipo: "entrada", valor: 20, paymentMethod: "pix", data: "2026-01-01" }, { tipo: "saida", valor: 5, data: "2026-01-02" }, { tipo: "entrada", valor: 9, cancelled: true }];
assert.deepEqual(cash.calcularTotaisCaixa(movements, { isCancelled: (item) => item.cancelled === true }), { entradas: 20, saidas: 5, saldo: 15, cancelados: 1 });
assert.equal(cash.calcularSaldo(movements, { isCancelled: (item) => item.cancelled === true }), 15);
assert.deepEqual(cash.calcularResumoSessaoCaixa({ openingBalance: 10 }, movements, { isCancelled: (item) => item.cancelled === true, getPaymentMethod: (item) => ({ id: item.paymentMethod || "dinheiro" }), getMovementDate: (item) => item.data || null }), { entradas: 20, saidas: 5, saldo: 15, cancelados: 1, porForma: { pix: 20 }, ultimaMovimentacao: "2026-01-02", expectedBalance: 25 });
console.log("Cash payment methods: aliases, fallback e dependências injetadas preservados.");
