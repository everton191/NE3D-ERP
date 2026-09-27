const fs = require("node:fs");

const css = fs.readFileSync("style.css", "utf8");
const app = fs.readFileSync("app.js", "utf8");

function bloco(seletor) {
  const i = css.indexOf(seletor);
  if (i < 0) throw new Error(`Seletor ausente no style.css: ${seletor}`);
  const abre = css.indexOf("{", i);
  const fecha = css.indexOf("}", abre);
  if (abre < 0 || fecha < 0) throw new Error(`Bloco invalido para: ${seletor}`);
  return css.slice(abre + 1, fecha);
}

const label = bloco(".calc-segmented label");
if (!/position:\s*relative/.test(label)) {
  throw new Error(
    "O label do .calc-segmented precisa ser position:relative: sem isso o input absolutamente " +
      "posicionado usa o painel (position:fixed) como containing block e o width:100% global " +
      "faz cada opcao do lote/taxa extra exceder a largura da tela."
  );
}

const input = bloco(".calc-segmented input");
if (!/position:\s*absolute/.test(input)) throw new Error("O radio do .calc-segmented deve continuar absolute.");
if (!/width:\s*100%/.test(input)) throw new Error("O radio do .calc-segmented deve ter width:100% limitado ao proprio label.");
if (!/max-width:\s*100%/.test(input)) throw new Error("O radio do .calc-segmented precisa de max-width:100%.");

const feeLabel = bloco(".calc-fee-stepper label");
if (!/position:\s*relative/.test(feeLabel)) {
  throw new Error("O label do .calc-fee-stepper precisa ser position:relative para conter o input absoluto.");
}

if (!/\.calc-option-block,\.calc-option-fields,\.calc-stepper-row,\.calc-segmented,\.calc-batch-summary\{min-width:0;max-width:100%;box-sizing:border-box\}/.test(css)) {
  throw new Error("As faixas de lote e taxa extra devem manter min-width:0 e max-width:100%.");
}

for (const opcao of ['data-calc-option="batch"', 'data-calc-option="extra-fee"']) {
  const i = app.indexOf(opcao);
  if (i < 0) throw new Error(`Bloco da Calculadora ausente no app.js: ${opcao}`);
  const trecho = app.slice(i, i + 3000);
  if (!trecho.includes("calc-segmented")) throw new Error(`O bloco ${opcao} nao renderiza o controle segmentado.`);
}

const calculadora = app.slice(app.indexOf("function renderCalculadoraConteudo()"), app.indexOf("function dispensarDicaCalculadora()"));
if (!calculadora.includes("Calcular várias peças") || !calculadora.includes("Adicionar taxa extra")) {
  throw new Error("Os trechos de referencia da Calculadora nao estao no bloco esperado do app.js.");
}

console.log(
  "Calculadora mobile: radios do lote/taxa extra contidos no proprio label (scroll horizontal do painel zerado)."
);
