(function attachOrdersOperationalHistory(global) {
  "use strict";
  function getOrderOperationalEventDate(value) {
    const date = value instanceof Date ? value : new Date(value || 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function formatOrderOperationalEventDate(value) {
    const date = getOrderOperationalEventDate(value);
    if (!date) return "Data não informada";
    return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  function getOrderOperationalEvents(order = {}, dependencies = {}) {
    const { auditLogs = [], history = [], productionJobs = [], productionEvents = [], customerForOrder, formatMoney, orderTotal, orderStatusLabel, productionStatusLabel, orderCashMovements, cashDescription } = dependencies;
    const orderId = String(order.id || "");
    if (!orderId) return [];
    const events = [];
    const hasCancellationAudit = (Array.isArray(auditLogs) ? auditLogs : []).some((record) => record?.acao === "pedido_cancelado" && String(record?.detalhes?.pedidoId || record?.detalhes?.orderId || record?.detalhes?.order_id || "") === orderId);
    const add = (event = {}) => {
      const date = getOrderOperationalEventDate(event.data);
      if (!date) return;
      events.push({ id: String(event.id || `${event.tipo || "evento"}-${date.getTime()}-${events.length}`), tipo: String(event.tipo || "pedido"), titulo: String(event.titulo || "Atualização do pedido"), detalhe: String(event.detalhe || "").trim(), data: date.toISOString() });
    };
    add({ id: `pedido-criado-${orderId}`, tipo: "pedido", titulo: "Pedido criado", detalhe: `${customerForOrder(order)} • ${formatMoney(orderTotal(order))}`, data: order.criadoEm || order.created_at || order.data });
    (Array.isArray(auditLogs) ? auditLogs : []).forEach((record) => {
      const details = record.detalhes || {};
      if (String(details.pedidoId || details.orderId || details.order_id || "") !== orderId || ["pedido_edicao_solicitada", "pedido_cancelamento_solicitado", "pedido_excluido"].includes(record.acao)) return;
      const labels = { pedido_editado: "Pedido editado", pedido_cancelado: "Pedido cancelado", pedido_status_alterado: "Status do pedido alterado" };
      if (!labels[record.acao] && !String(details.descricao || "").trim()) return;
      add({ id: record.id, tipo: "pedido", titulo: labels[record.acao] || "Pedido atualizado", detalhe: record.acao === "pedido_cancelado" ? String(details.motivo || order.cancelReason || order.cancel_reason || "Cancelamento confirmado") : !labels[record.acao] ? String(details.descricao || "") : details.statusNovo ? `${orderStatusLabel(details.statusAnterior)} → ${orderStatusLabel(details.statusNovo)}` : (details.status ? `Status: ${orderStatusLabel(details.status)}` : ""), data: record.data });
    });
    (Array.isArray(history) ? history : []).forEach((record) => {
      const metadata = record.metadata || {};
      if (String(metadata.order_id || metadata.orderId || metadata.pedidoId || "") !== orderId || (metadata.event_type === "order_cancelled" && hasCancellationAudit)) return;
      add({ id: record.id, tipo: metadata.area === "stock" ? "estoque" : "pedido", titulo: metadata.area === "stock" ? "Movimentação de estoque" : record.acao || "Pedido", detalhe: record.detalhes || metadata.reason || "", data: record.data });
    });
    const jobs = (Array.isArray(productionJobs) ? productionJobs : []).filter((job) => String(job.orderId || job.order_id || "") === orderId);
    const jobIds = new Set(jobs.map((job) => String(job.id || "")));
    jobs.forEach((job) => add({ id: `producao-${job.id}`, tipo: "producao", titulo: `Produção: ${productionStatusLabel(job.status)}`, detalhe: `${job.itemName || job.item_name || "Item"}${job.productionCode || job.production_code ? ` • ${job.productionCode || job.production_code}` : ""}`, data: job.updated_at || job.releasedAt || job.released_at || job.created_at }));
    (Array.isArray(productionEvents) ? productionEvents : []).forEach((event) => {
      const jobId = String(event.productionJobId || event.production_job_id || "");
      if (String(event.orderId || event.order_id || "") !== orderId && !jobIds.has(jobId)) return;
      add({ id: event.id, tipo: "producao", titulo: event.newStatus || event.new_status ? `Produção: ${productionStatusLabel(event.newStatus || event.new_status)}` : "Evento de produção", detalhe: event.note || event.eventType || event.event_type || "", data: event.created_at });
    });
    (orderCashMovements(order) || []).forEach((movement) => add({ id: `caixa-${movement.id}`, tipo: "caixa", titulo: String(movement.tipo || "").toLowerCase() === "saida" ? "Saída vinculada" : "Recebimento registrado", detalhe: `${formatMoney(Number(movement.valor) || 0)} • ${cashDescription(movement)}`, data: movement.criadoEm || movement.created_at || movement.data }));
    const unique = new Map();
    events.forEach((event) => { const repeatedUpdate = ["Pedido atualizado", "Pedido editado"].includes(event.titulo); const key = `${event.tipo}|${event.titulo}|${event.detalhe}|${repeatedUpdate ? "" : event.data}`; if (!unique.has(key)) unique.set(key, event); });
    return [...unique.values()].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 20);
  }
  const api = Object.freeze({ getOrderOperationalEventDate, formatOrderOperationalEventDate, getOrderOperationalEvents });
  global.SimplificaOrdersOperationalHistory = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
