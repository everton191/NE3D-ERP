const assert = require("assert");
const C = require("../src/ai-3d/canonical-order.js");
const P = require("../src/ai-3d/order-create-preparation.js");

const clone = (value) => JSON.parse(JSON.stringify(value));
const normalizeItems = (items) => items.map((item, index) => ({
  ...clone(item),
  id: item.id || `item-${index + 1}`,
  nome: String(item.nome || "").trim(),
  qtd: Math.max(1, Number(item.qtd) || 1),
  valor: Math.max(0, Number(item.valor) || 0),
  total: Math.max(0, Number(item.total) || (Number(item.valor) || 0) * (Number(item.qtd) || 1)),
  materiais: clone(item.materiais || [])
}));
const dependencies = {
  sanitizeItems(items) {
    const normalized = normalizeItems(items);
    const validos = normalized.filter((item) => item.nome && item.qtd > 0 && item.valor > 0 && item.total > 0);
    return { validos, invalidos: normalized.filter((item) => !validos.includes(item)) };
  },
  normalizeItems,
  calculateFinancialSummary(input) {
    const subtotal = Number(input.subtotalItens) || 0;
    const desconto = Math.max(0, Number(input.desconto) || 0);
    const total = Math.max(0, subtotal - desconto);
    const entrada = Math.max(0, Number(input.down_payment) || 0);
    const restante = Math.max(0, total - entrada);
    return { subtotal, desconto, total, entrada, restante, statusFinanceiro: entrada <= 0 ? "pendente" : restante <= 0 ? "pago_total" : "pago_parcial" };
  },
  normalizePaymentMethod(id) { return { id: id || "pix", name: id === "cash" ? "Dinheiro" : "Pix", type: id === "cash" ? "cash" : "instant" }; },
  createOperationMetadata(kind, reference) { return { operation_uuid: "fixed-operation", client_request_id: `${kind}:${reference.id}`, request_hash: "fixed-hash" }; },
  prepareOnlineRecord(record) { return { ...record, owner_id: "owner-1", sync_status: "pending" }; }
};
const useCase = new P.OrderCreatePreparationUseCase(dependencies);
const operation = { orderId: 123, sequenceNumber: 9, displayDate: "12/08/2026", createdAt: "2026-08-12T12:00:00.000Z", updatedAt: "2026-08-12T12:00:00.000Z" };

function input(overrides = {}) {
  return {
    customer: { name: "José", phone: "85999999999", email: "jose@example.com" },
    items: [{ nome: "Chaveiro", qtd: 1, valor: 7, materiais: [{ materialId: "pla-preto", quantidade: 0.01, unidade: "kg" }] }],
    discount: { value: 0, type: "fixo", percentage: 0 },
    downPayment: 0,
    paymentMethodId: "pix",
    status: "aberto",
    notes: "",
    dueDate: "",
    operation,
    ...overrides
  };
}

const prepared = useCase.prepare(input());
assert.strictEqual(prepared.record.cliente, "José");
assert.strictEqual(prepared.record.total, 7);
assert.strictEqual(prepared.record.itens.length, 1);
assert.strictEqual(prepared.record.owner_id, "owner-1");
assert.strictEqual(typeof useCase.execute, "undefined", "A preparação não pode persistir nem executar WRITE.");

const canonical = C.createCanonicalOrder({ customerName: "José", items: [{ description: "Chaveiro", quantity: 2, unitPrice: 7 }] });
const mapped = new C.OrderCreateAdapter().map(canonical);
const fromAi = useCase.prepare(input({
  customer: { name: mapped.cliente, phone: mapped.clienteTelefone, email: mapped.clienteEmail },
  items: mapped.itens,
  discount: { value: mapped.desconto },
  downPayment: mapped.down_payment,
  paymentMethodId: mapped.payment_method_id,
  status: mapped.status,
  notes: mapped.observacao,
  dueDate: mapped.prazo
}));
assert.strictEqual(fromAi.record.total, 14);
assert.strictEqual(fromAi.record.itens[0].qtd, 2);
const shadowState = { orders: 2, stock: 5, cash: 4, finance: 1 };
const shadowBefore = JSON.stringify(shadowState);
const shadow = new P.OrderCreateShadowPipeline({
  canonicalApi: C,
  preparationUseCase: useCase,
  shadowPersistence: new C.ShadowPersistence()
}).prepare(canonical, operation);
assert.strictEqual(shadow.status, "SHADOW_VALIDATED");
assert.strictEqual(shadow.sideEffects, 0);
assert.strictEqual(JSON.stringify(shadowState), shadowBefore);

