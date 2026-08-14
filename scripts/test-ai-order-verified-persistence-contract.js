const assert = require("assert");
const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");

assert.match(app, /persist: \(order\) => salvarPedidoComVerificacaoLocal\(order\)/);
assert.match(app, /function getPedidosPersistidosNoEscopoAtual\(\)/);
assert.match(app, /lerCacheDadosUsuario\(escopo\)\?\.data\?\.pedidos/);
assert.match(app, /localStorage\.getItem\("pedidos"\)/);
assert.match(app, /throw new Error\("ORDER_LOCAL_PERSISTENCE_NOT_VERIFIED"\)/);
assert.match(app, /compensarCreditoPedidoFree\(creditReservation\)/);
assert.match(app, /if \(executionResult\.status === "ALREADY_COMMITTED"\) compensarCreditoPedidoFree/);

console.log("ORDER.CREATE persistence: releitura local, falha explícita e compensação de crédito contratadas.");
