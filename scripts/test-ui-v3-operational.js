const fs=require('node:fs');const assert=require('node:assert/strict');const app=fs.readFileSync('app.js','utf8');const style=fs.readFileSync('style.css','utf8');
assert.match(app,/const attrs = `width="24" height="24" viewBox="0 0 24 24"/,'ícones SVG centrais precisam de tamanho intrínseco seguro');
for(const marker of ['.storefront-admin-tabs{','.auth-page{','.side-profile-card.premium-profile-trigger{','.dashboard-chart-card,','.combo-chart-svg{']){
  assert.ok(style.includes(marker),`regra visual compartilhada ausente: ${marker}`);
}
for(const removedAiSelector of ['.assistant-fab{','.assistant-panel{','.assistant-backdrop{','.ai-model-card{','.ai-runtime-diagnostics{']){
  assert.ok(!style.includes(removedAiSelector),`estilo removido de IA reapareceu: ${removedAiSelector}`);
}
['pedido','pedidos','clientes','producao','estoque'].forEach(screen=>assert.ok(app.includes(`data-ui3-screen="${screen}"`),`${screen} sem raiz V3`));
assert.equal((app.match(/data-ui3-screen="pedidos"/g)||[]).length,2,'variantes mobile e PWA de Pedidos devem usar V3');
assert.match(app,/pedidoTab === "itens" \? renderAcaoPedidoCompacta\("✚", "Manual"/,'Manual nao condicionado a Itens');assert.match(app,/pedidoTab === "itens" \? renderAcaoPedidoCompacta\("calculadora", "Calcular"/,'Calcular nao condicionado a Itens');assert.ok(app.includes('ui3-sticky-actions ui3-order-final-bar'),'Barra final nao usa StickyActionBar');
for(const [start,end,label] of [
  ['function solicitarDecisaoItemDuplicado','async function addCalculatedItemToOrder','decisao de item duplicado'],
  ['function adicionarProdutoManual','async function solicitarSenhaConfirmacaoAdmin','item manual'],
  ['async function solicitarSenhaConfirmacaoAdmin','async function validarSenhaSupabaseUsuarioAtual','autorizacao sensivel'],
  ['function abrirRevisaoAlteracoesPedido','function confirmarRevisaoAlteracoesPedido','revisao do pedido'],
  ['function abrirCadastroItemEstoque','async function addMaterial','cadastro de estoque'],
  ['function mostrarModalEdicaoMaterial','async function salvarEdicaoMaterialEstoque','edicao de estoque'],
  ['function abrirCadastroLoteEstoque','async function salvarLoteEstoque','lote de estoque'],
  ['function abrirSaidaManualEstoque','async function confirmarSaidaManualEstoque','saida de estoque'],
  ['function abrirReposicaoEstoque','async function confirmarReposicaoEstoque','reposicao de estoque']
  ,['function abrirCaixaRapidoOperacional','async function salvarCaixaRapidoOperacional','lancamento rapido do caixa']
  ,['function abrirEstoqueRapidoOperacional','async function salvarEstoqueRapidoOperacional','entrada rapida de estoque']
  ,['function abrirCadastroImpressora','function atualizarMarcaCadastroImpressora','cadastro de impressora monitorada']
  ,['function abrirStatusManualImpressora','function abrirVinculoPedidoImpressora','status de impressora']
  ,['function abrirVinculoPedidoImpressora','async function abrirHistoricoImpressora','vinculo de pedido e impressora']
  ,['async function abrirHistoricoImpressora','function abrirAgentesLocais','historico de impressora']
  ,['function abrirAgentesLocais','async function criarAgenteLocal','agentes locais']
  ,['async function criarAgenteLocal','const PRODUCTION_STATUS_META','credenciais de agente']
  ,['function abrirLiberacaoProducao','async function confirmarLiberacaoProducao','liberacao de producao']
  ,['function abrirCadastroImpressoraProducao','function salvarImpressoraProducao','cadastro de impressora da producao']
]){const flow=app.slice(app.indexOf(start),app.indexOf(end));assert.ok(flow.includes('promoverPopupParaDialogUiV3'),`${label} nao usa Portal V3`)}
assert.ok(app.includes('kind: "drawer"'),'acoes rapidas devem usar Drawer V3 explicito');
const quickOrderDrawer=app.slice(app.indexOf('function montarPedidoRapidoNoDrawerUiV3'),app.indexOf('function abrirPedidoRapidoOperacional'));
assert.ok(quickOrderDrawer.includes('kind: "drawer"'),'Pedido rapido deve usar Drawer V3');
assert.ok(app.includes('montarPedidoRapidoNoDrawerUiV3({ historyEntry: false })'),'atualizacao do Pedido rapido nao deve empilhar historico');
console.log('UI V3 operational: Pedido, Clientes, Producao e Estoque validados.');
