const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");

[
  "function getAtividadeEmpresaSaas",
  "saas_sessions?select=*&order=last_seen_at.desc&limit=200",
  "Cadastros recentes",
  "Empresas por plano",
  "Online agora",
  "function mostrarResumoAtualizacaoUmaVez",
  "APP_RELEASE_NOTES_STORAGE_KEY",
  "function marcarResumoAtualizacaoVisto",
  "function tentarDesbloqueioLocalComBiometria",
  "Biometria não confirmada. Digite sua senha para continuar."
].forEach((marker) => assert.ok(app.includes(marker), `Contrato ausente: ${marker}`));

assert.match(app, /getVersaoResumoAtualizacaoVista\(\) === APP_VERSION/, "Resumo deve aparecer uma vez por versao.");
assert.match(app, /appConfig\.biometricEnabled && isAndroid\(\)/, "Biometria deve ser exclusiva do Android configurado.");
assert.match(app, /if \(desbloqueado\) return true;/, "Biometria aprovada deve liberar a sessao sem senha.");

console.log("Superadmin, resumo de versao e fallback biometrico validados.");
