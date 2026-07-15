const fs = require("fs");
const assert = require("assert");

const app = fs.readFileSync("app.js", "utf8");

[
  'id="pedidoDesconto"',
  "function atualizarDescontoPedido",
  'id="pedidoValorFinal"',
  "function atualizarValorFinalPedido",
  'id="pedidoDescontoTipo"',
  "function atualizarTipoDescontoPedido",
  'option value="porcentagem"',
  'data-order-discount',
  'id="manualItemValor" type="text" inputmode="decimal"',
  'id="valorManualItem" type="text" inputmode="decimal"',
  'return partes.length ? partes.join(" • ") : "-";',
  'pix_key: origem.pix_key || appConfig.pixKey || ""',
  'pixKey: usarTexto(linha.pix_key) || usarTexto(settings.pix_key) || appConfig.pixKey',
  'const totalComercialBase = totalCalculadoCliente;',
  'function garantirNumeracaoSequencialPedidos',
  'function getNumeroSequencialPedido',
  'function getProximoNumeroSequencialPedido',
  'numeroPedido: numeroPedidoOperacional',
  'class="smart-order-number">Pedido',
  'class="smart-order-contact-name"',
  '<h2>Pedido ${escaparHtml(getNumeroSequencialPedido(pedido))}</h2>'
].forEach((marker) => assert.ok(app.includes(marker), `Correção de pedido/PDF ausente: ${marker}`));

assert.ok(!app.includes('id="manualItemTempo"'), "Item manual não deve solicitar tempo de impressão.");
assert.ok(!app.includes('id="manualItemObs"'), "Item manual não deve solicitar observação adicional.");
assert.ok(
  app.includes('assinatura.toLocaleLowerCase("pt-BR") !== rodape.toLocaleLowerCase("pt-BR")'),
  "Rodapé do PDF deve evitar mensagem duplicada."
);
assert.ok(
  app.includes('if (y > altura - 58)') && app.includes('doc.addPage();'),
  "Bloco Pix deve ganhar nova página quando não couber."
);

console.log("Edição de pedido, valores decimais, desconto e PDF validados.");
