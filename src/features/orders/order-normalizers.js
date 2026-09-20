(function attachOrderNormalizers(global) {
  "use strict";

  function normalizarItemPedido(item = {}, helpers = {}) {
    const getMateriaisItem = typeof helpers.getMateriaisItem === "function" ? helpers.getMateriaisItem : () => [];
    const createItemId = typeof helpers.createItemId === "function"
      ? helpers.createItemId
      : () => `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const qtd = Math.max(1, Number(item.qtd) || 1);
    const valor = Math.max(0, Number(item.valor ?? item.precoVenda) || 0);
    return {
      ...item,
      id: item.id || createItemId(),
      nome: String(item.nome || "Produto 3D").trim(),
      tipoImpressao: item.tipoImpressao === "RESINA" ? "RESINA" : "FDM",
      material: item.material || "",
      materiais: getMateriaisItem(item),
      qtd,
      tempoHoras: Math.max(0, Number(item.tempoHoras ?? item.tempo) || 0),
      valor,
      total: Math.max(0, Number(item.total) || valor * qtd),
      custoMaterial: Math.max(0, Number(item.custoMaterial) || 0),
      custoEnergia: Math.max(0, Number(item.custoEnergia) || 0),
      custoTotal: Math.max(0, Number(item.custoTotal ?? item.custo) || 0),
      baseProduto: Math.max(0, Number(item.baseProduto ?? item.productBase) || 0),
      lucroProduto: Math.max(0, Number(item.lucroProduto ?? item.productProfit) || 0),
      valorProduto: Math.max(0, Number(item.valorProduto ?? item.productValue) || 0),
      taxaExtra: Math.max(0, Number(item.taxaExtra ?? item.extraFee) || 0)
    };
  }

  function getMateriaisItem(item = {}, helpers = {}) {
    const getMaterialEstoque = typeof helpers.getMaterialEstoque === "function" ? helpers.getMaterialEstoque : () => null;
    const numeroMonetarioPedido = typeof helpers.numeroMonetarioPedido === "function" ? helpers.numeroMonetarioPedido : (value, fallback = 0) => Number(value) || fallback;
    if (Array.isArray(item.materiais) && item.materiais.length) {
      return item.materiais.map((material) => {
        const materialId = material.materialId || material.id || "";
        const estoqueItem = getMaterialEstoque(materialId);
        const unidade = String(material.unidade || material.unit || estoqueItem?.unidade || "kg");
        const gramasLegado = Math.max(0, Number(material.gramas) || 0);
        const quantidadeInformada = Math.max(0, Number(material.quantidade ?? material.quantity) || 0);
        const quantidade = quantidadeInformada || (unidade === "kg" ? gramasLegado / 1000 : gramasLegado);
        return { materialId, nome: material.nome || estoqueItem?.nome || "", quantidade, unidade, valorUnitario: Math.max(0, numeroMonetarioPedido(material.valorUnitario ?? material.unitValue, 0)), gramas: gramasLegado || (unidade === "kg" ? quantidade * 1000 : unidade === "g" ? quantidade : 0) };
      }).filter((material) => material.materialId && material.quantidade > 0);
    }
    const materialId = item.materialId || "";
    const gramas = Math.max(0, Number(item.materialGramsTotal ?? item.materialGrams) || 0);
    const estoqueItem = getMaterialEstoque(materialId);
    const unidade = String(estoqueItem?.unidade || "kg");
    const quantidade = unidade === "kg" ? gramas / 1000 : gramas;
    return materialId && quantidade > 0 ? [{ materialId, nome: estoqueItem?.nome || "", quantidade, unidade, gramas }] : [];
  }

  function normalizarItensPedido(pedidoOuItens = [], helpers = {}) {
    const itens = Array.isArray(pedidoOuItens) ? pedidoOuItens : Array.isArray(pedidoOuItens?.itens) ? pedidoOuItens.itens : [];
    return itens.map((item) => normalizarItemPedido(item, helpers));
  }

  function itemEhPlaceholderPedido(item = {}, helpers = {}) {
    const normalizarTextoBusca = typeof helpers.normalizarTextoBusca === "function" ? helpers.normalizarTextoBusca : (value) => String(value || "").trim().toLowerCase();
    const nome = normalizarTextoBusca(item.nome || "");
    const semValor = Number(item.valor) <= 0 && Number(item.total) <= 0;
    return semValor && ["", "produto 3d", "novo item", "item calculado", "item do pedido"].includes(nome);
  }

  function validarItemPedidoParaSalvar(item = {}, helpers = {}) {
    const normalizar = typeof helpers.normalizarItemPedido === "function" ? helpers.normalizarItemPedido : (value) => normalizarItemPedido(value, helpers);
    const normalizarTextoBusca = typeof helpers.normalizarTextoBusca === "function" ? helpers.normalizarTextoBusca : (value) => String(value || "").trim().toLowerCase();
    const isPlaceholder = typeof helpers.itemEhPlaceholderPedido === "function" ? helpers.itemEhPlaceholderPedido : (value) => itemEhPlaceholderPedido(value, helpers);
    const normalizado = normalizar(item);
    const nome = String(normalizado.nome || "").trim();
    const nomeOriginal = String(item.nome || "").trim();
    if (!nomeOriginal || ["", "produto 3d", "novo item", "item calculado", "item do pedido"].includes(normalizarTextoBusca(nome)) || isPlaceholder(normalizado)) return { ok: false, reason: "Informe a descrição do item.", item: normalizado };
    if ((Number(normalizado.qtd) || 0) <= 0) return { ok: false, reason: "A quantidade precisa ser maior que zero.", item: normalizado };
    if ((Number(normalizado.valor) || 0) <= 0 || (Number(normalizado.total) || 0) <= 0) return { ok: false, reason: "O valor do item precisa ser maior que zero.", item: normalizado };
    return { ok: true, item: normalizado };
  }

  function sanitizeItensPedidoParaSalvar(itens = [], helpers = {}) {
    const normalizar = typeof helpers.normalizarItensPedido === "function" ? helpers.normalizarItensPedido : (value) => normalizarItensPedido(value, helpers);
    const validar = typeof helpers.validarItemPedidoParaSalvar === "function" ? helpers.validarItemPedidoParaSalvar : (value) => validarItemPedidoParaSalvar(value, helpers);
    const validos = [], invalidos = [];
    normalizar(itens).forEach((item) => { const validacao = validar(item); if (validacao.ok) validos.push(validacao.item); else invalidos.push({ item, reason: validacao.reason }); });
    return { validos, invalidos };
  }

  const api = Object.freeze({ getMateriaisItem, normalizarItemPedido, normalizarItensPedido, itemEhPlaceholderPedido, validarItemPedidoParaSalvar, sanitizeItensPedidoParaSalvar });
  global.SimplificaOrderNormalizers = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
