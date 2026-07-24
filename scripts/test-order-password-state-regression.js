const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");

assert.match(
  app,
  /async function alterarStatusPedido[\s\S]*?pedidos\[indicePedido\] = marcarRegistroAlteradoParaSync\(pedidoAtualizado\);[\s\S]*?salvarDados\(\);/,
  "A troca de status deve substituir atomicamente o pedido e persistir antes da sincronização."
);
const alterarStatusPedido = app.match(/async function alterarStatusPedido[\s\S]*?\n\}/)?.[0] || "";
assert.doesNotMatch(alterarStatusPedido, /consumirCreditoAcaoFree/);
assert.match(
  app,
  /indicadorAtual\?\.classList\.contains\("sync-syncing"\)[\s\S]*?atualizarIndicadorSincronizacao\("pending", "Salvo no aparelho"\)/
);
assert.match(
  app,
  /const senhaJaAlteradaLocalmente = !!local\?\.passwordUpdatedAt;[\s\S]*?const deveTrocarSenha = remoto\.mustChangePassword === true && !senhaJaAlteradaLocalmente;/
);
assert.match(
  app,
  /usuario\.mustChangePassword = perfil\.must_change_password === true && !usuario\.passwordUpdatedAt;[\s\S]*?usuario\.senhaTemporaria = usuario\.mustChangePassword;/
);

console.log("Regressões de status do pedido e troca obrigatória de senha protegidas.");
