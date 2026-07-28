const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");

assert.match(
  app,
  /async function alterarStatusPedido[\s\S]*?pedidos\[indicePedido\] = marcarRegistroAlteradoParaSync\(pedidoAtualizado\);[\s\S]*?salvarDados\(\);/,
  "A troca de status deve substituir atomicamente o pedido e persistir antes da sincronização."
);
assert.match(
  app,
  /window\.__pedidosStatusEmAndamento\.add\(chaveOperacao\);[\s\S]*?finally \{[\s\S]*?window\.__pedidosStatusEmAndamento\.delete\(chaveOperacao\);/,
  "A trava contra cliques repetidos deve sempre ser liberada."
);
const alterarStatusPedido = app.match(/async function alterarStatusPedido[\s\S]*?\n\}/)?.[0] || "";
assert.doesNotMatch(
  alterarStatusPedido,
  /consumirCreditoAcaoFree/,
  "Alterar o estado de um pedido existente não deve aguardar anúncio nem consumir outra ação comercial."
);
assert.match(
  app,
  /indicadorAtual\?\.classList\.contains\("sync-syncing"\)[\s\S]*?atualizarIndicadorSincronizacao\("pending", "Salvo no aparelho"\)/,
  "O indicador visual deve sair de Salvando mesmo se o estado interno já tiver sido liberado."
);
assert.match(
  app,
  /const senhaJaAlteradaLocalmente = !!local\?\.passwordUpdatedAt;[\s\S]*?const deveTrocarSenha = remoto\.mustChangePassword === true && !senhaJaAlteradaLocalmente;/,
  "A flag remota antiga não deve reabrir a troca obrigatória após uma alteração local concluída."
);
assert.match(
  app,
  /usuario\.mustChangePassword = perfil\.must_change_password === true && !usuario\.passwordUpdatedAt;[\s\S]*?usuario\.senhaTemporaria = usuario\.mustChangePassword;/,
  "As duas flags locais de senha temporária devem permanecer consistentes."
);

console.log("Regressões de status do pedido e troca obrigatória de senha protegidas.");
