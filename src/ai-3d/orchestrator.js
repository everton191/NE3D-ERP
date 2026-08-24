(function attachSimplifica3dAiOrchestrator(global) {
  "use strict";
  const C = global.Simplifica3dAiCore;

  function composeTool(result) {
    if (!result) return "Não consegui concluir essa consulta agora.";
    if (result.status === C.TOOL_STATUS.PERMISSION_DENIED) return "Seu acesso atual não permite consultar essas informações.";
    if (result.status === C.TOOL_STATUS.NOT_FOUND) return "Não encontrei um resultado correspondente.";
    if (result.status === C.TOOL_STATUS.AMBIGUOUS) return `Encontrei mais de uma opção: ${(result.matches || []).map((item) => item.name).join(", ")}. Qual delas você quer?`;
    if (result.status === C.TOOL_STATUS.NEEDS_INFORMATION) return result.missing?.includes("weightGrams") ? "Informe o peso da peça para eu calcular na calculadora." : "Falta uma informação para concluir o cálculo.";
    if (result.status !== C.TOOL_STATUS.SUCCESS) return "Não consegui concluir essa consulta agora.";
    if (result.tool === "customer_search") return `Encontrei ${result.customer.name}.`;
    if (result.tool === "order_history") return result.orders?.length ? `Os pedidos recentes de ${result.customerName || "esse cliente"} incluem ${result.orders.map((order) => order.items?.join(", ") || `pedido ${order.id}`).join("; ")}.` : "Não encontrei pedidos anteriores desse cliente.";
    if (result.tool === "order_search") return result.orders?.length ? `Encontrei ${result.orders.length} pedido(s).` : "Não encontrei pedidos no contexto atual.";
    if (result.tool === "price_calculate") return `O cálculo ficou em ${result.formattedPrice || `R$ ${Number(result.calculatedPrice || 0).toFixed(2).replace(".", ",")}`}.`;
    if (result.tool === "stock_search") return result.matches?.length ? result.matches.map((item) => `${item.name}: ${item.quantity} ${item.unit || ""}`.trim()).join("; ") + "." : "Não encontrei esse item no estoque.";
    if (result.tool === "stock_summary") return result.items?.length ? `O estoque tem ${result.totalItems} material(is); ${result.lowStockCount} em nível baixo.` : "Não há materiais cadastrados no estoque.";
    if (result.tool === "cash_summary") return result.metric === "sales"
      ? `Vendas: ${result.formattedSales} em ${result.orders || 0} pedido(s). O saldo do caixa no mesmo período é ${result.formattedBalance}.`
      : `Caixa: entradas ${result.formattedEntries}, saídas ${result.formattedExits} e saldo ${result.formattedBalance}. Vendas no período: ${result.formattedSales}.`;
    if (result.tool === "home_summary") return `Hoje: ${result.ordersToday} pedido(s), ${result.formattedRevenue} em pedidos e ${result.lowStockCount} alerta(s) de estoque.`;
    return "Consulta concluída.";
  }

  class AiOrchestrator3D {
    constructor({ manager, continuationResolver, contextBuilder, tools, provider, operationSafety = null, rlm = null, requirementEngine = null, loopGuard = null, telemetry = () => {} }) {
      this.manager = manager; this.resolver = continuationResolver; this.contextBuilder = contextBuilder; this.tools = tools; this.provider = provider; this.operationSafety = operationSafety; this.rlm = rlm; this.requirements = requirementEngine || new C.RequirementEngine(); this.loopGuard = loopGuard || new C.LoopGuard(); this.telemetry = telemetry;
    }
    recordTiming(stage, started, details = {}) {
      const event = {
        event: "AI_TIMING",
        stage,
        duration: Math.max(0, Date.now() - started),
        conversationId: this.manager.session.conversationId,
        taskId: this.manager.session.activeTask?.taskId || "",
        ...details
      };
      this.telemetry(event);
      return event.duration;
    }
    async runTool(intent, args, appContext) {
      const map = { "CUSTOMER.SEARCH": "customer_search", "ORDER.HISTORY": "order_history", "ORDER.SEARCH": "order_search", "PRICE.CALCULATE": "price_calculate", "STOCK.SEARCH": "stock_search", "STOCK.SUMMARY": "stock_summary", "CASH.SUMMARY": "cash_summary", "HOME.SUMMARY": "home_summary" };
      const stack = new C.TaskStack(this.manager.session); const subtask = stack.push(intent);
      const started = Date.now(); const result = await this.tools.execute(map[intent], args, { session: this.manager.session, appContext });
      stack.pop(result); this.manager.save();
      this.recordTiming("T_TOOL", started, { taskId: subtask.taskId, subtaskId: subtask.taskId, domain: intent.split(".")[0], intentType: C.INTENT_TYPE.SUBTASK, capability: intent, tool: map[intent], result: result.status });
      return result;
    }
    async handle(text, { messages = [], attachments = [], appContext = {} } = {}) {
      const responseStarted = Date.now();
      const parseStarted = Date.now();
      const classification = this.resolver.classify(text, this.manager.session);
      this.recordTiming("T_PARSE", parseStarted, { intentType: classification.type, intent: classification.intent || classification.action || "" });
      const finish = (response, result = "SUCCESS") => {
        this.recordTiming("T_RESPONSE", responseStarted, { result, intentType: classification.type });
        return response;
      };
      if (attachments.length) {
        const contextStarted = Date.now();
        const context = this.contextBuilder.build({ session: this.manager.session, app: appContext, messages, attachments });
        this.recordTiming("T_CONTEXT", contextStarted, { intentType: "IMAGE" });
        const providerStarted = Date.now();
        const answer = await this.provider.converse(text, context, attachments);
        this.recordTiming("T_PROVIDER", providerStarted, { result: "SUCCESS", capability: "VISION" });
        return finish({ classification, summary: answer, session: this.manager.session.snapshot() });
      }
      if (classification.type === C.INTENT_TYPE.NAVIGATION && classification.routeId) {
        const navigationSummary = classification.draft
          ? `Certo. Vou abrir ${classification.label || "essa tela"} com os dados preenchidos para você revisar.`
          : `Certo. Vou abrir ${classification.label || "essa tela"}.`;
        return finish({ classification, navigationTarget: { routeId: classification.routeId, label: classification.label || "tela", draft: classification.draft || null }, summary: navigationSummary, session: this.manager.session.snapshot() });
      }
      if (classification.type === C.INTENT_TYPE.NEW_TASK && classification.intent === "ORDER.CREATE") {
        this.manager.startOrder(classification.seed);
        const customer = classification.seed.customer;
        let prefix = "Pedido em rascunho iniciado.";
        if (customer) {
          const found = await this.runTool("CUSTOMER.SEARCH", { query: customer }, appContext);
          if (found.status === C.TOOL_STATUS.SUCCESS) {
            this.manager.updateSlot("customer", found.customer.name, C.SLOT_STATE.RESOLVED, "customer_search");
            this.manager.updateSlot("customerId", found.customer.id, C.SLOT_STATE.RESOLVED, "customer_search");
            this.manager.session.resolvedEntities.customer = found.customer; this.manager.save();
            const history = await this.runTool("ORDER.HISTORY", { customerId: found.customer.id, customerName: found.customer.name, limit: 5 }, appContext);
            const productMissing = this.manager.session.activeDraft?.items?.some((item) => item?.nome?.state === C.SLOT_STATE.MISSING);
            if (productMissing && history.status === C.TOOL_STATUS.SUCCESS && history.suggestedProduct) {
              this.manager.setLastQuestion({ kind: "PRODUCT_SUGGESTION", acceptUpdate: { product: history.suggestedProduct } });
              return finish({ classification, summary: `Encontrei ${found.customer.name}. Os pedidos recentes incluem principalmente ${history.suggestedProduct}. É ${history.suggestedProduct} novamente?`, session: this.manager.session.snapshot() });
            }
            prefix = `Encontrei ${found.customer.name}.`;
          }
        }
        const ready = this.requirements.isReady(this.manager.session.activeDraft);
        return finish({ classification, draftReady: ready, summary: ready ? `${prefix} O rascunho está completo. Vou abrir o pedido preenchido para você revisar e salvar.` : `${prefix} ${this.nextQuestion()}`.trim(), session: this.manager.session.snapshot() });
      }
      if (classification.action === "CANCEL_TASK") { this.manager.cancel(); return finish({ classification, summary: "Tudo bem. Descartei somente este rascunho; nenhum dado do ERP foi alterado.", session: this.manager.session.snapshot() }); }
      if (classification.action === "REJECT_SUGGESTION") { this.manager.setLastQuestion(null); return finish({ classification, summary: this.nextQuestion(), session: this.manager.session.snapshot() }); }
      if (classification.action === "PREPARE_OPERATION") {
        if (!this.operationSafety) return finish({ classification, summary: "A preparação segura não está disponível agora. Nenhum dado foi alterado.", session: this.manager.session.snapshot() }, "BLOCKED");
        const prepared = this.operationSafety.prepareOrder(appContext);
        if (prepared.status !== "SUCCESS") {
          const missing = prepared.missing?.length ? ` Ainda faltam: ${prepared.missing.join(", ")}.` : "";
          return finish({ classification, prepared, summary: `Não foi possível preparar o pedido.${missing} Nenhum dado foi alterado.`, session: this.manager.session.snapshot() }, "BLOCKED");
        }
        const payload = prepared.operation.payload;
        const live = this.operationSafety.gate?.mode === "LIVE";
        const itemLines = payload.items.map((item) => `${item.quantity} × ${item.description} — R$ ${item.unitPrice.toFixed(2).replace(".", ",")} cada${item.weightState === C.SLOT_STATE.NOT_APPLICABLE ? " — sem peso" : ""}`).join("\n");
        return finish({ classification, prepared, summary: `${live ? "Pedido pronto para sua confirmação" : "Prévia do pedido"}\nCliente: ${payload.customerName}\nItens:\n${itemLines}\nTotal: R$ ${payload.total.toFixed(2).replace(".", ",")}\n\n${live ? "Está tudo certo para salvar?" : "Esta é apenas uma simulação; nenhum dado será salvo."}`, session: this.manager.session.snapshot() });
      }
      if (classification.action === "CONFIRM_PENDING") {
        if (!this.operationSafety) return finish({ classification, summary: "A confirmação segura não está disponível. Nenhum dado foi alterado.", session: this.manager.session.snapshot() }, "BLOCKED");
        const confirmed = await this.operationSafety.confirm(appContext, this.manager.session.pendingAction?.confirmationId || "");
        if (confirmed.status === "SUCCESS") {
          const summary = confirmed.result.message;
          if (["COMMITTED", "ALREADY_COMMITTED"].includes(confirmed.result?.status)) this.manager.complete(confirmed.result);
          const navigationTarget = ["COMMITTED", "ALREADY_COMMITTED"].includes(confirmed.result?.status) && confirmed.result?.orderId
            ? { routeId: "orders.list", label: "Pedido criado", entityId: confirmed.result.orderId, entityType: "order" }
            : null;
          return finish({ classification, confirmed, summary, navigationTarget, session: this.manager.session.snapshot() });
        }
        if (confirmed.status === "DUPLICATE") return finish({ classification, confirmed, summary: confirmed.result?.message || "Este pedido já foi processado; não criei outro.", session: this.manager.session.snapshot() });
        if (confirmed.status === "STALE") return finish({ classification, confirmed, summary: "O pedido mudou depois do último resumo. Peça para conferir novamente antes de salvar.", session: this.manager.session.snapshot() }, "BLOCKED");
        if (confirmed.status === "EXPIRED") return finish({ classification, confirmed, summary: "Esse resumo ficou antigo. Peça para conferir o pedido novamente antes de salvar.", session: this.manager.session.snapshot() }, "BLOCKED");
        return finish({ classification, confirmed, summary: "A validação foi bloqueada por segurança. Prepare novamente o pedido; nenhum dado foi alterado.", session: this.manager.session.snapshot() }, "BLOCKED");
      }
      if (classification.type === C.INTENT_TYPE.TASK_UPDATE && classification.updates) {
        Object.entries(classification.updates).forEach(([name, value]) => this.manager.updateSlot(name, value, classification.updateState || C.SLOT_STATE.PROVIDED, "message", { allItems: classification.allItems === true, itemIndex: classification.itemIndex }));
        this.manager.setLastQuestion(null);
        const ready = this.requirements.isReady(this.manager.session.activeDraft);
        return finish({ classification, draftReady: ready, summary: ready ? "O rascunho está completo. Vou abrir o pedido preenchido para você revisar e salvar." : this.nextQuestion(), session: this.manager.session.snapshot() });
      }
      if (classification.type === C.INTENT_TYPE.SUBTASK) {
        const args = { ...classification.arguments };
        if (classification.intent === "PRICE.CALCULATE") {
          const item = this.manager.session.activeDraft?.items?.[0];
          args.weightGrams = Number(args.weightGrams) > 0 ? Number(args.weightGrams) : item?.pesoGramas?.value;
          args.quantity = Number(args.quantity) > 0 ? Number(args.quantity) : (item?.quantidade?.value || 1);
        }
        const result = await this.runTool(classification.intent, args, appContext);
        const continuation = this.manager.session.activeTask ? this.nextQuestion() : "";
        return finish({ classification, toolResult: result, summary: `${composeTool(result)} ${continuation}`.trim(), session: this.manager.session.snapshot() });
      }
      if (this.rlm && /\b(quanto tenho|quais pedidos|quanto vendi|tenho material suficiente|por que|qual produto|risco de atraso|desperd[ií]cio)\b/i.test(text)) {
        const rlmResult = await this.rlm.run(text, { messages, actor: appContext });
        return finish({ classification, rlmResult, summary: rlmResult.answer, session: this.manager.session.snapshot() });
      }
      const contextStarted = Date.now();
      const context = this.contextBuilder.build({ session: this.manager.session, app: appContext, messages });
      this.recordTiming("T_CONTEXT", contextStarted, { intentType: classification.type });
      const providerStarted = Date.now();
      try {
        const answer = await this.provider.converse(text, context);
        this.recordTiming("T_PROVIDER", providerStarted, { result: "SUCCESS" });
        const response = { classification, summary: answer, session: this.manager.session.snapshot() };
        return finish(response);
      } catch (error) {
        this.recordTiming("T_PROVIDER", providerStarted, { result: "FAILURE", error: "PROVIDER_UNAVAILABLE" });
        this.recordTiming("T_RESPONSE", responseStarted, { result: "FAILURE", intentType: classification.type });
        throw error;
      }
    }
    nextQuestion() {
      const evaluation = this.requirements.evaluate(this.manager.session.activeDraft);
      const missing = evaluation.missing;
      let question = missing.some((name) => name.endsWith("product")) ? "Qual é o item do pedido?"
        : missing.some((name) => name.endsWith("weightGrams")) ? "Qual é o peso em gramas? Se não se aplicar, diga “Sem peso”."
          : missing.some((name) => name.endsWith("unitPrice")) ? "Quer informar o preço ou prefere que eu abra a calculadora?"
            : "O pedido está completo. Quer que eu mostre o resumo para sua confirmação?";
      const loop = this.loopGuard.check({ session: this.manager.session, question });
      if (loop.prevented) {
        this.telemetry({ event: "AI_LOOP_PREVENTED", stage: "T_RESPONSE", duration: 0, conversationId: this.manager.session.conversationId, taskId: this.manager.session.activeTask?.taskId || "", result: "LOOP_PREVENTED" });
        question = missing.some((name) => name.endsWith("weightGrams"))
          ? "Para continuar, informe o peso ou responda apenas “Sem peso”. Também posso cancelar este rascunho."
          : "Ainda falta uma informação para continuar. Você pode respondê-la ou cancelar este rascunho.";
      }
      return question;
    }
    summarizeDraft() {
      const draft = this.manager.session.activeDraft; if (!draft) return "Não há pedido em rascunho agora.";
      const show = (entry, suffix = "") => entry?.value != null && entry.value !== "" ? `${entry.value}${suffix}` : "não informado";
      const items = (draft.items || []).map((item) => `${show(item.quantidade)} × ${show(item.nome)}, peso ${item.pesoGramas?.state === C.SLOT_STATE.NOT_APPLICABLE ? "não se aplica" : show(item.pesoGramas, " g")}, preço ${item.valor?.value ? `R$ ${Number(item.valor.value).toFixed(2).replace(".", ",")}` : "não informado"}`).join("; ");
      return `Rascunho: cliente ${show(draft.customer)}; ${items || "nenhum item"}. Nada foi salvo.`;
    }
  }

  global.Simplifica3dAiOrchestrator = Object.freeze({ AiOrchestrator3D, composeTool });
  if (typeof module !== "undefined" && module.exports) module.exports = global.Simplifica3dAiOrchestrator;
})(typeof window !== "undefined" ? window : globalThis);
