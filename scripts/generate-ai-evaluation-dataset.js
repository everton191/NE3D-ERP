"use strict";
const fs = require("fs");
const path = require("path");

const domains = [
  { domain: "orders", screen: "orders.list", action: "orders.search", nouns: ["pedido", "encomenda", "ordem"], phrases: ["busca o {noun} do João", "mostra {noun}s atrasados", "procura o {noun} 843"] },
  { domain: "customers", screen: "orders.list", action: "customers.search", nouns: ["cliente", "comprador", "contato"], phrases: ["busca o {noun} João", "procura a Maria nos {noun}s", "acha o {noun} da oficina"] },
  { domain: "inventory", screen: "inventory.list", action: "inventory.search", nouns: ["PLA preto", "filamento azul", "rolo aberto"], phrases: ["quanto tem de {noun}", "procura {noun}", "mostra {noun} no estoque"] },
  { domain: "cash", screen: "cash.home", action: "cash.get_summary", nouns: ["caixa", "saldo", "movimento"], phrases: ["mostra o {noun} de hoje", "quanto entrou no {noun}", "resumo do {noun}"] },
  { domain: "calculator", screen: "calculator", action: "calculator.quote", nouns: ["peça", "impressão", "chaveiro"], phrases: ["calcula uma {noun} de 200 gramas", "quanto custa a {noun} de duas horas", "faz orçamento da {noun}"] },
  { domain: "production", screen: "production.queue", action: "production.list_queue", nouns: ["fila", "produção", "impressão"], phrases: ["mostra a {noun}", "o que tem na {noun}", "lista a {noun} pendente"] },
  { domain: "navigation", screen: "dashboard", action: "navigation.open", nouns: ["pedidos", "estoque", "calculadora"], phrases: ["abre {noun}", "vai para {noun}", "me leva até {noun}"] }
];
const categories = ["correct_action", "correct_arguments", "ambiguity", "missing_data", "negation", "question", "out_of_domain", "typo", "informal_pt_br", "short_multi_turn", "context_reference", "negative_tool_calling"];
const typos = (text, index) => index % 3 === 0 ? text.replace(/o/g, "u") : index % 3 === 1 ? text.replace(/a/g, "") : `${text} pfv`;
const rows = [];
for (const spec of domains) {
  for (let index = 0; index < 80; index += 1) {
    const category = categories[index % categories.length];
    const noun = spec.nouns[index % spec.nouns.length];
    let input = spec.phrases[index % spec.phrases.length].replace("{noun}", noun);
    let expectedAction = spec.action;
    let expectedDisposition = "CALL";
    const expectedArguments = {};
    if (category === "negation") { input = `não ${input}`; expectedAction = null; expectedDisposition = "NO_CALL"; }
    if (category === "question") { input = `se eu pedir para ${input}, o que acontece?`; expectedAction = null; expectedDisposition = "ANSWER_ONLY"; }
    if (category === "out_of_domain") { input = "qual a previsão do tempo amanhã?"; expectedAction = null; expectedDisposition = "OUT_OF_DOMAIN"; }
    if (category === "ambiguity") { input = `abre esse ${spec.domain === "inventory" ? "rolo" : "registro"}`; expectedAction = null; expectedDisposition = "ASK_CLARIFICATION"; }
    if (category === "missing_data" && ["calculator", "navigation"].includes(spec.domain)) { input = spec.domain === "calculator" ? "faz um orçamento" : "abre lá"; expectedAction = null; expectedDisposition = "ASK_CLARIFICATION"; }
    if (category === "negative_tool_calling" && spec.domain === "cash") { input = "quanto você acha que eu deveria retirar do caixa?"; expectedAction = null; expectedDisposition = "ANSWER_ONLY"; }
    if (category === "typo") input = typos(input, index);
    if (category === "informal_pt_br") input = `${input}, rapidão aí`;
    rows.push({ id: `${spec.domain}-${String(index + 1).padStart(3, "0")}`, domain: spec.domain, category, input, screen: spec.screen, expectedAction, expectedArguments, expectedDisposition, split: index < 56 ? "train_candidate" : index < 68 ? "validation" : "test_frozen" });
  }
}
const target = path.resolve(__dirname, "..", "training", "functiongemma", "evaluation.v1.jsonl");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
console.log(`Generated ${rows.length} evaluation cases at ${target}. No model was trained.`);
