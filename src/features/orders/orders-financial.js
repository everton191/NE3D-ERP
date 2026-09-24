(function attachOrdersFinancial(global) {
  "use strict";

  function parseOrderMoney(value, fallback = 0) {
    if (value === null || value === undefined || String(value).trim() === "") return fallback;
    const text = String(value).trim().replace(/[^\d,.-]/g, "");
    const normalized = text.includes(",") && text.lastIndexOf(",") > text.lastIndexOf(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : text.replace(/,/g, "");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  }

  function orderItemsSubtotal(source = {}, context = {}) {
    const items = Array.isArray(source) ? source : context.normalizeItems(source);
    return items.reduce((sum, item) => {
      const total = parseOrderMoney(item.total, NaN);
      if (Number.isFinite(total) && total > 0) return sum + total;
      const unitValue = Math.max(0, parseOrderMoney(item.valor ?? item.precoVenda, 0));
      return sum + unitValue * Math.max(1, Number(item.qtd) || 1);
    }, 0);
  }

  function orderDiscountValue(order = {}) {
    return Math.max(0, parseOrderMoney(order?.desconto ?? order?.discount ?? order?.valor_desconto, 0));
  }

  function orderDownPaymentValue(order = {}) {
    return Math.max(0, parseOrderMoney(
      order?.down_payment ?? order?.valor_entrada ?? order?.entradaPaga ?? order?.entrada_pago ?? order?.entrada ?? order?.sinal,
      0
    ));
  }

  function orderFinancialStatusLabel(status = "pendente") {
    const labels = { pendente: "Pendente", pago_parcial: "Pago parcial", parcial: "Pago parcial", pago_total: "Pago total", quitado: "Pago total" };
    return labels[String(status || "pendente").toLowerCase()] || "Pendente";
  }

  function orderFinancialStatusClass(status = "pendente") {
    const value = String(status || "pendente").toLowerCase();
    if (["pago_total", "quitado"].includes(value)) return "order-status-paid";
    if (["pago_parcial", "parcial"].includes(value)) return "order-status-waiting";
    return "order-status-open";
  }

  function orderFinancialSummary(order = {}, context = {}) {
    const suppliedSubtotal = parseOrderMoney(order?.subtotalItens ?? order?.subtotal_itens, NaN);
    const subtotal = Number.isFinite(suppliedSubtotal) && suppliedSubtotal >= 0 ? suppliedSubtotal : orderItemsSubtotal(order, context);
    const discount = orderDiscountValue(order);
    const extraFee = Math.max(0, parseOrderMoney(order?.taxaExtra ?? order?.extraFee ?? order?.taxa_extra, 0));
    const suppliedTotal = parseOrderMoney(order?.total ?? order?.valor ?? order?.totalPedido, NaN);
    const calculatedTotal = Math.max(0, subtotal + extraFee - discount);
    const total = Number.isFinite(suppliedTotal) && suppliedTotal >= 0 && (suppliedTotal > 0 || subtotal === 0) ? suppliedTotal : calculatedTotal;
    const downPayment = orderDownPaymentValue(order);
    const remaining = Math.max(0, total - downPayment);
    const downPaymentExceedsTotal = downPayment > total + 0.009;
    const financialStatus = downPayment <= 0 ? "pendente" : remaining <= 0 ? "pago_total" : "pago_parcial";
    return { subtotal, desconto: discount, taxaExtra: extraFee, total, entrada: downPayment, restante: remaining, entradaMaiorQueTotal: downPaymentExceedsTotal, statusFinanceiro: financialStatus };
  }

  function distributeExtraFeeIntoCustomerItems(items = [], extraFee = 0, context = {}) {
    const normalizedItems = context.normalizeItems(items);
    const fee = Math.max(0, parseOrderMoney(extraFee, 0));
    if (!fee || !normalizedItems.length) return normalizedItems;
    const subtotal = orderItemsSubtotal(normalizedItems, context);
    if (subtotal <= 0) return normalizedItems;
    let remainingFee = fee;
    return normalizedItems.map((item, index) => {
      const quantity = Math.max(1, Number(item.qtd) || 1);
      const originalTotal = Math.max(0, parseOrderMoney(item.total, 0));
      const share = index === normalizedItems.length - 1 ? remainingFee : Math.round(fee * (originalTotal / subtotal) * 100) / 100;
      remainingFee = Math.max(0, remainingFee - share);
      const customerTotal = Math.max(0, originalTotal + share);
      return { ...item, valor: customerTotal / quantity, total: customerTotal };
    });
  }

  function orderTotal(order = {}, context = {}) {
    return orderFinancialSummary(order, context).total;
  }

  function ordersFinancialSummary(orders = [], context = {}) {
    return (Array.isArray(orders) ? orders : []).reduce((summary, order) => {
      if (context.isCancelled(order)) return summary;
      const financial = orderFinancialSummary(order, context);
      summary.totalPedidos += financial.total;
      summary.valorRecebido += Math.min(financial.entrada, financial.total);
      summary.valorAReceber += financial.restante;
      if (financial.statusFinanceiro === "pago_total") summary.pagosTotal += 1;
      else if (financial.statusFinanceiro === "pago_parcial") summary.pagosParcial += 1;
      else summary.pendentes += 1;
      return summary;
    }, { totalPedidos: 0, valorRecebido: 0, valorAReceber: 0, pendentes: 0, pagosParcial: 0, pagosTotal: 0 });
  }

  const api = Object.freeze({ parseOrderMoney, orderItemsSubtotal, orderDiscountValue, orderDownPaymentValue, orderFinancialStatusLabel, orderFinancialStatusClass, orderFinancialSummary, distributeExtraFeeIntoCustomerItems, orderTotal, ordersFinancialSummary });
  global.SimplificaOrdersFinancial = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
