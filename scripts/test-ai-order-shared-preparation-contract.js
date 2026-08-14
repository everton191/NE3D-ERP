const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const preparation = fs.readFileSync(path.join(root, "src/ai-3d/order-create-preparation.js"), "utf8");

assert.match(app, /function getOrderCreatePreparationUseCase3d\(\)/);
assert.match(app, /const preparationUseCase = getOrderCreatePreparationUseCase3d\(\);/);
assert.match(app, /preparacaoPedido = preparationUseCase\.prepare\(/);
assert.match(app, /orderPreparationUseCase = getOrderCreatePreparationUseCase3d\(\)/);
assert.match(app, /const ALLOW_LIVE_AI_ORDER_CREATE = RUNTIME_FEATURES\.aiOrderCreateEnabled === true;/);
assert.match(app, /new S\.WriteCapabilityGate\(\{ mode: ALLOW_LIVE_AI_ORDER_CREATE \? S\.WRITE_MODE\.LIVE : S\.WRITE_MODE\.DRY_RUN/);
assert.match(app, /\["ORDER\.CREATE", "ORDER\.UPDATE", "ORDER\.CANCEL"/);
assert.doesNotMatch(preparation, /fecharPedido\s*\(/);
assert.doesNotMatch(preparation, /salvarDados\s*\(/);
assert.doesNotMatch(preparation, /InventoryService|\bcaixa\.push|supabase/i);
assert.doesNotMatch(preparation, /class OrderCreatePreparationUseCase[\s\S]*?\bexecute\s*\(/);

console.log("ORDER.CREATE shared preparation contract: manual e IA confirmada reutilizam a mesma preparação.");
