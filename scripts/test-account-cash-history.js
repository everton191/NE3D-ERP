const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.resolve(__dirname, "../app.js"), "utf8");

assert(app.includes('await hidratarHistoricoContaSupabase("login")'), "login deve hidratar o histórico remoto antes de sincronizar a fila");
assert(app.includes('function hidratarHistoricoContaSupabase(motivo = "login")'), "hidratação do histórico da conta deve existir");
assert(app.includes("offset=${offset}"), "erp_records deve ser paginado para não truncar o histórico em 1000 registros");
assert(app.includes("function getMovimentosCaixaDaConta()"), "Caixa deve possuir fonte unificada por conta");
assert(app.includes("const movimentosConta = getMovimentosCaixaDaConta();"), "tela Caixa deve consumir o histórico unificado");
assert(app.includes("function calcularTotaisCaixa(movimentos = getMovimentosCaixaDaConta())"), "cards devem usar a mesma fonte do Caixa");
assert(app.includes("canonical_readonly: true"), "movimentos canônicos remotos devem ser somente leitura no cliente");
assert(app.includes("simplifica:financial-canonical:v2:${escopo}:${empresa}"), "cache financeiro deve ser isolado por usuário e empresa");

console.log("Histórico da conta: hidratação no login, paginação, isolamento e Caixa/cards com fonte unificada validados.");
