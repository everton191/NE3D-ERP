(function attachLfmValidationCorpus(global) {
  "use strict";

  const rows = [
    ["encontre a compradora Beatriz", "customers.search", "customers.search", { query: "Beatriz" }, "customers"],
    ["dados do cliente Felipe", "customers.search", "customers.search", { query: "Felipe" }, "customers"],
    ["cadastro em nome de Camila", "customers.search", "customers.search", { query: "Camila" }, "customers"],
    ["ver todas as máquinas de impressão", "printers.list", "printers.list", {}, "printers"],
    ["alguma impressora desligada?", "printers.list", "printers.list", { status: "desligada" }, "printers"],
    ["equipamentos 3d cadastrados", "printers.list", "printers.list", {}, "printers"],
    ["quais peças aguardam fabricação", "production.list", "production.list", { status: "aguardando" }, "production"],
    ["jobs da produção", "production.list", "production.list", {}, "production"],
    ["andamento das impressões", "production.list", "production.list", {}, "production"],
    ["faturamento da quinzena", "reports.sales", "", { period: "quinzena" }, "reports-sales"],
    ["quanto entrou em vendas hoje", "reports.sales", "", { period: "hoje" }, "reports-sales"],
    ["resumo comercial de julho", "reports.sales", "", { period: "julho" }, "reports-sales"],
    ["demonstrativo de receitas e custos", "reports.financial", "", {}, "reports-financial"],
    ["balanço financeiro semestral", "reports.financial", "", { period: "semestral" }, "reports-financial"],
    ["lucro do mês passado", "reports.financial", "", { period: "mês passado" }, "reports-financial"],
    ["quanto há no caixa agora", "cash.get_status", "cash.get_status", {}, "cash"],
    ["movimentação de caixa do turno", "cash.get_status", "cash.get_status", { period: "turno" }, "cash"],
    ["confere o caixa dessa tarde", "cash.get_status", "cash.get_status", { period: "tarde" }, "cash"],
    ["traduza bom dia para italiano", "", "", {}, "no-match"],
    ["liga a luz da sala", "", "", {}, "no-match"],
    ["qual é a moeda do Japão?", "", "", {}, "no-match"]
  ];

  const cases = Object.freeze(rows.map((row, index) => Object.freeze({
    id: `validation-${String(index + 1).padStart(3, "0")}`,
    rawInput: row[0], expectedIntent: row[1], expectedTool: row[2], expectedFields: Object.freeze(row[3]),
    family: row[4], context: Object.freeze({}), activeWorkflow: "", criticalFields: Object.freeze([]), expectedStatus: row[1] ? "MATCH" : "NO_MATCH", split: "validation"
  })));
  const api = Object.freeze({ datasetId: "lfm-validation-v1", cases });
  global.SimplificaLfmValidationCorpus = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
