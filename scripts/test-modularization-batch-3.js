"use strict";

const assert = require("node:assert/strict");
const customer = require("../src/features/customers/customer-normalizers.js");
const inventory = require("../src/features/inventory/inventory-presentation.js");
const printer = require("../src/features/printers/printer-presentation.js");
const storefront = require("../src/features/storefront/promotions-formatters.js");

assert.equal(customer.normalizePhoneBR("(85) 99999-9999"), "+5585999999999");
assert.equal(customer.normalizePhoneBR(null), "");
assert.equal(customer.normalizarTelefoneWhatsapp("+55 85 99999-9999"), "5585999999999");
assert.equal(customer.normalizarTelefoneBusca(undefined), "");
assert.equal(customer.formatPhoneForPdf("(85) 99999-9999"), "(85) 99999-9999");
assert.equal(customer.normalizarSugestaoClienteTexto("  João & Cia ", { removerAcentos: (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "") }), "joao cia");
assert.deepEqual(customer.normalizarSugestaoCliente({ nome: "Ana", telefone: "85 3333-4444", emails: [" ana@example.com "] }), { id: "app-Ana-558533334444-ana@example.com", source: "app_client", name: "Ana", phone: "558533334444", email: "ana@example.com", phones: ["558533334444"], emails: ["ana@example.com"], usageCount: 0, lastUsedAt: "" });

assert.equal(inventory.labelStatusEstoque("low"), "Baixo");
assert.equal(inventory.labelStatusEstoque(null), "Normal");
assert.equal(inventory.formatarQuantidadeEstoque("1.2345", "kg"), "1,235 kg");
assert.equal(inventory.normalizarChaveProdutoEstoque("  PLA   Azul ", { normalizarSugestaoClienteTexto: (value) => String(value).toLowerCase() }), "pla azul");

assert.equal(printer.formatarTemperaturaImpressora(210.6), "211 °C");
assert.equal(printer.formatarTemperaturaImpressora(null), "—");
assert.equal(printer.getPrinterQueueStage({ status: "em_impressao" }), "impressao");
assert.equal(printer.getPrinterQueueStage({ status: "cancelado" }), "arquivado");
assert.equal(printer.getPrinterQueueStageLabel("prontos"), "Pronto");
assert.equal(printer.calcularCustoDesperdicioImpressao({ unidade: "kg", custoUnitario: 100 }, 50, 30, { hourly_cost: 12 }), 11);
assert.equal(storefront.getStorefrontProductTypeLabel({ stock_mode: "unavailable", is_customizable: true }), "Indisponível");
assert.equal(storefront.getStorefrontProductTypeLabel({ is_customizable: true }), "Personalizável");
assert.equal(storefront.getStorefrontProductTypeLabel({ stock_mode: "manual", stock_quantity: 2 }), "Entrega imediata");
assert.equal(storefront.getStorefrontStockLabel({ stock_mode: "manual", stock_quantity: null }), "Estoque manual");
assert.equal(storefront.getStorefrontStockLabel({ stock_mode: "manual", stock_quantity: 2.5 }), "2.5 un.");
assert.equal(storefront.getStorefrontStockLabel({ stock_mode: "erp_linked" }), "Vinculado ao estoque");

console.log("Batch 3 modularization: customer, inventory presentation, and printer presentation parity passed.");
