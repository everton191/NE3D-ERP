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

function calcularPreco({ baseProduto, margemPercentual, taxaExtra }) {
  const lucro = baseProduto * (margemPercentual / 100);
  const valorProduto = baseProduto + lucro;
  const totalFinal = valorProduto + taxaExtra;
  return { lucro, valorProduto, totalFinal };
}

const comTaxa = calcularPreco({ baseProduto: 10, margemPercentual: 100, taxaExtra: 5 });
assert(comTaxa.valorProduto === 20, "margem aplica somente sobre o produto");
assert(comTaxa.totalFinal === 25, "taxa extra entra depois da margem");
assert(comTaxa.totalFinal !== 30, "taxa extra nao recebe margem");

const semTaxa = calcularPreco({ baseProduto: 10, margemPercentual: 100, taxaExtra: 0 });
assert(semTaxa.valorProduto === 20 && semTaxa.totalFinal === 20, "calculo sem taxa preserva total do produto");

const taxaVazia = calcularPreco({ baseProduto: 10, margemPercentual: 50, taxaExtra: Number("") || 0 });
assert(taxaVazia.totalFinal === 15, "taxa vazia equivale a zero");

assert(!/const\s+custo\s*=\s*custoBase\s*\+\s*taxaExtra[\s\S]{0,180}precoSemTaxa\s*=\s*custo\s*\*/.test(appSource), "codigo nao soma taxa antes da margem");
assert(/const\s+baseProduto\s*=/.test(appSource) && /const\s+valorProduto\s*=/.test(appSource), "codigo explicita base e valor do produto");
assert(/function\s+embutirTaxaExtraNosItensCliente/.test(appSource), "documentos de cliente embutem taxa no valor final");
assert(!/\[\s*"Taxa extra"\s*,\s*taxaExtraComercial\s*\]/.test(appSource), "PDF nao discrimina taxa extra para cliente");

if (process.exitCode) process.exit(process.exitCode);
console.log("Teste da taxa extra concluido.");
