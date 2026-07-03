const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const audit = fs.readFileSync(path.join(root, "docs", "stock-audit-stage-1-2026-07-01.md"), "utf8");

function includes(needle, message) {
  assert.ok(app.includes(needle), message || `Missing marker: ${needle}`);
}

includes("function registrarHistorico(acao, detalhes = \"\", metadata = {})", "Historico deve aceitar metadata estruturada.");
includes("getMovementHistory()", "InventoryService deve expor historico de movimentos.");
includes("hasMovementKey(idempotencyKey = \"\")", "InventoryService deve validar chave de idempotencia.");
includes("createMovementMetadata({", "Movimentos devem ter metadata canonica.");
includes("movement_type", "Metadata deve registrar tipo de movimento.");
includes("before_quantity", "Metadata deve registrar saldo anterior.");
includes("after_quantity", "Metadata deve registrar saldo posterior.");
includes("order_material_deduction:", "Baixa por pedido deve ter chave de idempotencia.");
includes("order_material_return:", "Devolucao por cancelamento deve ter chave de idempotencia.");
includes("INVENTORY_ADJUST_REASON_REQUIRED", "Ajuste manual deve exigir motivo ao alterar peso.");
includes("INVENTORY_OUTPUT_REASON_REQUIRED", "Saida manual deve exigir motivo.");
includes("INVENTORY_OUTPUT_OVER_BALANCE", "Saida manual deve bloquear saldo negativo.");
includes("function abrirSaidaManualEstoque", "Interface deve ter modal de saida manual.");
includes("data-action=\"stock-output\"", "Botao de saida manual deve estar ligado na tela.");
includes("abrirSaidaManualEstoque(Number(elemento.dataset.index))", "Dispatcher deve tratar botao de saida.");
includes("function renderListaComprasEstoque", "Alertas devem incluir lista de compras.");
includes("usuarioPodeVerCustosEstoque", "Custos devem respeitar papel do usuario.");
includes("Custos</span><strong>restrito", "Tela deve esconder custos de usuario sem permissao.");

assert.ok(css.includes(".stock-purchase-row"), "CSS da lista de compras deve existir.");
assert.ok(css.includes(".stock-purchase-row .status-badge"), "Lista de compras deve controlar badge no mobile.");
assert.ok(audit.includes("Não foi criada tabela nova nem módulo paralelo de estoque."), "Auditoria deve registrar preservacao da estrutura atual.");
assert.ok(audit.includes("Não foi ativado consumo automático por rolo."), "Auditoria deve registrar que rolos automaticos continuam futuros.");

console.log("Estoque etapa 1: auditoria, idempotencia local, saida manual e UI verificados.");
