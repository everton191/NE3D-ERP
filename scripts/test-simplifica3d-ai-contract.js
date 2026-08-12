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
  path.join(__dirname, "..", "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "SimplificaLocalAiPlugin.java"),
  "utf8"
);
const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

assert.match(pluginSource, /void load\(\)[\s\S]*callProvider\("ensure_model"/,
  "O plugin deve solicitar o download automaticamente ao carregar");
assert.match(appSource, /if \(!status\.modelReady\)[\s\S]*await plugin\.ensureModel\(\)/,
  "O atalho da IA deve solicitar o modelo quando ele ainda não estiver pronto");
assert.match(appSource, /status\.compatible === false[\s\S]*incompatibilityReason/,
  "O atalho da IA deve avisar quando o aparelho não é compatível");
assert.match(appSource, /secretariaIaChatMessages\.slice\(-12\)[\s\S]*conversation/,
  "O chat deve enviar uma janela da conversa recente para a IA");
assert.match(appSource, /simplifica:ia-chat:[\s\S]*localStorage\.setItem/,
  "O chat deve preservar a memória por conta no armazenamento local");
assert.match(appSource, /Caixa: entradas[\s\S]*Itens com estoque baixo:/,
  "Consultas da IA devem transformar dados do domínio em resposta visível");
assert.match(appSource, /const APP_VERSION = "1\.0\.32";[\s\S]*const APP_VERSION_CODE = 60;/,
  "A versão pública da entrega deve ser 1.0.32, código 60");

console.log("Contrato da IA do Simplifica 3D validado.");