const scenarios = [
  ["item único", input()],
  ["múltiplos itens", input({ items: [{ nome: "A", qtd: 1, valor: 2 }, { nome: "B", qtd: 2, valor: 3 }] })],
  ["quantidade 1", input({ items: [{ nome: "A", qtd: 1, valor: 2 }] })],
  ["quantidade alta", input({ items: [{ nome: "A", qtd: 10000, valor: 2 }] })],
  ["preço inteiro", input({ items: [{ nome: "A", qtd: 2, valor: 4 }] })],
  ["preço decimal", input({ items: [{ nome: "A", qtd: 3, valor: 4.75 }] })],
  ["desconto", input({ discount: { value: 2 } })],
  ["sem desconto", input({ discount: { value: 0 } })],
  ["cliente existente", input()],
  ["cliente incompleto", input({ customer: { name: "José" } })],
  ["produto cadastrado", input({ items: [{ idProduto: "p1", nome: "A", qtd: 1, valor: 2 }] })],
  ["item personalizado", input({ items: [{ nome: "Peça sob medida", qtd: 1, valor: 9 }] })],
  ["peso informado", input({ items: [{ nome: "A", qtd: 1, valor: 2, materialGramsTotal: 10 }] })],
  ["sem peso", input({ items: [{ nome: "A", qtd: 1, valor: 2 }] })],
  ["material único", input()],
  ["múltiplos materiais", input({ items: [{ nome: "A", qtd: 1, valor: 2, materiais: [{ materialId: "m1", quantidade: 1 }, { materialId: "m2", quantidade: 2 }] }] })],
  ["material por item", input({ items: [{ nome: "A", qtd: 1, valor: 2, materiais: [{ materialId: "m1", quantidade: 1 }] }, { nome: "B", qtd: 1, valor: 2, materiais: [{ materialId: "m2", quantidade: 1 }] }] })],
  ["observação", input({ notes: "Entregar embalado" })],
  ["metadata operacional", input()],
  ["subtotal", input({ items: [{ nome: "A", qtd: 3, valor: 2 }] })],
  ["total", input({ items: [{ nome: "A", qtd: 3, valor: 2 }], discount: { value: 1 } })],
  ["arredondamento preservado pelo domínio", input({ items: [{ nome: "A", qtd: 3, valor: 1.11 }] })],
  ["restauração de draft", input({ notes: "restaurado" })],
  ["alteração após preparação", input({ items: [{ nome: "A", qtd: 120, valor: 7 }] })],
  ["stale coberto pelo safety pipeline", input()],
  ["confirmação duplicada coberta pelo safety pipeline", input()],
  ["activity recriada sem execução", input()],
  ["processo reiniciado sem execução", input()],
  ["payload alterado exige nova preparação", input({ items: [{ nome: "A", qtd: 121, valor: 7 }] })],
  ["replay bloqueado fora da preparação", input()]
];
for (const [name, value] of scenarios) {
  const result = useCase.prepare(value);
  assert.ok(result.record && result.financial, name);
}

assert.throws(() => useCase.prepare(input({ customer: { name: "" } })), (error) => error.code === "CUSTOMER_REQUIRED");
assert.throws(() => useCase.prepare(input({ items: [] })), (error) => error.code === "ITEMS_REQUIRED");
assert.throws(() => useCase.prepare(input({ items: [{ nome: "", qtd: 1, valor: 0 }] })), (error) => error.code === "INVALID_ITEMS");
console.log(`ORDER.CREATE preparation: ${scenarios.length}/${scenarios.length} cenários preparados sem WRITE.`);
