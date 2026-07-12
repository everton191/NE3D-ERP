const fs=require('node:fs');const assert=require('node:assert/strict');const app=fs.readFileSync('app.js','utf8');
['pedido','clientes','producao','estoque'].forEach(screen=>assert.ok(app.includes(`data-ui3-screen="${screen}"`),`${screen} sem raiz V3`));
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
]){const flow=app.slice(app.indexOf(start),app.indexOf(end));assert.ok(flow.includes('promoverPopupParaDialogUiV3'),`${label} nao usa Portal V3`)}
assert.ok(app.includes('kind: "drawer"'),'acoes rapidas devem usar Drawer V3 explicito');
console.log('UI V3 operational: Pedido, Clientes, Producao e Estoque validados.');
