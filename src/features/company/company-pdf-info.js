(function attachCompanyPdfInfo(global) {
  "use strict";

  function getCompanyPdfInfo(config = {}, context = {}) {
    const { formatPhoneForPdf, systemName = "" } = context;
    const instagram = String(config.companyInstagram || "").trim();
    return {
      nome: String(config.businessName || config.appName || systemName).trim(),
      subtitulo: String(config.pdfHeaderText || "Impressão 3D").trim(),
      whatsapp: formatPhoneForPdf(config.whatsappNumber || ""),
      telefone: formatPhoneForPdf(config.companyPhone || ""),
      email: String(config.companyEmail || "").trim(),
      instagram: instagram ? (instagram.startsWith("@") ? instagram : "@" + instagram) : "",
      endereco: String(config.companyAddress || "").trim(),
      cidadeEstado: String(config.companyCityState || config.pixCity || "").trim(),
      cnpj: String(config.companyCnpj || "").trim(),
      site: String(config.companyWebsite || "").trim(),
      pixKey: String(config.pixKey || "").trim(),
      pixReceiverName: String(config.pixReceiverName || config.businessName || "").trim()
    };
  }

  const api = Object.freeze({ getCompanyPdfInfo });
  global.SimplificaCompanyPdfInfo = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
