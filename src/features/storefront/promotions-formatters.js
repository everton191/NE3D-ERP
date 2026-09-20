(function attachStorefrontPromotionFormatters(global) {
  "use strict";
  const getCategoryLabel = (category = "") => ({ impressoras: "Impressoras", filamentos: "Filamentos", resinas: "Resinas", materiais: "Materiais" })[category] || "Produtos 3D";
  const normalizarTemaLojaOnline = () => "light";
  const formatOfferTime = (item = {}, now = Date.now()) => {
    const expiresAt = Date.parse(String(item.expiresAt || ""));
    if (Number.isFinite(expiresAt) && expiresAt > now) {
      const remainingMinutes = Math.max(1, Math.ceil((expiresAt - now) / 60000));
      if (remainingMinutes < 60) return `Termina em ${remainingMinutes} min`;
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      if (hours < 24) return `Termina em ${hours}h${minutes ? ` ${minutes}min` : ""}`;
      const days = Math.floor(hours / 24);
      return `Termina em ${days} ${days === 1 ? "dia" : "dias"}`;
    }
    const checkedAt = Date.parse(String(item.updatedAt || item.publishedAt || ""));
    if (!Number.isFinite(checkedAt)) return "Validade não informada";
    const elapsedMinutes = Math.max(0, Math.floor((now - checkedAt) / 60000));
    if (elapsedMinutes < 1) return "Verificada agora";
    if (elapsedMinutes < 60) return `Verificada há ${elapsedMinutes} min`;
    return `Verificada há ${Math.floor(elapsedMinutes / 60)}h`;
  };
  const api = Object.freeze({ getCategoryLabel, normalizarTemaLojaOnline, formatOfferTime });
  global.SimplificaStorefrontPromotionFormatters = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
