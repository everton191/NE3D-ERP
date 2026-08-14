(function attachCanonicalOrder(global) {
  "use strict";
  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const money = (value) => Math.round((Math.max(0, Number(value) || 0) + Number.EPSILON) * 100) / 100;
  const number = (value) => Math.max(0, Number(value) || 0);
  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  function sha256(value) {
    const ascii = unescape(encodeURIComponent(String(value))); const words = []; const maxWord = 2 ** 32;
    const length = ascii.length; const hash = sha256.h || []; const k = sha256.k || []; let primeCounter = k.length;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate += 1) if (!isComposite[candidate]) { for (let j = 0; j < 313; j += candidate) isComposite[j] = candidate; hash[primeCounter] = (candidate ** 0.5 * maxWord) | 0; k[primeCounter++] = (candidate ** (1 / 3) * maxWord) | 0; }
    sha256.h = hash; sha256.k = k; let message = ascii + "\x80"; while (message.length % 64 !== 56) message += "\x00";
    for (let index = 0; index < message.length; index += 1) words[index >> 2] |= message.charCodeAt(index) << ((3 - index) % 4) * 8;
    words.push((length / maxWord) | 0); words.push(length << 3); let workingHash = hash.slice(0, 8);
    for (let offset = 0; offset < words.length;) { const oldHash = workingHash.slice(); const w = words.slice(offset, offset += 16); workingHash = workingHash.slice(0, 8);
      for (let round = 0; round < 64; round += 1) { const w15 = w[round - 15]; const w2 = w[round - 2]; const a = workingHash[0]; const e = workingHash[4];
        const temp1 = workingHash[7] + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7)) + ((e & workingHash[5]) ^ (~e & workingHash[6])) + k[round] + (w[round] = round < 16 ? w[round] : (w[round - 16] + ((w15 >>> 7 | w15 << 25) ^ (w15 >>> 18 | w15 << 14) ^ (w15 >>> 3)) + w[round - 7] + ((w2 >>> 17 | w2 << 15) ^ (w2 >>> 19 | w2 << 13) ^ (w2 >>> 10))) | 0);
        const temp2 = (((a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10)) + ((a & workingHash[1]) ^ (a & workingHash[2]) ^ (workingHash[1] & workingHash[2]))) | 0;
        workingHash = [(temp1 + temp2) | 0].concat(workingHash); workingHash[4] = (workingHash[4] + temp1) | 0; workingHash.pop(); }
      for (let index = 0; index < 8; index += 1) workingHash[index] = (workingHash[index] + oldHash[index]) | 0; }
    return workingHash.map((word) => (word >>> 0).toString(16).padStart(8, "0")).join("");
  }
  function canonicalMaterial(material = {}) { return { materialId: String(material.materialId || material.id || ""), materialType: String(material.materialType || material.tipo || ""), color: String(material.color || material.cor || ""), quantity: number(material.quantity ?? material.quantidade), unit: String(material.unit || material.unidade || "kg"), metadata: clone(material.metadata || {}) }; }
  function canonicalItem(item = {}) { const quantity = Math.max(1, Number(item.quantity ?? item.qtd) || 1); const unitPrice = money(item.unitPrice ?? item.valor ?? item.precoVenda); return { productId: String(item.productId || item.idProduto || ""), description: String(item.description || item.nome || "").trim(), quantity, unitPrice, subtotal: money(quantity * unitPrice), weightGrams: number(item.weightGrams ?? item.materialGramsTotal ?? item.pesoGramas), materials: (item.materials || item.materiais || []).map(canonicalMaterial), metadata: clone(item.metadata || {}) }; }
  function createCanonicalOrder(input = {}) { const items = (input.items || input.itens || []).map(canonicalItem); const subtotal = money(items.reduce((sum, item) => sum + item.subtotal, 0)); const discounts = (input.discounts || []).map((discount) => ({ type: String(discount.type || "fixed"), value: money(discount.value), amount: money(discount.amount ?? discount.value), metadata: clone(discount.metadata || {}) })); const legacyDiscount = money(input.discountTotal ?? input.desconto); if (!discounts.length && legacyDiscount) discounts.push({ type: "fixed", value: legacyDiscount, amount: legacyDiscount, metadata: {} }); const discountTotal = money(discounts.reduce((sum, discount) => sum + discount.amount, 0)); return { customerId: String(input.customerId || input.customer_id || ""), customerSnapshot: { name: String(input.customerSnapshot?.name || input.customerName || input.cliente || "").trim(), phone: String(input.customerSnapshot?.phone || input.customerPhone || input.clienteTelefone || ""), email: String(input.customerSnapshot?.email || input.customerEmail || input.clienteEmail || "") }, items, subtotal, discounts, discountTotal, total: money(subtotal - discountTotal), downPayment: money(input.downPayment ?? input.down_payment), status: String(input.status || "aberto"), dueDate: String(input.dueDate || input.prazo || ""), paymentMethodId: String(input.paymentMethodId || input.payment_method_id || "pix"), notes: String(input.notes || input.observacao || input.observacoes || ""), metadata: clone(input.metadata || {}) }; }
  function canonicalHash(payload) { return sha256(stableStringify(createCanonicalOrder(payload))); }
  function normalizeForParity(value = {}) { const canonical = createCanonicalOrder(value); return JSON.parse(stableStringify(canonical)); }
  class OrderCreateAdapter {
    map(canonicalPayload) { const order = createCanonicalOrder(canonicalPayload); return { customerId: order.customerId, cliente: order.customerSnapshot.name, clienteTelefone: order.customerSnapshot.phone, clienteEmail: order.customerSnapshot.email, itens: order.items.map((item) => ({ productId: item.productId, nome: item.description, qtd: item.quantity, valor: item.unitPrice, total: item.subtotal, materialGramsTotal: item.weightGrams, metadata: clone(item.metadata), materiais: item.materials.map((material) => ({ materialId: material.materialId, materialType: material.materialType, color: material.color, quantidade: material.quantity, unidade: material.unit, metadata: clone(material.metadata) })) })), subtotalItens: order.subtotal, subtotal_itens: order.subtotal, desconto: order.discountTotal, discounts: clone(order.discounts), total: order.total, down_payment: order.downPayment, observacao: order.notes, observacoes: order.notes, prazo: order.dueDate, status: order.status, payment_method_id: order.paymentMethodId, metadata: clone(order.metadata) }; }
  }
  class ShadowPersistence { constructor() { this.records = []; } persist(mapped, operation = {}) { const record = { status: "SHADOW_VALIDATED", payloadHash: canonicalHash(operation.payload || mapped), mapped: clone(mapped), sideEffects: 0 }; this.records.push(record); return record; } }
  global.Simplifica3dCanonicalOrder = Object.freeze({ stableStringify, sha256, createCanonicalOrder, canonicalHash, normalizeForParity, OrderCreateAdapter, ShadowPersistence });
  if (typeof module !== "undefined" && module.exports) module.exports = global.Simplifica3dCanonicalOrder;
})(typeof window !== "undefined" ? window : globalThis);
