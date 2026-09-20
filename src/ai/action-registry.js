(function attachSimplificaActionRegistry(global) {
  "use strict";

  const OPERATION = Object.freeze({ READ: "READ", PREPARE: "PREPARE", WRITE: "WRITE" });
  const HEALTH = Object.freeze({ READY: "READY", DEGRADED: "DEGRADED", DISABLED: "DISABLED", BROKEN: "BROKEN" });
  const INPUT_REQUIREMENTS = Object.freeze({
    "navigation.open": Object.freeze({ requiredAll: Object.freeze(["tela"]) }),
    "orders.search": Object.freeze({ requiredAny: Object.freeze(["query", "status", "customer"]) }),
    "orders.get": Object.freeze({ requiredAll: Object.freeze(["order_id"]) }),
    "orders.prepare_create": Object.freeze({ requiredAll: Object.freeze(["customer_id", "items"]) }),
    "orders.prepare_update": Object.freeze({ requiredAll: Object.freeze(["order_id", "proposed", "idempotency_key"]) }),
    "orders.prepare_cancel": Object.freeze({ requiredAll: Object.freeze(["order_id", "reason", "return_stock", "idempotency_key"]) }),
    "customers.search": Object.freeze({ requiredAll: Object.freeze(["query"]) }),
    "inventory.search": Object.freeze({ requiredAny: Object.freeze(["query", "status"]) }),
    "calculator.quote": Object.freeze({ requiredAll: Object.freeze(["weight_grams", "time_minutes", "quantity"]) }),
    "products.search": Object.freeze({ requiredAll: Object.freeze(["query"]) }),
    "printers.search": Object.freeze({ requiredAny: Object.freeze(["query", "status"]) })
  });
  // Workflow metadata is declarative rather than an alternate business layer.
  // It only constrains what a model may see; domain executors remain canonical.
  const WORKFLOW = Object.freeze({
    "orders.search": { produces: ["order_refs"], allowedNext: ["orders.get", "orders.prepare_update", "orders.prepare_cancel"] },
    "orders.get": { requires: ["order_id"], produces: ["order"], allowedNext: ["orders.prepare_update", "orders.prepare_cancel"] },
    "orders.prepare_create": { requires: ["customer_id"], produces: ["prepared_operation"], allowedNext: ["orders.commit_create"] },
    "orders.prepare_update": { requires: ["order_id"], produces: ["prepared_operation"], allowedNext: ["orders.update"] },
    "orders.prepare_cancel": { requires: ["order_id"], produces: ["prepared_operation"], allowedNext: ["orders.cancel"] },
    "customers.search": { produces: ["customer_refs"], allowedNext: ["customers.get", "orders.prepare_create"] },
    "inventory.search": { produces: ["material_refs", "roll_refs"], allowedNext: ["inventory.get_roll", "inventory.history", "inventory.prepare_reservation", "inventory.prepare_consume"] },
    "inventory.get_roll": { requires: ["roll_id"], produces: ["roll"], allowedNext: ["inventory.history", "inventory.prepare_consume"] },
    "cash.prepare_withdrawal": { produces: ["prepared_operation"], allowedNext: ["cash.commit_withdrawal"] },
    "cash.prepare_deposit": { produces: ["prepared_operation"], allowedNext: ["cash.commit_deposit"] },
    "cash.prepare_close_session": { requires: ["session_id"], produces: ["prepared_operation"], allowedNext: ["cash.close_session"] },
    "production.list_queue": { produces: ["job_refs"], allowedNext: ["production.prepare_change_status"] },
    "production.prepare_job": { requires: ["order_id"], produces: ["prepared_operation"], allowedNext: ["production.commit_job"] },
    "production.prepare_change_status": { requires: ["job_id"], produces: ["prepared_operation"], allowedNext: ["production.change_status"] },
    "calculator.quote": { produces: ["weight_grams", "time_minutes"], allowedNext: ["orders.prepare_create"] }
  });

  const definitions = [
    ["navigation.open", "navigation", "READ", "Abre uma tela conhecida do Simplifica 3D.", "navigation.open", "authenticated", false, true, ["tela"], ["abrir", "abre", "ir para", "vai", "mostrar tela"]],
    ["orders.search", "orders", "READ", "Busca pedidos sem alterar dados.", "order_search", "basic_orders", false, true, ["query", "status", "customer"], ["buscar pedido", "procurar pedido", "mostrar pedido", "pedidos atrasados"]],
    ["orders.get", "orders", "READ", "Obtém um pedido por ID previamente resolvido.", "order_history", "basic_orders", false, true, ["order_id"], ["ver pedido", "detalhes do pedido"]],
    ["orders.prepare_create", "orders", "PREPARE", "Valida e prepara a criação de pedido sem gravar.", "OrderCreatePreparationUseCase", "basic_orders", false, true, ["customer_id", "items"], ["preparar pedido", "montar pedido"]],
    ["orders.prepare_update", "orders", "PREPARE", "Valida e prepara a edição de um pedido sem gravar.", "EditOrderUseCase.prepare", "basic_orders", false, true, ["order_id", "proposed", "idempotency_key"], ["preparar edição", "revisar alteração do pedido"]],
    ["orders.prepare_cancel", "orders", "PREPARE", "Produz plano determinístico de cancelamento sem gravar.", "CancelOrderUseCase.prepare", "basic_orders", false, true, ["order_id", "reason", "return_stock", "idempotency_key"], ["preparar cancelamento", "revisar cancelamento"]],
    ["orders.commit_create", "orders", "WRITE", "Confirma uma criação de pedido previamente preparada.", "SafeOperationPipeline.prepareOrder", "basic_orders", true, false, ["prepared_operation_id", "confirmation_token"], ["confirmar pedido", "salvar pedido"]],
    ["orders.update", "orders", "WRITE", "Atualiza pedido existente por operação preparada.", "EditOrderUseCase.commit", "basic_orders", true, true, ["prepared_operation_id", "confirmation_token", "idempotency_key"], ["alterar pedido", "editar pedido"]],
    ["orders.cancel", "orders", "WRITE", "Cancela pedido com devolução e regras financeiras.", "CancelOrderUseCase.commit", "basic_orders", true, true, ["prepared_operation_id", "confirmation_token", "idempotency_key"], ["cancelar pedido"]],
    ["customers.search", "customers", "READ", "Busca clientes e retorna IDs reais.", "customer_search", "basic_orders", false, true, ["query"], ["buscar cliente", "procurar cliente"]],
    ["customers.get", "customers", "READ", "Obtém cliente por ID previamente resolvido.", "", "basic_orders", false, false, ["customer_id"], ["ver cliente", "dados do cliente"]],
    ["inventory.search", "inventory", "READ", "Busca materiais e rolos sem alterar estoque.", "stock_search", "basic_stock", false, true, ["query", "status"], ["ver estoque", "quanto tem", "procurar filamento", "PLA", "rolo", "material"]],
    ["inventory.get_roll", "inventory", "READ", "Obtém um rolo por ID previamente resolvido.", "", "basic_stock", false, false, ["roll_id"], ["ver rolo", "detalhes do rolo"]],
    ["inventory.history", "inventory", "READ", "Consulta histórico de estoque.", "InventoryService", "basic_stock", false, false, ["material_id", "roll_id"], ["histórico do estoque", "movimentos do rolo"]],
    ["inventory.prepare_reservation", "inventory", "PREPARE", "Valida reserva de material sem gravar.", "InventoryReserveUseCase.prepare", "basic_stock", false, false, ["material_id", "amount", "order_id", "idempotency_key"], ["preparar reserva", "separar material"]],
    ["inventory.prepare_release", "inventory", "PREPARE", "Valida liberação de reserva sem gravar.", "InventoryReleaseUseCase.prepare", "basic_stock", false, false, ["reservation_id", "amount", "reason", "idempotency_key"], ["preparar liberação", "revisar liberação"]],
    ["inventory.prepare_consume", "inventory", "PREPARE", "Valida consumo de material sem gravar.", "InventoryConsumeUseCase.prepare", "basic_stock", false, false, ["roll_id", "amount", "idempotency_key"], ["preparar baixa", "revisar consumo"]],
    ["inventory.reserve", "inventory", "WRITE", "Reserva material por operação confirmada.", "InventoryReserveUseCase.commit", "basic_stock", true, false, ["prepared_operation_id", "confirmation_token"], ["reservar material"]],
    ["inventory.release", "inventory", "WRITE", "Libera reserva existente.", "InventoryReleaseUseCase.commit", "basic_stock", true, false, ["prepared_operation_id", "confirmation_token", "idempotency_key"], ["liberar reserva"]],
    ["inventory.consume", "inventory", "WRITE", "Registra consumo real de material.", "InventoryConsumeUseCase.commit", "basic_stock", true, false, ["prepared_operation_id", "confirmation_token", "idempotency_key"], ["dar baixa", "baixar", "consumir", "usar material"]],
    ["cash.get_summary", "cash", "READ", "Consulta entradas, saídas e saldo do caixa.", "cash_summary", "simple_cashier", false, true, ["period"], ["resumo do caixa", "saldo do caixa"]],
    ["cash.prepare_withdrawal", "cash", "PREPARE", "Valida uma sangria sem movimentar dinheiro.", "CashWithdrawalUseCase.prepare", "simple_cashier", false, false, ["amount", "description", "idempotency_key"], ["preparar sangria", "retirar dinheiro"]],
    ["cash.commit_withdrawal", "cash", "WRITE", "Confirma sangria previamente preparada.", "CashWithdrawalUseCase.commit", "simple_cashier", true, false, ["prepared_operation_id", "confirmation_token"], ["confirmar sangria"]],
    ["cash.prepare_deposit", "cash", "PREPARE", "Valida um suprimento sem movimentar dinheiro.", "CashDepositUseCase.prepare", "simple_cashier", false, false, ["amount", "description", "idempotency_key"], ["preparar suprimento", "adicionar dinheiro"]],
    ["cash.commit_deposit", "cash", "WRITE", "Confirma suprimento previamente preparado.", "CashDepositUseCase.commit", "simple_cashier", true, false, ["prepared_operation_id", "confirmation_token"], ["confirmar suprimento"]],
    ["cash.open_session", "cash", "WRITE", "Abre uma sessão de caixa.", "abrirSessaoCaixaAutomatica", "simple_cashier", true, false, ["opening_amount", "idempotency_key"], ["abrir caixa"]],
    ["cash.prepare_close_session", "cash", "PREPARE", "Calcula a conferência de fechamento sem persistir.", "CashCloseSessionUseCase.prepare", "simple_cashier", false, false, ["session_id", "counted_amount", "idempotency_key"], ["preparar fechamento", "conferir caixa"]],
    ["cash.close_session", "cash", "WRITE", "Fecha uma sessão de caixa.", "CashCloseSessionUseCase.commit", "simple_cashier", true, false, ["prepared_operation_id", "confirmation_token", "idempotency_key"], ["fechar caixa"]],
    ["calculator.quote", "calculator", "READ", "Calcula preço por código determinístico.", "CalculatorDomain.calculate", "basic_calculator", false, true, ["weight_grams", "time_minutes", "quantity"], ["calcular preço", "fazer orçamento", "quanto custa"]],
    ["calculator.batch", "calculator", "READ", "Calcula vários orçamentos sem persistir.", "CalculatorDomain.calculate", "basic_calculator", false, false, ["items"], ["calcular em lote", "vários orçamentos"]],
    ["production.list_queue", "production", "READ", "Consulta a fila e o estado atual das impressões sem alterar dados.", "productionSummaryReadOnly", "basic_production", false, true, ["status"], ["fila de produção", "o que tem na produção", "impressão pendente", "qual impressão está rodando"]],
    ["production.prepare_job", "production", "PREPARE", "Prepara trabalho de produção sem mudar status.", "ProductionPrepareUseCase.prepare", "basic_production", false, false, ["order_id", "printer_id", "idempotency_key"], ["preparar impressão", "colocar na fila", "enviar para produção"]],
        ["production.commit_job", "production", "WRITE", "Cria trabalho de produção previamente preparado.", "ProductionPrepareUseCase.commit", "basic_production", true, false, ["prepared_operation_id", "confirmation_token"], ["confirmar trabalho", "enviar para produção"]],
        ["production.prepare_change_status", "production", "PREPARE", "Valida mudança de status sem persistir.", "ProductionChangeStatusUseCase.prepare", "basic_production", false, false, ["job_id", "status", "idempotency_key"], ["preparar mudança de status", "revisar status"]],
        ["production.change_status", "production", "WRITE", "Altera status de produção após confirmação.", "ProductionChangeStatusUseCase.commit", "basic_production", true, false, ["prepared_operation_id", "confirmation_token", "idempotency_key"], ["iniciar impressão", "marcar como pronto"]],
        ["products.search", "products", "READ", "Busca produtos cadastrados sem alterar catálogo ou estoque.", "searchProductsReadOnly", "basic_products", false, true, ["query"], ["buscar produto", "procurar produto", "mostrar produto"]],
        ["printers.search", "printers", "READ", "Consulta impressoras cadastradas e o estado de impressão.", "searchPrintersReadOnly", "printer_registry", false, true, ["query", "status"], ["buscar impressora", "qual impressora", "impressora imprimindo", "status da impressora"]],
        ["reports.open", "reports", "READ", "Abre a tela de relatórios sem alterar dados.", "navigation.open", "simple_reports", false, true, [], ["abrir relatórios", "ver relatórios", "mostrar relatórios"]],
        // === NÓS FUTUROS - PLANNED/DISABLED (sem handler, sem rota, sem rota, sem handler) ===
        ["fiscal.invoice.search", "fiscal", "READ", "Busca notas fiscais emitidas sem alterar dados. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["query"], []],
        ["fiscal.invoice.details", "fiscal", "READ", "Obtém detalhes de nota fiscal por ID. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["invoice_id"], []],
        ["fiscal.invoice.prepare_issue", "fiscal", "PREPARE", "Prepara emissão de nota fiscal sem persistir. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["order_id", "invoice_type", "idempotency_key"], []],
        ["fiscal.invoice.prepare_cancel", "fiscal", "PREPARE", "Prepara cancelamento de NF sem persistir. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["invoice_id", "reason", "idempotency_key"], []],
        ["fiscal.invoice.prepare_correction", "fiscal", "PREPARE", "Prepara correção de NF sem persistir. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["invoice_id", "correction_data", "idempotency_key"], []],
        ["fiscal.settings", "fiscal", "READ", "Abre configurações fiscais. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, [], []],
        ["fiscal.certificate", "fiscal", "READ", "Consulta certificados fiscais. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["certificate_id"], []],
        ["finance.accounts_payable", "finance", "READ", "Consulta contas a pagar. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["query"], []],
        ["finance.accounts_receivable", "finance", "READ", "Consulta contas a receber. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["query"], []],
        ["purchases.search", "purchases", "READ", "Busca compras registradas. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["query"], []],
        ["shipping.status", "shipping", "READ", "Consulta status de frete/entrega. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["tracking_number"], []],
        ["crm.search", "crm", "READ", "Consulta dados do CRM. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["query"], []],
        ["maintenance.list", "maintenance", "READ", "Consulta agenda de manutenção. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["query"], []],
        ["quality.search", "quality", "READ", "Consulta registros de qualidade. NÓ FUTURO - NÃO IMPLEMENTADO.", "", "", false, false, ["query"], []]
  ];

  const actions = definitions.map(([id, domain, operationType, description, handler, permission, requiresConfirmation, tested, fields, aliases]) => Object.freeze({
    id, version: 1, domain, category: domain, operationType, readWrite: operationType === OPERATION.WRITE ? "write" : "read", description, handler, executor: handler, permission, requiresConfirmation,
    idempotent: operationType !== OPERATION.WRITE || fields.includes("idempotency_key") || fields.includes("prepared_operation_id"),
    inputSchema: Object.freeze({
      type: "object",
      allowed: Object.freeze(fields),
      requiredAll: INPUT_REQUIREMENTS[id]?.requiredAll || Object.freeze([]),
      requiredAny: INPUT_REQUIREMENTS[id]?.requiredAny || Object.freeze([])
    }), validator: fields.length ? "strict-object-validator" : "empty-object-validator",
    requires: Object.freeze(WORKFLOW[id]?.requires || []), produces: Object.freeze(WORKFLOW[id]?.produces || []),
    allowedNext: Object.freeze(WORKFLOW[id]?.allowedNext || []), terminal: !(WORKFLOW[id]?.allowedNext?.length),
    aliases: Object.freeze(aliases), examples: Object.freeze(aliases.slice(0, 2)), tested,
    enabled: Boolean(handler) && tested, exposedToModel: Boolean(handler) && operationType !== OPERATION.WRITE
  }));

  const byId = new Map(actions.map((action) => [action.id, action]));
  function health(action) {
    const errors = [];
    if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(action.id)) errors.push("INVALID_ID");
    if (!action.inputSchema) errors.push("MISSING_SCHEMA");
    if (!action.validator) errors.push("MISSING_VALIDATOR");
    if (action.handler && !action.permission) errors.push("MISSING_PERMISSION");
    if (!action.handler) errors.push("MISSING_HANDLER");
    if (!action.tested) errors.push("MISSING_CONTRACT_TEST");
    if (action.operationType === OPERATION.WRITE && (!action.requiresConfirmation || !action.idempotent)) errors.push("UNSAFE_WRITE_POLICY");
    const state = errors.some((error) => error === "INVALID_ID" || error === "MISSING_SCHEMA" || error === "MISSING_VALIDATOR" || error === "UNSAFE_WRITE_POLICY")
      ? HEALTH.BROKEN : action.enabled && errors.length === 0 ? HEALTH.READY : action.handler ? HEALTH.DEGRADED : HEALTH.DISABLED;
    return Object.freeze({ id: action.id, state, exposed: state === HEALTH.READY && action.exposedToModel === true, errors: Object.freeze(errors) });
  }
  function validateRegistry() {
    const duplicates = actions.filter((action, index) => actions.findIndex((candidate) => candidate.id === action.id) !== index).map((action) => action.id);
    const report = actions.map(health);
    return Object.freeze({ ok: duplicates.length === 0 && report.every((item) => item.state !== HEALTH.BROKEN), duplicates, actions: report });
  }
  function compactManifest() {
    return { version: 1, domains: actions.reduce((all, action) => { if (health(action).exposed) (all[action.domain] ||= { actions: [] }).actions.push(action.id); return all; }, {}) };
  }
  const api = Object.freeze({ OPERATION, HEALTH, actions: Object.freeze(actions), get: (id) => byId.get(id), health, validateRegistry, compactManifest });
  global.SimplificaActionRegistry = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
