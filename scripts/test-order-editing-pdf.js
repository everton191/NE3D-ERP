const fs = require("fs");
const assert = require("assert");

const app = fs.readFileSync("app.js", "utf8");
const orderPreparation = fs.readFileSync("src/ai-3d/order-create-preparation.js", "utf8");
const delivery = fs.readFileSync("src/features/company/pdf-document-delivery.js", "utf8");
const composer = fs.readFileSync("src/features/company/pdf-order-composer.js", "utf8");
const ordersRenderer = fs.readFileSync("src/features/orders/orders-renderer.js", "utf8");
const haystack = app + "\n" + delivery + "\n" + composer + "\n" + ordersRenderer;

[
  "function atualizarDescontoPedido",
  'option value="porcentagem"',
  'data-order-discount',
  'id="manualItemValor" type="text" inputmode="decimal"',
  'id="valorManualItem" type="text" inputmode="decimal"',
  'function garantirNumeracaoSequencialPedidos',
  'function getNumeroSequencialPedido',
  'function getProximoNumeroSequencialPedido',
  'class="smart-order-number">Pedido',
  'class="smart-order-contact-name"',
  '<h2>Pedido ${escaparHtml(getNumeroSequencialPedido(pedido))}</h2>',
  'pix_key: textoOuFallback("pix_key", appConfig.pixKey)',
  'pixKey: valorLinhaOuSettings("pix_key", "pix_key", appConfig.pixKey)',
  'empresa.pixKey || ctx.appConfig.pixKey'
].forEach((marker) => assert.ok(haystack.includes(marker), `Correção de pedido/PDF ausente: ${marker}`));

[
  'id="pedidoDesconto"',
  'id="pedidoValorFinal"',
  'id="pedidoDescontoTipo"',
  "function atualizarTipoDescontoPedido",
  "function atualizarValorFinalPedido"
].forEach((marker) => assert.ok(ordersRenderer.includes(marker) || haystack.includes(marker), `Correção de pedido/PDF ausente: ${marker}`));

assert.ok(
  haystack.includes('const totalComercialBase = totalCalculadoCliente;'),
  "Correção de pedido/PDF ausente: const totalComercialBase = totalCalculadoCliente;"
);

assert.ok(
  (app.includes("sequenceNumber: getNumeroSequencialPedido") || app.includes("sequenceNumber: getProximoNumeroSequencialPedido"))
    && orderPreparation.includes("numeroPedido: sequenceNumber"),
  "Preparação compartilhada deve preservar o número operacional do pedido."
);

assert.ok(!app.includes('id="manualItemTempo"'), "Item manual não deve solicitar tempo de impressão.");
assert.ok(!app.includes('id="manualItemObs"'), "Item manual não deve solicitar observação adicional.");
assert.ok(
  haystack.includes('return parts.length ? parts.join(" • ") : "-";')
    || haystack.includes('return partes.length ? partes.join(" • ") : "-";'),
  "Rodapé/contatos do PDF devem formatar lista com • ou fallback -."
);
assert.ok(
  haystack.includes('signature.toLocaleLowerCase("pt-BR") !== footerText.toLocaleLowerCase("pt-BR")')
    || haystack.includes('assinatura.toLocaleLowerCase("pt-BR") !== rodape.toLocaleLowerCase("pt-BR")'),
  "Rodapé do PDF deve evitar mensagem duplicada."
);
assert.ok(
  haystack.includes('if (y > altura - 61)') && haystack.includes('doc.addPage();'),
  "Bloco Pix deve ganhar nova página quando não couber."
);
assert.ok(
  haystack.includes('let y = 66;')
    && haystack.includes('const resumoAltura = resumoFinanceiroPdf.entrada > 0 ? 60 : 36;')
    && haystack.includes('doc.addImage(qrData, "PNG", largura / 2 - 13, y + 5, 26, 26);'),
  "PDF deve usar o layout compacto para evitar uma segunda página sem necessidade."
);
assert.ok(
  app.includes("function gerarPDF")
    && app.includes("SimplificaPdfOrderComposer.generateOrderPdf"),
  "gerarPDF deve ser bridge do compositor PDF."
);
assert.ok(!app.includes("new jsPDF("), "app.js não deve compor jsPDF.");

console.log("Edição de pedido, valores decimais, desconto e PDF validados.");
