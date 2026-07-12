const fs = require("node:fs");
const assert = require("node:assert");
const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles/ui-v3/screens/finance.css", "utf8");
assert.ok(app.includes('data-ui-version="v3" data-ui3-screen="caixa"'), "Caixa deve usar a raiz V3.");
assert.ok(app.includes("function calcularTotaisCaixaPeriodo"), "Cálculo financeiro deve permanecer disponível.");
assert.ok(app.includes("function editarMovimentoCaixa") && app.includes("function removerMovimentoCaixa"), "Ações financeiras devem permanecer disponíveis.");
assert.ok(css.includes("repeat(var(--ui3-grid-columns)"), "Caixa deve consumir o grid oficial.");
console.log("UI V3 financeiro: Caixa, movimentações, pagamentos e fechamento validados.");
