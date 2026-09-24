(function attachStorefrontPromotionFormatters(global) {
  "use strict";
  const getCategoryLabel = (category = "") => ({ impressoras: "Impressoras", filamentos: "Filamentos", resinas: "Resinas", materiais: "Materiais" })[category] || "Produtos 3D";
  const normalizarTemaLojaOnline = () => "light";
  const getStorefrontProductTypeLabel = (product = {}) => {
    if (String(product.stock_mode || "") === "unavailable") return "Indisponível";
    if (product.is_customizable) return "Personalizável";
    if (String(product.stock_mode || "") === "manual" && Number(product.stock_quantity || 0) > 0) return "Entrega imediata";
    return "Sob encomenda";
  };
  const getStorefrontStockLabel = (product = {}) => {
    const mode = String(product.stock_mode || "unlimited");
    if (mode === "manual") return product.stock_quantity === null || product.stock_quantity === undefined ? "Estoque manual" : `${Number(product.stock_quantity || 0)} un.`;
    if (mode === "erp_linked") return "Vinculado ao estoque";
    if (mode === "unavailable") return "Indisponível";
    return "Sob encomenda";
  };
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
  const api = Object.freeze({ getCategoryLabel, normalizarTemaLojaOnline, getStorefrontProductTypeLabel, getStorefrontStockLabel, formatOfferTime });
  global.SimplificaStorefrontPromotionFormatters = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
