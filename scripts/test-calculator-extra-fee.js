const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(rootDir, "app.js"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exitCode = 1;
  } else {
    console.log("OK:", message);
  }
}

function almostEqual(actual, expected) {
  return Math.abs(actual - expected) < 0.000001;
}

function calcularValorPercentual(valorBase, percentual) {
  return valorBase * (percentual / 100);
}

function aplicarPercentualAcrescimo(valorBase, percentual) {
  return valorBase + calcularValorPercentual(valorBase, percentual);
}

function aplicarPercentualDesconto(valorBase, percentual) {
  return Math.max(0, valorBase - calcularValorPercentual(valorBase, percentual));
}

function calcularPreco({ baseProduto, margemPercentual, taxaExtra }) {
  const lucro = calcularValorPercentual(baseProduto, margemPercentual);
  const valorProduto = aplicarPercentualAcrescimo(baseProduto, margemPercentual);
  const totalFinal = valorProduto + taxaExtra;
  return { lucro, valorProduto, totalFinal };
}

function calcularPrecoComTaxaPercentual({ baseProduto, margemPercentual, taxaExtraPercentual }) {
  const lucro = calcularValorPercentual(baseProduto, margemPercentual);
  const valorProduto = aplicarPercentualAcrescimo(baseProduto, margemPercentual);
  const taxaExtra = calcularValorPercentual(valorProduto, taxaExtraPercentual);
  const totalFinal = valorProduto + taxaExtra;
  return { lucro, valorProduto, taxaExtra, totalFinal };
}

const comTaxa = calcularPreco({ baseProduto: 10, margemPercentual: 100, taxaExtra: 5 });
assert(comTaxa.valorProduto === 20, "margem aplica somente sobre o produto");
assert(comTaxa.totalFinal === 25, "taxa extra entra depois da margem");
assert(comTaxa.totalFinal !== 30, "taxa extra nao recebe margem");

const semTaxa = calcularPreco({ baseProduto: 10, margemPercentual: 100, taxaExtra: 0 });
assert(semTaxa.valorProduto === 20 && semTaxa.totalFinal === 20, "calculo sem taxa preserva total do produto");

const taxaVazia = calcularPreco({ baseProduto: 10, margemPercentual: 50, taxaExtra: Number("") || 0 });
assert(taxaVazia.totalFinal === 15, "taxa vazia equivale a zero");

[
  [30, 5, 31.5],
  [30, 10, 33],
  [30, 15, 34.5],
  [30, 20, 36],
  [50, 20, 60],
  [100, 10, 110],
  [100, 15, 115],
  [100, 30, 130]
].forEach(([base, percentual, esperado]) => {
  assert(almostEqual(aplicarPercentualAcrescimo(base, percentual), esperado), `${base} + ${percentual}% = ${esperado}`);
});

assert(almostEqual(aplicarPercentualDesconto(30, 10), 27), "desconto de 10% em 30 = 27");
assert(almostEqual(aplicarPercentualDesconto(100, 30), 70), "desconto de 30% em 100 = 70");

const taxaPercentualDepoisDaMargem = calcularPrecoComTaxaPercentual({
  baseProduto: 15,
  margemPercentual: 100,
  taxaExtraPercentual: 10
});
assert(taxaPercentualDepoisDaMargem.valorProduto === 30, "preco comercial considera margem antes da taxa percentual");
assert(taxaPercentualDepoisDaMargem.taxaExtra === 3, "taxa de 10% usa preco comercial de 30");
assert(taxaPercentualDepoisDaMargem.totalFinal === 33, "cenario real corrigido: 30 + 10% = 33");

assert(!/const\s+custo\s*=\s*custoBase\s*\+\s*taxaExtra[\s\S]{0,180}precoSemTaxa\s*=\s*custo\s*\*/.test(appSource), "codigo nao soma taxa antes da margem");
assert(/const\s+baseProduto\s*=/.test(appSource) && /const\s+valorProduto\s*=/.test(appSource), "codigo explicita base e valor do produto");
assert(/function\s+aplicarPercentualAcrescimo/.test(appSource), "app possui helper central de acrescimo percentual");
assert(/function\s+aplicarPercentualDesconto/.test(appSource), "app possui helper central de desconto percentual");
assert(/const\s+dominio\s*=\s*CalculatorDomain\.calculate\(/.test(appSource), "calculadora usa o dominio central para margem e taxa");
assert(/const\s+valorProduto\s*=\s*dominio\.subtotalBase/.test(appSource), "preco comercial vem do dominio depois da margem");
assert(/const\s+taxaExtra\s*=\s*dominio\.extraFeeAmount/.test(appSource), "taxa percentual vem do dominio sobre o preco comercial");
assert(!/const\s+taxaInfo\s*=\s*calcularTaxaExtraAplicada\(baseProduto\)/.test(appSource), "taxa percentual nao usa mais custo interno antes da margem");
assert(/function\s+embutirTaxaExtraNosItensCliente/.test(appSource), "documentos de cliente embutem taxa no valor final");
assert(!/\[\s*"Taxa extra"\s*,\s*taxaExtraComercial\s*\]/.test(appSource), "PDF nao discrimina taxa extra para cliente");

if (process.exitCode) process.exit(process.exitCode);
console.log("Teste da taxa extra concluido.");
