const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const { execFileSync } = require('node:child_process');

function extract(source) {
  const start = source.indexOf('function garantirNumeracaoSequencialPedidos(');
  const end = source.indexOf('\nfunction getNumeroSequencialPedido(', start);
  assert(start >= 0 && end > start);
  return vm.runInNewContext(`(${source.slice(start, end)})`);
}
const before = extract(execFileSync('git', ['show', '6269281:app.js'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
const after = extract(fs.readFileSync('app.js', 'utf8'));
const copy = (value) => JSON.parse(JSON.stringify(value));
const cases = [[], null, [null, false], [{id: 3}, {id: 1}, {id: 2}],
  [{id: 1, numeroPedido: 2}, {id: 2}, {id: 3, numero_pedido: '8'}],
  [{id: 1, numeroPedido: -2}, {id: 2, numeroPedido: 'invalid'}, {id: 3, numeroPedido: 0.5}],
  [{id: 1, numeroPedido: 3}, {id: 2, numeroPedido: 3}],
  [{id: 4, criadoEm: '2025-01-02'}, {id: 5, criadoEm: '2025-01-01'}]];
for (const fixture of cases) {
  const oldData = copy(fixture), newData = copy(fixture);
  assert.equal(JSON.stringify(after(newData)), JSON.stringify(before(oldData)));
  assert.deepEqual(newData, oldData);
}
const mutable = [{id: 1, numeroPedido: 1}];
after(mutable);
mutable.push({id: 2});
after(mutable);
assert.equal(mutable[1].numeroPedido, 2, 'in-place additions must still be numbered');
mutable[0].numeroPedido = 0;
mutable[0].numero_pedido = 0;
after(mutable);
assert.equal(mutable[0].numeroPedido, 1, 'in-place edits must still be detected');

const dataset = Array.from({length: 5000}, (_, i) => ({id: 5000-i, numeroPedido: i+1, criadoEm: '2026-09-06T12:00:00Z'}));
function measure(fn) {
  for (let i = 0; i < 5; i++) fn(dataset);
  const samples = [];
  for (let run = 0; run < 5; run++) {
    const start = performance.now();
    for (let card = 0; card < 30; card++) fn(dataset);
    samples.push(performance.now() - start);
  }
  return samples.sort((a,b) => a-b)[2];
}
const baseline = measure(before), optimized = measure(after);
console.log(JSON.stringify({tests: '8 equivalence cases + insertion/edit passed', fixtureOrders: 5000,
  callsPerSample: 30, baselineMedianMs: +baseline.toFixed(2), optimizedMedianMs: +optimized.toFixed(2),
  speedup: +(baseline/optimized).toFixed(2), scope: 'numbering helper only, not browser or full screen'}, null, 2));
