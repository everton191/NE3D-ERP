"use strict";

const assert = require("node:assert/strict");
const orders = require("../src/features/orders/order-normalizers.js");
const helpers = {
  getMateriaisItem: () => [{ materialId: "pla", quantidade: 0.2, unidade: "kg" }],
  createItemId: () => "item-test"
};

const item = orders.normalizarItemPedido({ nome: "  Peça  ", qtd: 2, precoVenda: 12.5, tempo: 3, productBase: 4, extraFee: 1 }, helpers);
assert.equal(item.id, "item-test");
assert.equal(item.nome, "Peça");
assert.equal(item.tipoImpressao, "FDM");
assert.equal(item.total, 25);
assert.equal(item.tempoHoras, 3);
assert.equal(item.baseProduto, 4);
assert.equal(item.taxaExtra, 1);
assert.deepEqual(item.materiais, [{ materialId: "pla", quantidade: 0.2, unidade: "kg" }]);
assert.equal(orders.normalizarItensPedido({ itens: [{ id: "a" }] }, helpers)[0].id, "a");
assert.deepEqual(orders.getMateriaisItem({ materialId: "pla", materialGrams: 250 }, { getMaterialEstoque: () => ({ nome: "PLA", unidade: "kg" }) }), [{ materialId: "pla", nome: "PLA", quantidade: 0.25, unidade: "kg", gramas: 250 }]);
assert.equal(orders.validarItemPedidoParaSalvar({ nome: "Produto", qtd: 1, valor: 2 }, helpers).ok, true);
assert.equal(orders.validarItemPedidoParaSalvar({ nome: "Produto 3D", qtd: 1, valor: 2 }, helpers).reason, "Informe a descrição do item.");
console.log("Order normalizers: contrato, dependências injetadas e totais preservados.");
