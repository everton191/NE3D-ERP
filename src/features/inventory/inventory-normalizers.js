(function attachInventoryNormalizers(global) {
  "use strict";
  function resolverStatusEstoque(percentual = 0, material = {}) {
    const saldo = Math.max(0, Number(material.current_quantity ?? material.qtd) || 0);
    const minimo = Math.max(0, Number(material.estoqueMinimo ?? material.min_stock ?? material.minStock) || 0);
    if (minimo > 0) { if (saldo <= 0) return "critical"; if (saldo <= minimo) return "low"; return "normal"; }
    const critical = Number(material.critical_stock_threshold ?? material.criticalStockThreshold ?? 10) || 10;
    const low = Number(material.low_stock_threshold ?? material.lowStockThreshold ?? 30) || 30;
    if (percentual <= critical) return "critical";
    if (percentual <= low) return "low";
    return "normal";
  }
  function calcularPercentualEstoque(atual = 0, base = 0) {
    const saldo = Math.max(0, Number(atual) || 0), referencia = Math.max(0, Number(base) || 0);
    if (!referencia) return saldo > 0 ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round((saldo / referencia) * 100)));
  }
  function calcularCustoKgMaterialEstoque(material = {}) {
    const custoKg = Number(material.precoKg || material.preco_por_kg || material.pricePerKg || material.custoKg || material.costPerKg) || 0;
    if (custoKg > 0) return custoKg;
    const total = Number(material.valorTotal || material.valor_total || material.custoTotal || material.costTotal || material.precoPago || material.preco_pago) || 0;
    const base = Math.max(0, Number(material.quantity_base ?? material.initial_quantity ?? material.qtd) || 0);
    return total > 0 && base > 0 ? total / base : 0;
  }
  function normalizarLoteEstoque(lote = {}, material = {}, helpers = {}) {
    const now = helpers.now ? helpers.now() : new Date().toISOString();
    const createId = helpers.createId || (() => "batch-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6));
    const unit = lote.unit || lote.unidade || material.unidade || material.unit || "g";
    const initial = Math.max(0, Number(lote.initial_quantity ?? lote.initialQuantity ?? lote.quantidadeInicial ?? lote.qtdInicial ?? lote.current_quantity ?? lote.currentQuantity ?? lote.qtd) || 0);
    const current = Math.max(0, Number(lote.current_quantity ?? lote.currentQuantity ?? lote.saldoAtual ?? lote.qtdAtual ?? lote.qtd ?? initial) || 0);
    const batchType = String(lote.batch_type || lote.batchType || lote.tipo || material.batch_control_type || "rolo").trim() || "rolo";
    const rawStatus = String(lote.status || (current <= 0 ? "esgotado" : "fechado")).trim().toLowerCase();
    const status = ["fechado", "em_uso", "esgotado", "inativo"].includes(rawStatus) ? rawStatus : "fechado";
    return { ...lote, id: lote.id || createId(), inventory_item_id: lote.inventory_item_id || lote.inventoryItemId || material.id || "", batch_code: String(lote.batch_code || lote.batchCode || lote.codigo || lote.code || "").trim(), manufacturer_lot: String(lote.manufacturer_lot || lote.manufacturerLot || lote.loteFabricante || "").trim(), location_id: String(lote.location_id || lote.locationId || lote.localizacao || "").trim(), qr_code: String(lote.qr_code || lote.qrCode || "").trim(), batch_type: batchType, initial_quantity: initial, current_quantity: current, unit, cost_total: Math.max(0, Number(lote.cost_total ?? lote.costTotal ?? lote.custoTotal) || 0), cost_per_unit: Math.max(0, Number(lote.cost_per_unit ?? lote.costPerUnit ?? lote.custoUnitario) || 0), spool_tare_weight_g: Math.max(0, Number(lote.spool_tare_weight_g ?? lote.spoolTareWeightG ?? lote.taraCarretel) || 0), purchase_date: lote.purchase_date || lote.purchaseDate || "", opened_at: lote.opened_at || lote.openedAt || "", last_weighed_at: lote.last_weighed_at || lote.lastWeighedAt || "", status, notes: String(lote.notes || lote.observacoes || "").trim(), created_at: lote.created_at || lote.createdAt || now, updated_at: lote.updated_at || lote.updatedAt || now };
  }
  function normalizarLotesEstoque(material = {}, helpers = {}) {
    const batches = Array.isArray(material.inventory_batches) ? material.inventory_batches : Array.isArray(material.batches) ? material.batches : Array.isArray(material.rolos) ? material.rolos : [];
    return batches.map((batch) => normalizarLoteEstoque(batch, material, helpers));
  }
  function calcularSaldoLotesEstoque(batches = [], unit = "un") { return (Array.isArray(batches) ? batches : []).filter((batch) => !["inativo", "esgotado"].includes(String(batch.status || "").toLowerCase())).filter((batch) => !batch.unit || !unit || String(batch.unit) === String(unit)).reduce((sum, batch) => sum + (Number(batch.current_quantity) || 0), 0); }
  function normalizarMaterialEstoque(material = {}, helpers = {}) {
    const inferirTipoMaterial = helpers.inferirTipoMaterial, normalizarLotesEstoque = helpers.normalizarLotesEstoque, materialUsaControleLote = helpers.materialUsaControleLote, calcularSaldoLotesEstoque = helpers.calcularSaldoLotesEstoque, calcularPercentualEstoque = helpers.calcularPercentualEstoque, getCodigoNumericoMaterialEstoque = helpers.getCodigoNumericoMaterialEstoque, getCodigoExternoMaterialEstoque = helpers.getCodigoExternoMaterialEstoque;
    const tipo = material.tipo || inferirTipoMaterial(material.nome);
    const cor = String(material.cor || "").trim();
    const nomeBase = String(material.nome || [tipo, cor].filter(Boolean).join(" ") || tipo).trim();
    const unidade = material.unit || material.unidade || "kg";
    const inventoryBatches = normalizarLotesEstoque({ ...material, nome: nomeBase, tipo, unidade });
    const isBatchControlled = materialUsaControleLote(material);
    const saldoLotes = isBatchControlled ? calcularSaldoLotesEstoque(inventoryBatches, unidade) : 0;
    const saldoAtual = isBatchControlled && inventoryBatches.length ? saldoLotes : Math.max(0, Number(material.current_quantity ?? material.currentQuantity ?? material.qtd) || 0);
    const baseInformada = Number(material.quantity_base ?? material.quantityBase ?? material.initial_quantity ?? material.initialQuantity) || 0;
    const base = Math.max(saldoAtual, baseInformada || Math.max(1, saldoAtual));
    const percentual = calcularPercentualEstoque(saldoAtual, base);
    const status = resolverStatusEstoque(percentual, material);
    return { ...material, id: material.id || "mat-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6), codigoEstoque: getCodigoNumericoMaterialEstoque(material), stock_code: getCodigoNumericoMaterialEstoque(material), codigoExterno: getCodigoExternoMaterialEstoque(material), external_code: getCodigoExternoMaterialEstoque(material), nome: nomeBase, tipo, cor, qtd: saldoAtual, unidade, unit: unidade, categoria: String(material.categoria || material.category || tipo || "Geral").trim(), tipoItem: String(material.tipoItem || material.item_type || material.itemType || (["PLA", "PETG", "TPU", "RESINA"].includes(String(tipo).toUpperCase()) ? "Item de produção 3D" : "Matéria-prima")).trim(), item_type: String(material.tipoItem || material.item_type || material.itemType || (["PLA", "PETG", "TPU", "RESINA"].includes(String(tipo).toUpperCase()) ? "Item de produção 3D" : "Matéria-prima")).trim(), estoqueMinimo: Math.max(0, Number(material.estoqueMinimo ?? material.min_stock ?? material.minStock) || 0), min_stock: Math.max(0, Number(material.estoqueMinimo ?? material.min_stock ?? material.minStock) || 0), custoUnitario: Math.max(0, Number(material.custoUnitario ?? material.unit_cost ?? material.unitCost ?? material.precoKg ?? material.custoKg) || 0), unit_cost: Math.max(0, Number(material.custoUnitario ?? material.unit_cost ?? material.unitCost ?? material.precoKg ?? material.custoKg) || 0), fornecedor: String(material.fornecedor || material.supplier || "").trim(), observacoes: String(material.observacoes || material.observacao || material.notes || "").trim(), icone: String(material.icone || material.icon || "").trim(), foto: String(material.foto || material.imageDataUrl || material.image_url || "").trim(), ativo: material.ativo !== false && material.active !== false, is_batch_controlled: isBatchControlled, batch_control_type: String(material.batch_control_type || material.batchControlType || material.tipoControleLote || (isBatchControlled ? "rolo" : "")).trim(), inventory_batches: inventoryBatches, batches: inventoryBatches, initial_quantity: Math.max(0, Number(material.initial_quantity ?? material.initialQuantity ?? base) || 0), current_quantity: saldoAtual, quantity_base: base, remaining_percent: percentual, stock_status: status, low_stock_threshold: Number(material.low_stock_threshold ?? material.lowStockThreshold ?? 30) || 30, critical_stock_threshold: Number(material.critical_stock_threshold ?? material.criticalStockThreshold ?? 10) || 10, notified_low_stock: !!(material.notified_low_stock || material.notifiedLowStock), notified_critical_stock: !!(material.notified_critical_stock || material.notifiedCriticalStock), last_restock_at: material.last_restock_at || material.lastRestockAt || "" };
  }
  function classeStatusEstoque(status = "normal") {
    if (status === "critical") return "stock-status-critical";
    if (status === "low") return "stock-status-low";
    return "stock-status-normal";
  }
  function filtrarMateriaisEstoque(materiais = [], filtro = "todos", busca = "", helpers = {}) {
    const normalizarTexto = helpers.normalizarTexto, normalizarMaterial = helpers.normalizarMaterial, getCodigo = helpers.getCodigo, getCodigoExterno = helpers.getCodigoExterno, formatarCodigo = helpers.formatarCodigo;
    const termo = normalizarTexto(busca || "");
    const buscaSemPrefixo = String(busca || "").trim().replace(/^#/, "");
    const codigoBusca = /^\d+$/.test(buscaSemPrefixo) ? Number(buscaSemPrefixo) : 0;
    return (Array.isArray(materiais) ? materiais : []).filter((material) => {
      const normalizado = normalizarMaterial(material);
      const codigo = getCodigo(normalizado);
      const codigoExterno = getCodigoExterno(normalizado);
      const texto = normalizarTexto(`${formatarCodigo(codigo)} ${codigo} ${codigoExterno} ${normalizado.nome} ${normalizado.tipo} ${normalizado.tipoItem} ${normalizado.categoria} ${normalizado.cor} ${normalizado.id}`);
      const passaBusca = !termo || texto.includes(termo) || (codigoBusca > 0 && codigo === codigoBusca);
      const passaFiltro = filtro === "todos" || (filtro === "low" && normalizado.stock_status === "low") || (filtro === "sem_estoque" && (Number(normalizado.qtd) || 0) <= 0);
      return passaBusca && passaFiltro;
    });
  }
  function ordenarMateriaisEstoque(materiais = [], ordenacao = "codigo", getCodigo = (material) => Number(material?.codigoEstoque) || 0) {
    const lista = [...(Array.isArray(materiais) ? materiais : [])];
    const porCodigo = (a, b) => getCodigo(a) - getCodigo(b);
    if (ordenacao === "nome") return lista.sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR") || porCodigo(a, b));
    if (ordenacao === "baixo") return lista.sort((a, b) => (Number(a.qtd) || 0) - (Number(b.qtd) || 0) || porCodigo(a, b));
    if (ordenacao === "recente") return lista.sort((a, b) => String(b.atualizadoEm || b.updated_at || b.last_restock_at || "").localeCompare(String(a.atualizadoEm || a.updated_at || a.last_restock_at || "")) || porCodigo(a, b));
    return lista.sort(porCodigo);
  }
  const api = Object.freeze({ resolverStatusEstoque, calcularPercentualEstoque, calcularCustoKgMaterialEstoque, normalizarLoteEstoque, normalizarLotesEstoque, calcularSaldoLotesEstoque, normalizarMaterialEstoque, classeStatusEstoque, filtrarMateriaisEstoque, ordenarMateriaisEstoque });
  global.SimplificaInventoryNormalizers = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
