const assert = require("assert");
const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const executor = fs.readFileSync("src/ai-3d/order-create-executor.js", "utf8");
const features = fs.readFileSync("src/config/runtimeFeatures.js", "utf8");
const safety = fs.readFileSync("src/ai-3d/operation-safety.js", "utf8");

assert.match(app, /getOrderCreateTransactionExecutor3d\(\)\.execute\(/);
assert.match(app, /new S\.WriteCapabilityGate\(\{ mode: ALLOW_LIVE_AI_ORDER_CREATE \? S\.WRITE_MODE\.LIVE : S\.WRITE_MODE\.DRY_RUN/);
assert.match(app, /const ALLOW_LIVE_AI_ORDER_CREATE = RUNTIME_FEATURES\.aiOrderCreateEnabled === true;/);
assert.match(features, /aiOrderCreateEnabled:\s*true/);
assert.match(app, /\["ORDER\.CREATE", "ORDER\.UPDATE", "ORDER\.CANCEL"/);
assert.doesNotMatch(app, /orderCreateTransactionExecutor3d\s*=\s*simplifica3dAiOrchestratorV2/);
assert.match(app, /allowedCapabilities:\s*\["ORDER\.CREATE"\]/);
assert.match(app, /function criarExecutorPedidoConfirmadoPelaIa3d\(\)/);
assert.match(app, /simplifica3dAiOrchestratorV2\.orderCreateExecutor = ALLOW_LIVE_AI_ORDER_CREATE \? confirmedExecutor : null/);
assert.match(app, /Somente você pode autorizar[\s\S]*Confirmar pedido/);
assert.match(safety, /confirmation\.status !== OPERATION_STATUS\.CONFIRMATION_PENDING/);
for (const forbidden of ["ORDER.UPDATE", "ORDER.CANCEL", "CUSTOMER.CREATE", "CUSTOMER.UPDATE", "STOCK.ADD", "STOCK.REMOVE", "CASH.WRITE", "FINANCE.WRITE"]) {
  const escaped = forbidden.replace(".", "\\.");
  assert.doesNotMatch(app, new RegExp(`allowedCapabilities:\\s*\\[[^\\]]*${escaped}`), `${forbidden} não pode ser liberada`);
}
assert.doesNotMatch(executor, /window\.Simplifica3dAi|ToolRegistry|LLM|provider|Supabase/i);
assert.doesNotMatch(executor, /fecharPedido\s*\(|salvarDados\s*\(|InventoryService|caixa\.push|pedidos\.push|supabase/i);

console.log("ORDER.CREATE LIVE gate: somente pedido confirmado pelo usuário pode chegar ao executor transacional compartilhado.");
