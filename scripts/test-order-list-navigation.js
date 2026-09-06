const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app.js', 'utf8');
function extract(name, next) { return source.slice(source.indexOf(`function ${name}(`), source.indexOf(`\nfunction ${next}(`)); }
const ctx = {window:{},telas:{pedidos:true,dashboard:true},telaAtual:'pedidos',telaAnterior:'dashboard',navigationStack:[],pedidoVisualizandoId:3,
  appConfig:{},location:{pathname:'/'},canAccessScreen:()=>true,setTimeout:()=>0,parseStorefrontAdminRoute:()=>false,parseStorefrontPublicRoute:()=>false,getParentScreenForBack:()=> 'dashboard',fecharCamadaAtualSeExistir:()=>false};
for (const name of ['fecharMenusContextuaisUi','atualizarContextoAssistantCore3d','registrarEventoUsoLocal','atualizarHistoricoBrowserApp','renderAppComTransicaoNavegacao','renderApp','resetarScrollTelaAtiva','renderizarPreservandoScroll']) ctx[name]=()=>{};
vm.createContext(ctx);
vm.runInContext(extract('trocarTela','voltarTela')+extract('voltarTela','voltarInicio')+extract('visualizarPedido','fecharDetalhesPedido')+extract('fecharDetalhesPedido','carregarMaisPedidos'),ctx);
ctx.trocarTela('pedidos'); assert.equal(ctx.pedidoVisualizandoId,null);
ctx.visualizarPedido(2); assert.equal(ctx.pedidoVisualizandoId,2);
ctx.voltarTela(); assert.equal(ctx.telaAtual,'pedidos'); assert.equal(ctx.pedidoVisualizandoId,null);
ctx.visualizarPedido(1); ctx.trocarTela('dashboard'); ctx.trocarTela('pedidos'); assert.equal(ctx.pedidoVisualizandoId,null);
ctx.visualizarPedido(3); ctx.fecharDetalhesPedido(); assert.equal(ctx.pedidoVisualizandoId,null);
assert(!extract('renderListaPedidosPwa','renderResumoCalculo').includes('listaPaginada[0]'));
console.log('Order navigation passed: list entry, explicit detail, back, re-entry, close, no automatic first selection.');
