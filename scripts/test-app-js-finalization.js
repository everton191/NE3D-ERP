"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const prepare = fs.readFileSync(path.join(root, "scripts", "prepare-web.js"), "utf8");
const parityHarness = path.join(root, "scripts", "test-domain-renderer-parity.js");
assert(fs.existsSync(parityHarness), "harness estrutural de paridade de renderers ausente");
const expectedModules = [
  "src/features/inventory/inventory-normalizers.js",
  "src/features/inventory/inventory-identifiers.js",
  "src/features/inventory/inventory-roll-consumption.js",
  "src/features/production/production-status.js",
  "src/features/customers/customer-normalizers.js",
  "src/features/customers/customers-renderer.js",
  "src/features/orders/order-normalizers.js",
  "src/features/orders/orders-renderer.js",
  "src/features/orders/orders-repository.js",
  "src/features/cash/cash-payment-methods.js",
  "src/features/account/plan-normalizers.js",
  "src/features/storefront/promotions-formatters.js",
  "src/features/printers/printer-presentation.js",
  "src/features/reports/reports-formatters.js",
  "src/shared/date-formatters.js",
  "src/ai/canonical-runtime-bindings.js"
];
for (const relative of expectedModules) {
  assert(fs.existsSync(path.join(root, relative)), `módulo ausente: ${relative}`);
  assert(prepare.includes(`"${relative}"`), `prepare-web não carrega: ${relative}`);
}
assert(index.includes("src/ai/canonical-runtime-bindings.js"), "bridge da IA deve continuar carregada");
assert.match(app, /function\s+resolverStatusEstoque[\s\S]{0,180}SimplificaInventoryNormalizers\.resolverStatusEstoque/, "resolverStatusEstoque deve ser bridge para o módulo");
assert.match(app, /function\s+normalizarMaterialEstoque[\s\S]{0,360}SimplificaInventoryNormalizers\.normalizarMaterialEstoque/, "normalizarMaterialEstoque deve ser bridge para o módulo");
assert.match(app, /function\s+classeStatusEstoque[\s\S]{0,140}SimplificaInventoryNormalizers\.classeStatusEstoque/, "classe de status deve ser bridge para estoque");
assert.match(app, /function\s+filtrarMateriaisEstoque[\s\S]{0,500}SimplificaInventoryNormalizers\.filtrarMateriaisEstoque/, "filtro deve ser bridge para estoque");
assert.match(app, /function\s+ordenarMateriaisEstoque[\s\S]{0,200}SimplificaInventoryNormalizers\.ordenarMateriaisEstoque/, "ordenação deve ser bridge para estoque");
assert.match(app, /function\s+normalizarItemPedido[\s\S]{0,180}SimplificaOrderNormalizers\.normalizarItemPedido/, "normalizarItemPedido deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+renderClientes\s*\([\s\S]{0,180}SimplificaCustomersRenderer\.renderClientes/, "renderClientes deve ser bridge para o renderer de clientes");
assert.doesNotMatch(app, /function\s+renderClientesLegacy\s*\(/, "renderer legado de clientes não deve retornar");
assert.doesNotMatch(app, /function\s+renderClientesOperacionaisLegacy\s*\(/, "renderer operacional legado de clientes não deve retornar");
assert.match(app, /function\s+normalizarItensPedido[\s\S]{0,180}SimplificaOrderNormalizers\.normalizarItensPedido/, "normalizarItensPedido deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+getMateriaisItem[\s\S]{0,220}SimplificaOrderNormalizers\.getMateriaisItem/, "getMateriaisItem deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+renderListaPedidos\s*\([\s\S]{0,1000}SimplificaOrdersRenderer\.renderListaPedidos/, "renderListaPedidos deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderDetalhePedido\s*\([\s\S]{0,1000}SimplificaOrdersRenderer\.renderDetalhePedido/, "renderDetalhePedido deve ser bridge para o renderer de pedidos");
assert.doesNotMatch(app, /function\s+renderDetalhePedidoLegacy\s*\(/, "detalhe legado de pedido não deve retornar");
assert.match(app, /function\s+salvarPedidoComVerificacaoLocal[\s\S]{0,300}SimplificaOrdersRepository\.salvarPedidoComVerificacaoLocal/, "persistência local de pedido deve ser bridge para o repositório");
assert.match(app, /function\s+normalizarMetodoPagamentoCaixa[\s\S]{0,180}SimplificaCashPaymentMethods\.normalizarMetodoPagamentoCaixa/, "normalizarMetodoPagamentoCaixa deve ser bridge para o módulo de caixa");
assert.match(app, /function\s+getMetodoPagamentoMovimento[\s\S]{0,180}SimplificaCashPaymentMethods\.getMetodoPagamentoMovimento/, "getMetodoPagamentoMovimento deve ser bridge para o módulo de caixa");
assert.match(app, /function\s+normalizarSlugPlano[\s\S]{0,120}SimplificaPlanNormalizers\.normalizarSlugPlano/, "normalizarSlugPlano deve ser bridge para o módulo de conta");
assert.match(app, /function\s+normalizarStatusPlano[\s\S]{0,120}SimplificaPlanNormalizers\.normalizarStatusPlano/, "normalizarStatusPlano deve ser bridge para o módulo de conta");
assert.match(app, /function\s+normalizarStatusPagamento[\s\S]{0,120}SimplificaPlanNormalizers\.normalizarStatusPagamento/, "normalizarStatusPagamento deve ser bridge para o módulo de conta");
assert.match(app, /function\s+normalizarStatusAssinaturaDefinitivo[\s\S]{0,150}SimplificaPlanNormalizers\.normalizarStatusAssinaturaDefinitivo/, "normalizarStatusAssinaturaDefinitivo deve ser bridge para o módulo de conta");
assert.match(app, /function\s+normalizarBillingVariant[\s\S]{0,120}SimplificaPlanNormalizers\.normalizarBillingVariant/, "normalizarBillingVariant deve ser bridge para o módulo de conta");
assert.match(app, /function\s+formatarTempoOfertaPromocao3d[\s\S]{0,140}SimplificaStorefrontPromotionFormatters\.formatOfferTime/, "formatarTempoOfertaPromocao3d deve ser bridge para o módulo da loja");
assert.match(app, /function\s+getNomeCategoriaPromocao3d[\s\S]{0,140}SimplificaStorefrontPromotionFormatters\.getCategoryLabel/, "getNomeCategoriaPromocao3d deve ser bridge para o módulo da loja");
assert.match(app, /function\s+getProductionStatusLabel[\s\S]{0,150}SimplificaProductionStatus\.getLabel/, "getProductionStatusLabel deve ser bridge para o módulo");
assert.match(app, /function\s+formatarMinutosProducao[\s\S]{0,120}SimplificaProductionStatus\.formatMinutes/, "formatarMinutosProducao deve ser bridge para o módulo");
assert.match(app, /function\s+calcularPreviaConsumoPorRolo[\s\S]{0,500}SimplificaInventoryRollConsumption\.calcularPreviaConsumoPorRolo/, "calcularPreviaConsumoPorRolo deve ser bridge para o módulo");
assert.equal((app.match(/function\s+formatarDataHora\s*\(/g) || []).length, 1, "formatarDataHora deve possuir uma única bridge");
assert.match(app, /function\s+formatarDataHora[\s\S]{0,120}SimplificaDateFormatters\.formatDateTime/, "formatarDataHora deve delegar ao módulo compartilhado");
assert.match(app, /function\s+formatarTempoRelativo[\s\S]{0,120}SimplificaDateFormatters\.formatRelative/, "formatarTempoRelativo deve ser bridge para o módulo compartilhado");
assert.match(app, /function\s+formatarPrazoWhatsapp[\s\S]{0,120}SimplificaDateFormatters\.formatDeadline/, "formatarPrazoWhatsapp deve ser bridge para o módulo compartilhado");
assert.match(app, /function\s+formatarTempoCalculadora[\s\S]{0,120}CalculatorDomain\.formatTimeInput/, "formatarTempoCalculadora deve ser bridge para o domínio da calculadora");
assert.match(app, /function\s+sincronizarTempoFormatadoCalculadora[\s\S]{0,180}CalculatorDomain\.parseFormattedTime/, "tempo formatado deve usar parser canônico da calculadora");
assert.match(app, /function\s+normalizarCalculadoraWidget[\s\S]{0,180}CalculatorDomain\.normalizeWidget/, "widget da calculadora deve ser bridge para o domínio");
assert.match(app, /function\s+normalizarTipoImpressoraCalculadora[\s\S]{0,120}CalculatorDomain\.normalizePrinterType/, "tipo da calculadora deve ser bridge para o domínio");
assert.match(app, /function\s+numeroCalculadora[\s\S]{0,180}CalculatorDomain\.normalizeNumber/, "número da calculadora deve ser bridge para o domínio");
assert.match(app, /function\s+calcularTaxaExtraAplicada[\s\S]{0,240}CalculatorDomain\.calculateExtraFee/, "taxa extra da calculadora deve usar fórmula canônica");
assert.match(app, /function\s+formatarTelefonePdf[\s\S]{0,140}SimplificaCustomerNormalizers\.formatPhoneForPdf/, "formatarTelefonePdf deve ser bridge para o módulo de clientes");
assert.match(app, /function\s+numeroDocumentoPdf[\s\S]{0,140}SimplificaDateFormatters\.formatDocumentNumber/, "numeroDocumentoPdf deve ser bridge para o módulo compartilhado");
assert.match(app, /function\s+formatarVariacaoDashboard[\s\S]{0,160}SimplificaHomeData\.formatDashboardVariation/, "formatarVariacaoDashboard deve ser bridge para o módulo Home");
assert.match(app, /function\s+formatarAtualizacaoPromocoes3d[\s\S]{0,120}SimplificaDateFormatters\.formatUpdatedAt/, "formatarAtualizacaoPromocoes3d deve ser bridge para o módulo compartilhado");
assert.match(app, /function\s+formatarDeltaRelatorios[\s\S]{0,120}SimplificaReportsFormatters\.formatDelta/, "formatarDeltaRelatorios deve ser bridge para o módulo de relatórios");
assert.match(app, /function\s+formatarPeriodoCurtoRelatorios[\s\S]{0,140}SimplificaReportsFormatters\.formatShortPeriod/, "formatarPeriodoCurtoRelatorios deve ser bridge para o módulo de relatórios");
console.log("APP.JS finalization baseline: módulos e bridges conhecidos preservados sem regras duplicadas.");
