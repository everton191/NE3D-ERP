(function attachLfmDevelopmentCorpus(global) {
  "use strict";

  const rows = [
    ["acha a ficha da cliente Renata", "customers.search", "customers.search", { query: "Renata" }, "customers"],
    ["tem cadastro do Paulo?", "customers.search", "customers.search", { query: "Paulo" }, "customers"],
    ["cliente ana silva", "customers.search", "customers.search", { query: "ana silva" }, "customers"],
    ["localiza o contato do Marcos", "customers.search", "customers.search", { query: "Marcos" }, "customers"],
    ["cadstro da Juliana", "customers.search", "customers.search", { query: "Juliana" }, "customers"],
    ["quem é o cliente Roberto Lima", "customers.search", "customers.search", { query: "Roberto Lima" }, "customers"],

    ["quais máquinas estão cadastradas?", "printers.list", "printers.list", {}, "printers"],
    ["mostra as impressoras disponíveis", "printers.list", "printers.list", {}, "printers"],
    ["tem alguma printer online?", "printers.list", "printers.list", {}, "printers"],
    ["ver impressora da bancada", "printers.list", "printers.list", { query: "bancada" }, "printers"],
    ["impresoras ativas", "printers.list", "printers.list", { status: "ativas" }, "printers"],
    ["como estão as máquinas 3d", "printers.list", "printers.list", {}, "printers"],

    ["o que está na fila hoje?", "production.list", "production.list", {}, "production"],
    ["trabalhos aguardando impressão", "production.list", "production.list", { status: "aguardando" }, "production"],
    ["tem peça sendo produzida?", "production.list", "production.list", {}, "production"],
    ["acompanhar os jobs em andamento", "production.list", "production.list", { status: "em andamento" }, "production"],
    ["fila 3d agora", "production.list", "production.list", {}, "production"],
    ["produçao atrasada", "production.list", "production.list", { status: "atrasada" }, "production"],

    ["quanto vendemos esta semana?", "reports.sales", "", { period: "esta semana" }, "reports-sales"],
    ["quero o total de vendas de setembro", "reports.sales", "", { period: "setembro" }, "reports-sales"],
    ["vendas dos últimos 30 dias", "reports.sales", "", { period: "últimos 30 dias" }, "reports-sales"],
    ["relatorio mensal de pedidos vendidos", "reports.sales", "", { period: "mensal" }, "reports-sales"],
    ["qto vendeu ontem", "reports.sales", "", { period: "ontem" }, "reports-sales"],
    ["desempenho comercial do trimestre", "reports.sales", "", { period: "trimestre" }, "reports-sales"],

    ["resultado financeiro deste mês", "reports.financial", "", { period: "este mês" }, "reports-financial"],
    ["receitas e despesas do ano", "reports.financial", "", { period: "ano" }, "reports-financial"],
    ["como ficou o financeiro em agosto?", "reports.financial", "", { period: "agosto" }, "reports-financial"],
    ["balanço dos últimos sete dias", "reports.financial", "", { period: "últimos sete dias" }, "reports-financial"],
    ["relat financ semana", "reports.financial", "", { period: "semana" }, "reports-financial"],
    ["lucro e gastos do trimestre", "reports.financial", "", { period: "trimestre" }, "reports-financial"],

    ["qual é o movimento do caixa hoje?", "cash.get_status", "cash.get_status", { period: "hoje" }, "cash"],
    ["tem dinheiro disponível no caixa?", "cash.get_status", "cash.get_status", {}, "cash"],
    ["consulta o fechamento parcial", "cash.get_status", "cash.get_status", {}, "cash"],
    ["situação financeira do caixa agora", "cash.get_status", "cash.get_status", {}, "cash"],
    ["cx de hoje como tá", "cash.get_status", "cash.get_status", { period: "hoje" }, "cash"],
    ["entradas e saídas do caixa nesta manhã", "cash.get_status", "cash.get_status", { period: "esta manhã" }, "cash"],

    ["qual ônibus passa no centro?", "", "", {}, "no-match"],
    ["faz uma música pra mim", "", "", {}, "no-match"],
    ["quem ganhou o jogo ontem", "", "", {}, "no-match"],
    ["me lembra disso amanhã", "", "", {}, "no-match"],
    ["e aquele negócio?", "", "", {}, "no-match"],
    ["pode resolver pra mim", "", "", {}, "no-match"]
  ];

  const cases = Object.freeze(rows.map((row, index) => Object.freeze({
    id: `dev-${String(index + 1).padStart(3, "0")}`,
    rawInput: row[0], expectedIntent: row[1], expectedTool: row[2], expectedFields: Object.freeze(row[3]),
    family: row[4], context: Object.freeze({}), activeWorkflow: "", criticalFields: Object.freeze([]), expectedStatus: row[1] ? "MATCH" : "NO_MATCH", split: "dev"
  })));
  const api = Object.freeze({ datasetId: "lfm-dev-v1", cases });
  global.SimplificaLfmDevelopmentCorpus = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
