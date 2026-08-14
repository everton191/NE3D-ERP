"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

global.window = global;
require("../src/services/simplifica3dAiActions.js");

const actions = global.Simplifica3dAiActions;
assert(actions, "Registro de ações da IA não carregou");

const chat = actions.preview({ type: "chat", payload: { answer: "Brasília é a capital do Brasil." } });
assert.strictEqual(chat.summary, "Brasília é a capital do Brasil.");
assert.strictEqual(chat.requiresConfirmation, false);

const cash = actions.preview({ type: "caixa.lancar", payload: { tipo: "entrada", valor: "12,50", descricao: "Teste" } });
assert.strictEqual(cash.requiresConfirmation, true);
assert(cash.summary.includes("12.50"));

const order = actions.preview({ type: "pedido.criar", payload: { cliente: "Cliente", itens: ["Peça"] } });
assert.strictEqual(order.requiresConfirmation, true);
assert(order.summary.includes("1 item(ns)"));

assert.throws(() => actions.preview({ type: "apagar.tudo", payload: {} }), /não autorizada/i);

const pluginSource = fs.readFileSync(
  path.join(__dirname, "..", "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "SimplificaLocalAiPlugin.kt"),
  "utf8"
);
const artifactManagerSource = fs.readFileSync(
  path.join(__dirname, "..", "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "ai", "ModelArtifactManager.kt"),
  "utf8"
);
const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const uiComponentsSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "assistant-core", "ui-contracts", "components.js"),
  "utf8"
);

assert.doesNotMatch(pluginSource, /override fun load|callProvider|br\.com\.simplifica\.ai\.provider/,
  "O plugin próprio não pode depender de provider externo nem iniciar download ao carregar");
assert.match(pluginSource, /fun installModel\([\s\S]*ModelArtifactManager\.install/,
  "O download deve existir apenas como ação explícita do usuário");
assert.match(artifactManagerSource, /setEnabled\(context, true\)[\s\S]*enqueueUniqueWork/,
  "A instalação autorizada deve ativar e enfileirar o download próprio");
assert.match(appSource, /preaquecerAssistenteIa3d[\s\S]*provider\.prewarm\(\)/,
  "A assistente deve aquecer o provider pela abstração AiProvider");
assert.match(appSource, /setTimeout\(\(\) => preaquecerAssistenteIa3d\(\), 450\)/,
  "O aquecimento deve começar em segundo plano na abertura do sistema");
assert.match(appSource, /result\?\.compatible === false[\s\S]*incompatibilityReason/,
  "O atalho da IA deve avisar quando o aparelho não é compatível");
assert.match(appSource, /Baixar modelo de IA\?[\s\S]*Agora não[\s\S]*provider\.installModel/,
  "O download deve mostrar tamanho e pedir confirmação explícita");
assert.match(appSource, /secretariaIaChatMessages\.slice\(-12\)[\s\S]*conversation/,
  "O chat deve enviar uma janela da conversa recente para a IA");
assert.match(appSource, /simplifica:ia-chat:[\s\S]*localStorage\.setItem/,
  "O chat deve preservar a memória por conta no armazenamento local");
assert.match(appSource, /Caixa: entradas[\s\S]*Itens com estoque baixo:/,
  "Consultas da IA devem transformar dados do domínio em resposta visível");
assert.match(uiComponentsSource, /class="ai-chat-dialog[^"\n]*"[\s\S]*id="\$\{this\.escapeAttr\(inputId\)\}"/,
  "Os componentes reutilizáveis devem oferecer painel e caixa de texto integrada");
assert.match(appSource, /ui\?\.composer\(/,
  "O chat do Simplifica deve integrar a caixa de texto reutilizável");
assert.match(appSource, /ui\?\.panel\(/,
  "O chat do Simplifica deve integrar o painel reutilizável");
assert.match(appSource, /function ouvirMensagemAssistenteIa\(\)[\s\S]*plugin\.listen\(\)/,
  "O chat deve oferecer entrada por voz");
assert.match(appSource, /Somente você pode autorizar[\s\S]*Confirmar pedido[\s\S]*Quero alterar/,
  "O usuário deve confirmar explicitamente antes de salvar um pedido");
assert.match(appSource, /const APP_VERSION = "1\.0\.35";[\s\S]*const APP_VERSION_CODE = 63;/,
  "A versão pública da entrega deve ser 1.0.35, código 63");

console.log("Contrato da IA do Simplifica 3D validado.");
