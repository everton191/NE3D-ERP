(function attachCompanyPdfPreview(global) {
  "use strict";
  function renderPdfPreview(context = {}) {
    const { appConfig, escaparAttr, escaparHtml, getCompanyPdfInfo, getPdfThemeConfig, limitPdfColor } = context;
    const tema = getPdfThemeConfig();
    const corLinha = limitPdfColor(appConfig.pdfSecondaryColor || tema.line, tema.line);
    const empresaInfo = getCompanyPdfInfo();
    const empresa = empresaInfo.nome || "Minha empresa 3D";
    const subtitulo = empresaInfo.subtitulo || "Impressão 3D";
    const mensagem = appConfig.pdfDefaultMessage || "Peças produzidas com impressão 3D de alta qualidade.";
    const assinatura = appConfig.pdfSignature || appConfig.documentFooter || "Qualquer dúvida, estamos à disposição.";
    const contatos = [empresaInfo.whatsapp, empresaInfo.email, empresaInfo.site, empresaInfo.instagram].filter(Boolean).slice(0, 2).join(" • ");
    return `<div class="pdf-saved-preview-note"><strong>Modelo salvo neste dispositivo</strong><small>Esta cópia é atualizada depois de salvar qualquer alteração do PDF.</small></div><div class="pdf-model-preview" data-pdf-saved-preview="true" style="--pdf-preview-bg:${escaparAttr(tema.background)};--pdf-preview-panel:${escaparAttr(tema.panel)};--pdf-preview-line:${escaparAttr(corLinha)};--pdf-preview-text:${escaparAttr(tema.text)};--pdf-preview-muted:${escaparAttr(tema.muted)}"><div class="pdf-model-preview-page"><header><span class="pdf-model-preview-logo">${appConfig.companyLogoDataUrl ? `<img src="${escaparAttr(appConfig.companyLogoDataUrl)}" alt="Logo da empresa">` : "S3D"}</span><div><strong>${escaparHtml(empresa)}</strong><small>${escaparHtml(subtitulo)}</small></div><em>ORÇAMENTO</em></header>${contatos ? `<small class="pdf-model-preview-contact">${escaparHtml(contatos)}</small>` : ""}<div class="pdf-model-preview-meta"><span>Cliente</span><b>Cliente exemplo</b><span>Validade</span><b>${Number(appConfig.quoteValidityDays) || 7} dias</b><span>Pagamento</span><b>${escaparHtml(appConfig.paymentTerms || "A combinar")}</b><span>Produção</span><b>${escaparHtml(appConfig.productionDeadlineText || "A combinar")}</b></div><div class="pdf-model-preview-table"><div><b>Item</b><b>Qtd.</b><b>Total</b></div><div><span>Peça 3D personalizada</span><span>1</span><span>R$ 120,00</span></div><div><span>Acabamento</span><span>1</span><span>R$ 30,00</span></div></div><p>${escaparHtml(mensagem)}</p><footer><span>${escaparHtml(assinatura)}</span><strong>R$ 150,00</strong></footer></div></div>`;
  }
  const api = Object.freeze({ renderPdfPreview });
  global.SimplificaCompanyPdfPreview = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
