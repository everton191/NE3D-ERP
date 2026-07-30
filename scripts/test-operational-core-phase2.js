const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");

[
  "function getExcecoesOperacionaisDashboard",
  "aguardando_material",
  "produção parada",
  "pagamento pendente",
  "Caixa sem sessão aberta",
  "saldo contado",
  "justificativa obrigatória",
  "counted_balance",
  "difference_amount",
  "cash_session_closed"
].forEach((marker) => assert.ok(app.includes(marker), `Núcleo operacional incompleto: ${marker}`));

assert.match(
  app,
  /if\s*\(Math\.abs\(diferenca\)\s*>=\s*0\.01\)[\s\S]+if\s*\(!justificativa\)/,
  "Diferença de caixa precisa exigir justificativa."
);
assert.match(
  app,
  /closingBalance:\s*saldoInformado[\s\S]+expectedBalance:\s*resumo\.expectedBalance/,
  "Fechamento deve separar saldo contado do esperado."
);

console.log("Núcleo operacional fase 2: exceções e conferência de caixa validadas.");
