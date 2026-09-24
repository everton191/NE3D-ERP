"use strict";
const assert = require("node:assert/strict");
const commands = require("../src/features/cash/cash-commands.js");

function baseDeps(overrides = {}) {
  const state = {
    session: null,
    movements: [],
    toasts: [],
    histories: [],
    shadows: [],
    audits: [],
    persists: 0,
    renders: 0,
    scrollRenders: 0,
    syncs: [],
    credits: [],
    alerts: [],
    prompts: [],
    errors: [],
    confirmQueue: [true],
    parseImpl: (value) => Number(String(value).replace(",", ".")),
    form: {}
  };
  const deps = {
    state,
    isSimpleMode: () => true,
    getCurrentSession: () => (state.session && state.session.status === "open" ? state.session : null),
    setSession: (session) => { state.session = session; },
    summarizeSession: (session) => ({
      expectedBalance: session?.expected_balance ?? 100,
      entradas: 150,
      saidas: 50,
      porForma: { dinheiro: 100 }
    }),
    totals: () => ({ saldo: 100 }),
    now: () => "2026-09-21T12:00:00.000Z",
    dateLocalIso: () => "2026-09-21",
    hash: (value) => `h(${value})`,
    getOwnerId: () => "owner-1",
    financialFlowVersion: "shadow-v1",
    reconciliationVersion: "reconciliation-v1",
    shadow: (tipo, detalhes) => state.shadows.push({ tipo, detalhes }),
    allowAction: () => true,
    requestSensitiveActionConfirmation: async () => state.confirmQueue.shift() ?? true,
    consumeCredit: async (actionType, label) => { state.credits.push({ actionType, label }); return true; },
    parseNumber: (value, rotulo, options) => {
      const parsed = state.parseImpl(value);
      if (!Number.isFinite(parsed)) throw new Error(`inválido: ${rotulo}`);
      if (options?.min !== undefined && parsed < options.min) throw new Error(`abaixo do mínimo: ${rotulo}`);
      if (options?.allowZero === false && parsed === 0) throw new Error(`zero: ${rotulo}`);
      return parsed;
    },
    notifyError: (error, meta) => state.errors.push({ error, meta }),
    alert: (mensagem) => state.alerts.push(mensagem),
    prompt: (mensagem, padrao) => {
      state.prompts.push({ mensagem, padrao });
      return state.promptResponses?.shift() ?? null;
    },
    toast: (mensagem, tipo, duracao) => state.toasts.push({ mensagem, tipo, duracao }),
    formatMoney: (valor) => `R$ ${Number(valor || 0).toFixed(2)}`,
    normalizePayment: (valor) => ({
      id: String(valor || "pix").toLowerCase(),
      name: String(valor || "Pix"),
      type: String(valor || "pix").toLowerCase()
    }),
    criarMetadadosOperacaoFinanceira: (tipo, referencia, opcoes) => ({
      operation_uuid: `uuid-${tipo}-${referencia.id}`,
      client_request_id: `req-${tipo}-${referencia.id}`,
      created_from_device: "device-a",
      created_at: opcoes?.createdAt || "2026-09-21T12:00:00.000Z"
    }),
    prepareOnline: (registro) => ({ ...registro, sync_status: "pending" }),
    pushMovement: (movimento) => state.movements.push(movimento),
    getMovement: (indice) => state.movements[indice],
    setMovement: (indice, movimento) => { state.movements[indice] = movimento; },
    isCancelled: (movimento) => Boolean(movimento.cancelado || movimento.status === "cancelado"),
    description: (movimento) => movimento.descricao || "Movimento",
    formatDateShort: () => "21/09",
    escapeHtml: (valor) => String(valor),
    escapeAttr: (valor) => String(valor),
    actionIcon: (icone) => icone,
    el: (id) => state.form[id] || null,
    getUi3: () => state.ui3 || null,
    persist: () => { state.persists += 1; },
    history: (acao, detalhes, metadata) => state.histories.push({ acao, detalhes, metadata }),
    audit: (acao, detalhes) => state.audits.push({ acao, detalhes }),
    scheduleSync: (motivo) => state.syncs.push(motivo),
    renderApp: () => { state.renders += 1; },
    renderPreservingScroll: () => { state.scrollRenders += 1; },
    getUserEmail: () => "user@example.com",
    getUserId: () => "user-1",
    getSupabaseUserId: () => "supa-1",
    ...overrides
  };
  return deps;
}

