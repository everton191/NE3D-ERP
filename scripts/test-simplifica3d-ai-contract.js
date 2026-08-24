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
const modelInstallerSource = fs.readFileSync(
  path.join(__dirname, "..", "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "ai", "FunctionGemmaModelInstaller.kt"),
  "utf8"
);
const toolRuntimeSource = fs.readFileSync(
  path.join(__dirname, "..", "android", "app", "src", "main", "java", "br", "com", "ne3d", "erp", "ai", "FunctionGemmaToolRuntime.kt"),
  "utf8"
);
const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const updateManifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "downloads", "update.json"), "utf8"));
const uiComponentsSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "assistant-core", "ui-contracts", "components.js"),
  "utf8"
);

assert.doesNotMatch(pluginSource, /callProvider|br\.com\.simplifica\.ai\.provider|fun interpret\(/,
  "O plugin próprio não pode depender de provider externo nem oferecer chat genérico");
assert.match(pluginSource, /fun importFunctionGemma\([\s\S]*FunctionGemmaModelInstaller\.install/,
  "A importação do GGUF deve existir apenas como ação explícita do aplicativo");
assert.match(modelInstallerSource, /EXPECTED_SHA256[\s\S]*EXPECTED_BYTES = 291_557_856L[\s\S]*\.part[\s\S]*renameTo\(target\)/,
  "A instalação deve validar tamanho e SHA-256 antes do rename atômico");
assert.match(toolRuntimeSource, /operationType in setOf\("READ", "PREPARE"\)[\s\S]*FUNCTIONGEMMA_WRITE_TOOL_BLOCKED/,
  "O runtime deve bloquear ferramentas WRITE antes da inferência");
assert.match(pluginSource, /writeExposed", 0/,
  "A ponte Android deve manter WRITE_EXPOSED em zero");
assert.match(appSource, /preaquecerAssistenteIa3d[\s\S]*provider\.prewarm\(\)/,
  "A assistente deve aquecer o provider pela abstração AiProvider");
assert.match(appSource, /async function abrirSecretariaIaLocal3d[\s\S]*await preaquecerAssistenteIa3d\(\{ renderChat: true \}\)/,
  "O aquecimento deve ocorrer fora da abertura do ERP, ao abrir a assistente");
assert.match(appSource, /result\?\.compatible === false[\s\S]*incompatibilityReason/,
  "O atalho da IA deve avisar quando o aparelho não é compatível");
assert.doesNotMatch(appSource, /renderUiSection\(\{ id: "assistente-ia"/,
  "A configuração não deve exibir seletor ou menu de outros modelos");
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
assert.match(appSource, new RegExp(`const APP_VERSION = "${updateManifest.version.replace(/\./g, "\\.")}";[\\s\\S]*const APP_VERSION_CODE = ${updateManifest.versionCode};`),
  "A versão pública da IA deve acompanhar downloads/update.json");

console.log("Contrato da IA do Simplifica 3D validado.");
