(function attachCustomerNormalizers(global) {
  "use strict";

  function normalizePhoneBR(phone = "") {
    let digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0") && (digits.length === 11 || digits.length === 12)) digits = digits.slice(1);
    if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) digits = "55" + digits;
    if (!digits.startsWith("55") || (digits.length !== 12 && digits.length !== 13)) return "";
    return "+" + digits;
  }

  function normalizarTelefoneWhatsapp(numero = "") {
    return normalizePhoneBR(numero).replace(/^\+/, "");
  }

  function normalizarTelefoneBusca(numero = "") {
    return String(numero || "").replace(/\D/g, "");
  }

  function formatPhoneForPdf(value = "") {
    const normalized = normalizePhoneBR(value);
    const digits = normalized.replace(/\D/g, "");
    if (!digits) return String(value || "").trim();
    const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;
    if (withoutCountry.length === 11) return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`;
    if (withoutCountry.length === 10) return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`;
    return normalized;
  }

  function normalizarSugestaoClienteTexto(valor = "", helpers = {}) {
    const texto = String(valor || "").toLowerCase();
    const removerAcentos = typeof helpers.removerAcentos === "function" ? helpers.removerAcentos : (item) => String(item).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return removerAcentos(texto).replace(/[^a-z0-9\s@.+-]/g, " ").replace(/\s+/g, " ").trim();
  }

  function normalizarSugestaoCliente(item = {}) {
    const name = String(item.name || item.nome || item.displayName || "").trim();
    const phones = Array.isArray(item.phones) ? item.phones : [item.phone || item.telefone || item.number || ""];
    const emails = Array.isArray(item.emails) ? item.emails : [item.email || item.mail || ""];
    const phone = normalizarTelefoneWhatsapp(phones.find(Boolean) || "");
    const email = String(emails.find(Boolean) || "").trim();
    if (!name && !phone && !email) return null;
    return {
      id: String(item.id || item.contactId || `${item.source || "app"}-${name}-${phone}-${email}`).slice(0, 140),
      source: item.source || "app_client", name, phone, email,
      phones: phones.map((valor) => normalizarTelefoneWhatsapp(valor)).filter(Boolean),
      emails: emails.map((valor) => String(valor || "").trim()).filter(Boolean),
      usageCount: Number(item.usageCount || item.pedidos || 0) || 0,
      lastUsedAt: item.lastUsedAt || item.updated_at || item.atualizadoEm || item.createdAt || ""
    };
  }
  function rotuloStatusCliente(status = "") {
    return ({ active: "ativo", overdue: "atrasado", blocked: "bloqueado", inactive: "inativo", cancelled: "cancelado", anonymized: "anonimizado" })[status] || status || "ativo";
  }

  function mergeSuggestions(lists = [], helpers = {}) {
    const normalizeText = helpers.normalizeText || normalizarSugestaoClienteTexto;
    const map = new Map();
    (Array.isArray(lists) ? lists.flat() : []).filter(Boolean).forEach((item) => {
      const key = normalizeText(`${item.name}|${item.phone || ""}|${item.email || ""}`);
      if (!key) return;
      const current = map.get(key);
      map.set(key, current ? { ...current, ...item, usageCount: Math.max(current.usageCount || 0, item.usageCount || 0), source: current.source === "app_client" ? current.source : item.source } : item);
    });
    return Array.from(map.values());
  }
  function rankSuggestions(suggestions = [], query = "", helpers = {}) {
    const normalizeText = helpers.normalizeText || normalizarSugestaoClienteTexto;
    const normalizePhone = helpers.normalizePhone || normalizarTelefoneBusca;
    const term = normalizeText(query); const phoneTerm = normalizePhone(query);
    return (Array.isArray(suggestions) ? suggestions : []).map((item) => {
      const name = normalizeText(item.name); const phone = normalizePhone(item.phone || item.phones?.[0] || "");
      let score = Number(item.usageCount || 0) * 2;
      if (!term && !phoneTerm) score = 0;
      if (phoneTerm.length >= 2 && phone.includes(phoneTerm)) score += phone.startsWith(phoneTerm) ? 95 : 70;
      if (term) { if (name === term) score += 120; else if (name.startsWith(term)) score += 95; else if (name.split(/\s+/).some((part) => part.startsWith(term))) score += 82; else if (name.includes(term)) score += 64; else { let pos = 0; for (const letter of term) { pos = name.indexOf(letter, pos); if (pos < 0) return { ...item, _score: score }; pos += 1; } score += 35; } }
      if (item.source === "app_client") score += 18; if (item.source === "phone_contact") score += 8; if (item.source === "recent") score += 12;
      return { ...item, _score: score };
    }).filter(Boolean).filter((item) => item._score > 0).sort((a, b) => b._score - a._score || normalizeText(a.name).localeCompare(normalizeText(b.name))).slice(0, 8);
  }

  const api = Object.freeze({ normalizePhoneBR, normalizarTelefoneWhatsapp, normalizarTelefoneBusca, formatPhoneForPdf, normalizarSugestaoClienteTexto, normalizarSugestaoCliente, rotuloStatusCliente, mergeSuggestions, rankSuggestions });
  global.SimplificaCustomerNormalizers = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
