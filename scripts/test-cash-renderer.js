"use strict";
const assert = require("node:assert/strict");
const renderer = require("../src/features/cash/cash-renderer.js");

const esc = (value) => String(value ?? "");
let view = "movimentos";
const windowFake = { __caixaBusca: "", __extratoFinanceiroFiltros: {}, __caixaCardAtivo: "" };
const movimentos = [
  { id: 1, tipo: "entrada", valor: 120.5, data: "2026-09-20T10:00:00.000Z", payment_method: "pix", paymentMethod: "pix", descricao: "Venda balcao" },
  { id: 2, tipo: "saida", valor: 30, data: "2026-09-20T11:00:00.000Z", payment_method: "dinheiro", paymentMethod: "dinheiro", descricao: "Sangria material" },
  { id: 3, tipo: "entrada", valor: 10, data: "2026-09-19T09:00:00.000Z", payment_method: "cartao", paymentMethod: "cartao", descricao: "Venda cartao", cancelado: true, motivoCancelamento: "erro" }
];
const info = { label: "Este mes", start: new Date(2026, 8, 1), end: new Date(2026, 9, 1), endInclusive: new Date(2026, 8, 30) };
const nomesMetodo = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartao" };
const context = {
  caixa: movimentos,
  pedidos: [],
  window: windowFake,
  document: { getElementById: () => null },
  navigator: {},
  alert: () => {},
  escaparHtml: esc,
  escaparAttr: esc,
  normalizarTextoBusca: (value) => esc(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
  descricaoCaixa: (movimento) => esc(movimento.descricao || ""),
  movimentoCaixaCancelado: (movimento) => Boolean(movimento.cancelado),
  obterDataMovimentoCaixa: (movimento) => new Date(movimento.data || 0),
  dataDentroIntervalo: () => true,
  formatarMoeda: (value) => `R$ ${(Number(value) || 0).toFixed(2)}`,
  formatarDataCurta: () => "20/09",
  hojeIsoData: () => "2026-09-20",
  renderUiIcon: () => "",
  renderIconeAcaoPedido: (icone) => icone,
  renderMenuHandleIcon: () => "",
  renderMiniSparklineDashboard: () => "",
  renderContextualAdvancedToggle: () => "",
  renderizarPreservandoScroll: () => {},
  mostrarToast: () => {},
  planoPermiteRecurso: () => true,
  mostrarBloqueioRecursoPro: () => {},
  imprimirOuOferecerPdf: () => {},
  salvarOuCompartilharPdf: () => {},
  isContextAdvancedVisible: () => true,
  permitirVisualizacaoOperacionalBasica: () => true,
  caixaModoSimplesAtivo: () => false,
  getCaixaViewAtiva: () => view,
  getCaixaPeriodoAtivo: () => "hoje",
  getCaixaFiltroAtivo: () => "todos",
  getPeriodoCustomizadoCaixa: () => ({ inicio: "", fim: "" }),
  getInfoPeriodoCaixa: () => info,
  getMovimentosCaixaDaConta: () => movimentos,
  filtrarMovimentosCaixaPorPeriodo: (lista) => lista,
  calcularTotaisCaixa: () => ({ saldo: 100.5, entradas: 130.5, saidas: 30 }),
  calcularTotaisCaixaPeriodo: () => ({ saldo: 100.5, entradas: 130.5, saidas: 30 }),
  calcularResumoSessaoCaixa: () => ({ porForma: {}, entradas: 0, saidas: 0, expectedBalance: 0, ultimaMovimentacao: null }),
  getSessaoCaixaAtual: () => null,
  getMetodosPagamentoCaixa: () => [
    { id: "pix", name: "Pix", type: "digital" },
    { id: "dinheiro", name: "Dinheiro", type: "cash" },
    { id: "cartao", name: "Cartao", type: "card" }
  ],
  normalizarMetodoPagamentoCaixa: (value) => ({ id: value, name: value, type: "cash" }),
  getMetodoPagamentoMovimento: (movimento) => {
    const id = movimento.payment_method || movimento.paymentMethod || "pix";
    return { id, name: nomesMetodo[id] || "Pix", type: "cash" };
  },
  getUsuarioAtual: () => ({ email: "ana@loja.com", nome: "Ana", empresa: "Loja" }),
  clienteDoPedido: (pedido) => pedido.cliente || "",
  totalPedido: (pedido) => Number(pedido.total) || 0,
  getDataPedidoLocal: (pedido) => new Date(pedido.data || 0),
  pedidoContaParaAnalytics: () => false,
  calcularCustosPedidoAnalytics: () => ({ cost: 0 })
};

const esperadas = [
  "renderCaixa", "renderCaixaOverview", "renderCaixaViewTabs", "renderCaixaMobileTopbar",
  "filtrarMovimentosCaixa", "filtrarMovimentosCaixaPorBusca", "getResumoMetodoMovimentoCaixa",
  "renderExtratoFinanceiro", "renderLinhaExtratoFinanceiro", "textoExtratoFinanceiro",
  "exportarExtratoFinanceiro", "compartilharExtratoFinanceiro", "classificarOrigemMovimentoCaixa",
  "renderStatusSessaoCaixaSimples", "getTotaisCaixaPorForma", "getExtratoFinanceiroAtual"
];
for (const nome of esperadas) {
  assert.equal(typeof renderer[nome], "function", `export ausente: ${nome}`);
}

const htmlMovimentos = renderer.renderCaixa(context);
assert.match(htmlMovimentos, /data-ui3-screen="caixa"/);
assert.match(htmlMovimentos, /Venda balcao/);
assert.match(htmlMovimentos, /Sangria material/);
assert.match(htmlMovimentos, /cash-view-tabs/);

assert.equal(
  renderer.getResumoMetodoMovimentoCaixa({ tipo: "entrada", payment_method: "pix" }, context),
  "Entrada • Pix"
);
assert.equal(renderer.classificarOrigemMovimentoCaixa({ tipo: "saida", descricao: "Sangria de caixa" }, context), "retirada");
assert.equal(renderer.classificarOrigemMovimentoCaixa({ tipo: "saida", descricao: "retirada cafe" }, context), "retirada");
assert.equal(renderer.classificarOrigemMovimentoCaixa({ tipo: "entrada", descricao: "venda" }, context), "entrada manual");
assert.equal(renderer.classificarOrigemMovimentoCaixa({ tipo: "saida", descricao: "luz" }, context), "despesa");

const filtrados = renderer.filtrarMovimentosCaixa(movimentos, "entradas", null, context);
assert.equal(filtrados.length, 1, "filtro entradas deve ignorar saidas e cancelados");
const todos = renderer.filtrarMovimentosCaixa(movimentos, "todos", null, context);
assert.equal(todos.length, 3);

windowFake.__caixaBusca = "sangria";
const porBusca = renderer.filtrarMovimentosCaixaPorBusca(movimentos, undefined, context);
assert.equal(porBusca.length, 1, "busca do caixa deve reduzir aos movimentos com termo");
assert.equal(porBusca[0].id, 2);
windowFake.__caixaBusca = "";

const overview = renderer.renderCaixaOverview({ saldo: 100.5 }, movimentos, true, "<div>linhas-caixa</div>", "<div>controles-caixa</div>", context);
assert.match(overview, /cash-experience/);
assert.match(overview, /controles-caixa/);
assert.match(overview, /Movimentações recentes/);
assert.match(overview, /cash-mobile-search-button/);
const overviewAberto = renderer.renderCaixaOverview({ saldo: 100.5 }, movimentos, true, "<div>linhas-caixa</div>", "<div>controles-caixa</div>", {
  ...context,
  getSessaoCaixaAtual: () => ({ id: "s1", status: "open", openedAt: "2026-09-20T08:00:00.000Z", openingBalance: 0 }),
  window: { ...windowFake, __caixaCardAtivo: "historico" }
});
assert.match(overviewAberto, /linhas-caixa/, "com card de historico ativo o card aberto deve exibir as linhas de movimento");

view = "extrato";
const htmlExtrato = renderer.renderCaixa(context);
assert.match(htmlExtrato, /Extrato Financeiro/);
assert.match(htmlExtrato, /Total entradas/);
const painel = renderer.renderExtratoFinanceiro(context);
assert.match(painel, /statement-panel/);
assert.match(painel, /Nenhuma movimentação no período selecionado\.|statement-row/, "extrato deve renderizar lista ou vazio");

const linha = renderer.renderLinhaExtratoFinanceiro({
  data: new Date("2026-09-20T10:00:00.000Z"), descricao: "Venda balcao", origem: "Entrada manual",
  valorAssinado: 120.5, valor: 120.5, tipo: "entrada", responsavel: "Ana", status: "confirmado",
  saldoAcumulado: 120.5, cliente: "", pedidoId: ""
}, context);
assert.match(linha, /Venda balcao/);
assert.match(linha, /R\$ 120\.50/);

const texto = renderer.textoExtratoFinanceiro(context);
assert.match(texto, /Extrato Financeiro - Simplifica 3D/);
assert.match(texto, /Entradas: R\$/);

const atual = renderer.getExtratoFinanceiroAtual(context);
assert.equal(atual.itens.length, 3);
assert.ok(atual.resumo.entradas > 0 && atual.resumo.saidas > 0);

const topbar = renderer.renderCaixaMobileTopbar(context);
assert.ok(topbar.includes("abrirCardCaixaRapido('historico');setTimeout"), "topbar do Caixa deve abrir historico e focar busca");

assert.equal(renderer.renderStatusSessaoCaixaSimples(context), "", "sem sessao e sem modo simples o status nao renderiza");

view = "movimentos";

async function testStatementShareRecovery() {
  function fixture(navigator = {}, extra = {}) {
    const state = { alerts: [], toasts: [], blocked: [], copied: [] };
    return {
      state,
      context: {
        ...context,
        navigator,
        alert: (value) => state.alerts.push(value),
        mostrarToast: (...args) => state.toasts.push(args),
        mostrarBloqueioRecursoPro: (...args) => state.blocked.push(args),
        ...extra
      }
    };
  }

  for (const navigator of [{}, { clipboard: {} }, { clipboard: { writeText: true } }]) {
    const f = fixture(navigator);
    assert.equal(await renderer.compartilharExtratoFinanceiro(f.context), false,
      "sem API de cópia utilizável não pode afirmar que o extrato foi copiado");
    assert.deepEqual(f.state.toasts, [], "sem cópia não pode exibir sucesso");
    assert.deepEqual(f.state.alerts, [texto], "deve manter o fallback com o texto completo");
  }

  const denied = Object.assign(new Error("Permissão negada"), { name: "NotAllowedError" });
  const rejected = fixture({ clipboard: { writeText: async () => { throw denied; } } });
  assert.equal(await renderer.compartilharExtratoFinanceiro(rejected.context), false);
  assert.deepEqual(rejected.state.toasts, []);
  assert.deepEqual(rejected.state.alerts, [texto]);

  let resolveCopy;
  const pending = fixture({ clipboard: { writeText: (value) => {
    pending.state.copied.push(value);
    return new Promise((resolve) => { resolveCopy = resolve; });
  } } });
  let copyFinished = false;
  const copying = renderer.compartilharExtratoFinanceiro(pending.context).then((result) => {
    copyFinished = true;
    return result;
  });
  await Promise.resolve();
  assert.equal(copyFinished, false, "deve aguardar a confirmação da API de cópia");
  assert.deepEqual(pending.state.toasts, [], "cópia pendente não pode anunciar sucesso");
  resolveCopy();
  assert.equal(await copying, true);
  assert.deepEqual(pending.state.copied, [texto]);
  assert.equal(pending.state.toasts.length, 1);
  assert.equal(pending.state.toasts[0][1], "sucesso");
  assert.deepEqual(pending.state.alerts, []);

  const nativeCalls = [];
  const native = fixture({ share: async (value) => { nativeCalls.push(value); } });
  assert.equal(await renderer.compartilharExtratoFinanceiro(native.context), true);
  assert.deepEqual(nativeCalls, [{ title: "Extrato Financeiro Simplifica 3D", text: texto }]);
  assert.deepEqual(native.state.alerts, []);
  assert.deepEqual(native.state.toasts, []);

  let copiedAfterAbort = false;
  const cancelled = fixture({
    share: async () => { throw Object.assign(new Error("Cancelado"), { name: "AbortError" }); },
    clipboard: { writeText: async () => { copiedAfterAbort = true; } }
  });
  assert.equal(await renderer.compartilharExtratoFinanceiro(cancelled.context), true,
    "cancelamento mantém o contrato sem acionar outra ação");
  assert.equal(copiedAfterAbort, false, "cancelamento não deve copiar o texto sem solicitação");
  assert.deepEqual(cancelled.state.alerts, []);
  assert.deepEqual(cancelled.state.toasts, []);

  const recovered = fixture({
    share: async () => { throw denied; },
    clipboard: { writeText: async (value) => { recovered.state.copied.push(value); } }
  });
  assert.equal(await renderer.compartilharExtratoFinanceiro(recovered.context), true);
  assert.deepEqual(recovered.state.copied, [texto]);
  assert.equal(recovered.state.toasts.length, 1);
  assert.deepEqual(recovered.state.alerts, []);

  const unavailable = fixture({ share: async () => { throw denied; } });
  assert.equal(await renderer.compartilharExtratoFinanceiro(unavailable.context), false);
  assert.deepEqual(unavailable.state.alerts, [texto]);
  assert.deepEqual(unavailable.state.toasts, []);

  let blockedAction = false;
  const blocked = fixture({ share: async () => { blockedAction = true; } }, { planoPermiteRecurso: () => false });
  assert.equal(await renderer.compartilharExtratoFinanceiro(blocked.context), false);
  assert.equal(blockedAction, false);
  assert.equal(blocked.state.blocked.length, 1);
  assert.deepEqual(blocked.state.alerts, []);
  assert.deepEqual(blocked.state.toasts, []);
}

testStatementShareRecovery().then(() => {
  console.log("Cash renderer: caixa, busca, visões, extrato, linha, texto, topbar e 10 cenários de compartilhamento validados.");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
