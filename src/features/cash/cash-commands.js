(function attachCashCommands(global) {
  "use strict";

  function openAutomaticSession(motivo, deps) {
    if (!deps.isSimpleMode()) return null;
    const aberta = deps.getCurrentSession();
    if (aberta) return aberta;
    const agora = deps.now();
    const saldo = deps.totals().saldo;
    const session = {
      id: `cash-${deps.dateLocalIso(new Date())}-${deps.hash(`${deps.getOwnerId() || "local"}:${agora}`)}`,
      status: "open",
      mode: "auto",
      openedAt: agora,
      opened_at: agora,
      openingBalance: saldo,
      opening_balance: saldo,
      expectedBalance: saldo,
      expected_balance: saldo,
      reason: motivo,
      financial_flow_version: deps.financialFlowVersion,
      reconciliation_version: deps.reconciliationVersion
    };
    deps.setSession(session);
    deps.shadow("cash_session_auto_open", { session_id: session.id, motivo });
    return session;
  }

  async function openManualSession(deps) {
    if (!await deps.requestSensitiveActionConfirmation({
      actionLabel: "abrir ou reabrir caixa",
      titulo: "Autorizar abertura do caixa",
      mensagem: "Confirme sua senha antes de abrir uma nova sessão de caixa.",
      confirmar: "Autorizar abertura",
      cancelar: "Cancelar",
      exigirConfirmacaoVisual: true
    })) return;
    const session = openAutomaticSession("abertura_manual", deps);
    if (!session) return;
    deps.persist();
    deps.toast("Caixa aberto.", "sucesso", 2600);
    deps.renderPreservingScroll();
  }

  async function closeSession(deps) {
    const session = deps.getCurrentSession();
    if (!session) {
      deps.toast("O caixa já está fechado.", "info", 2600);
      return;
    }
    const summary = deps.summarizeSession(session);
    const countedText = deps.prompt(
      `Saldo esperado: ${deps.formatMoney(summary.expectedBalance)}.\nInforme o saldo contado no caixa:`,
      Number(summary.expectedBalance).toFixed(2).replace(".", ",")
    );
    if (countedText === null) {
      deps.toast("Fechamento cancelado.", "info", 2200);
      return;
    }
    let counted = 0;
    try {
      counted = deps.parseNumber(countedText, "saldo contado", { min: 0 });
    } catch (error) {
      deps.notifyError(error, { area: "Caixa", action: "Conferir fechamento" });
      return;
    }
    const difference = Number((counted - summary.expectedBalance).toFixed(2));
    let reason = "";
    if (Math.abs(difference) >= 0.01) {
      reason = String(deps.prompt(
        `Diferença de ${deps.formatMoney(difference)}. Informe a justificativa obrigatória:`
      ) || "").trim();
      if (!reason) {
        deps.toast("Informe a justificativa da diferença para fechar o caixa.", "aviso", 3800);
        return;
      }
    }
    const confirmed = await deps.requestSensitiveActionConfirmation({
      actionLabel: "fechar caixa",
      titulo: "Fechar caixa",
      mensagem: `Esperado: ${deps.formatMoney(summary.expectedBalance)}. Contado: ${deps.formatMoney(counted)}. Diferença: ${deps.formatMoney(difference)}.`,
      cancelar: "Cancelar",
      confirmar: "Fechar caixa",
      perigo: false,
      exigirConfirmacaoVisual: true
    });
    if (!confirmed) return;
    const agora = deps.now();
    deps.setSession({
      ...session,
      status: "closed",
      closedAt: agora,
      closed_at: agora,
      closingBalance: counted,
      closing_balance: counted,
      countedBalance: counted,
      counted_balance: counted,
      expectedBalance: summary.expectedBalance,
      expected_balance: summary.expectedBalance,
      closingDifference: difference,
      closing_difference: difference,
      differenceAmount: difference,
      difference_amount: difference,
      closingReason: reason,
      closing_reason: reason,
      notes: reason,
      closedBy: deps.getUserEmail() || deps.getSupabaseUserId() || "",
      closed_by: deps.getSupabaseUserId() || null,
      paymentsSummary: summary.porForma,
      payments_summary_json: summary.porForma
    });
    deps.shadow("cash_session_closed_basic", {
      session_id: session.id,
      total: summary.expectedBalance,
      saldo_informado: counted,
      diferenca: difference,
      justificativa: reason,
      responsavel: deps.getUserEmail() || "",
      entradas: summary.entradas,
      saidas: summary.saidas
    });
    deps.persist();
    deps.history("Caixa", `Caixa fechado. Esperado ${deps.formatMoney(summary.expectedBalance)}, contado ${deps.formatMoney(counted)}, diferença ${deps.formatMoney(difference)}.`, {
      area: "cash",
      event_type: "cash_session_closed",
      session_id: session.id,
      expected_balance: summary.expectedBalance,
      counted_balance: counted,
      difference: difference,
      reason: reason,
      responsible: deps.getUserEmail() || ""
    });
    deps.toast("Caixa fechado com sucesso.", "sucesso", 3200);
    deps.renderPreservingScroll();
  }

  async function addMovement(deps) {
    if (!deps.allowAction("Seu acesso está bloqueado. Regularize o plano para lançar no caixa.")) return;
    const tipo = deps.el("caixaTipo")?.value || "entrada";
    const metodo = deps.normalizePayment(deps.el("caixaMetodoPagamento")?.value || (tipo === "saida" ? "dinheiro" : "pix"));
    let valor = 0;
    try {
      valor = deps.parseNumber(deps.el("caixaValor")?.value, "valor do caixa", { min: 0, allowZero: false });
    } catch (error) {
      deps.notifyError(error, { area: "Caixa", action: "Lançar movimento" });
      return;
    }
    const descricao = deps.el("caixaDescricao")?.value.trim() || "";

    if (tipo === "saida" && !descricao) {
      deps.alert("Para lançar uma saída, informe a descrição. Ex.: 2 reais caneta");
      return;
    }

    if (!await deps.requestSensitiveActionConfirmation({
      actionLabel: tipo === "saida" ? "registrar sangria ou retirada no caixa" : "registrar suprimento no caixa",
      titulo: tipo === "saida" ? "Autorizar saída do caixa" : "Autorizar entrada manual",
      mensagem: `${tipo === "saida" ? "Saída" : "Entrada"} de ${deps.formatMoney(valor)} em ${metodo.name}. Confirme sua senha antes de lançar.`,
      confirmar: "Autorizar lançamento",
      cancelar: "Cancelar",
      perigo: tipo === "saida",
      exigirConfirmacaoVisual: true
    })) return;

    if (!await deps.consumeCredit("registrar_caixa", "registrar entrada/saída no caixa")) return;
    const agora = deps.now();
    const session = openAutomaticSession(tipo === "saida" ? "retirada" : "movimento_manual", deps);
    const movementId = Date.now();
    const metadata = deps.criarMetadadosOperacaoFinanceira("caixa_manual", {
      id: movementId,
      valor,
      status: tipo,
      atualizadoEm: agora
    }, { createdAt: agora });
    deps.pushMovement(deps.prepareOnline({
      id: movementId,
      tipo,
      valor,
      descricao: descricao || "Movimento manual",
      cash_session_id: session?.id || "",
      cashSessionId: session?.id || "",
      payment_method_id: metodo.id,
      paymentMethodId: metodo.id,
      paymentMethod: metodo.name,
      payment_method_type: metodo.type,
      ...metadata,
      data: agora,
      criadoEm: agora,
      atualizadoEm: agora
    }));
    deps.shadow("caixa_manual_shadow", {
      tipo,
      valor,
      metodo: metodo.id,
      session_id: session?.id || "",
      operation_uuid: metadata.operation_uuid,
      client_request_id: metadata.client_request_id
    });

    deps.persist();
    deps.history("Caixa", (tipo === "saida" ? "Saída: " : "Entrada: ") + deps.formatMoney(valor) + " - " + (descricao || "Movimento manual"));
    const rotulo = tipo === "saida" && /sangria/i.test(descricao) ? "Sangria" : tipo === "saida" ? "Retirada" : metodo.name;
    deps.toast(`${rotulo} registrado no caixa.`, "sucesso", 2600);
    deps.renderApp();
  }

  async function editMovement(index, deps) {
    if (!deps.allowAction("Seu acesso está bloqueado. Regularize o plano para alterar o caixa.")) return;
    const movement = deps.getMovement(index);
    if (!movement) return;
    if (deps.isCancelled(movement)) {
      deps.toast("Movimento cancelado não pode ser editado.", "aviso", 3200);
      return;
    }
    if (!await deps.requestSensitiveActionConfirmation({ actionLabel: "editar movimento do caixa" })) return;

    const ui = deps.getUi3();
    if (!ui?.Dialog) return;
    const typeCurrent = String(movement.tipo || "entrada").toLowerCase() === "saida" ? "saida" : "entrada";
    const overlay = ui.Dialog({ title: "Editar movimento", content: `
      <form class="ui3-stack cash-edit-modal" id="cashEditForm">
        <p class="muted">Revise entrada ou saída antes de salvar. Esta ação fica protegida por biometria ou senha.</p>
        <div class="form-grid">
          <label class="field">
            <span>Tipo</span>
            <select id="cashEditTipo">
              <option value="entrada" ${typeCurrent === "entrada" ? "selected" : ""}>Entrada</option>
              <option value="saida" ${typeCurrent === "saida" ? "selected" : ""}>Saída</option>
            </select>
          </label>
          <label class="field">
            <span>Valor</span>
            <input id="cashEditValor" type="number" min="0" step="0.01" value="${deps.escapeAttr(Number(movement.valor) || 0)}" required>
          </label>
          <label class="field wide-field">
            <span>Descrição</span>
            <input id="cashEditDescricao" value="${deps.escapeAttr(deps.description(movement))}" placeholder="Ex.: material, pagamento, ferramenta">
          </label>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="cash-edit-cancel">Cancelar</button>
          <button class="btn" type="submit">${deps.actionIcon("✎", "Editar")} Salvar alteração</button>
        </div>
      </form>
  ` });
    if (!overlay) return;

    const cancelar = () => ui.closeOverlay();
    overlay.querySelectorAll('[data-action="cash-edit-cancel"]').forEach((botao) => {
      botao.addEventListener("click", cancelar, { once: true });
    });
    deps.el("cashEditForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const tipo = deps.el("cashEditTipo")?.value || "entrada";
      let valor = 0;
      try {
        valor = deps.parseNumber(deps.el("cashEditValor")?.value, "valor do caixa", { min: 0, allowZero: false });
      } catch (error) {
        deps.notifyError(error, { area: "Caixa", action: "Editar movimento" });
        return;
      }
      const descricao = deps.el("cashEditDescricao")?.value.trim() || "";
      if (tipo === "saida" && !descricao) {
        deps.alert("Para manter o caixa claro, informe a descrição da saída.");
        return;
      }
      if (!await deps.consumeCredit("registrar_caixa", "registrar entrada/saída no caixa")) return;
      const agora = deps.now();
      deps.setMovement(index, deps.prepareOnline({
        ...movement,
        tipo,
        valor,
        descricao: descricao || "Movimento manual",
        data: movement.data || agora,
        updated_at: agora,
        updatedAt: agora
      }));

      deps.persist();
      deps.scheduleSync("caixa-editado");
      deps.history("Caixa", "Movimento editado: " + deps.formatMoney(valor) + " - " + (descricao || "Movimento manual"));
      ui.closeOverlay();
      deps.renderApp();
      deps.toast("Movimento atualizado.", "sucesso", 2600);
    }, { once: true });
    setTimeout(() => deps.el("cashEditValor")?.focus(), 80);
  }

  async function cancelMovement(index, deps) {
    if (!deps.allowAction("Seu acesso está bloqueado. Regularize o plano para alterar o caixa.")) return;
    const movement = deps.getMovement(index);
    if (!movement) return;
    if (deps.isCancelled(movement)) {
      deps.toast("Este movimento já está cancelado.", "info", 2600);
      return;
    }
    const ui = deps.getUi3();
    if (!ui?.Dialog) return;
    const typeLabel = String(movement.tipo || "entrada").toLowerCase() === "saida" ? "Saída" : "Entrada";
    const overlay = ui.Dialog({ title: "Cancelar movimentação", content: `
      <form class="ui3-stack cash-cancel-modal" id="cashCancelForm">
        <div class="danger-auth-card">
          <strong>Atenção!</strong>
          <span>Essa ação não pode ser desfeita. O movimento será marcado como cancelado e não entrará mais no total.</span>
        </div>
        <div class="cash-cancel-summary">
          <span><small>Movimento</small><strong>${deps.escapeHtml(deps.description(movement))}</strong></span>
          <span><small>Tipo</small><strong>${deps.escapeHtml(typeLabel)}</strong></span>
          <span><small>Valor</small><strong>${deps.formatMoney(movement.valor)}</strong></span>
          ${movement.data ? `<span><small>Data</small><strong>${deps.escapeHtml(deps.formatDateShort(movement.data))}</strong></span>` : ""}
        </div>
        <label class="field">
          <span>Motivo do cancelamento</span>
          <input id="cashCancelReason" placeholder="Ex.: lançamento duplicado" required>
        </label>
        <p class="muted auth-inline-feedback" id="cashCancelFeedback">Depois do motivo, a autorização será feita por biometria ou senha.</p>
        <div class="actions">
          <button class="btn ghost" type="button" id="cashCancelBack">Voltar</button>
          <button class="btn danger" type="submit">Confirmar cancelamento</button>
        </div>
      </form>
  ` });
    if (!overlay) return;
    const cancelar = () => ui.closeOverlay();
    deps.el("cashCancelClose")?.addEventListener("click", cancelar, { once: true });
    deps.el("cashCancelBack")?.addEventListener("click", cancelar, { once: true });
    deps.el("cashCancelForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const motivo = String(deps.el("cashCancelReason")?.value || "").trim();
      const feedback = deps.el("cashCancelFeedback");
      if (!motivo) {
        if (feedback) feedback.textContent = "Informe o motivo do cancelamento.";
        return;
      }
      const authorized = await deps.requestSensitiveActionConfirmation({ actionLabel: "cancelar movimento do caixa" });
      if (!authorized) {
        deps.toast("Confirmação cancelada.", "info", 2600);
        return;
      }
      if (!await deps.consumeCredit("registrar_caixa", "registrar entrada/saída no caixa")) return;
      const resumo = `${typeLabel} ${deps.formatMoney(movement.valor)} - ${deps.description(movement)}`;
      const agora = deps.now();
      deps.setMovement(index, deps.prepareOnline({
        ...movement,
        status: "cancelado",
        cancelado: true,
        canceladoEm: agora,
        cancelled_at: agora,
        canceladoPor: deps.getSupabaseUserId() || deps.getUserId() || deps.getUserEmail() || "local",
        motivoCancelamento: motivo || "Cancelamento manual",
        updated_at: agora,
        updatedAt: agora
      }));
      deps.persist();
      deps.scheduleSync("caixa-cancelado");
      deps.history("Caixa", "Movimento cancelado: " + resumo);
      deps.audit("caixa_movimento_cancelado", { tipo: typeLabel, valor: movement.valor, motivo });
      ui.closeOverlay();
      deps.renderApp();
      deps.toast("Movimento cancelado.", "sucesso", 2600);
    });
    setTimeout(() => deps.el("cashCancelReason")?.focus(), 80);
  }

  const api = Object.freeze({
    openAutomaticSession,
    openManualSession,
    closeSession,
    addMovement,
    editMovement,
    cancelMovement
  });
  global.SimplificaCashCommands = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
