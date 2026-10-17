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
  "src/app/bootstrap.js",
  "src/navigation/screen-v3-wrapper.js",
  "src/navigation/screen-dispatcher.js",
  "src/navigation/app-domain-events.js",
  "src/features/app-ui/app-ui-renderers.js",
  "src/features/inventory/inventory-normalizers.js",
  "src/features/inventory/inventory-identifiers.js",
  "src/features/inventory/inventory-roll-consumption.js",
  "src/features/inventory/inventory-batch-commands.js",
  "src/features/inventory/inventory-modals.js",
  "src/features/inventory/inventory-screen-renderer.js",
  "src/features/calculator/calculator-commands.js",
  "src/features/calculator/calculator-settings.js",
  "src/features/account/account-profile-modals.js",
  "src/features/production/production-status.js",
  "src/features/production/production-repository.js",
  "src/features/production/production-commands.js",
  "src/features/production/production-bambu-commands.js",
  "src/features/production/production-renderer.js",
  "src/features/customers/customer-normalizers.js",
  "src/features/customers/customers-renderer.js",
  "src/features/orders/order-normalizers.js",
  "src/features/orders/orders-financial.js",
  "src/features/orders/orders-operational-history.js",
  "src/features/orders/orders-renderer.js",
  "src/features/orders/orders-repository.js",
  "src/features/cash/cash-payment-methods.js",
  "src/features/cash/cash-repository.js",
  "src/features/cash/cash-sync-service.js",
  "src/features/cash/cash-commands.js",
  "src/features/cash/cash-renderer.js",
  "src/features/account/plan-normalizers.js",
  "src/features/account/account-security.js",
  "src/features/account/auth-commands.js",
  "src/features/account/auth-remote-commands.js",
  "src/features/account/auth-session-commands.js",
  "src/features/account/billing-commands.js",
  "src/features/diagnostics/diagnostics-admin.js",
  "src/features/sync/sync-remote-commands.js",
  "src/features/sync/remote-data-commands.js",
  "src/features/saas/saas-admin-commands.js",
  "src/features/security/security-audit-commands.js",
  "src/features/company/company-administration.js",
  "src/features/company/company-pdf-info.js",
  "src/features/company/company-pdf-preview.js",
  "src/features/company/pdf-document-delivery.js",
  "src/features/company/pdf-order-composer.js",
  "src/features/company/company-settings-actions.js",
  "src/features/company/pdf-settings-renderer.js",
  "src/features/company/company-renderer.js",
  "src/features/users/users-administration-renderer.js",
  "src/features/users/users-administration-commands.js",
  "src/features/config/config-appearance.js",
  "src/features/config/config-interface-mode.js",
  "src/features/storefront/promotions-formatters.js",
  "src/features/storefront/storefront-access.js",
  "src/features/storefront/storefront-admin-storage.js",
  "src/features/storefront/storefront-editor.js",
  "src/features/storefront/storefront-publication.js",
  "src/features/storefront/storefront-v3.js",
  "src/features/storefront/storefront-product-editor.js",
  "src/features/storefront/storefront-guided.js",
  "src/features/storefront/storefront-admin-store.js",
  "src/features/storefront/storefront-admin-remote.js",
  "src/features/storefront/storefront-images.js",
  "src/features/storefront/storefront-public.js",
  "src/features/storefront/storefront-admin-render.js",
  "src/features/storefront/storefront-publication.js",
  "src/features/storefront/storefront-v3.js",
  "src/features/storefront/storefront-product-editor.js",
  "src/features/storefront/storefront-guided.js",
  "src/features/storefront/storefront-admin-store.js",
  "src/features/storefront/storefront-admin-remote.js",
  "src/features/storefront/storefront-images.js",
  "src/features/storefront/storefront-public.js",
  "src/features/storefront/storefront-admin-render.js",
  "src/features/printers/printer-presentation.js",
  "src/features/printers/printers-operations.js",
  "src/features/reports/reports-formatters.js",
  "src/shared/date-formatters.js",
  "src/ai/canonical-runtime-bindings.js"
];
for (const relative of expectedModules) {
  assert(fs.existsSync(path.join(root, relative)), `módulo ausente: ${relative}`);
  assert(prepare.includes(`"${relative}"`), `prepare-web não carrega: ${relative}`);
}
assert.match(app, /function\s+iniciarBootstrapAplicacao\s*\([\s\S]{0,7000}SimplificaAppBootstrap\.start/, "app.js deve apenas compor o contexto do bootstrap");
assert.match(app, /function\s+gerarPDF[\s\S]{0,240}SimplificaPdfOrderComposer\.generateOrderPdf/, "gerarPDF deve ser bridge para o compositor PDF");
assert.match(app, /function\s+salvarOuCompartilharPdf[\s\S]{0,240}SimplificaPdfDocumentDelivery\.saveOrSharePdf/, "entrega de PDF deve delegar ao módulo");
assert.doesNotMatch(app, /new jsPDF\(/, "composição de PDF não deve permanecer no app.js");
assert.doesNotMatch(app, /doc\.text\(/, "renderização de domínio PDF não deve permanecer no app.js");
assert.match(app, /function\s+gerarPdfCalculadora[\s\S]{0,400}gerarPDF/, "gerarPdfCalculadora deve orquestrar via gerarPDF bridge");
assert.doesNotMatch(app, /document\.addEventListener\("DOMContentLoaded",\s*async\s*\(\)\s*=>/, "lifecycle global não deve permanecer implementado no app.js");
assert.doesNotMatch(app, /window\.addEventListener\("unhandledrejection"/, "handler global deve residir no bootstrap");
assert(index.includes("src/ai/canonical-runtime-bindings.js"), "bridge da IA deve continuar carregada");
assert.match(app, /function\s+resolverStatusEstoque[\s\S]{0,180}SimplificaInventoryNormalizers\.resolverStatusEstoque/, "resolverStatusEstoque deve ser bridge para o módulo");
assert.match(app, /function\s+normalizarMaterialEstoque[\s\S]{0,360}SimplificaInventoryNormalizers\.normalizarMaterialEstoque/, "normalizarMaterialEstoque deve ser bridge para o módulo");
assert.match(app, /function\s+classeStatusEstoque[\s\S]{0,140}SimplificaInventoryNormalizers\.classeStatusEstoque/, "classe de status deve ser bridge para estoque");
assert.match(app, /function\s+filtrarMateriaisEstoque[\s\S]{0,500}SimplificaInventoryNormalizers\.filtrarMateriaisEstoque/, "filtro deve ser bridge para estoque");
assert.match(app, /function\s+ordenarMateriaisEstoque[\s\S]{0,200}SimplificaInventoryNormalizers\.ordenarMateriaisEstoque/, "ordenação deve ser bridge para estoque");
assert.match(app, /function\s+normalizarItemPedido[\s\S]{0,180}SimplificaOrderNormalizers\.normalizarItemPedido/, "normalizarItemPedido deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+renderClientes\s*\([\s\S]{0,180}SimplificaCustomersRenderer\.renderClientes/, "renderClientes deve ser bridge para o renderer de clientes");
assert.match(app, /function\s+clientePassaFiltrosSaas[\s\S]{0,220}SimplificaCustomersSaasQuery\.matchesClient/, "filtro SaaS de clientes deve ser bridge para query canônica");
assert.match(app, /function\s+getResumoEmpresaSaas[\s\S]{0,700}SimplificaCustomersSaasQuery\.companySummary/, "resumo SaaS de clientes deve ser bridge para query canônica");
assert.doesNotMatch(app, /function\s+renderClientesLegacy\s*\(/, "renderer legado de clientes não deve retornar");
assert.doesNotMatch(app, /function\s+renderClientesOperacionaisLegacy\s*\(/, "renderer operacional legado de clientes não deve retornar");
assert.match(app, /function\s+normalizarItensPedido[\s\S]{0,180}SimplificaOrderNormalizers\.normalizarItensPedido/, "normalizarItensPedido deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+calcularResumoFinanceiroPedido[\s\S]{0,220}SimplificaOrdersFinancial\.orderFinancialSummary/, "resumo financeiro de pedido deve ser bridge para a fronteira financeira");
assert.match(app, /function\s+embutirTaxaExtraNosItensCliente[\s\S]{0,220}SimplificaOrdersFinancial\.distributeExtraFeeIntoCustomerItems/, "taxa do documento deve ser bridge para a fronteira financeira");
assert.match(app, /function\s+pedidoPossuiConsumoEstoque[\s\S]{0,220}SimplificaOrdersCommandService\.hasOrderStockConsumption/, "consumo de estoque do pedido deve ser bridge para o comando canônico");
assert.match(app, /function\s+pedidoJaCancelado[\s\S]{0,140}SimplificaOrdersCommandService\.isOrderCancelled/, "cancelamento do pedido deve ser bridge para o comando canônico");
assert.match(app, /function\s+getMateriaisItem[\s\S]{0,220}SimplificaOrderNormalizers\.getMateriaisItem/, "getMateriaisItem deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+renderListaPedidos\s*\([\s\S]{0,1000}SimplificaOrdersRenderer\.renderListaPedidos/, "renderListaPedidos deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+alterarStatusPedido[\s\S]{0,900}SimplificaOrdersHandlers\.changeOrderStatus/, "handler de status de pedido deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+requestOrderEdit[\s\S]{0,500}SimplificaOrdersHandlers\.requestOrderEdit/, "handler de edição de pedido deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+requestOrderDelete[\s\S]{0,700}SimplificaOrdersHandlers\.requestOrderDelete/, "handler de cancelamento de pedido deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+cancelOrderSafely[\s\S]{0,900}SimplificaOrdersHandlers\.cancelOrderSafely/, "orquestração de cancelamento de pedido deve ser bridge para o módulo de pedidos");
assert.match(app, /function\s+fecharPedido[\s\S]{0,900}SimplificaOrdersHandlers\.finalizeOrderUi/, "fechamento de pedido deve delegar ao handler canônico");
assert.match(app, /function\s+salvarPedidoRapidoOperacional[\s\S]{0,1800}SimplificaOrdersHandlers\.saveQuickOrder/, "fluxo rápido de pedido deve delegar ao handler canônico");
assert.match(app, /function\s+removerItensSelecionadosPedido[\s\S]{0,420}SimplificaOrdersHandlers\.removeSelectedOrderItems/, "remoção múltipla deve delegar ao handler canônico");
assert.match(app, /function\s+abrirPedidoParaEdicaoAutorizada[\s\S]{0,220}SimplificaOrdersController\.openAuthorizedEdit/, "abertura de edição de pedido deve ser bridge para o controller");
assert.match(app, /function\s+cancelarEdicaoPedido[\s\S]{0,180}SimplificaOrdersController\.cancelEdit/, "cancelamento de edição de pedido deve ser bridge para o controller");
assert.doesNotMatch(app, /function\s+renderListaPedidosLegacy\s*\(/, "renderer legado de lista de pedidos não deve retornar");
assert.match(app, /function\s+renderDetalhePedido\s*\([\s\S]{0,1000}SimplificaOrdersRenderer\.renderDetalhePedido/, "renderDetalhePedido deve ser bridge para o renderer de pedidos");
assert.doesNotMatch(app, /function\s+renderDetalhePedidoLegacy\s*\(/, "detalhe legado de pedido não deve retornar");
assert.match(app, /function\s+renderPedidoStatusChips[\s\S]{0,280}SimplificaOrdersRenderer\.renderOrderStatusChips/, "chips de status devem ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderPedidosRecentesDashboard[\s\S]{0,360}SimplificaOrdersRenderer\.renderRecentDashboardOrders/, "pedidos recentes devem ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderPedidoStatusSelect[\s\S]{0,280}SimplificaOrdersRenderer\.renderOrderStatusSelect/, "seletor de status deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderChipsMaterialPedido[\s\S]{0,260}SimplificaOrdersRenderer\.renderOrderMaterialChips/, "chips de material devem ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderAcaoPedidoCompacta[\s\S]{0,220}SimplificaOrdersRenderer\.renderOrderCompactAction/, "ações compactas devem ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderIconeAcaoPedido[\s\S]{0,160}SimplificaOrdersRenderer\.renderOrderActionIcon/, "ícone de ação deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderPedidoRapidoTimeline[\s\S]{0,180}SimplificaOrdersRenderer\.renderQuickOrderTimeline/, "linha do tempo operacional deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderComandosPedidoRapidoPwa[\s\S]{0,200}SimplificaOrdersRenderer\.renderQuickOrderPwaCommands/, "comandos PWA devem ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderHistoricoOperacionalPedido[\s\S]{0,260}SimplificaOrdersRenderer\.renderOrderOperationalHistory/, "histórico operacional deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+getEventosOperacionaisPedido[\s\S]{0,500}SimplificaOrdersOperationalHistory\.getOrderOperationalEvents/, "projeção operacional deve delegar à fronteira de pedidos");
assert.match(app, /function\s+getDadosFinanceirosCanonicosComFallback[\s\S]{0,600}SimplificaCashPaymentMethods\.obterDadosFinanceirosCanonicosComFallback/, "leitura financeira canônica deve delegar à fronteira de Caixa");
assert.match(app, /function\s+registrarEventoFinanceiroPedidoLocal[\s\S]{0,600}SimplificaCashPaymentMethods\.enfileirarEventoFinanceiroDoPedido/, "fila financeira de Pedido deve delegar à fronteira de Caixa");
assert.match(app, /function\s+atualizarCacheFinanceiroCanonicoRemoto[\s\S]{0,500}SimplificaCashRepository\.refreshCanonicalFinancialCache/, "cache remoto de Caixa deve delegar ao repositório");
assert.match(app, /function\s+sincronizarEventosFinanceirosPendentes[\s\S]{0,400}SimplificaCashSyncService\.syncPendingFinancialEvents/, "sincronizador financeiro deve delegar ao CashSyncService");
assert.match(app, /function\s+agendarSincronizacaoFinanceiraCanonica[\s\S]{0,400}SimplificaCashSyncService\.scheduleSync/, "agendamento financeiro deve delegar ao CashSyncService");
assert.match(app, /function\s+abrirSessaoCaixaAutomatica[\s\S]{0,300}SimplificaCashCommands\.openAutomaticSession/, "abertura automática de sessão deve delegar ao CashCommands");
assert.match(app, /async function\s+abrirSessaoCaixaManual[\s\S]{0,300}SimplificaCashCommands\.openManualSession/, "abertura manual de sessão deve delegar ao CashCommands");
assert.match(app, /async function\s+fecharSessaoCaixaBasica[\s\S]{0,300}SimplificaCashCommands\.closeSession/, "fechamento de sessão deve delegar ao CashCommands");
assert.match(app, /async function\s+adicionarMovimentoCaixa[\s\S]{0,300}SimplificaCashCommands\.addMovement/, "lançamento de movimento deve delegar ao CashCommands");
assert.match(app, /async function\s+editarMovimentoCaixa[\s\S]{0,300}SimplificaCashCommands\.editMovement/, "edição de movimento deve delegar ao CashCommands");
assert.match(app, /async function\s+removerMovimentoCaixa[\s\S]{0,300}SimplificaCashCommands\.cancelMovement/, "cancelamento de movimento deve delegar ao CashCommands");
assert.match(app, /function\s+renderCaixa\s*\([\s\S]{0,180}SimplificaCashRenderer\.renderCaixa/, "renderCaixa deve ser bridge para o renderer de caixa");
assert.match(app, /async function\s+exportarExtratoFinanceiro[\s\S]{0,220}SimplificaCashRenderer\.exportarExtratoFinanceiro/, "extrato financeiro deve ser bridge para o renderer de caixa");
assert.match(app, /async function\s+sincronizarProducaoManualSupabaseSilencioso[\s\S]{0,200}SimplificaProductionRepository\.sincronizarProducaoManualSupabaseSilencioso/, "sincronização da produção deve ser bridge para o repositório");
assert.match(app, /function\s+payloadTarefaProducao[\s\S]{0,220}SimplificaProductionRepository\.payloadTarefaProducao/, "payload de tarefa deve ser bridge para o repositório");
assert.match(app, /async function\s+carregarProducaoManualSupabaseSilencioso[\s\S]{0,220}SimplificaProductionRepository\.carregarProducaoManualSupabaseSilencioso/, "carga da produção deve ser bridge para o repositório");
assert.match(app, /function\s+confirmarLiberacaoProducao[\s\S]{0,220}SimplificaProductionCommands\.confirmarLiberacaoProducao/, "liberação para produção deve ser bridge para os commands");
assert.match(app, /function\s+atualizarStatusTarefaProducao[\s\S]{0,220}SimplificaProductionCommands\.atualizarStatusTarefaProducao/, "mudança de status de tarefa deve ser bridge para os commands");
assert.match(app, /function\s+criarReimpressaoProducao[\s\S]{0,220}SimplificaProductionCommands\.criarReimpressaoProducao/, "reimpressão deve ser bridge para os commands");
assert.match(app, /function\s+registrarFalhaImpressaoBambu[\s\S]{0,220}SimplificaProductionBambuCommands\.registrarFalhaImpressaoBambu/, "falha Bambu deve ser bridge para os bambu-commands");
assert.match(app, /function\s+confirmarConclusaoImpressaoBambu[\s\S]{0,220}SimplificaProductionBambuCommands\.confirmarConclusaoImpressaoBambu/, "conclusão Bambu deve ser bridge para os bambu-commands");
assert.match(app, /function\s+renderProducao\s*\([\s\S]{0,220}SimplificaProductionRenderer\.renderProducao/, "renderProducao deve ser bridge para o renderer de produção");
assert.match(app, /function\s+getResumoCapacidadeProducao[\s\S]{0,220}SimplificaProductionRenderer\.getResumoCapacidadeProducao/, "resumo de capacidade deve ser bridge para o renderer de produção");
assert.match(app, /function\s+abrirImpressoraAtivaProducao[\s\S]{0,220}SimplificaProductionRenderer\.abrirImpressoraAtivaProducao/, "painel da impressora ativa deve ser bridge para o renderer de produção");
assert.match(app, /function\s+renderHistoricoProducao[\s\S]{0,220}SimplificaProductionRenderer\.renderHistoricoProducao/, "histórico da produção deve ser bridge para o renderer de produção");
assert.match(app, /function\s+gerarCodigoProducao[\s\S]{0,220}SimplificaProductionCommands\.gerarCodigoProducao/, "código de produção deve ser bridge para os commands");
assert.match(app, /function\s+getProductionItemMaterial[\s\S]{0,220}SimplificaProductionCommands\.getProductionItemMaterial/, "material do item de produção deve ser bridge para os commands");
assert.doesNotMatch(app, /register_order_financial_cancellation/, "RPC de cancelamento financeiro não deve permanecer no app.js");
assert.doesNotMatch(app, /register_sale_financial_operation/, "RPC de venda financeira não deve permanecer no app.js");
assert.match(app, /function\s+renderRentabilidadeOperacionalPedido[\s\S]{0,260}SimplificaOrdersRenderer\.renderOrderProfitability/, "rentabilidade deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderListaPedidosPwa[\s\S]{0,520}SimplificaOrdersRenderer\.renderOrderPwaList/, "lista PWA deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderPreviaConsumoPorRoloPedido[\s\S]{0,420}SimplificaOrdersRenderer\.renderOrderRollConsumptionPreview/, "prévia de rolo deve ser bridge para o renderer de pedidos");
assert.match(app, /function\s+renderMateriaisItemPedido[\s\S]{0,420}SimplificaOrdersRenderer\.renderOrderMaterials/, "materiais do pedido devem ser bridge para o renderer de pedidos");
assert.match(app, /function\s+descreverAlteracoesPedido[\s\S]{0,260}SimplificaOrdersController\.describeOrderChanges/, "diferenças de pedido devem ser bridge para o controller");
assert.match(app, /function\s+salvarRascunhoPedidoRapidoLocal[\s\S]{0,620}SimplificaOrdersController\.saveQuickOrderDraft/, "persistência do rascunho deve ser bridge para o controller");
assert.match(app, /function\s+carregarRascunhoPedidoRapidoLocal[\s\S]{0,520}SimplificaOrdersController\.loadQuickOrderDraft/, "leitura do rascunho deve ser bridge para o controller");
assert.match(app, /function\s+aplicarRascunhoPedidoRapidoLocal[\s\S]{0,600}SimplificaOrdersController\.restoreQuickOrderDraft/, "restauração do rascunho deve ser bridge para o controller");
assert.match(app, /function\s+abrirRevisaoAlteracoesPedido[\s\S]{0,520}SimplificaOrdersRenderer\.renderOrderReview/, "revisão de pedido deve ser bridge para o renderer");
assert.match(app, /function\s+salvarPedidoComVerificacaoLocal[\s\S]{0,300}SimplificaOrdersRepository\.salvarPedidoComVerificacaoLocal/, "persistência local de pedido deve ser bridge para o repositório");
assert.match(app, /function\s+normalizarMetodoPagamentoCaixa[\s\S]{0,180}SimplificaCashPaymentMethods\.normalizarMetodoPagamentoCaixa/, "normalizarMetodoPagamentoCaixa deve ser bridge para o módulo de caixa");
assert.match(app, /function\s+getMetodoPagamentoMovimento[\s\S]{0,180}SimplificaCashPaymentMethods\.getMetodoPagamentoMovimento/, "getMetodoPagamentoMovimento deve ser bridge para o módulo de caixa");
assert.match(app, /function\s+normalizarSlugPlano[\s\S]{0,160}Simplifica(BillingCommands|PlanNormalizers)\.normalizarSlugPlano/, "normalizarSlugPlano deve ser bridge para o módulo de conta");
assert.match(app, /function\s+calcularStatusAssinatura[\s\S]{0,240}SimplificaBillingCommands\.calcularStatusAssinatura/, "calcularStatusAssinatura deve ser bridge para billing-commands");
assert.match(app, /function\s+cancelarAssinaturaCliente[\s\S]{0,240}SimplificaBillingCommands\.cancelarAssinaturaCliente/, "cancelarAssinaturaCliente deve ser bridge para billing-commands");
assert.match(app, /function\s+getBillingCommandsDeps\s*\(/, "getBillingCommandsDeps deve existir");
assert(index.includes("src/features/account/billing-commands.js"), "billing-commands deve estar no index.html");
assert.match(app, /function\s+configurarTelemetriaErros[\s\S]{0,200}SimplificaDiagnosticsAdmin\.configurarTelemetriaErros/, "configurarTelemetriaErros deve ser bridge para diagnostics-admin");
assert.match(app, /function\s+gerarRelatorioCodexDiagnostico[\s\S]{0,240}SimplificaDiagnosticsAdmin\.gerarRelatorioCodexDiagnostico/, "gerarRelatorioCodexDiagnostico deve ser bridge para diagnostics-admin");
assert.match(app, /function\s+getDiagnosticsAdminDeps\s*\(/, "getDiagnosticsAdminDeps deve existir");
assert(index.includes("src/features/diagnostics/diagnostics-admin.js"), "diagnostics-admin deve estar no index.html");
assert.match(app, /async function\s+enviarRegistroSyncSupabase[\s\S]{0,240}SimplificaSyncRemoteCommands\.enviarRegistroSyncSupabase/, "enviarRegistroSyncSupabase deve ser bridge para sync-remote-commands");
assert.match(app, /async function\s+atualizarClienteSaasSupabaseParcial[\s\S]{0,280}SimplificaSaasAdmin\.atualizarClienteSaasSupabaseParcial/, "atualizarClienteSaasSupabaseParcial deve ser bridge para saas-admin-commands");
assert.match(app, /async function\s+excluirUsuarioTesteSaas[\s\S]{0,280}SimplificaSaasAdmin\.excluirUsuarioTesteSaas/, "excluirUsuarioTesteSaas deve ser bridge para saas-admin-commands");
assert.match(app, /function\s+getSaasAdminDeps\s*\(/, "getSaasAdminDeps deve existir");
assert(index.includes("src/features/saas/saas-admin-commands.js"), "saas-admin-commands deve estar no index.html");
assert.match(app, /async function\s+carregarSaasSupabaseSilencioso[\s\S]{0,280}SimplificaSecurityAudit\.carregarSaasSupabaseSilencioso/, "carregarSaasSupabaseSilencioso deve ser bridge para security-audit-commands");
assert.match(app, /async function\s+consultarLicencaSupabaseSilencioso[\s\S]{0,280}SimplificaSecurityAudit\.consultarLicencaSupabaseSilencioso/, "consultarLicencaSupabaseSilencioso deve ser bridge para security-audit-commands");
assert.match(app, /function\s+getSecurityAuditDeps\s*\(/, "getSecurityAuditDeps deve existir");
assert(index.includes("src/features/security/security-audit-commands.js"), "security-audit-commands deve estar no index.html");
assert.match(app, /async function\s+salvarPerfilUsuarioRemoto[\s\S]{0,280}SimplificaSyncRemoteCommands\.salvarPerfilUsuarioRemoto/, "salvarPerfilUsuarioRemoto deve ser bridge para sync-remote-commands");
assert.match(app, /async function\s+sincronizarRelayNotificacoesAndroid[\s\S]{0,280}SimplificaSyncRemoteCommands\.sincronizarRelayNotificacoesAndroid/, "sincronizarRelayNotificacoesAndroid deve ser bridge para sync-remote-commands");
assert.match(app, /function\s+getSyncRemoteCommandsDeps\s*\(/, "getSyncRemoteCommandsDeps deve existir");
assert(index.includes("src/features/sync/sync-remote-commands.js"), "sync-remote-commands deve estar no index.html");
assert.match(app, /async function\s+enviarAnalyticsDashboardSilencioso[\s\S]{0,280}SimplificaRemoteData\.enviarAnalyticsDashboardSilencioso/, "enviarAnalyticsDashboardSilencioso deve ser bridge para remote-data-commands");
assert.match(app, /async function\s+obterBackupSupabase[\s\S]{0,280}SimplificaRemoteData\.obterBackupSupabase/, "obterBackupSupabase deve ser bridge para remote-data-commands");
assert.match(app, /function\s+getRemoteDataDeps\s*\(/, "getRemoteDataDeps deve existir");
assert(index.includes("src/features/sync/remote-data-commands.js"), "remote-data-commands deve estar no index.html");
assert.match(app, /function\s+normalizarStatusPlano[\s\S]{0,120}SimplificaPlanNormalizers\.normalizarStatusPlano/, "normalizarStatusPlano deve ser bridge para o módulo de conta");
assert.match(app, /function\s+normalizarStatusPagamento[\s\S]{0,120}SimplificaPlanNormalizers\.normalizarStatusPagamento/, "normalizarStatusPagamento deve ser bridge para o módulo de conta");
assert.match(app, /function\s+normalizarStatusAssinaturaDefinitivo[\s\S]{0,150}SimplificaPlanNormalizers\.normalizarStatusAssinaturaDefinitivo/, "normalizarStatusAssinaturaDefinitivo deve ser bridge para o módulo de conta");
assert.match(app, /function\s+normalizarBillingVariant[\s\S]{0,120}SimplificaPlanNormalizers\.normalizarBillingVariant/, "normalizarBillingVariant deve ser bridge para o módulo de conta");
assert.match(app, /function\s+formatarTempoOfertaPromocao3d[\s\S]{0,140}SimplificaStorefrontPromotionFormatters\.formatOfferTime/, "formatarTempoOfertaPromocao3d deve ser bridge para o módulo da loja");
assert.match(app, /function\s+getNomeCategoriaPromocao3d[\s\S]{0,140}SimplificaStorefrontPromotionFormatters\.getCategoryLabel/, "getNomeCategoriaPromocao3d deve ser bridge para o módulo da loja");
assert.match(app, /function\s+getStorefrontProductTypeLabel[\s\S]{0,180}SimplificaStorefrontPromotionFormatters\.getStorefrontProductTypeLabel/, "label de tipo de produto deve ser bridge para o módulo da loja");
assert.match(app, /function\s+getStorefrontStockLabel[\s\S]{0,180}SimplificaStorefrontPromotionFormatters\.getStorefrontStockLabel/, "label de estoque da loja deve ser bridge para o módulo da loja");
assert.match(app, /function\s+getProductionStatusLabel[\s\S]{0,150}SimplificaProductionStatus\.getLabel/, "getProductionStatusLabel deve ser bridge para o módulo");
assert.match(app, /function\s+formatarMinutosProducao[\s\S]{0,120}SimplificaProductionStatus\.formatMinutes/, "formatarMinutosProducao deve ser bridge para o módulo");
assert.match(app, /function\s+calcularPreviaConsumoPorRolo[\s\S]{0,500}SimplificaInventoryRollConsumption\.calcularPreviaConsumoPorRolo/, "calcularPreviaConsumoPorRolo deve ser bridge para o módulo");
assert.match(app, /async function\s+salvarLoteEstoque[\s\S]{0,240}SimplificaInventoryBatchCommands\.saveBatch/, "salvarLoteEstoque deve ser bridge para inventory-batch-commands");
assert.match(app, /async function\s+confirmarSaidaManualEstoque[\s\S]{0,240}SimplificaInventoryBatchCommands\.confirmManualOutput/, "confirmarSaidaManualEstoque deve ser bridge para inventory-batch-commands");
assert.match(app, /function\s+abrirCadastroLoteEstoque[\s\S]{0,240}SimplificaInventoryBatchCommands\.openBatchModal/, "abrirCadastroLoteEstoque deve ser bridge para inventory-batch-commands");
assert.match(app, /function\s+abrirSaidaManualEstoque[\s\S]{0,240}SimplificaInventoryBatchCommands\.openManualOutputModal/, "abrirSaidaManualEstoque deve ser bridge para inventory-batch-commands");
assert.match(app, /function\s+renderEstoque\s*\([\s\S]{0,1200}SimplificaInventoryScreenRenderer\.renderEstoque/, "renderEstoque deve ser bridge para inventory-screen-renderer");
assert.match(app, /function\s+renderizarFabEstoqueGlobal\s*\([\s\S]{0,400}SimplificaInventoryScreenRenderer\.renderizarFabEstoqueGlobal/, "renderizarFabEstoqueGlobal deve ser bridge para inventory-screen-renderer");
assert.match(app, /function\s+atualizarResumoLoteCalculadora\s*\([\s\S]{0,400}SimplificaInventoryScreenRenderer\.atualizarResumoLoteCalculadora/, "atualizarResumoLoteCalculadora deve ser bridge para inventory-screen-renderer");
assert.match(app, /function\s+renderCadastroItemEstoqueWizard\s*\([\s\S]{0,400}SimplificaInventoryModals\.renderCadastroItemEstoqueWizard/, "renderCadastroItemEstoqueWizard deve ser bridge para inventory-modals");
assert.match(app, /function\s+mostrarModalEdicaoMaterial[\s\S]{0,400}SimplificaInventoryModals\.mostrarModalEdicaoMaterial/, "mostrarModalEdicaoMaterial deve ser bridge para inventory-modals");
assert.match(app, /function\s+abrirReposicaoEstoque[\s\S]{0,400}SimplificaInventoryModals\.abrirReposicaoEstoque/, "abrirReposicaoEstoque deve ser bridge para inventory-modals");
assert.match(app, /function\s+abrirCadastroMaterialCalculadora\s*\([\s\S]{0,400}SimplificaInventoryModals\.abrirCadastroMaterialCalculadora/, "abrirCadastroMaterialCalculadora deve ser bridge para inventory-modals");
assert.match(app, /async function\s+addMaterial\s*\([\s\S]{0,400}SimplificaInventoryHandlers\.addMaterial/, "addMaterial deve ser bridge para inventory-handlers");
assert.match(app, /function\s+getInventoryModalsDeps\s*\(/, "getInventoryModalsDeps deve existir");
assert.match(app, /function\s+getInventoryScreenRendererDeps\s*\(/, "getInventoryScreenRendererDeps deve existir");
assert.match(app, /function\s+getInventoryAddMaterialDeps\s*\(/, "getInventoryAddMaterialDeps deve existir");
assert(index.includes("src/features/inventory/inventory-modals.js"), "inventory-modals deve estar no index.html");
assert(index.includes("src/features/inventory/inventory-screen-renderer.js"), "inventory-screen-renderer deve estar no index.html");
assert.match(app, /function\s+calcular\s*\(\s*opcoes\s*=\s*\{\}\s*\)[\s\S]{0,400}SimplificaCalculatorCommands\.runCalculation/, "calcular deve ser bridge para calculator-commands");
assert(index.includes("src/features/calculator/calculator-commands.js"), "calculator-commands deve estar no index.html");
assert.match(app, /function\s+abrirConfiguracoesCalculadora[\s\S]{0,400}SimplificaCalculatorSettings\.abrirConfiguracoesCalculadora/, "abrirConfiguracoesCalculadora deve ser bridge para calculator-settings");
assert.match(app, /function\s+limparCalculo[\s\S]{0,400}SimplificaCalculatorSettings\.limparCalculo/, "limparCalculo deve ser bridge para calculator-settings");
assert.match(app, /function\s+getCalculatorSettingsDeps\s*\(/, "getCalculatorSettingsDeps deve existir");
assert(index.includes("src/features/calculator/calculator-settings.js"), "calculator-settings deve estar no index.html");
assert.match(app, /function\s+abrirPerfilPremiumPainel[\s\S]{0,400}SimplificaAccountProfileModals\.abrirPerfilPremiumPainel/, "abrirPerfilPremiumPainel deve ser bridge para account-profile-modals");
assert.match(app, /function\s+abrirSeletorUsuariosPerfil[\s\S]{0,400}SimplificaAccountProfileModals\.abrirSeletorUsuariosPerfil/, "abrirSeletorUsuariosPerfil deve ser bridge para account-profile-modals");
assert.match(app, /function\s+abrirFotoPerfilUsuario[\s\S]{0,400}SimplificaAccountProfileModals\.abrirFotoPerfilUsuario/, "abrirFotoPerfilUsuario deve ser bridge para account-profile-modals");
assert.match(app, /function\s+abrirAlteracaoSenhaConta[\s\S]{0,400}SimplificaAccountProfileModals\.abrirAlteracaoSenhaConta/, "abrirAlteracaoSenhaConta deve ser bridge para account-profile-modals");
assert.match(app, /function\s+abrirModalRedefinicaoSenhaSupabase[\s\S]{0,400}SimplificaAccountProfileModals\.abrirModalRedefinicaoSenhaSupabase/, "abrirModalRedefinicaoSenhaSupabase deve ser bridge para account-profile-modals");
assert.match(app, /function\s+solicitarPlanoSuperadmin[\s\S]{0,400}SimplificaAccountProfileModals\.solicitarPlanoSuperadmin/, "solicitarPlanoSuperadmin deve ser bridge para account-profile-modals");
assert.match(app, /function\s+getAccountProfileModalsDeps\s*\(/, "getAccountProfileModalsDeps deve existir");
assert(index.includes("src/features/account/account-profile-modals.js"), "account-profile-modals deve estar no index.html");
assert.match(app, /function\s+abrirPainelImpressoraSimplifica[\s\S]{0,400}SimplificaPrintersOperations\.abrirPainelImpressoraSimplifica/, "abrirPainelImpressoraSimplifica deve ser bridge para printers-operations");
assert.match(app, /function\s+abrirAjusteDadosImpressao[\s\S]{0,400}SimplificaProductionRenderer\.abrirAjusteDadosImpressao/, "abrirAjusteDadosImpressao deve ser bridge para production-renderer");
assert.match(app, /function\s+preencherImpressoras[\s\S]{0,400}SimplificaCalculatorSettings\.preencherImpressoras/, "preencherImpressoras deve ser bridge para calculator-settings");
assert.match(app, /function\s+atualizarPedidoRapidoResumo[\s\S]{0,600}SimplificaOrdersHandlers\.atualizarPedidoRapidoResumo/, "atualizarPedidoRapidoResumo deve ser bridge para orders-handlers");
assert.match(app, /function\s+iniciarVerificacao2FA\s*\([\s\S]{0,240}SimplificaAuthCommands\.iniciarVerificacao2FA/, "iniciarVerificacao2FA deve ser bridge para auth-commands");
assert.match(app, /function\s+concluirLoginUsuario\s*\(usuario[\s\S]{0,240}SimplificaAuthCommands\.concluirLoginUsuario/, "concluirLoginUsuario deve ser bridge para auth-commands");
assert.match(app, /function\s+getAuthCommandsDeps\s*\(/, "getAuthCommandsDeps deve existir");
assert(index.includes("src/features/account/auth-commands.js"), "auth-commands deve estar no index.html");
assert.match(app, /async function\s+atualizarSenhaSupabaseComSessao[\s\S]{0,280}SimplificaAuthRemote\.atualizarSenhaSupabaseComSessao/, "atualizarSenhaSupabaseComSessao deve ser bridge para auth-remote-commands");
assert.match(app, /function\s+getAuthRemoteDeps\s*\(/, "getAuthRemoteDeps deve existir");
assert(index.includes("src/features/account/auth-remote-commands.js"), "auth-remote-commands deve estar no index.html");
assert.match(app, /async\s+verifyRlsHealth\(\)[\s\S]{0,240}SimplificaAuthSession\.verifyRlsHealth/, "verifyRlsHealth deve ser bridge para auth-session-commands");
assert.match(app, /async\s+signupSaas\(__opts\)[\s\S]{0,240}SimplificaAuthSession\.signupSaas/, "signupSaas deve ser bridge para auth-session-commands");
assert.match(app, /function\s+getAuthSessionDeps\s*\(/, "getAuthSessionDeps deve existir");
assert(index.includes("src/features/account/auth-session-commands.js"), "auth-session-commands deve estar no index.html");
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
assert.match(app, /function\s+calcularDeltaPercentualRelatorios[\s\S]{0,140}SimplificaReportsFormatters\.calculatePercentageDelta/, "delta percentual deve ser bridge para o módulo de relatórios");
const domainEvents = fs.readFileSync(path.join(root, "src", "navigation", "app-domain-events.js"), "utf8");
const domainEventNeedles = [
  'window.addEventListener("popstate"',
  'window.addEventListener("simplifica-theme-system-change"',
  'window.addEventListener("beforeunload", deps.removerAndroidBackHandler',
  'document.addEventListener("touchstart", (event) => {',
  'document.addEventListener("touchmove", (event) => {',
  'document.addEventListener("keydown", (event) => {\n      const key = String(event.key || "").toLowerCase();',
  'document.addEventListener("visibilitychange", () => {\n      if (!document.hidden) deps.agendarAtualizacaoViewportOperacionalMobile',
  'document.addEventListener("visibilitychange", () => {\n    const draft = deps.bambuLoginDraftState',
  'document.addEventListener("click", (event) => {\n      const summary = event.target?.closest?.(".settings-accordion-list',
  'document.addEventListener("click", (event) => {\n      const elemento = event.target.closest("[data-action]")',
  'document.addEventListener("focusin", (event) => {',
  'document.addEventListener("pointerdown", (event) => {\n      document.querySelectorAll(".stock-item-menu[open]"'
];
// The plan form owns one temporary cancellation listener, not application
// navigation. Keep the global-router prohibition and allow only this exact
// registration; its lifecycle is exercised by test-plan-presentation-editor.
const editorBackListener = 'window.addEventListener("popstate", onBack);';
assert.equal(app.split(editorBackListener).length - 1, 1, "editor deve registrar um único cancelamento temporário");
assert(app.includes('window.removeEventListener("popstate", onBack);'), "editor deve remover seu cancelamento temporário");
const appDomainSource = app.replace(editorBackListener, "");
let domainEventListenerCount = 0;
for (const needle of domainEventNeedles) {
  if (appDomainSource.includes(needle)) domainEventListenerCount += 1;
}
assert.equal(domainEventListenerCount, 0, `DOMAIN_EVENT_LISTENERS_IN_APP_JS deve ser 0, restaram: ${domainEventListenerCount}`);
assert.match(app, /function\s+configurarNavegacaoInternaApp[\s\S]{0,200}SimplificaAppDomainEvents\.configureNavigationPopstate/, "popstate deve ser bridge para app-domain-events");
assert.match(app, /function\s+configurarEventListenersArquitetura[\s\S]{0,200}SimplificaAppDomainEvents\.configureActionDispatcher/, "dispatcher de acoes deve ser bridge para app-domain-events");
assert.match(app, /function\s+dispatchDataAction\s*\(/, "corpo do dispatcher deve residir em dispatchDataAction");
assert.match(domainEvents, /configureNavigationPopstate/, "modulo de domain events deve registrar popstate");
assert.match(domainEvents, /configureActionDispatcher/, "modulo de domain events deve registrar o dispatcher");
assert(index.includes("src/navigation/app-domain-events.js"), "app-domain-events deve estar no index.html");
assert(prepare.includes('"src/navigation/app-domain-events.js"'), "app-domain-events deve estar no prepare-web");
assert.match(app, /function\s+renderApp\s*\([\s\S]{0,160}SimplificaAppUiRenderers\.renderApp/, "renderApp deve ser bridge para app-ui-renderers");
assert.match(app, /function\s+mostrarToast\s*\([\s\S]{0,180}SimplificaAppUiRenderers\.showToast/, "mostrarToast deve ser bridge para app-ui-renderers");
assert.match(app, /function\s+renderizarAtalhoSecretariaIaGlobal\s*\([\s\S]{0,180}SimplificaAppUiRenderers\.renderAiShortcut/, "atalho IA deve ser bridge para app-ui-renderers");
assert.match(app, /function\s+aplicarFiltroClientesSaasNaTela\s*\([\s\S]{0,180}SimplificaAppUiRenderers\.applyCustomersSaasFilter/, "filtro SaaS deve ser bridge para app-ui-renderers");
assert.match(app, /function\s+mostrarAdminSobDemanda\s*\([\s\S]{0,180}SimplificaAppUiRenderers\.showAdminOnDemand/, "modal admin deve ser bridge para app-ui-renderers");
assert.match(app, /function\s+renderDashboardMobileAdvancedPanel\s*\([\s\S]{0,220}SimplificaAppUiRenderers\.renderDashboardMobileAdvancedPanel/, "painel mobile deve ser bridge para app-ui-renderers");
assert(index.includes("src/features/app-ui/app-ui-renderers.js"), "app-ui-renderers deve estar no index.html");
assert(prepare.includes('"src/features/app-ui/app-ui-renderers.js"'), "app-ui-renderers deve estar no prepare-web");
console.log(`DOMAIN_EVENT_LISTENERS_IN_APP_JS = ${domainEventListenerCount}`);
console.log("APP.JS finalization baseline: módulos e bridges conhecidos preservados sem regras duplicadas.");
