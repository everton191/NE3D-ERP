const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js', 'utf8');
const start = source.indexOf('async function abrirEtapasPedido(');
const end = source.indexOf('\nasync function abrirMaisOpcoesPedido(', start);
assert(start >= 0 && end > start);
async function run(choice, state = 'active', changed = false) {
  const calls = [];
  let reads = 0;
  const context = {
    encontrarPedidoPorId: () => (++reads > 1 && changed) || state === 'missing' ? null : {id: '1', status: state},
    pedidoJaCancelado: p => p.status === 'cancelado',
    getNumeroSequencialPedido: () => 1,
    labelStatusPedido: s => s,
    solicitarEscolhaPedido: async config => { calls.push('dialog'); assert.equal(config.opcoes.length, 5); return choice; },
    abrirLiberacaoProducao: id => calls.push(`production:${id}`),
    abrirFinanceiroPedido: id => calls.push(`finance:${id}`),
    alterarStatusPedido: (id, status) => calls.push(`${status}:${id}`)
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  await context.abrirEtapasPedido('1');
  return calls;
}
(async () => {
  for (const [choice, expected] of [['producao','production'], ['financeiro','finance'], ['pronto','pronto'], ['entregue','entregue'], ['pago','pago']]) {
    assert.deepEqual(await run(choice), ['dialog', `${expected}:1`]);
  }
  for (const choice of ['', 'unknown', 'cancelado']) assert.deepEqual(await run(choice), ['dialog']);
  assert.deepEqual(await run('pago', 'cancelado'), []);
  assert.deepEqual(await run('pago', 'missing'), []);
  assert.deepEqual(await run('pago', 'active', true), ['dialog']);
  console.log('11 checks passed: existing handlers, dismissal, invalid choice, cancelled/missing/stale order.');
})().catch(error => { console.error(error); process.exitCode = 1; });
