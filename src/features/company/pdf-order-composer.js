(function attachPdfOrderComposer(global) {
  "use strict";

  async function generateOrderPdf(opcoes = {}, ctx = {}) {
  
    const modoDocumento = typeof opcoes === "string"
      ? opcoes
      : String(opcoes?.modo || opcoes?.acao || opcoes?.destino || "pdf");
    const deveImprimir = /imprim|print/i.test(modoDocumento);
    if (!(await ctx.verificarPermissaoPdfAntesGerar())) return;
    const itensValidos = ctx.normalizarItensPedido(ctx.getItensPedido())
      .map((item) => ctx.validarItemPedidoParaSalvar(item))
      .filter((validacao) => validacao.ok)
      .map((validacao) => validacao.item);
    if (itensValidos.length === 0) {
      ctx.alertRef("Adicione itens ao pedido antes de gerar o PDF");
      return;
    }
  
    const jsPDF = ctx.windowRef.jspdf?.jsPDF;
    if (!jsPDF) {
      ctx.alertRef("Biblioteca de PDF não carregou. Verifique a internet e tente novamente.");
      return;
    }
  
    const operacaoUX = ctx.iniciarOperacaoUX({
      name: "generate-pdf",
      title: deveImprimir ? "Preparando impressão" : "Gerando PDF",
      message: "Preparando dados...",
      context: "pedidos",
      button: opcoes?.button || null,
      buttonLoadingText: deveImprimir ? "Preparando..." : "Gerando PDF...",
      buttonSuccessText: deveImprimir ? "Enviado" : "PDF gerado",
      buttonErrorText: "Tentar novamente",
      steps: ["Preparando dados", "Montando relatório", "Gerando PDF", deveImprimir ? "Enviando para impressão" : "Finalizando download"],
      progress: 10
    });
    const dados = ctx.dadosPedidoAtual();
    const { cliente, total } = dados;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const empresa = ctx.getEmpresaPdfInfo();
    const tema = ctx.getPdfThemeConfig();
    const largura = doc.internal.pageSize.getWidth();
    const altura = doc.internal.pageSize.getHeight();
    const margem = 10;
    const agoraPdf = new Date();
    const pedidoId = ctx.getPedidoEditando()?.id || Date.now();
    const numeroDoc = ctx.numeroDocumentoPdf(pedidoId, agoraPdf);
    const tipoDoc = ctx.getTipoDocumentoPedidoPdf(ctx.getPedidoEditando());
    ctx.windowRef.__simplificaExportandoPdf = true;
    try {
      const marcaPdf = await ctx.obterMarcaPdfDataUrl();
      ctx.atualizarOperacaoUX(operacaoUX, { stepIndex: 1, message: "Montando relatório...", progress: 30 });
      const telefoneCliente = ctx.formatarTelefonePdf(await ctx.obterTelefoneWhatsappPedido(ctx.getPedidoEditando()));
      const emailCliente = dados.email || (ctx.getPedidoEditando() ? ctx.emailDoPedido(ctx.getPedidoEditando()) : "");
      const taxaExtraComercial = Math.max(0, Number(ctx.getPedidoEditando()?.taxaExtra || ctx.getPedidoEditando()?.extraFee || 0) || 0);
      const itensClientePdf = ctx.embutirTaxaExtraNosItensCliente(itensValidos, taxaExtraComercial);
      const resumoItens = itensClientePdf.reduce((soma, item) => soma + (Number(item.total) || 0), 0);
      const descontoComercial = Math.max(0, ctx.numeroMonetarioPedido(ctx.getDescontoPedido(), ctx.valorDescontoPedido(ctx.getPedidoEditando() || {})));
      const totalCalculadoCliente = Math.max(0, resumoItens - descontoComercial);
      const totalComercialBase = totalCalculadoCliente;
      const resumoFinanceiroPdf = ctx.calcularResumoFinanceiroPedido({
        itens: itensClientePdf,
        subtotalItens: resumoItens,
        taxaExtra: 0,
        extraFee: 0,
        taxa_extra: 0,
        desconto: descontoComercial,
        total: totalComercialBase,
        down_payment: dados.entrada ?? ctx.valorEntradaPedido(ctx.getPedidoEditando() || {})
      });
      const totalComercial = resumoFinanceiroPdf.total;
  
      const contextoCabecalho = { largura, altura, margem, tema, empresa, data: agoraPdf, numeroDoc, tipoDoc, marcaPdf };
      ctx.desenharFundoComercialPdf(doc, largura, altura, tema);
      ctx.desenharCabecalhoComercialPdf(doc, contextoCabecalho);
  
      let y = 66;
      ctx.desenharCartaoPdf(doc, margem, y, largura - margem * 2, 25, tema);
      ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
      ctx.setFontePdf(doc, 9, "bold");
      doc.text("DADOS DO CLIENTE", margem + 6, y + 7);
      ctx.setTextPdf(doc, tema.text, "#f5fbff");
      ctx.setFontePdf(doc, 8);
      doc.text("Nome:", margem + 6, y + 13);
      ctx.setFontePdf(doc, 10, "bold");
      doc.text(cliente || "Cliente não informado", margem + 6, y + 19);
      ctx.setFontePdf(doc, 8);
      doc.text("WhatsApp:", margem + 96, y + 13);
      ctx.setFontePdf(doc, 9, "bold");
      doc.text(telefoneCliente || "Não informado", margem + 96, y + 19);
      ctx.setFontePdf(doc, 8);
      doc.text("E-mail:", margem + 6, y + 23);
      doc.text(emailCliente || "Não informado", margem + 22, y + 23);
      doc.text("Endereço:", margem + 96, y + 23);
      doc.text(dados.endereco || ctx.getPedidoEditando()?.enderecoCliente || "Não informado", margem + 116, y + 23);
  
      y += 30;
      ctx.desenharCartaoPdf(doc, margem, y, largura - margem * 2, 8, tema, tema.panelAlt);
      ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
      ctx.setFontePdf(doc, 9, "bold");
      doc.text("ITENS DO ORÇAMENTO", margem + 6, y + 5.5);
      y += 12;
  
      const desenharTabelaCabecalho = () => {
        ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
        ctx.setFontePdf(doc, 7, "bold");
        doc.text("ITEM", margem + 4, y);
        doc.text("DESCRIÇÃO", margem + 28, y);
        doc.text("MATERIAL", margem + 90, y);
        doc.text("QTD.", largura - margem - 55, y, { align: "right" });
        doc.text("VALOR UNIT.", largura - margem - 34, y, { align: "right" });
        doc.text("SUBTOTAL", largura - margem - 4, y, { align: "right" });
        ctx.setDrawPdf(doc, tema.line, "#0bb8b1");
        doc.line(margem + 3, y + 4, largura - margem - 3, y + 4);
        y += 8;
      };
  
      const novaPagina = () => {
        doc.addPage();
        ctx.desenharFundoComercialPdf(doc, largura, altura, tema);
        y = 18;
        ctx.desenharCartaoPdf(doc, margem, y - 5, largura - margem * 2, 11, tema, tema.panelAlt);
        ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
        ctx.setFontePdf(doc, 9, "bold");
        doc.text("ITENS DO ORÇAMENTO (continuação)", margem + 6, y + 2);
        y += 14;
        desenharTabelaCabecalho();
      };
  
      desenharTabelaCabecalho();
      itensClientePdf.forEach((item, indice) => {
        const nomeLinhas = doc.splitTextToSize(String(item.nome || "Item"), 54).slice(0, 2);
        const obs = String(item.observacao || item.descricao || "").trim();
        const materialLinhas = doc.splitTextToSize(ctx.textoMaterialPdf(item), 28).slice(0, 2);
        const alturaLinha = Math.max(11, nomeLinhas.length * 4 + (obs ? 3.6 : 0) + 4, materialLinhas.length * 4 + 4);
        if (y + alturaLinha > altura - 34) novaPagina();
        if (indice % 2 === 1) {
          ctx.setFillPdf(doc, tema.tableStripe, "#0c2838");
          doc.rect(margem + 3, y - 5, largura - margem * 2 - 6, alturaLinha, "F");
        }
        ctx.setTextPdf(doc, tema.text, "#f5fbff");
        ctx.setFontePdf(doc, 9, "bold");
        doc.text(String(indice + 1).padStart(2, "0"), margem + 4, y);
        doc.text(nomeLinhas, margem + 28, y);
        if (obs) {
          ctx.setTextPdf(doc, tema.muted, "#b8c6d4");
          ctx.setFontePdf(doc, 7.5);
          doc.text(doc.splitTextToSize(obs, 54).slice(0, 1), margem + 28, y + 7.5);
        }
        ctx.setTextPdf(doc, tema.muted, "#b8c6d4");
        ctx.setFontePdf(doc, 8);
        doc.text(materialLinhas, margem + 90, y);
        ctx.setTextPdf(doc, tema.text, "#f5fbff");
        ctx.setFontePdf(doc, 8.5);
        doc.text(String(item.qtd || 1), largura - margem - 55, y, { align: "right" });
        doc.text(ctx.formatarMoeda(item.valor || 0), largura - margem - 34, y, { align: "right" });
        doc.text(ctx.formatarMoeda(item.total || 0), largura - margem - 4, y, { align: "right" });
        ctx.setDrawPdf(doc, tema.line, "#0bb8b1");
        doc.setLineWidth(0.12);
        doc.line(margem + 3, y + alturaLinha - 4, largura - margem - 3, y + alturaLinha - 4);
        y += alturaLinha;
      });
  
      if (y > 218) novaPagina();
      y += 3;
      const larguraObs = 98;
      const larguraResumo = largura - margem * 2 - larguraObs - 4;
      const resumoAltura = resumoFinanceiroPdf.entrada > 0 ? 60 : 36;
      ctx.desenharCartaoPdf(doc, margem, y, larguraObs, resumoAltura, tema);
      ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
      ctx.setFontePdf(doc, 9, "bold");
      doc.text("OBSERVAÇÕES", margem + 6, y + 8);
      ctx.setTextPdf(doc, tema.muted, "#b8c6d4");
      ctx.setFontePdf(doc, 7.5);
      const observacoes = [
        ctx.appConfig.pdfDefaultMessage,
        ctx.appConfig.pdfDefaultNotes,
        dados.observacao,
        dados.prazo ? `Prazo combinado: ${ctx.formatarPrazoWhatsapp(dados.prazo)}` : ""
      ].filter(Boolean).join("\n");
      ctx.textoLimitadoPdf(doc, observacoes || "Sem observações adicionais.", margem + 6, y + 16, larguraObs - 12, 5, 4.2);
  
      const resumoX = margem + larguraObs + 4;
      ctx.desenharCartaoPdf(doc, resumoX, y, larguraResumo, resumoAltura, tema);
      ctx.setTextPdf(doc, tema.text, "#f5fbff");
      ctx.setFontePdf(doc, 8);
      const resumoLinhas = [
        ["Subtotal dos itens", resumoItens],
        ...(descontoComercial > 0 ? [["Desconto", descontoComercial]] : [])
      ];
      resumoLinhas.forEach(([label, valor], i) => {
        doc.text(label, resumoX + 6, y + 8 + i * 7);
        doc.text(ctx.formatarMoeda(valor), resumoX + larguraResumo - 6, y + 8 + i * 7, { align: "right" });
      });
      const linhaSeparador = y + 12 + resumoLinhas.length * 7;
      ctx.setDrawPdf(doc, tema.muted, "#b8c6d4");
      doc.line(resumoX + 6, linhaSeparador, resumoX + larguraResumo - 6, linhaSeparador);
      ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
      ctx.setFontePdf(doc, 10, "bold");
      doc.text("TOTAL", resumoX + 6, linhaSeparador + 9);
      ctx.setFontePdf(doc, resumoFinanceiroPdf.entrada > 0 ? 14 : 18, "bold");
      doc.text(ctx.formatarMoeda(totalComercial), resumoX + larguraResumo - 6, linhaSeparador + 9, { align: "right" });
      if (resumoFinanceiroPdf.entrada > 0) {
        ctx.setTextPdf(doc, tema.text, "#f5fbff");
        ctx.setFontePdf(doc, 8);
        doc.text("Entrada paga", resumoX + 6, linhaSeparador + 18);
        doc.text(ctx.formatarMoeda(resumoFinanceiroPdf.entrada), resumoX + larguraResumo - 6, linhaSeparador + 18, { align: "right" });
        doc.text("Valor restante", resumoX + 6, linhaSeparador + 26);
        doc.text(ctx.formatarMoeda(resumoFinanceiroPdf.restante), resumoX + larguraResumo - 6, linhaSeparador + 26, { align: "right" });
        ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
        ctx.setFontePdf(doc, 8, "bold");
        doc.text("Status financeiro", resumoX + 6, linhaSeparador + 34);
        doc.text(ctx.labelStatusFinanceiroPedido(resumoFinanceiroPdf.statusFinanceiro), resumoX + larguraResumo - 6, linhaSeparador + 34, { align: "right" });
      }
  
      y += resumoAltura + 5;
      const valorPix = resumoFinanceiroPdf.entrada > 0 ? resumoFinanceiroPdf.restante : totalComercial;
      const payloadPix = valorPix > 0 ? ctx.gerarPayloadPix(valorPix, cliente) : "";
      if (payloadPix) {
        if (y > altura - 61) {
          doc.addPage();
          ctx.desenharFundoComercialPdf(doc, largura, altura, tema);
          y = 18;
        }
        const qrData = ctx.gerarQrPixDataUrl(payloadPix);
        ctx.desenharCartaoPdf(doc, margem, y, largura - margem * 2, 37, tema);
        ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
        ctx.setFontePdf(doc, 9, "bold");
        doc.text("PAGUE COM PIX", margem + 16, y + 10);
        ctx.setTextPdf(doc, tema.muted, "#b8c6d4");
        ctx.setFontePdf(doc, 8);
        doc.text("Escaneie o QR Code ou copie a chave Pix:", margem + 16, y + 17);
        ctx.setTextPdf(doc, tema.secondary, "#00d8c8");
        ctx.setFontePdf(doc, 9, "bold");
        doc.text(empresa.pixKey || ctx.appConfig.pixKey || "", margem + 16, y + 25);
        if (qrData) doc.addImage(qrData, "PNG", largura / 2 - 13, y + 5, 26, 26);
        ctx.setTextPdf(doc, tema.text, "#f5fbff");
        ctx.setFontePdf(doc, 9, "bold");
        doc.text("Pagamento via PIX", largura - margem - 56, y + 13);
        ctx.setTextPdf(doc, tema.muted, "#b8c6d4");
        ctx.setFontePdf(doc, 8);
        const pixTexto = [
          empresa.pixReceiverName ? `Recebedor: ${empresa.pixReceiverName}` : "",
          ctx.appConfig.pixInstruction || "Após o pagamento, envie o comprovante pelo WhatsApp."
        ].filter(Boolean).join("\n");
        ctx.textoLimitadoPdf(doc, pixTexto, largura - margem - 56, y + 21, 50, 3, 4);
      }
  
      const totalPaginas = doc.getNumberOfPages();
      for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
        doc.setPage(pagina);
        desenharRodapeComercialPdf(doc, { largura, altura, margem, tema, empresa, pagina, totalPaginas });
      }
  
      ctx.atualizarOperacaoUX(operacaoUX, { stepIndex: 2, message: "Gerando arquivo PDF...", progress: 75 });
      const nomeArquivo = ctx.nomeArquivoPdfPedido(pedidoId, cliente, agoraPdf);
      ctx.registrarHistorico(deveImprimir ? "Impressão" : "PDF", `${tipoDoc} ${numeroDoc} gerado para ${cliente}`);
      ctx.atualizarOperacaoUX(operacaoUX, {
        stepIndex: 3,
        message: deveImprimir ? "Enviando para impressão..." : "Finalizando download...",
        progress: 90
      });
      const concluiu = deveImprimir
        ? await ctx.imprimirOuOferecerPdf(doc, nomeArquivo, `${tipoDoc} ${cliente}`)
        : await ctx.salvarOuCompartilharPdf(doc, nomeArquivo, `${tipoDoc} ${cliente}`);
      if (concluiu) {
        ctx.atualizarOperacaoUX(operacaoUX, { message: "Documento concluído.", progress: 100 });
        ctx.concluirOperacaoUX(operacaoUX, deveImprimir ? "Enviado" : "PDF gerado");
        ctx.mostrarToast(deveImprimir ? `${tipoDoc} enviado para impressão.` : `${tipoDoc} gerado com visual profissional.`, "sucesso", 3200);
      } else {
        ctx.falharOperacaoUX(operacaoUX, "Ação não concluída", "Não concluído");
      }
    } catch (error) {
      ctx.falharOperacaoUX(operacaoUX, error, "Erro ao gerar PDF");
      ctx.mostrarToast("Não foi possível gerar o documento agora.", "erro", 4200);
      ctx.registrarDiagnostico("PDF", "Falha ao gerar documento", error?.message || String(error), { silent: true });
    } finally {
      ctx.windowRef.__simplificaExportandoPdf = false;
    }
  
  }

  const api = Object.freeze({ generateOrderPdf });
  global.SimplificaPdfOrderComposer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
