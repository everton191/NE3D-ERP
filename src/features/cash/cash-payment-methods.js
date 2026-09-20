(function attachCashPaymentMethods(global) {
  "use strict";

  function normalizarMetodoPagamentoCaixa(value = "", helpers = {}) {
    const id = String(value || "").trim().toLowerCase();
    const getMetodosPagamentoCaixa = typeof helpers.getMetodosPagamentoCaixa === "function" ? helpers.getMetodosPagamentoCaixa : () => [];
    const methods = getMetodosPagamentoCaixa();
    return methods.find((method) => method.id === id || method.type === id) || methods[0] || { id: "dinheiro", name: "Dinheiro", type: "cash" };
  }

  function getMetodoPagamentoMovimento(movimento = {}, helpers = {}) {
    const normalize = typeof helpers.normalizarMetodoPagamentoCaixa === "function"
      ? helpers.normalizarMetodoPagamentoCaixa
      : (value) => normalizarMetodoPagamentoCaixa(value, helpers);
    return normalize(movimento.payment_method_type || movimento.paymentMethodType || movimento.paymentMethod || movimento.metodoPagamento || movimento.formaPagamento || movimento.payment_method_id || movimento.paymentMethodId || "dinheiro");
  }
  function calcularTotaisCaixa(movimentos = [], helpers = {}) {
    const cancelled = helpers.isCancelled || (() => false);
    return (Array.isArray(movimentos) ? movimentos : []).reduce((totals, movement) => {
      if (cancelled(movement)) { totals.cancelados += 1; return totals; }
      const value = Number(movement.valor) || 0;
      if (movement.tipo === "saida") totals.saidas += value;
      else totals.entradas += value;
      totals.saldo = totals.entradas - totals.saidas;
      return totals;
    }, { entradas: 0, saidas: 0, saldo: 0, cancelados: 0 });
  }
  function calcularSaldo(movimentos = [], helpers = {}) { return calcularTotaisCaixa(movimentos, helpers).saldo; }
  function calcularResumoSessaoCaixa(session = null, movements = [], helpers = {}) {
    const cancelled = helpers.isCancelled || (() => false), paymentMethod = helpers.getPaymentMethod || (() => ({ id: "dinheiro" })), dateOf = helpers.getMovementDate || (() => null);
    const summary = (Array.isArray(movements) ? movements : []).reduce((totals, movement) => {
      if (cancelled(movement)) { totals.cancelados += 1; return totals; }
      const value = Number(movement.valor) || 0, outgoing = String(movement.tipo || "").toLowerCase() === "saida";
      if (outgoing) totals.saidas += value;
      else { totals.entradas += value; const method = paymentMethod(movement); totals.porForma[method.id] = (totals.porForma[method.id] || 0) + value; }
      totals.saldo = totals.entradas - totals.saidas; totals.ultimaMovimentacao = dateOf(movement) || totals.ultimaMovimentacao;
      return totals;
    }, { entradas: 0, saidas: 0, saldo: 0, cancelados: 0, porForma: {}, ultimaMovimentacao: null });
    summary.expectedBalance = (Number(session?.openingBalance ?? session?.opening_balance) || 0) + summary.saldo;
    return summary;
  }

  const api = Object.freeze({ normalizarMetodoPagamentoCaixa, getMetodoPagamentoMovimento, calcularSaldo, calcularTotaisCaixa, calcularResumoSessaoCaixa });
  global.SimplificaCashPaymentMethods = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
