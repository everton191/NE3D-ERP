(function attachInventoryIdentifiers(global) {
  "use strict";

  function getCodigoNumericoMaterialEstoque(material = {}) {
    const codigo = Number(material.codigoEstoque ?? material.stock_code ?? material.codigo ?? 0);
    return Number.isInteger(codigo) && codigo > 0 ? codigo : 0;
  }

  function formatarCodigoMaterialEstoque(materialOuCodigo = 0) {
    const codigo = typeof materialOuCodigo === "object"
      ? getCodigoNumericoMaterialEstoque(materialOuCodigo)
      : Math.floor(Number(materialOuCodigo) || 0);
    return codigo > 0 ? `#${String(codigo).padStart(4, "0")}` : "#----";
  }

  function getProximoCodigoMaterialEstoque(lista = []) {
    return (Array.isArray(lista) ? lista : []).reduce((maior, material) => Math.max(maior, getCodigoNumericoMaterialEstoque(material)), 0) + 1;
  }

  function getCodigoExternoMaterialEstoque(material = {}) {
    return String(material.codigoExterno || material.external_code || material.barcode || material.qr_code || "").trim();
  }

  const api = Object.freeze({
    getCodigoNumericoMaterialEstoque,
    formatarCodigoMaterialEstoque,
    getProximoCodigoMaterialEstoque,
    getCodigoExternoMaterialEstoque
  });
  global.SimplificaInventoryIdentifiers = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
