const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");

assert.match(
  app,
  /async function alterarStatusPedido[\s\S]*?getEditOrderUseCase3d\(\)\.prepare\([\s\S]*?getEditOrderUseCase3d\(\)\.commit\(/,
  "A troca de status deve delegar preparação e commit ao UseCase compartilhado."
);
assert.match(app, /commitEdit:[\s\S]*?getOrderCreateTransactionExecutor3d\(\)\.execute\(/, "O UseCase de edição deve persistir pelo executor transacional oficial.");
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
assert.match(
  app,
  /async function limparTrocaSenhaObrigatoriaSupabase\(\)[\s\S]*?method: "PATCH"[\s\S]*?must_change_password: false/,
  "A troca concluída deve limpar diretamente a exigência no perfil online existente."
);
assert.match(
  app,
  /async function alterarSenhaSupabaseSeConectado\(novaSenha\)[\s\S]*?await limparTrocaSenhaObrigatoriaSupabase\(\);/,
  "A alteração de senha dentro do aplicativo deve limpar a exigência online."
);
assert.match(
  app,
  /async function atualizarSenhaSupabaseComSessao\(novaSenha\)[\s\S]*?await limparTrocaSenhaObrigatoriaSupabase\(\);/,
  "A redefinição por link de recuperação também deve limpar a exigência online."
);
assert.match(
  app,
  /async function atualizarSenhaSupabaseComSessao\(novaSenha\)[\s\S]*?await definirSenhaUsuario\(usuario, novaSenha, false\);[\s\S]*?salvarDados\(\);/,
  "A redefinição por link deve limpar e persistir também a exigência local."
);
assert.doesNotMatch(
  app,
  /getUsuarioAtual\(\)\?\.mustChangePassword[\s\S]{0,160}renderTrocaSenhaObrigatoria\(\)/,
  "A sinalização remota de senha temporária não deve bloquear a navegação nem tornar a troca obrigatória."
);
assert.match(
  app,
  /function renderSeguranca\(\)[\s\S]*?abrirAlteracaoSenhaConta\(\)[\s\S]*?function abrirAlteracaoSenhaConta\(\)/,
  "A troca voluntária de senha deve continuar disponível no menu Segurança."
);
assert.doesNotMatch(
  app,
  /mostrarToast\((?:error|erro)\?\.message/,
  "Mensagens técnicas brutas não devem ser exibidas diretamente ao usuário."
);
assert.match(
  app,
  /if \(mensagemToastTecnica\(texto\)\) \{[\s\S]*?texto = "Não foi possível concluir esta ação\. Tente novamente\.";/,
  "Falhas técnicas devem permanecer no diagnóstico e chegar à interface como mensagem amigável."
);

console.log("Regressões de status do pedido e troca obrigatória de senha protegidas.");
