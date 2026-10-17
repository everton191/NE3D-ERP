(function attachPdfDocumentDelivery(global) {
  "use strict";

  function imageType(dataUrl) {
    return String(dataUrl || "").includes("image/jpeg") ? "JPEG" : "PNG";
  }

  function addBrandWatermark(doc, width, height, dataUrl = "", context = {}) {
    if (!context.hasProfessionalPdfAccess() || !dataUrl) return;
    try {
      const type = imageType(dataUrl);
      if (context.appConfig.brandWatermarkEnabled !== false && doc.GState && doc.setGState) {
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        doc.addImage(dataUrl, type, width / 2 - 36, height / 2 - 36, 72, 72);
        doc.setGState(new doc.GState({ opacity: 1 }));
      }
    } catch (_) {
      try { doc.addImage(dataUrl, imageType(dataUrl), width / 2 - 28, height / 2 - 28, 56, 56); } catch (_) {}
    }
  }

  function addPdfBackground(doc, width, height, dataUrl = "", context = {}) {
    if (!context.hasProfessionalPdfAccess() || !dataUrl) return;
    try {
      const type = imageType(dataUrl);
      if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 0.12 }));
      doc.addImage(dataUrl, type, 0, 0, width, height);
      if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
    } catch (error) {
      context.logDiagnostic("pdf", "Fundo personalizado não aplicado", error.message);
    }
  }

  function addFreeWatermark(doc, width, height, context = {}) {
    if (context.hasProfessionalPdfAccess()) return;
    try {
      doc.setTextColor(180, 190, 205);
      doc.setFontSize(13);
      if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 0.18 }));
      doc.text("Simplifica 3D - Plano Free", width / 2, height / 2, { align: "center", angle: 35 });
      if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
    } catch (_) {
      doc.setTextColor(180, 190, 205);
      doc.setFontSize(10);
      doc.text("Simplifica 3D - Plano Free", width / 2, height - 10, { align: "center" });
    }
  }

  function arrayBufferToBase64(buffer, context = {}) {
    const bytes = new context.Uint8ArrayRef(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunkSize));
    }
    return context.btoaRef(binary);
  }

  async function ensureAndroidStoragePermission(context = {}) {
    const plugin = context.windowRef.Capacitor?.Plugins?.SimplificaFiles;
    if (!plugin?.requestStoragePermission) return true;
    try {
      const result = await plugin.requestStoragePermission();
      if (result?.granted === false) {
        context.alertRef("Permissão de armazenamento negada. Não foi possível salvar o PDF.");
        return false;
      }
    } catch (error) {
      context.logDiagnostic("pdf", "Permissão de armazenamento falhou", error.message || error);
      return false;
    }
    return true;
  }

  async function savePdfAndroidNative(doc, fileName, context = {}) {
    const plugin = context.windowRef.Capacitor?.Plugins?.SimplificaFiles;
    if (!plugin?.savePdf) return false;
    try {
      if (!(await ensureAndroidStoragePermission(context))) return false;
      const base64 = arrayBufferToBase64(doc.output("arraybuffer"), context);
      const result = await plugin.savePdf({ fileName, base64 });
      if (result?.ok) {
        context.alertRef("PDF salvo em Downloads/Simplifica3D.");
        context.logHistory("PDF", "PDF salvo no Android: " + fileName);
        return true;
      }
    } catch (error) {
      context.logDiagnostic("pdf", "Salvamento Android falhou", error.message || error);
      context.alertRef("Não foi possível salvar em Downloads. Verifique a permissão de arquivos e tente baixar novamente.");
    }
    return false;
  }

  async function printPdfAndroidNative(doc, fileName, title = "Pedido Simplifica 3D", context = {}) {
    const plugin = context.windowRef.Capacitor?.Plugins?.SimplificaFiles;
    if (!plugin?.printPdf) return false;
    const base64 = arrayBufferToBase64(doc.output("arraybuffer"), context);
    const result = await plugin.printPdf({ fileName, base64, title, jobName: title });
    if (result?.ok) {
      context.logHistory("Impressão", "Diálogo de impressão aberto no Android: " + fileName);
      return true;
    }
    return false;
  }

  async function printPdfBrowser(doc, fileName, title = "Pedido Simplifica 3D", context = {}) {
    const { windowRef, documentRef, urlRef, setTimeoutRef, clearTimeoutRef } = context;
    if (typeof windowRef.print !== "function") return false;
    const blob = doc.output("blob");
    let url = "";
    let iframe = null;
    let loadTimer = null;
    let cleanupTimer = null;
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeoutRef(loadTimer);
      clearTimeoutRef(cleanupTimer);
      try { iframe?.remove(); } catch (_) {}
      try { if (url) urlRef.revokeObjectURL(url); } catch (_) {}
    };
    try {
      url = urlRef.createObjectURL(blob);
      iframe = documentRef.createElement("iframe");
      iframe.title = title;
      Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0", opacity: "0" });
      const loaded = new Promise((resolve, reject) => {
        loadTimer = setTimeoutRef(() => reject(new Error("Tempo esgotado ao preparar impressão.")), 8000);
        iframe.onload = () => { clearTimeoutRef(loadTimer); resolve(true); };
        iframe.onerror = () => { clearTimeoutRef(loadTimer); reject(new Error("Não foi possível preparar o documento para impressão.")); };
        documentRef.body.appendChild(iframe);
        iframe.src = url;
      });
      await loaded;
      const printWindow = iframe.contentWindow;
      if (!printWindow?.print) throw new Error("Impressão não suportada neste navegador.");
      printWindow.focus();
      printWindow.print();
      cleanupTimer = setTimeoutRef(cleanup, 60000);
      context.logHistory("Impressão", "Diálogo de impressão aberto no navegador: " + fileName);
      return true;
    } catch (error) { cleanup(); throw error; }
  }

  async function saveOrSharePdf(doc, fileName, title = "Pedido Simplifica 3D", context = {}) {
    const safeName = String(fileName || "pedido-simplifica-3d.pdf").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").toLowerCase();
    const blob = doc.output("blob");
    if (context.isAndroid() && await savePdfAndroidNative(doc, safeName, context)) return true;
    if (context.isAndroid() && typeof context.FileRef !== "undefined" && context.navigatorRef.canShare && context.navigatorRef.share) {
      try {
        const file = new context.FileRef([blob], safeName, { type: "application/pdf" });
        if (context.navigatorRef.canShare({ files: [file] })) {
          await context.navigatorRef.share({ files: [file], title, text: "PDF do pedido" });
          return true;
        }
      } catch (error) {
        if (error?.name === "AbortError") return true;
        context.logDiagnostic("pdf", "Compartilhamento Android falhou", error.message || error);
      }
    }
    try { doc.save(safeName); return true; } catch (error) {
      let url = "";
      let link = null;
      try {
        url = context.urlRef.createObjectURL(blob);
        link = context.documentRef.createElement("a");
        link.href = url; link.download = safeName; link.rel = "noopener";
        context.documentRef.body.appendChild(link); link.click(); link.remove();
        context.setTimeoutRef(() => context.urlRef.revokeObjectURL(url), 60000);
        return true;
      } catch (fallbackError) {
        try { link?.remove(); } catch (_) {}
        try { if (url) context.urlRef.revokeObjectURL(url); } catch (_) {}
        context.logDiagnostic("pdf", "Download do PDF falhou", fallbackError.message || error.message);
        context.alertRef("Não foi possível baixar o PDF neste dispositivo. Tente abrir pelo navegador ou baixar novamente pelo pedido.");
        return false;
      }
    }
  }

  async function printOrOfferPdf(doc, fileName, title = "Pedido Simplifica 3D", context = {}) {
    const safeName = String(fileName || "pedido-simplifica-3d.pdf").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").toLowerCase();
    try {
      const printed = context.isAndroidNativeApp()
        ? await printPdfAndroidNative(doc, safeName, title, context)
        : await printPdfBrowser(doc, safeName, title, context);
      if (printed) return true;
    } catch (error) { context.logDiagnostic("pdf", "Impressão falhou", error.message || error); }
    return context.confirmRef("Nenhuma impressora disponível. Deseja gerar PDF?")
      ? saveOrSharePdf(doc, safeName, title, context)
      : false;
  }

  function hexToRgb(hex) {
    const clean = String(hex || "").replace("#", "");
    const value = clean.length === 3 ? clean.split("").map((letter) => letter + letter).join("") : clean.padEnd(6, "0").slice(0, 6);
    return [parseInt(value.slice(0, 2), 16) || 0, parseInt(value.slice(2, 4), 16) || 168, parseInt(value.slice(4, 6), 16) || 107];
  }

  function rgb(color, fallback = "#00d8c8", context = {}) {
    return hexToRgb(context.limitPdfColor(color, fallback));
  }

  function setFill(doc, color, fallback, context = {}) {
    doc.setFillColor(...rgb(color, fallback, context));
  }

  function setDraw(doc, color, fallback, context = {}) {
    doc.setDrawColor(...rgb(color, fallback, context));
  }

  function setText(doc, color, fallback, context = {}) {
    doc.setTextColor(...rgb(color, fallback, context));
  }

  function setFont(doc, size, style = "normal") {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  }

  function getTheme(context = {}) {
    const id = context.normalizePdfTheme();
    const base = context.pdfThemePresets[id] || context.pdfThemePresets.clean_white;
    return { id, ...base, background: "#ffffff", panel: "#ffffff", panelAlt: "#f4f4f4", tableStripe: "#f7f7f7", primary: "#111111", secondary: "#111111", line: "#b8b8b8", text: "#111111", muted: "#111111", headerText: "#111111" };
  }

  function materialText(item = {}, context = {}) {
    const materials = context.getOrderItemMaterials(item);
    const primaryMaterial = materials[0] || {};
    const materialId = item.materialId || primaryMaterial.materialId || "";
    const material = context.getStockMaterial(materialId);
    const parts = [item.material || primaryMaterial.nome || material?.nome || materialId, item.cor || material?.cor || primaryMaterial.cor, item.impressora || item.printer || item.printerModel]
      .map((value) => String(value || "").trim()).filter(Boolean);
    return parts.length ? parts.join(" • ") : "-";
  }

  function documentType(order = {}) {
    const status = String(order?.status || order?.situacao || "").toLowerCase();
    return /pago|produção|producao|conclu|entreg/.test(status) ? "PEDIDO" : "ORÇAMENTO";
  }

  function drawCommercialBackground(doc, width, height, theme, context = {}) {
    setFill(doc, theme.background, "#06131b", context);
    doc.rect(0, 0, width, height, "F");
    if (/dark|neon/.test(theme.id)) {
      const [red, green, blue] = rgb(theme.secondary, "#00d8c8", context);
      doc.setDrawColor(red, green, blue);
      for (let index = 0; index < 16; index += 1) {
        const y = 28 + index * 2.2;
        doc.setLineWidth(0.12);
        doc.line(74 + index * 1.7, y, width - 12, y + 32 + Math.sin(index) * 8);
      }
    } else {
      setFill(doc, theme.panelAlt, "#eef6f8", context);
      doc.rect(0, 0, width, 38, "F");
    }
  }

  function drawCard(doc, x, y, width, height, theme, fill = "", context = {}) {
    setFill(doc, fill || theme.panel, "#0a2230", context);
    setDraw(doc, theme.line, "#0bb8b1", context);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, width, height, 2, 2, "FD");
  }

  function drawLimitedText(doc, text, x, y, width, maxLines, lineHeight = 4.4) {
    const lines = doc.splitTextToSize(String(text || ""), width).slice(0, maxLines);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  }

  function drawCommercialHeader(doc, header, context = {}) {
    const { width, margin, theme, company, date, documentNumber, documentType, brandDataUrl } = header;
    const logoSize = 14;
    if (brandDataUrl) {
      try { doc.addImage(brandDataUrl, imageType(brandDataUrl), margin, 10, logoSize, logoSize); }
      catch (error) { context.logDiagnostic("pdf", "Logo não aplicada no orçamento", error.message); }
    } else {
      setFill(doc, theme.primary, "#00d8c8", context); doc.roundedRect(margin, 10, logoSize, logoSize, 3, 3, "F");
      setText(doc, theme.headerText, "#111111", context); setFont(doc, 10, "bold"); doc.text("S3D", margin + logoSize / 2, 19, { align: "center" });
    }
    const textX = margin + logoSize + 4;
    setText(doc, theme.headerText, "#ffffff", context); setFont(doc, 16, "bold"); doc.text(company.nome, textX, 16);
    setText(doc, theme.secondary, "#00d8c8", context); setFont(doc, 10, "bold"); doc.text(company.subtitulo || "Impressão 3D", textX, 22);
    setText(doc, theme.muted, "#b8c6d4", context); setFont(doc, 8);
    [company.whatsapp ? `WhatsApp: ${company.whatsapp}` : "", company.telefone ? `Telefone: ${company.telefone}` : "", company.email ? `E-mail: ${company.email}` : "", company.site ? `Site: ${company.site}` : "", company.instagram ? `Instagram: ${company.instagram}` : "", company.endereco ? `${company.endereco}${company.cidadeEstado ? " - " + company.cidadeEstado : ""}` : company.cidadeEstado, company.cnpj ? `CNPJ: ${company.cnpj}` : ""].filter(Boolean).slice(0, 4).forEach((line, index) => doc.text(line, margin + 1, 31 + index * 4));
    setText(doc, theme.headerText, "#ffffff", context); setFont(doc, 20, "bold"); doc.text(documentType, width - margin, 16, { align: "right" });
    setDraw(doc, theme.muted, "#b8c6d4", context); doc.roundedRect(width - margin - 52, 20, 52, 8, 1.5, 1.5, "S");
    setText(doc, theme.secondary, "#00d8c8", context); setFont(doc, 10, "bold"); doc.text(`Nº ${documentNumber}`, width - margin - 26, 25.5, { align: "center" });
    setText(doc, theme.text, "#f5fbff", context); setFont(doc, 8);
    const validity = Math.max(1, Number(context.appConfig.quoteValidityDays) || 7);
    const validityDate = new Date(date.getTime() + validity * 86400000);
    [["Data de emissão", date.toLocaleDateString("pt-BR")], ["Validade do orçamento", `${validityDate.toLocaleDateString("pt-BR")} (${validity} dias)`], ["Prazo de produção", context.appConfig.productionDeadlineText || "A combinar"], ["Forma de pagamento", context.appConfig.paymentTerms || "A combinar"]].forEach(([label, value], index) => {
      const y = 32 + index * 8;
      setText(doc, theme.secondary, "#00d8c8", context); setFont(doc, 8, "bold"); doc.text(label + ":", width - margin - 52, y);
      setText(doc, theme.text, "#f5fbff", context); setFont(doc, 8); doc.text(String(value), width - margin - 52, y + 3.8);
    });
  }

  function drawCommercialFooter(doc, footer, context = {}) {
    const { width, height, margin, theme, company, page, totalPages } = footer;
    drawCard(doc, margin, height - 22, width - margin * 2, 12, theme, theme.panelAlt, context);
    setText(doc, theme.text, "#f5fbff", context); setFont(doc, 9, "bold");
    const footerText = String(context.appConfig.documentFooter || "Obrigado pela preferência!").trim();
    const signature = String(context.appConfig.pdfSignature || "Qualquer dúvida, estamos à disposição.").trim();
    doc.text(footerText, margin + 6, height - 15);
    if (signature && signature.toLocaleLowerCase("pt-BR") !== footerText.toLocaleLowerCase("pt-BR")) { setText(doc, theme.muted, "#b8c6d4", context); setFont(doc, 7.5); doc.text(signature, margin + 6, height - 10.5); }
    const contact = company.instagram || company.whatsapp || company.email || company.site || "";
    if (contact) doc.text(contact, width - margin - 6, height - 14, { align: "right" });
    doc.text(`Página ${page}/${totalPages}`, width - margin - 6, height - 9.5, { align: "right" });
  }

  const api = Object.freeze({ imageType, addBrandWatermark, addPdfBackground, addFreeWatermark, saveOrSharePdf, printOrOfferPdf, arrayBufferToBase64, ensureAndroidStoragePermission, savePdfAndroidNative, printPdfAndroidNative, printPdfBrowser, hexToRgb, rgb, setFill, setDraw, setText, setFont, getTheme, materialText, documentType, drawCommercialBackground, drawCard, drawLimitedText, drawCommercialHeader, drawCommercialFooter });
  global.SimplificaPdfDocumentDelivery = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
