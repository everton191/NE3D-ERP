(function attachOrdersHandlers(global) {
  "use strict";

  async function changeOrderStatus(id, status, deps = {}) {
    if (!deps.allowAction("Seu acesso está bloqueado. Regularize o plano para alterar pedidos.")) return;
    const orders = deps.orders();
    const order = orders.find((item) => String(item?.id) === String(id));
    if (!order) return;
    if (deps.isCancelled(order)) {
      deps.toast("Pedido cancelado é um registro final e não pode mudar de status.", "info", 4200);
      return;
    }
    const operationKey = `${String(id)}:${String(status || "aberto")}`;
    const inProgress = deps.inProgress();
    if (inProgress.has(operationKey)) return;
    inProgress.add(operationKey);
    const previousStatus = order.status || "aberto";
    try {
      if (String(status || "").toLowerCase() === "cancelado") {
        await deps.requestDelete(id);
        return;
      }
      const now = deps.now();
      const operationId = `order_status:${id}:${String(status || "aberto")}:${now}`;
      const proposed = deps.markForSync({ ...order, status: status || "aberto", client_request_id: operationId, clientRequestId: operationId, atualizadoEm: now });
      const prepared = deps.editUseCase().prepare({ orderId: id, operationId, proposed }, { authorized: true });
      if (!prepared.success) throw Object.assign(new Error(prepared.errors[0]?.message || "Não foi possível preparar a alteração de status."), { code: prepared.errors[0]?.code });
      const result = await deps.editUseCase().commit(prepared, { authorized: true });
      if (!result.success) throw Object.assign(new Error(result.errors[0]?.message || "Não foi possível alterar o status."), { code: result.errors[0]?.code });
      const saved = result.data.order;
      deps.audit("pedido_status_alterado", saved, { statusAnterior: previousStatus, statusNovo: saved.status });
      deps.history("Pedido", `Status alterado de ${deps.statusLabel(previousStatus)} para ${deps.statusLabel(saved.status)}.`, { area: "order", order_id: String(id), previous_status: previousStatus, new_status: saved.status });
      deps.toast(`Status atualizado para ${deps.statusLabel(saved.status)}.`, "sucesso", 2200);
      deps.render();
      return result;
    } catch (error) {
      deps.log("Pedidos", "Alterar status", { pedidoId: String(id), status: String(status || "") }, error);
      deps.notify(error, { area: "Pedidos", action: "Alterar status", errorKey: "ORDER_STATUS_CHANGE_FAILED" });
      return null;
    } finally {
      inProgress.delete(operationKey);
    }
  }

  async function requestOrderDelete(orderId, deps = {}) {
    try {
      if (!deps.allowAction("Seu acesso está bloqueado. Regularize o plano para excluir pedidos.")) return;
      const order = deps.loadOrder(orderId);
      if (!order) return;
      deps.audit("pedido_cancelamento_solicitado", order);
      const confirmed = await deps.confirmSensitive({
        actionLabel: "cancelar este pedido",
        titulo: "Cancelar pedido",
        mensagem: "Tem certeza que deseja cancelar este pedido? Ele será movido para Cancelados e o histórico será preservado.",
        cancelar: "Cancelar",
        confirmar: "Autorizar cancelamento",
        perigo: true,
        exigirConfirmacaoVisual: true
      });
      if (!confirmed) return;
      let returnStock = false;
      if (deps.hasStockConsumption(order) && deps.stockWasDeducted(order) && !order.stock_returned_at && !order.estoqueDevolvidoEm) {
        returnStock = await deps.confirmAction({
          titulo: "Devolver estoque",
          mensagem: "Deseja devolver os materiais deste pedido ao estoque?",
          cancelar: "Não devolver",
          confirmar: "Devolver materiais",
          perigo: false
        });
      }
      return deps.cancelSafely(orderId, { returnStock, reason: "Cancelamento solicitado pelo usuário" });
    } catch (error) {
      deps.notify(error, { area: "Pedidos", action: "Solicitar cancelamento de pedido", errorKey: "REQUEST_ORDER_DELETE_FAILED" });
      return null;
    }
  }

  async function requestOrderEdit(orderId, deps = {}) {
    try {
      if (!deps.allowAction("Seu acesso está bloqueado. Regularize o plano para editar pedidos.")) return;
      const order = deps.loadOrder(orderId);
      if (!order) return;
      if (deps.isCancelled(order)) { deps.toast("Pedido cancelado é somente leitura e não pode ser editado.", "info", 4200); return; }
      if (!(await deps.confirmSensitive({ actionLabel: "editar este pedido" }))) return;
      if (!(await deps.consumeCredit("editar_pedido", "editar pedido"))) return;
      return deps.openAuthorizedEdit(orderId);
    } catch (error) {
      deps.notify(error, { area: "Pedidos", action: "Solicitar edição de pedido", errorKey: "REQUEST_ORDER_EDIT_FAILED" });
      return null;
    }
  }

  async function cancelOrderSafely(orderId, options = {}, deps = {}) {
    try {
      if (!deps.allowAction("Seu acesso está bloqueado. Regularize o plano para cancelar pedidos.")) return;
      const operationId = String(options.operationId || `order_cancel:${orderId}:${deps.nowMillis()}`);
      const prepared = deps.cancelUseCase().prepare({ orderId, operationId, returnStock: options.returnStock === true, reason: options.reason }, { authorized: true });
      if (!prepared.success) {
        const error = prepared.errors[0] || {};
        deps.toast(error.code === "ORDER_ALREADY_CANCELLED" ? "Este pedido já está cancelado." : "Não foi possível preparar o cancelamento.", error.code === "ORDER_ALREADY_CANCELLED" ? "info" : "erro", 4200);
        return prepared;
      }
      const result = await deps.cancelUseCase().commit(prepared, { authorized: true });
      if (!result.success) {
        const error = result.errors[0] || {};
        throw Object.assign(new Error(error.message || "Não foi possível cancelar o pedido."), { code: error.code || "CANCEL_ORDER_FAILED" });
      }
      const cancelled = result.data.order;
      const effects = result.data.effects || {};
      deps.clearEditingOrder(orderId);
      deps.audit("pedido_cancelado", cancelled, {
        devolveuEstoque: effects.inventoryChanged === true,
        movimentosCaixa: Number(effects.cashMovements) || 0,
        reversaoCaixa: effects.cashChanged === true,
        motivo: cancelled.cancelReason || cancelled.cancel_reason || ""
      });
      deps.history("Pedido", "Pedido cancelado: " + deps.customerName(cancelled), {
        area: "order",
        order_id: String(cancelled.id),
        event_type: "order_cancelled",
        reason: cancelled.cancelReason || cancelled.cancel_reason || ""
      });
      deps.toast("Pedido cancelado com sucesso.", "sucesso", 4200);
      deps.render();
      return result;
    } catch (error) {
      deps.notify(error, { area: "Pedidos", action: "Cancelar pedido com segurança", errorKey: "CANCEL_ORDER_FAILED" });
      return null;
    }
  }

  async function saveQuickOrder(event, deps = {}) {
    event?.preventDefault?.();
    if (deps.isLocked() || deps.isSaving()) {
      deps.toast("Salvamento em andamento. Aguarde concluir.", "info", 2200);
      return;
    }
    deps.setLocked(true);
    let operation = "";
    try {
      deps.syncDraft();
      deps.saveDraft({ force: true });
      if (!deps.customer()) {
        deps.toast("Informe o cliente para salvar o pedido rápido.", "aviso", 3200);
        deps.focus("clienteNome");
        return;
      }
      if (deps.hasPendingItem()) {
        const added = await deps.addPendingItem();
        if (!added) return;
      }
      if (!deps.items().length) {
        deps.toast("Adicione pelo menos um item antes de salvar.", "aviso", 3200);
        deps.focus("quickItemNome");
        return;
      }
      operation = deps.startOperation(event);
      deps.updateOperation(operation, { message: "Salvando...", progress: 45 });
      await deps.finalizeOrder();
      deps.updateOperation(operation, { message: "Salvando...", progress: 80 });
      if (!deps.isEditing() && !deps.items().length && !deps.customer()) deps.closePopup();
      else deps.refreshQuickOrder();
      deps.updateOperation(operation, { message: "Salvo.", progress: 100 });
      deps.completeOperation(operation, "Pedido salvo");
    } catch (error) {
      deps.failOperation(operation, error, "Erro ao salvar");
      deps.toast("Não foi possível salvar o pedido agora.", "erro", 4200);
      deps.diagnose(error);
    } finally {
      deps.setLocked(false);
    }
  }

  async function addCalculatedItem(item, options = {}, deps = {}) {
    if (deps.isAdding()) return false;
    deps.setAdding(true);
    const confirmButton = deps.document?.getElementById("confirmCalculatorItemButton");
    if (confirmButton) {
      confirmButton.disabled = true;
      confirmButton.textContent = "Adicionando item...";
    }
    deps.toast("Adicionando item...", "info", 1200);
    try {
      const validation = deps.validateItem(item);
      if (!validation.ok) {
        deps.toast(validation.reason || "Revise o item antes de adicionar.", "erro", 4200);
        return false;
      }
      const normalized = validation.item;
      const fingerprint = deps.fingerprint(normalized);
      const now = deps.nowMillis();
      if (fingerprint === deps.lastFingerprint() && now - deps.lastAddedAt() < 1200) {
        deps.toast("Item já processado. Aguarde um instante.", "aviso", 2400);
        return false;
      }
      const duplicateIndex = deps.findEquivalent(normalized);
      if (duplicateIndex >= 0 && options.allowDuplicatePrompt !== false) {
        const existing = deps.items()[duplicateIndex];
        const decision = await deps.decideDuplicate(normalized, existing);
        if (!decision) {
          deps.toast("Item não adicionado.", "info", 2400);
          return false;
        }
        if (decision === "increment") {
          if (!(await deps.consumeCredit("adicionar_item", "adicionar item ao pedido"))) return false;
          existing.qtd = Math.max(1, Number(existing.qtd) || 1) + Math.max(1, Number(normalized.qtd) || 1);
          existing.total = (Number(existing.valor) || 0) * existing.qtd;
          deps.setSelectedItem(duplicateIndex);
          deps.setLastAdded(fingerprint, now);
          deps.recordUsage("item_adicionado", { produto: existing.nome, modo: "incremento" });
          deps.toast("Quantidade atualizada.", "sucesso", 2600);
          deps.minimizeCalculator();
          deps.navigateToOrder();
          return true;
        }
      } else {
        const similarIndex = deps.findSimilar(normalized);
        if (similarIndex >= 0) deps.toast("Existe um item parecido no pedido. Adicionei separado porque descrição ou material são diferentes.", "info", 4200);
      }
      if (!(await deps.consumeCredit("adicionar_item", "adicionar item ao pedido"))) return false;
      const items = deps.items();
      items.push({ ...normalized, id: normalized.id || "item-" + deps.nowMillis().toString(36) });
      deps.setSelectedItem(items.length - 1);
      deps.setLastAdded(fingerprint, now);
      deps.recordUsage("item_adicionado", {
        produto: normalized.nome, materialNome: normalized.material, materialId: normalized.materialId,
        impressora: normalized.impressora, peso: normalized.materialGramsTotal, tempo: normalized.tempoHoras
      });
      deps.toast("Item adicionado.", "sucesso", 2600);
      deps.minimizeCalculator();
      deps.navigateToOrder();
      return true;
    } catch (error) {
      deps.notify(error, { area: "Pedido", action: "Adicionar item calculado", errorKey: "ADD_ORDER_ITEM_FAILED" });
      deps.toast("Erro ao adicionar item. Nada foi salvo.", "erro", 4200);
      return false;
    } finally {
      deps.setAdding(false);
      const currentButton = deps.document?.getElementById("confirmCalculatorItemButton");
      if (currentButton) {
        currentButton.disabled = false;
        currentButton.textContent = "Confirmar item";
      }
    }
  }

  async function openOrderItemActions(index, deps = {}) {
    const itemIndex = Number(index);
    const item = deps.items()[itemIndex];
    if (!item) return;
    const selected = deps.isItemSelected(itemIndex);
    const selectedItems = deps.selectedItems();
    const choice = await deps.requestChoice({
      titulo: item.nome || "Item do pedido",
      mensagem: "Escolha uma ação para este item.",
      opcoes: [
        { id: "editar", label: "Editar item", classe: "secondary", icone: "✎" },
        { id: "selecionar", label: selected ? "Retirar da seleção" : "Selecionar item", classe: "ghost", icone: selected ? "check" : "plus" },
        ...(selectedItems.length ? [{ id: "quantidade", label: "Alterar quantidade", classe: "ghost", icone: "✎" }] : []),
        { id: "excluir", label: "Excluir item", classe: "danger", icone: "🗑" },
        ...(selectedItems.length > 1 ? [{ id: "excluir_selecionados", label: "Excluir selecionados", classe: "danger", icone: "🗑" }] : [])
      ]
    });
    if (choice === "editar") {
      deps.selectItem(itemIndex);
      deps.focusItemEditor(itemIndex);
    }
    if (choice === "selecionar") deps.toggleItemSelection(itemIndex);
    if (choice === "quantidade") deps.changeSelectedQuantity();
    if (choice === "excluir") deps.removeItem(itemIndex);
    if (choice === "excluir_selecionados") deps.removeSelectedItems();
  }

  function mountQuickOrderDrawer(options = {}, deps = {}) {
    const popup = deps.document.getElementById("popup");
    if (!popup) return null;
    popup.innerHTML = deps.renderQuickOrder();
    return deps.promoteDrawer(popup, { title: "Pedido rápido", kind: "drawer", historyEntry: options.historyEntry !== false });
  }

  function openQuickOrder(options = {}, deps = {}) {
    const reset = options.reset === true;
    if (!deps.allowAction()) return;
    if (!reset) deps.restoreDraft();
    if (reset || !deps.hasDraft()) {
      if (reset) deps.clearDraft();
      deps.resetState();
    }
    if (!mountQuickOrderDrawer({}, deps)) return;
    deps.deferFocus();
  }

  function refreshQuickOrder(options = {}, deps = {}) {
    if (!deps.document.querySelector(".quick-order-drawer")) return;
    deps.syncDraft(options);
    mountQuickOrderDrawer({ historyEntry: false }, deps);
  }

  function atualizarPedidoRapidoResumo(deps = {}) {
    deps.syncDraft();
    const alvo = deps.document.querySelector(".quick-order-drawer [data-quick-order-summary]");
    if (!alvo) return;
    const subtotal = deps.normalizarItensPedido(deps.items()).reduce((soma, item) => soma + (Number(item.total) || 0), 0);
    const resumo = deps.calcularResumoFinanceiroPedido({
      itens: deps.items(),
      subtotalItens: subtotal,
      desconto: deps.discount(),
      down_payment: deps.downPayment()
    });
    alvo.innerHTML = `
    <div><span>Subtotal</span><strong>${deps.formatarMoeda(resumo.subtotal)}</strong></div>
    <div><span>Entrada</span><strong>${deps.formatarMoeda(resumo.entrada)}</strong></div>
    <div><span>Restante</span><strong>${deps.formatarMoeda(resumo.restante)}</strong></div>
    <div><span>Total</span><strong>${deps.formatarMoeda(resumo.total)}</strong></div>
  `;
  }

  function continueQuickOrder(deps = {}) {
    deps.syncDraft();
    deps.closePopup();
    deps.openOrderEditor(deps.hasItems());
  }

  function manageQuickOrderKeyboard(event, deps = {}) {
    if (!event) return;
    const target = event.target;
    const id = target?.id || "";
    if (event.key === "Escape") {
      event.preventDefault();
      deps.closePopup();
      return;
    }
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      deps.saveQuickOrder(event);
      return;
    }
    if (event.key !== "Enter" || event.shiftKey || target?.tagName === "TEXTAREA") return;
    if (["quickItemNome", "quickItemQtd", "quickItemValor", "quickItemTempo", "quickItemPeso"].includes(id)) {
      event.preventDefault();
      deps.closeSuggestions();
      deps.addQuickItem(event).then((ok) => { if (ok) deps.focus("quickItemNome"); });
      return;
    }
    if (["clienteNome", "clienteTelefone", "clienteEmail"].includes(id)) {
      event.preventDefault();
      deps.focusNext(id);
    }
  }

  function selectOrderItem(index, deps = {}) {
    const itemIndex = Number(index);
    if (!Number.isInteger(itemIndex) || !deps.items()[itemIndex]) return;
    deps.setCurrentItem(itemIndex);
    deps.updateSelectedItemUi(itemIndex);
  }

  function toggleOrderItemSelection(index, checked = null, deps = {}) {
    const itemIndex = Number(index);
    if (!Number.isInteger(itemIndex) || !deps.items()[itemIndex]) return;
    deps.setSelectedItems(deps.toggleSelection(deps.selectedItems(), itemIndex, checked, deps.items()));
    deps.selectItem(itemIndex);
    deps.render();
  }

  function selectAllOrderItems(deps = {}) {
    deps.setSelectedItems(deps.items().map((_, index) => index));
    deps.render();
  }

  function clearOrderItemSelection(deps = {}) {
    deps.setSelectedItems([]);
    deps.render();
  }

  function applyOrderItemsQuantity(quantityInput = null, deps = {}) {
    const selected = deps.selectedItems();
    if (!selected.length) return;
    const result = deps.applyQuantity(deps.items(), selected, quantityInput ?? deps.readQuantity());
    deps.toast("Quantidade " + result.quantity + " aplicada a " + selected.length + " item" + (selected.length > 1 ? "s" : "") + ".", "sucesso", 2200);
    deps.render();
  }

  function requestOrderItemsQuantity(deps = {}) {
    const selected = deps.selectedItems();
    if (!selected.length) return;
    const answer = deps.prompt("Nova quantidade para " + selected.length + " item" + (selected.length > 1 ? "s" : "") + " selecionado" + (selected.length > 1 ? "s" : "") + ":", "1");
    if (answer === null) return;
    deps.applyQuantity(answer);
  }

  async function removeSelectedOrderItems(deps = {}) {
    const selected = deps.selectedItems();
    if (!selected.length) return;
    const confirmed = await deps.confirm({ titulo: "Remover itens", mensagem: "Remover " + selected.length + " item" + (selected.length > 1 ? "s" : "") + " selecionado" + (selected.length > 1 ? "s" : "") + "?", confirmar: "Remover", cancelar: "Cancelar", perigo: true });
    if (!confirmed || !(await deps.consumeCredit("excluir_item", "excluir itens do pedido"))) return;
    const items = deps.items();
    [...selected].sort((a, b) => b - a).forEach((index) => { if (items[index]) items.splice(index, 1); });
    deps.setSelectedItems([]);
    deps.setCurrentItem(items.length ? Math.min(selected[0], items.length - 1) : null);
    deps.toast(selected.length + " item" + (selected.length > 1 ? "s" : "") + " removido" + (selected.length > 1 ? "s" : "") + ".", "sucesso", 2200);
    deps.render();
  }

  async function removeCurrentOrderItem(deps = {}) {
    const itemIndex = Number(deps.currentItem());
    if (!Number.isInteger(itemIndex) || !deps.items()[itemIndex]) {
      deps.toast("Selecione um item do pedido para excluir.", "aviso");
      return;
    }
    await deps.removeItem(itemIndex);
  }

  async function finalizeOrderUi(deps = {}) {
    const editingOrder = deps.editingOrder();
    try {
      if (deps.isSaving()) { deps.toast("Salvamento em andamento. Aguarde concluir.", "info", 2200); return; }
      const plan = deps.plan();
      if (plan.blockLevel === "total" || plan.status === "bloqueado") { deps.showPlanBlock(); return; }
      const header = deps.createHeader();
      const customer = header.cliente;
      deps.setSaving(true); deps.render();
      if (!editingOrder && !(await deps.verifyOrderLimit())) { deps.setSaving(false); deps.render(); return; }
      if (!customer) { deps.setSaving(false); deps.render(); deps.alert("Digite o nome do cliente"); return; }
      if (!editingOrder && !deps.verifyCustomerLimit(customer)) { deps.setSaving(false); deps.render(); return; }
      const now = deps.now();
      let preparation;
      try {
        preparation = deps.preparationUseCase().prepare({
          customer: { name: customer, phone: header.telefone, email: header.email }, customerSuggestion: deps.customerSuggestion(), items: deps.items(),
          discount: deps.discount(), downPayment: header.down_payment, paymentMethodId: deps.paymentMethod(editingOrder), status: header.status, notes: header.observacao, dueDate: header.prazo,
          operation: { kind: editingOrder ? "pedido_update" : "pedido_create", orderId: editingOrder?.id || deps.nowMillis(), sequenceNumber: editingOrder ? deps.sequenceNumber(editingOrder) : deps.nextSequenceNumber(), originalDate: editingOrder?.data, displayDate: now.toLocaleDateString("pt-BR"), createdAt: editingOrder?.criadoEm || now.toISOString(), updatedAt: now.toISOString() }
        });
      } catch (error) {
        if (error?.name === "OrderPreparationError") { deps.setSaving(false); deps.render(); deps.alert(error.message); return; }
        throw error;
      }
      deps.setItems(preparation.items);
      const order = preparation.record;
      if (editingOrder && !deps.reviewConfirmed()) { deps.setSaving(false); deps.render(); deps.openReview(order, deps.editingOrderOriginal() || editingOrder); return; }
      const disposableValidation = deps.disposableValidation();
      const execution = await deps.commandService().finalizeOrder({ preparation, editingOrder, reviewConfirmed: true, disposableValidation, cashRegisteredBefore: editingOrder ? deps.registeredCash(editingOrder) : 0 }, {
        preparationUseCase: deps.preparationUseCase, editUseCase: deps.editUseCase, transactionExecutor: deps.transactionExecutor, reserveCredit: deps.reserveCredit, compensateCredit: deps.compensateCredit
      });
      if (execution.status === "CREDIT_REJECTED") { deps.setSaving(false); deps.clearReview(); deps.render(); return; }
      if (execution.status !== "COMMITTED" && execution.status !== "ALREADY_COMMITTED") {
        deps.setSaving(false); deps.clearReview(); deps.render();
        if (execution.reason !== "STOCK_REJECTED") throw execution.error || new Error(execution.reason || "ORDER_CREATE_EXECUTION_FAILED");
        return;
      }
      const receipt = execution.cashReceipt;
      deps.recordCustomerSuggestion({ source: deps.customerSuggestion()?.source || "recent", name: customer, phone: header.telefone, email: header.email });
      if (!editingOrder) deps.recordUsage("pedido_criado", { tipoPedido: order.status, produto: order.itens?.[0]?.nome || "", materialNome: order.itens?.[0]?.material || "", peso: order.itens?.[0]?.materialGramsTotal || 0, tempo: order.itens?.[0]?.tempoHoras || 0 });
      deps.recordFinancialShadow(order, receipt);
      deps.log(editingOrder ? "Atualizar pedido" : "Salvar pedido", { id: order.id, cliente: customer, itens: order.itens?.length || 0, total: preparation.financial.total });
      if (!disposableValidation) deps.scheduleSync(editingOrder ? "pedido-atualizado" : "pedido-fechado");
      if (editingOrder) deps.audit("pedido_editado", order);
      deps.history(editingOrder ? "Pedido atualizado: " + customer : "Pedido criado: " + customer, { area: "order", order_id: String(order.id), event_type: editingOrder ? "order_updated" : "order_created" });
      const receiptMessage = receipt ? ` e ${receipt.paymentMethod || "pagamento"} registrado no caixa` : "";
      deps.toast(editingOrder ? `Pedido atualizado${receiptMessage}.` : `Pedido salvo${receiptMessage}.`, "sucesso", 3500);
      deps.recordMonetization(editingOrder ? "order_updated" : "order_created");
      deps.resetAfterSave(); deps.setSaving(false);
      if (deps.shouldFinishOnboarding()) { deps.finishOnboarding(); return; }
      deps.render();
    } catch (error) {
      deps.setSaving(false); deps.clearReview();
      const editing = deps.editingOrder();
      deps.log(editing ? "Atualizar pedido" : "Salvar pedido", { cliente: deps.currentCustomer(), itens: deps.items().length }, error);
      deps.notify(error, { area: "Pedidos", action: editing ? "Atualizar pedido" : "Salvar pedido", errorKey: editing ? "UPDATE_ORDER_FAILED" : "SAVE_ORDER_FAILED" });
      deps.render();
    } finally {
      if (deps.isSaving()) { deps.setSaving(false); deps.render(); }
    }
  }

function openOrderMaterialPopup(itemIndex, materialIndex = null, deps = {}) {
    const { ensureMaterials, toast, getStockMaterial, normalizeStock, escapeAttr, escapeHtml, formatQuantity, document, promotePopup, closePopup, normalizeText, parseQuantity, adjustItemTotal, render, notify } = deps;
  const materiais = ensureMaterials(itemIndex);
  const editando = Number.isInteger(Number(materialIndex)) && materiais[Number(materialIndex)];
  const indice = editando ? Number(materialIndex) : materiais.length;
  if (!editando && materiais.length >= 4) {
    toast("É possível adicionar até 4 materiais por item.", "info", 3200);
    return;
  }
  const atual = editando ? materiais[indice] : {};
  const estoqueAtual = getStockMaterial(atual.materialId);
  const opcoes = normalizeStock().map((material) => `<option value="${escapeAttr(material.nome)}">${escapeHtml(material.categoria || material.tipoItem || material.tipo || "Estoque")} • ${formatQuantity(material.qtd, material.unidade || "un")}</option>`).join("");
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <form class="modal-card order-material-picker" id="pedidoMaterialForm">
        <div class="modal-header">
          <h2>${editando ? "Editar material" : "Adicionar material"}</h2>
          <button class="icon-button" type="button" data-material-cancel title="Fechar">✕</button>
        </div>
        <label class="field">
          <span>Pesquisar no estoque</span>
          <input id="pedidoMaterialBusca" type="search" list="pedidoMaterialOpcoes" value="${escapeAttr(estoqueAtual?.nome || atual.nome || "")}" placeholder="Ex.: PLA vermelho, pingente, sacola" onchange="preencherMaterialPedidoPopup(this.value)" required>
          <datalist id="pedidoMaterialOpcoes">${opcoes}</datalist>
        </label>
        <label class="field compact-field">
          <span>Quantidade (<b id="pedidoMaterialUnidade">${escapeHtml(atual.unidade || estoqueAtual?.unidade || "un")}</b>)</span>
          <input id="pedidoMaterialQuantidade" type="text" inputmode="decimal" value="${escapeAttr(String(Number(atual.quantidade) || 1).replace(".", ","))}" required>
        </label>
        <div class="actions">
          <button class="btn ghost" type="button" data-material-cancel>Voltar</button>
          <button class="btn" type="submit">OK</button>
        </div>
      </form>
    </div>`;
  const host = promotePopup(popup, { title: editando ? "Editar material" : "Adicionar material" });
  const cancelar = () => closePopup();
  host.querySelectorAll("[data-material-cancel]").forEach((el) => el.addEventListener("click", cancelar, { once: true }));
  document.getElementById("pedidoMaterialForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const termo = String(document.getElementById("pedidoMaterialBusca")?.value || "");
    const busca = normalizeText(termo);
    const material = normalizeStock().find((item) => normalizeText(item.nome) === busca || String(item.id) === termo);
    if (!material) {
      toast("Selecione um item cadastrado no estoque.", "info", 3200);
      return;
    }
    try {
      const anterior = editando ? { ...materiais[indice] } : {};
      const quantidade = parseQuantity(document.getElementById("pedidoMaterialQuantidade")?.value, "quantidade", { min: 0.000001 });
      const valorUnitario = Math.max(0, Number(material.custoUnitario || material.unit_cost) || 0);
      const novo = { materialId: material.id, nome: material.nome, quantidade, unidade: material.unidade || "un", valorUnitario, gramas: 0 };
      materiais[indice] = novo;
      adjustItemTotal(itemIndex, anterior, novo);
      closePopup();
      render();
    } catch (erro) {
      notify(erro, { area: "Pedido", action: editando ? "Editar material" : "Adicionar material" });
    }
  }, { once: true });
  setTimeout(() => document.getElementById("pedidoMaterialBusca")?.focus(), 80);
}
const api = Object.freeze({ changeOrderStatus, requestOrderDelete, requestOrderEdit, cancelOrderSafely, saveQuickOrder, addCalculatedItem, openOrderItemActions, mountQuickOrderDrawer, openQuickOrder, refreshQuickOrder, atualizarPedidoRapidoResumo, continueQuickOrder, manageQuickOrderKeyboard, selectOrderItem, toggleOrderItemSelection, selectAllOrderItems, clearOrderItemSelection, applyOrderItemsQuantity, requestOrderItemsQuantity, removeSelectedOrderItems, removeCurrentOrderItem, openOrderMaterialPopup, finalizeOrderUi });
  global.SimplificaOrdersHandlers = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
