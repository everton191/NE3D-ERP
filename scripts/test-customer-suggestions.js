"use strict";

const assert = require("node:assert/strict");
const customers = require("../src/features/customers/customer-normalizers.js");
const list = customers.collectOperationalSuggestions({
  normalizeSuggestion: (item) => item.name ? item : null,
  normalizeText: (value) => String(value).toLowerCase(),
  operationalClients: () => [{ nome: "Ana", pedidos: 2 }],
  orders: () => [{ id: "p1" }],
  customerName: () => "Bia",
  customerPhone: () => "",
  customerEmail: () => "",
  isSuperAdmin: () => true,
  saasClients: () => [{ id: "s1", name: "Caio" }]
});
assert.equal(list.length, 3);
assert.equal(list.find((item) => item.name === "Ana").usageCount, 2);
console.log("Customer suggestions: fontes operacionais preservadas.");
