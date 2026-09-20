"use strict";

const assert = require("node:assert/strict");
const { calcularPreviaConsumoPorRolo } = require("../src/features/inventory/inventory-roll-consumption.js");

const material = {
  unidade: "kg",
  controle: true,
  lotes: [
    { id: "new", unit: "kg", current_quantity: 4, purchase_date: "2026-02-01" },
    { id: "old", unit: "kg", current_quantity: 2, purchase_date: "2026-01-01" },
    { id: "inactive", unit: "kg", current_quantity: 9, status: "esgotado" }
  ]
};
const helpers = {
  normalizarLotesEstoque: (item) => item.lotes,
  materialUsaControleLote: (item) => item.controle === true,
  podeUsarControleRolosEstoque: () => true,
  previewEnabled: true,
  autoConsumptionEnabled: false
};

const previa = calcularPreviaConsumoPorRolo(material, 5, "kg", helpers);
assert.equal(previa.enabled, true);
assert.equal(previa.automaticoAtivo, false);
assert.equal(previa.disponivel, 6);
assert.equal(previa.falta, 0);
assert.deepEqual(previa.sugestoes.map(({ lote, quantidade, saldoSimulado }) => [lote.id, quantidade, saldoSimulado]), [["old", 2, 0], ["new", 3, 1]]);
assert.equal(calcularPreviaConsumoPorRolo(material, 8, "kg", helpers).falta, 2);
console.log("Inventory roll consumption: cálculo determinístico e flags injetadas preservados.");
