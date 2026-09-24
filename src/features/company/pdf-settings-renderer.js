(function attachPdfSettingsRenderer(global) {
  "use strict";
  function renderPdfSettingsSections(options = {}, context = {}) {
    const { group = "empresa", open = false } = options;
    const { appConfig, escaparAttr, escaparHtml, limitarCorPdf, normalizarAppearanceSettings, renderAcaoSalvarSecaoEmpresa, renderPdfModeloPreview, renderUiSection } = context;
    const corSecundariaAtual = limitarCorPdf(appConfig.pdfSecondaryColor || normalizarAppearanceSettings().secondary_color || "#00d8c8");
    const pdfBgAtual = appConfig.pdfBackgroundDataUrl || "";
    return `
      ${renderUiSection({ id: `${group}-pdf`, title: "PDF", subtitle: "Modelo salvo, identidade, cabeçalho, rodapé e Pix", icon: "▣", open: group === "empresa" ? false : open, group, content: `
        ${renderPdfModeloPreview()}
        <div class="pdf-settings-group"><strong>Identidade do documento</strong>
        <div class="sync-grid"><label class="field"><span>Tema do PDF</span><select id="pdfThemeConfig"><option value="clean_white" selected>Novo padrão claro</option></select></label><label class="field"><span>Cor secundária do PDF</span><input id="pdfSecondaryColorConfig" type="color" value="${escaparAttr(corSecundariaAtual)}"></label><div class="metric"><span>Logo</span><strong>Usa Empresa</strong></div><div class="metric"><span>Pix</span><strong>Usa Empresa</strong></div></div></div>
        <div class="pdf-settings-group"><strong>Cabeçalho e condições</strong><div class="sync-grid"><label class="field"><span>Subtítulo da empresa no PDF</span><input id="pdfHeaderTextConfig" maxlength="60" value="${escaparAttr(appConfig.pdfHeaderText || "")}" placeholder="Ex.: Impressão 3D sob medida"></label><label class="field"><span>Validade padrão (dias)</span><input id="quoteValidityDaysConfig" type="number" min="1" max="90" step="1" value="${Number(appConfig.quoteValidityDays) || 7}"></label><label class="field"><span>Forma de pagamento</span><input id="paymentTermsConfig" value="${escaparAttr(appConfig.paymentTerms || "")}" placeholder="PIX / Transferência"></label><label class="field"><span>Prazo padrão</span><input id="productionDeadlineTextConfig" value="${escaparAttr(appConfig.productionDeadlineText || "")}" placeholder="Até 5 dias úteis"></label><label class="field"><span>Mensagem padrão</span><textarea id="pdfDefaultMessageConfig" rows="2" maxlength="220" placeholder="Peças produzidas com impressão 3D de alta qualidade.">${escaparHtml(appConfig.pdfDefaultMessage || "")}</textarea></label><label class="field"><span>Observação padrão</span><textarea id="pdfDefaultNotesConfig" rows="3" maxlength="420" placeholder="Condições, prazos e orientações comerciais.">${escaparHtml(appConfig.pdfDefaultNotes || "")}</textarea></label></div></div>
        <div class="pdf-settings-group"><strong>Rodapé, Pix e fundo</strong><div class="sync-grid"><label class="field"><span>Assinatura final</span><input id="pdfSignatureConfig" maxlength="160" value="${escaparAttr(appConfig.pdfSignature || appConfig.documentFooter || "")}" placeholder="Qualquer dúvida, estamos à disposição."></label><label class="field"><span>Instrução Pix no PDF</span><input id="pixInstructionConfig" maxlength="120" value="${escaparAttr(appConfig.pixInstruction || "")}" placeholder="Após o pagamento, envie o comprovante pelo WhatsApp."></label><label class="field"><span>Fundo/marca d'água do PDF</span><input id="pdfBackgroundFileConfig" class="file-input" type="file" accept="image/*" onchange="prepararPreviewImagemPersonalizacao(this, 'pdf-background')"></label><div class="metric"><span>Fundo personalizado</span><strong>${pdfBgAtual ? "Salvo" : "Padrão"}</strong></div></div>${appConfig.pdfBackgroundDataUrl ? `<button class="btn ghost" type="button" onclick="removerFundoPdf()">Remover fundo do PDF</button>` : ""}</div>
        ${renderAcaoSalvarSecaoEmpresa(`${group}-pdf`, "Salvar PDF")}
      ` })}
    `;
  }
  const api = Object.freeze({ renderPdfSettingsSections });
  global.SimplificaPdfSettingsRenderer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
