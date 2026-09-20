"use strict";

const assert = require("node:assert/strict");
const inventory = require("../src/features/inventory/inventory-normalizers.js");
const materials = [
  { id: "a", nome: "PLA Azul", qtd: 0, codigoEstoque: 3, stock_status: "critical" },
  { id: "b", nome: "PETG Preto", qtd: 2, codigoEstoque: 1, stock_status: "low" },
  { id: "c", nome: "Resina", qtd: 9, codigoEstoque: 2, stock_status: "normal" }
];
const helpers = {
  normalizarTexto: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
  normalizarMaterial: (material) => material,
  getCodigo: (material) => Number(material.codigoEstoque) || 0,
  getCodigoExterno: () => "",
  formatarCodigo: (value) => `#${value}`
};
assert.equal(inventory.classeStatusEstoque("critical"), "stock-status-critical");
assert.equal(inventory.classeStatusEstoque("low"), "stock-status-low");
assert.deepEqual(inventory.filtrarMateriaisEstoque(materials, "sem_estoque", "", helpers).map((item) => item.id), ["a"]);
assert.deepEqual(inventory.filtrarMateriaisEstoque(materials, "todos", "#1", helpers).map((item) => item.id), ["b"]);
assert.deepEqual(inventory.ordenarMateriaisEstoque(materials, "baixo", helpers.getCodigo).map((item) => item.id), ["a", "b", "c"]);
assert.deepEqual(inventory.ordenarMateriaisEstoque(materials, "codigo", helpers.getCodigo).map((item) => item.id), ["b", "c", "a"]);
console.log("Inventory selectors: status, filtro e ordenação validados.");
