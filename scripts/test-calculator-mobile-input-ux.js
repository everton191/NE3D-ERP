const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js', 'utf8');

function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert(from >= 0 && to > from, `missing ${start}`);
  return source.slice(from, to);
}

const elements = new Map();
const makeInput = value => ({ value, scrollIntoView() {}, closest: () => null });
const context = vm.createContext({
  window: {}, document: { getElementById: id => elements.get(id) || null, activeElement: null },
  CalculatorDomain: {
    toMinutes: (hours, minutes) => Math.max(0, Number(hours) || 0) * 60 + Math.max(0, Number(minutes) || 0),
    formatMinutes: total => ({ hours: Math.floor(total / 60), minutes: total % 60 })
  },
  agendarCalculoTempoReal() {}, setTimeout: callback => { callback(); return 1; }, clearTimeout() {}, formatarMoeda: value => `R$ ${Number(value).toFixed(2)}`,
  ultimoCalculo: null, calculatorDraftState: { tempo: '', tempoMinutos: '' }
});
vm.runInContext([
  section('function formatarTempoCalculadora(', 'function sincronizarTempoFormatadoCalculadora('),
  section('function sincronizarTempoSeparadoCalculadora(', 'function getModoLoteCalculadora('),
  section('function normalizarTempoSeparadoCalculadora(', 'function ocultarTecladoCalculadora(')
].join('\n'), context);

elements.set('tempo', makeInput(''));
elements.set('tempoMinutos', makeInput(''));
elements.set('tempoFormato', makeInput(''));
context.sincronizarTempoSeparadoCalculadora();
assert.equal(elements.get('tempo').value, '');
assert.equal(elements.get('tempoMinutos').value, '');
assert.equal(context.calculatorDraftState.tempo, '');
elements.get('tempo').value = '2';
elements.get('tempoMinutos').value = '90';
context.normalizarTempoSeparadoCalculadora();
assert.equal(elements.get('tempo').value, '3');
assert.equal(elements.get('tempoMinutos').value, '30');

assert.match(source, /placeholder="Ex\.: 120"/);
assert.match(source, /placeholder="Ex\.: 2"/);
assert.match(source, /placeholder="Ex\.: 30"/);
assert.match(source, /id="quantidade"[\s\S]*?placeholder="Ex\.: 5"/);
assert.match(source, /quantity: ""/);
assert.match(source, /Informe a quantidade de peças/);
assert.match(source, /id="tempoMinutos"[\s\S]*?enterkeyhint="done"[\s\S]*?onblur="concluirTempoCalculadora\(\)"/);
assert.match(source, /function concluirTempoCalculadora\([\s\S]*?ocultarTecladoCalculadora\(\)/);
assert.match(source, /id="calcKeyboardResultBar"/);
assert.match(source, /ocultarTecladoCalculadora\(\)/);
assert.match(source, /--calc-keyboard-inset/);
assert(!source.includes('value="${escaparAttr(config.tempo || "0")}"'));
console.log('Calculator mobile input UX passed: blank fields stay blank, entered time normalizes on blur, batch quantity starts empty, and keyboard result controls are present.');