(async () => {
  {
    const deps = baseDeps();
    const session = commands.openAutomaticSession("auto", deps);
    assert.equal(session.status, "open");
    assert.equal(session.mode, "auto");
    assert.equal(session.reason, "auto");
    assert.equal(session.financial_flow_version, "shadow-v1");
    assert.equal(session.reconciliation_version, "reconciliation-v1");
    assert.equal(session.opening_balance, 100);
    assert.equal(session.expected_balance, 100);
    assert.equal(deps.state.session.id, session.id);
    assert.equal(deps.state.shadows[0].tipo, "cash_session_auto_open");
    const again = commands.openAutomaticSession("outro", deps);
    assert.equal(again.id, session.id, "reabertura deve ser idempotente");
    assert.equal(deps.state.shadows.length, 1, "idempotência não deve regravar shadow");
    const blocked = commands.openAutomaticSession("auto", baseDeps({ isSimpleMode: () => false }));
    assert.equal(blocked, null, "modo simples desativado bloqueia abertura");
  }

  {
    const deps = baseDeps();
    deps.state.confirmQueue = [false];
    await commands.openManualSession(deps);
    assert.equal(deps.state.session, null, "confirmação negada bloqueia abertura manual");
    deps.state.confirmQueue = [true];
    await commands.openManualSession(deps);
    assert.equal(deps.state.session.status, "open");
    assert.equal(deps.state.persists, 1);
    assert.equal(deps.state.toasts[0].mensagem, "Caixa aberto.");
    assert.equal(deps.state.scrollRenders, 1);
  }

  {
    const deps = baseDeps();
    await commands.closeSession(deps);
    assert.equal(deps.state.toasts[0].mensagem, "O caixa já está fechado.");

    deps.state.session = { id: "s1", status: "open", expected_balance: 100, porForma: {} };
    deps.state.promptResponses = [null];
    await commands.closeSession(deps);
    assert.equal(deps.state.toasts.at(-1).mensagem, "Fechamento cancelado.");

    deps.state.promptResponses = ["abc"];
    deps.state.parseImpl = () => { throw new Error("nan"); };
    await commands.closeSession(deps);
    assert.equal(deps.state.errors.length, 1);

    deps.state.parseImpl = (value) => Number(String(value).replace(",", "."));
    deps.state.promptResponses = ["110"];
    await commands.closeSession(deps);
    assert.equal(deps.state.toasts.at(-1).mensagem, "Informe a justificativa da diferença para fechar o caixa.", "diferença exige justificativa");

    deps.state.promptResponses = ["110", "troco"];
    await commands.closeSession(deps);
    assert.equal(deps.state.session.status, "closed");
    assert.equal(deps.state.session.closing_difference, 10);
    assert.equal(deps.state.session.closing_reason, "troco");
    assert.equal(deps.state.shadows.at(-1).tipo, "cash_session_closed_basic");
    assert.equal(deps.state.persists, 1);
    assert.equal(deps.state.histories.at(-1).metadata.event_type, "cash_session_closed");
    assert.equal(deps.state.toasts.at(-1).mensagem, "Caixa fechado com sucesso.");
    assert.equal(deps.state.scrollRenders, 1);
  }

  {
    const deps = baseDeps();
    deps.state.form = { caixaTipo: { value: "saida" }, caixaValor: { value: "10" }, caixaDescricao: { value: "" }, caixaMetodoPagamento: { value: "dinheiro" } };
    await commands.addMovement(deps);
    assert.equal(deps.state.alerts[0], "Para lançar uma saída, informe a descrição. Ex.: 2 reais caneta");
    assert.equal(deps.state.movements.length, 0);

    deps.state.form.caixaDescricao = { value: "material" };
    deps.state.confirmQueue = [false];
    await commands.addMovement(deps);
    assert.equal(deps.state.credits.length, 0, "confirmação negada não consome crédito");
    assert.equal(deps.state.movements.length, 0);

    deps.state.confirmQueue = [true];
    await commands.addMovement(deps);
    assert.equal(deps.state.movements.length, 1);
    const movement = deps.state.movements[0];
    assert.equal(movement.tipo, "saida");
    assert.equal(movement.valor, 10);
    assert.equal(movement.payment_method_id, "dinheiro");
    assert.match(movement.operation_uuid, /^uuid-caixa_manual-/);
    assert.equal(movement.cash_session_id, deps.state.session.id);
    assert.equal(deps.state.credits[0].actionType, "registrar_caixa");
    assert.equal(deps.state.shadows.at(-1).tipo, "caixa_manual_shadow");
    assert.equal(deps.state.persists, 1);
    assert.match(deps.state.histories.at(-1).detalhes, /^Saída:/);
    assert.match(deps.state.toasts.at(-1).mensagem, /registrado no caixa\./);
    assert.equal(deps.state.renders, 1);
  }

  {
    const deps = baseDeps();
    deps.state.movements = [{ id: 1, tipo: "entrada", valor: 5, descricao: "ok", cancelado: true }];
    await commands.editMovement(0, deps);
    assert.equal(deps.state.toasts[0].mensagem, "Movimento cancelado não pode ser editado.");

    deps.state.movements = [{ id: 1, tipo: "entrada", valor: 5, descricao: "ok" }];
    deps.state.confirmQueue = [false];
    await commands.editMovement(0, deps);
    assert.equal(deps.state.credits.length, 0);

    let submit = null;
    const overlay = {
      querySelectorAll: () => []
    };
    deps.state.ui3 = {
      Dialog: () => overlay,
      closeOverlay: () => { deps.state.ui3.closed = true; }
    };
    deps.state.form = {
      cashEditForm: { addEventListener: (type, handler) => { submit = handler; } },
      cashEditTipo: { value: "saida" },
      cashEditValor: { value: "20" },
      cashEditDescricao: { value: "" },
      cashEditValor_focus: null
    };
    deps.state.form.cashEditValor.focus = () => {};
    deps.state.confirmQueue = [true];
    await commands.editMovement(0, deps);
    assert.ok(submit, "edição deve registrar o submit do diálogo");
    await submit({ preventDefault: () => {} });
    assert.equal(deps.state.alerts[0], "Para manter o caixa claro, informe a descrição da saída.");
    assert.equal(deps.state.movements[0].valor, 5, "saída sem descrição não edita");

    deps.state.form.cashEditDescricao = { value: "retrabalho" };
    await submit({ preventDefault: () => {} });
    assert.equal(deps.state.movements[0].tipo, "saida");
    assert.equal(deps.state.movements[0].valor, 20);
    assert.equal(deps.state.movements[0].descricao, "retrabalho");
    assert.equal(deps.state.persists, 1);
    assert.equal(deps.state.syncs[0], "caixa-editado");
    assert.equal(deps.state.ui3.closed, true);
    assert.equal(deps.state.renders, 1);
    assert.equal(deps.state.toasts.at(-1).mensagem, "Movimento atualizado.");
  }

  {
    const deps = baseDeps();
    deps.state.movements = [{ id: 1, tipo: "entrada", valor: 5, descricao: "ok", cancelado: true }];
    await commands.cancelMovement(0, deps);
    assert.equal(deps.state.toasts[0].mensagem, "Este movimento já está cancelado.");

    deps.state.movements = [{ id: 1, tipo: "entrada", valor: 5, descricao: "ok", data: "2026-09-21" }];
    let submit = null;
    const feedback = { textContent: "" };
    deps.state.ui3 = {
      Dialog: () => ({ querySelectorAll: () => [] }),
      closeOverlay: () => { deps.state.ui3.closed = true; }
    };
    deps.state.form = {
      cashCancelBack: { addEventListener: () => {} },
      cashCancelClose: { addEventListener: () => {} },
      cashCancelForm: { addEventListener: (type, handler) => { submit = handler; } },
      cashCancelReason: { value: "" },
      cashCancelFeedback: feedback
    };
    deps.state.form.cashCancelReason.focus = () => {};
    await commands.cancelMovement(0, deps);
    assert.ok(submit);
    await submit({ preventDefault: () => {} });
    assert.equal(feedback.textContent, "Informe o motivo do cancelamento.");
    assert.equal(deps.state.movements[0].cancelado, undefined);

    deps.state.form.cashCancelReason.value = "duplicado";
    deps.state.confirmQueue = [false];
    await submit({ preventDefault: () => {} });
    assert.equal(deps.state.toasts.at(-1).mensagem, "Confirmação cancelada.");
    assert.equal(deps.state.credits.length, 0);

    deps.state.confirmQueue = [true];
    await submit({ preventDefault: () => {} });
    assert.equal(deps.state.movements[0].status, "cancelado");
    assert.equal(deps.state.movements[0].motivoCancelamento, "duplicado");
    assert.equal(deps.state.movements[0].canceladoPor, "supa-1");
    assert.equal(deps.state.audits[0].acao, "caixa_movimento_cancelado");
    assert.equal(deps.state.syncs[0], "caixa-cancelado");
    assert.equal(deps.state.ui3.closed, true);
    assert.equal(deps.state.renders, 1);
    assert.match(deps.state.histories.at(-1).detalhes, /^Movimento cancelado:/);
  }

  console.log("Cash commands: sessão, abertura, fechamento, lançamento, edição e cancelamento preservados.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
