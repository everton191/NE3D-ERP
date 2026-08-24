"use strict";
const fs = require("fs");
const path = require("path");
const cases = [
  ["smoke-01", "abre os pedidos", "dashboard", "navigation.open", "CALL"],
  ["smoke-02", "vai para o estoque", "dashboard", "navigation.open", "CALL"],
  ["smoke-03", "busca o pedido do João", "orders.list", "orders.search", "CALL"],
  ["smoke-04", "me mostra pedidos atrasados", "orders.list", "orders.search", "CALL"],
  ["smoke-05", "qnt tem de PLA preto", "inventory.list", "inventory.search", "CALL"],
  ["smoke-06", "procura rolo azul", "inventory.list", "inventory.search", "CALL"],
  ["smoke-07", "quanto entrou hoje", "cash.home", "cash.get_summary", "CALL"],
  ["smoke-08", "qual o saldo do caixa", "cash.home", "cash.get_summary", "CALL"],
  ["smoke-09", "abre lá", "dashboard", null, "ASK_CLARIFICATION"],
  ["smoke-10", "faz um orçamento", "calculator", null, "ASK_CLARIFICATION"],
  ["smoke-11", "se eu cancelar esse pedido o que acontece?", "orders.details", null, "ANSWER_ONLY"],
  ["smoke-12", "quanto você acha que eu devo tirar do caixa?", "cash.home", null, "ANSWER_ONLY"],
  ["smoke-13", "cancela o pedido 42", "orders.details", null, "NO_CALL"],
  ["smoke-14", "dá baixa em 200 gramas", "inventory.list", null, "ASK_CLARIFICATION"],
  ["smoke-15", "fecha o cx", "cash.home", null, "NO_CALL"],
  ["smoke-16", "qual a previsão do tempo amanhã", "dashboard", null, "OUT_OF_DOMAIN"],
  ["smoke-17", "me mostra o pedido do João", "orders.list", "orders.search", "CALL"],
  ["smoke-18", "abre o ped do joao", "orders.list", "orders.search", "CALL"]
].map(([id, input, screen, expectedAction, expectedDisposition]) => ({ id, input, screen, expectedAction, expectedArguments: {}, expectedDisposition, writeAllowed: false, topKOnly: true }));
const target = path.resolve(__dirname, "..", "training", "functiongemma", "smoke.pt-br.v1.jsonl");
fs.writeFileSync(target, `${cases.map((item) => JSON.stringify(item)).join("\n")}\n`);
console.log(`Generated ${cases.length} PT-BR shadow smoke fixtures at ${target}.`);
