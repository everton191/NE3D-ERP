(function attachSimplificaDateFormatters(global) {
  "use strict";
  function parseDate(value) { const date = value instanceof Date ? value : new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
  function formatShort(value = "", { normalize = null } = {}) { if (!value) return ""; const date = typeof normalize === "function" ? normalize(value, null) : parseDate(value); return date ? date.toLocaleDateString("pt-BR") : String(value); }
  function formatDateTime(value = "") { if (!value) return "—"; const date = parseDate(value); return date ? date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : String(value); }
  function formatRelative(value, now = Date.now()) {
    const timestamp = typeof value === "number" ? value : (Date.parse(value || 0) || 0);
    if (!timestamp) return "Não registrado";
    const diff = Math.max(0, Number(now) - timestamp);
    if (diff < 60 * 1000) return "Atualizado agora";
    const minutes = Math.floor(diff / (60 * 1000));
    if (minutes < 60) return `Atualizado há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Atualizado há ${hours} h`;
    return new Date(timestamp).toLocaleString("pt-BR");
  }
  function formatDeadline(value = "") {
    if (!value) return "";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("pt-BR");
  }
  function formatDocumentNumber(orderId, date = new Date(), now = Date.now()) {
    const year = date.getFullYear();
    const number = String(orderId || now).replace(/\D/g, "").slice(-6).padStart(6, "0");
    return `${year}-${number}`;
  }
  function formatUpdatedAt(value) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return "Aguardando atualização";
    return `Atualizado às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const api = Object.freeze({ formatShort, formatDateTime, formatRelative, formatDeadline, formatDocumentNumber, formatUpdatedAt });
  global.SimplificaDateFormatters = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
