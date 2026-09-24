const fs=require('node:fs');const assert=require('node:assert/strict');const app=fs.readFileSync('app.js','utf8');const style=fs.readFileSync('style.css','utf8');const batchCommands=fs.readFileSync('src/features/inventory/inventory-batch-commands.js','utf8');const inventoryModals=fs.readFileSync('src/features/inventory/inventory-modals.js','utf8');const inventoryScreen=fs.readFileSync('src/features/inventory/inventory-screen-renderer.js','utf8');const inventoryHaystack=app+'\n'+batchCommands+'\n'+inventoryModals+'\n'+inventoryScreen;const ordersRenderer=fs.readFileSync('src/features/orders/orders-renderer.js','utf8');const customersRenderer=fs.readFileSync('src/features/customers/customers-renderer.js','utf8');const productionRenderer=fs.readFileSync('src/features/production/production-renderer.js','utf8');const printersOperations=fs.readFileSync('src/features/printers/printers-operations.js','utf8');const productionCommands=fs.readFileSync('src/features/production/production-commands.js','utf8');const ordersHandlers=fs.readFileSync('src/features/orders/orders-handlers.js','utf8');
assert.match(app,/const attrs = `width="24" height="24" viewBox="0 0 24 24"/,'ícones SVG centrais precisam de tamanho intrínseco seguro');
for(const marker of ['.storefront-admin-tabs{','.auth-page{','.side-profile-card.premium-profile-trigger{','.dashboard-chart-card,','.combo-chart-svg{']){
  assert.ok(style.includes(marker),`regra visual compartilhada ausente: ${marker}`);
}
for(const removedAiSelector of ['.assistant-fab{','.assistant-panel{','.assistant-backdrop{','.ai-model-card{','.ai-runtime-diagnostics{']){
  assert.ok(!style.includes(removedAiSelector),`estilo removido de IA reapareceu: ${removedAiSelector}`);
}
assert.ok(ordersRenderer.includes('data-ui3-screen="pedido"'),'pedido sem raiz V3');
assert.ok(ordersRenderer.includes('data-ui3-screen="pedidos"'),'pedidos sem raiz V3');
assert.ok(customersRenderer.includes('data-ui3-screen="clientes"'),'clientes sem raiz V3');
assert.ok(productionRenderer.includes('data-ui3-screen="producao"'),'producao sem raiz V3');
assert.ok(inventoryScreen.includes('data-ui3-screen="estoque"'),'estoque sem raiz V3');
assert.equal((ordersRenderer.match(/data-ui3-screen="pedidos"/g)||[]).length,2,'variantes mobile e PWA de Pedidos devem usar V3');
assert.match(ordersRenderer,/pedidoTab === "itens" \? renderAcaoPedidoCompacta\("✚", "Manual"/,'Manual nao condicionado a Itens');assert.match(ordersRenderer,/pedidoTab === "itens" \? renderAcaoPedidoCompacta\("calculadora", "Calcular"/,'Calcular nao condicionado a Itens');assert.ok(ordersRenderer.includes('ui3-sticky-actions ui3-order-final-bar'),'Barra final nao usa StickyActionBar');
for(const [start,end,label,hay] of [
  ['function solicitarDecisaoItemDuplicado','async function addCalculatedItemToOrder','decisao de item duplicado',app],
  ['function adicionarProdutoManual','async function solicitarSenhaConfirmacaoAdmin','item manual',app],
  ['async function solicitarSenhaConfirmacaoAdmin','async function validarSenhaSupabaseUsuarioAtual','autorizacao sensivel',app],
  ['function abrirRevisaoAlteracoesPedido','function confirmarRevisaoAlteracoesPedido','revisao do pedido',app],
  ['function renderCadastroItemEstoqueWizard(deps','function mostrarModalEdicaoMaterial(indice','cadastro de estoque',inventoryModals],
  ['function mostrarModalEdicaoMaterial(indice','function abrirReposicaoEstoque(indice','edicao de estoque',inventoryModals],
  ['function openBatchModal','function updateBatchStatus','lote de estoque',batchCommands],
  ['function openManualOutputModal','function saveQuickCalculatorMaterial','saida de estoque',batchCommands],
  ['function abrirReposicaoEstoque(indice','function abrirCadastroMaterialCalculadora','reposicao de estoque',inventoryModals]
  ,['function abrirCaixaRapidoOperacional','async function salvarCaixaRapidoOperacional','lancamento rapido do caixa',app]
  ,['function abrirEstoqueRapidoOperacional','async function salvarEstoqueRapidoOperacional','entrada rapida de estoque',app]
  ,['function abrirCadastroImpressora(id','function atualizarMarcaCadastroImpressora(context','cadastro de impressora monitorada',printersOperations]
  ,['function abrirStatusManualImpressora(id','function abrirVinculoPedidoImpressora(id','status de impressora',printersOperations]
  ,['function abrirVinculoPedidoImpressora(id','async function abrirHistoricoImpressora(id','vinculo de pedido e impressora',printersOperations]
  ,['async function abrirHistoricoImpressora(id','function abrirAgentesLocais(context','historico de impressora',printersOperations]
  ,['function abrirAgentesLocais(context','async function criarAgenteLocal(context','agentes locais',printersOperations]
  ,['async function criarAgenteLocal(context','async function garantirImpressorasMonitoradasCarregadas','credenciais de agente',printersOperations]
  ,['function abrirLiberacaoProducao(id','function confirmarLiberacaoProducao(event','liberacao de producao',productionCommands]
  ,['function abrirCadastroImpressoraProducao(id','function salvarImpressoraProducao(event','cadastro de impressora da producao',productionCommands]
]){const flow=hay.slice(hay.indexOf(start),hay.indexOf(end));assert.ok(flow.includes('promoverPopupParaDialogUiV3')||flow.includes('promotePopup')||flow.includes('UiV3'),`${label} nao usa Portal V3`)}
assert.ok(app.includes('kind: "drawer"'),'acoes rapidas devem usar Drawer V3 explicito');
assert.ok(ordersHandlers.includes('kind: "drawer"') && app.includes('promoteDrawer: promoverPopupParaDialogUiV3'),'Pedido rapido deve usar Drawer V3');
assert.ok(ordersHandlers.includes('mountQuickOrderDrawer({ historyEntry: false }, deps)') && app.includes('SimplificaOrdersHandlers.refreshQuickOrder'),'atualizacao do Pedido rapido nao deve empilhar historico');
assert.ok(productionRenderer.includes('tab === "historico" ? renderHistoricoProducao()') && app.includes('function renderHistoricoProducao()') && app.includes('const PRODUCTION_HISTORY_PAGE_SIZE = 6') && productionRenderer.includes('function abrirAjusteDadosImpressao') && app.includes('function abrirAjusteDadosImpressao(jobId)'),'historico compacto da producao ausente');
for(const marker of ['function abrirPainelImpressoraSimplifica(id)','Conectada e pronta para o próximo trabalho','class="printer-simple-connection"']){
  assert.ok(printersOperations.includes(marker) || app.includes(marker),`painel simples da impressora ausente: ${marker}`);
}
assert.ok(app.includes('const PRINTER_FEATURE_ENABLED = true'),'tela de impressoras precisa estar habilitada no piloto');
assert.ok(app.includes('{ tela: "impressoras", icone: "impressoras", texto: "Impressoras" }'),'Impressoras precisa aparecer no menu');
assert.ok(app.includes('function abrirImpressoraAtivaProducao(id)'),'card da impressora ativa precisa abrir o painel');
assert.ok(app.includes('filamentWeightGrams = job.filament_weight_grams'),'ajuste de peso deve preservar os campos local e remoto');
const lossHaystack=app+'\n'+productionRenderer+'\n'+productionCommands;
for(const marker of ['function getPesoPlanejadoTarefaProducao','function getCustoMaterialPorGramaTarefaProducao','Horas perdidas','Material perdido','Prejuízo estimado']){
  assert.ok(lossHaystack.includes(marker),`controle de perdas da produção ausente: ${marker}`);
}
console.log('UI V3 operational: Pedido, Clientes, Producao e Estoque validados.');
