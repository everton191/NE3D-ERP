const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js', 'utf8');
function block(start, end) {
  const pos = source.indexOf(start);
  assert(pos >= 0);
  const finish = source.indexOf(end, pos + start.length);
  assert(finish > pos);
  return source.slice(pos, finish);
}
const context = { caixa: [] };
vm.createContext(context);
const cancelStart = source.indexOf('function movimentoCaixaCancelado(');
assert(cancelStart >= 0);
vm.runInContext(source.slice(cancelStart, source.indexOf('\n}', cancelStart) + 2), context);
vm.runInContext(block('function calcularCaixaVinculadoPedido(', '\nfunction renderRentabilidadeOperacionalPedido('), context);
const calc = (p, m) => JSON.parse(JSON.stringify(context.calcularCaixaVinculadoPedido(p, m)));
const m = (extra = {}) => ({pedidoId: 'uuid-a', tipo: 'entrada', valor: 100, ...extra});
assert.deepEqual(calc({id: 'uuid-a'}, [m(), m({tipo:'saida',valor:25})]), {entradas:100,saidas:25,saldo:75,quantidade:2});
assert.equal(calc({id:'uuid-a'}, [m({pedidoId:'uuid-b'}), m({pedidoId:undefined,descricao:'Pedido #uuid-a'})]).quantidade, 0);
for (const flag of ['cancelado','cancelled','canceladoEm','cancelled_at','deleted_at','deletedAt']) {
  assert.equal(calc({id:'uuid-a'}, [m({[flag]:true})]).quantidade, 0);
}
for (const extra of [{status:'cancelado'}, {valor:NaN}, {valor:Infinity}, {valor:-1}, {tipo:'transferencia'}]) {
  assert.equal(calc({id:'uuid-a'}, [m(extra)]).quantidade, 0);
}
for (const key of ['pedidoId','pedido_id','orderId']) {
  assert.equal(calc({id:42}, [{[key]:'42',tipo:'entrada',valor:1}]).saldo, 1);
}
assert.equal(calc({}, [m({pedidoId:''})]).quantidade, 0);
assert.equal(calc({id:'uuid-a'}, null).quantidade, 0);
assert.equal(calc({id:'uuid-a'}, [m({valor:0.1}),m({valor:0.2})]).saldo, 0.3);
assert.equal(calc({id:'uuid-a'}, [m({tipo:'saida',valor:12})]).saldo, -12);
const fixture = [m()]; const original = JSON.stringify(fixture); calc({id:'uuid-a'}, fixture);
assert.equal(JSON.stringify(fixture), original);
console.log('Phase 5 cash checks passed: explicit IDs, legacy aliases, cancellations, invalid values, cents, negative balance, no mutation.');
