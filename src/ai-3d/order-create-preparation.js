(function attachOrderCreatePreparation(global) {
  "use strict";

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

  class OrderPreparationError extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "OrderPreparationError";
      this.code = code;
      this.details = details;
    }
  }

  class OrderCreatePreparationUseCase {
    constructor(dependencies = {}) {
      this.dependencies = dependencies;
    }

    prepare(input = {}) {
      const deps = this.dependencies;
      const required = ["sanitizeItems", "normalizeItems", "calculateFinancialSummary", "normalizePaymentMethod", "createOperationMetadata", "prepareOnlineRecord"];
      const missingDependencies = required.filter((name) => typeof deps[name] !== "function");
      if (missingDependencies.length) {
        throw new OrderPreparationError("DEPENDENCY_UNAVAILABLE", "Preparação de pedido indisponível.", { missingDependencies });
      }

      const customer = String(input.customer?.name || "").trim();
      if (!customer) throw new OrderPreparationError("CUSTOMER_REQUIRED", "Digite o nome do cliente.");

      const sanitized = deps.sanitizeItems(input.items || []);
      if (sanitized.invalidos?.length) {
        throw new OrderPreparationError("INVALID_ITEMS", "Revise os itens: todos precisam ter descrição, quantidade e valor maior que zero.", {
          invalidItems: clone(sanitized.invalidos)
        });
      }
      if (!sanitized.validos?.length) throw new OrderPreparationError("ITEMS_REQUIRED", "Nenhum item no pedido.");

      const items = deps.normalizeItems(sanitized.validos);
      const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      const financial = deps.calculateFinancialSummary({
        itens: items,
        subtotalItens: subtotal,
        desconto: input.discount?.value,
        descontoTipo: input.discount?.type,
        descontoPercentual: input.discount?.percentage,
        down_payment: input.downPayment
      });
      const paymentMethod = deps.normalizePaymentMethod(input.paymentMethodId || "pix");
      const operationId = input.operation?.orderId;
      const sequenceNumber = input.operation?.sequenceNumber;
      const updatedAt = input.operation?.updatedAt;
      const operationMetadata = deps.createOperationMetadata(input.operation?.kind || "pedido_create", {
        id: operationId,
        numeroPedido: sequenceNumber,
        numero_pedido: sequenceNumber,
        cliente: customer,
        total: financial.total,
        status: input.status,
        itens: items,
        atualizadoEm: updatedAt
      }, input.operation?.metadataOptions || {});

      const record = deps.prepareOnlineRecord({
        id: operationId,
        cliente: customer,
        clienteTelefone: String(input.customer?.phone || ""),
        clienteEmail: String(input.customer?.email || ""),
        emailCliente: String(input.customer?.email || ""),
        itens: clone(items),
        subtotalItens: subtotal,
        subtotal_itens: subtotal,
        desconto: financial.desconto,
        total: financial.total,
        down_payment: financial.entrada,
        valor_entrada: financial.entrada,
        valorRestante: financial.restante,
        valor_restante: financial.restante,
        financial_status: financial.statusFinanceiro,
        status_financeiro: financial.statusFinanceiro,
        status: input.status || "aberto",
        observacao: String(input.notes || ""),
        observacoes: String(input.notes || ""),
        prazo: String(input.dueDate || ""),
        dataPrazo: String(input.dueDate || ""),
        payment_method_id: paymentMethod.id,
        paymentMethodId: paymentMethod.id,
        paymentMethod: paymentMethod.name,
        payment_method_type: paymentMethod.type,
        clienteSuggestionSource: String(input.customerSuggestion?.source || ""),
        clienteSuggestionName: String(input.customerSuggestion?.name || ""),
        clienteSuggestionPhone: String(input.customerSuggestion?.phone || ""),
        ...operationMetadata,
        data: input.operation?.originalDate || input.operation?.displayDate,
        criadoEm: input.operation?.createdAt,
        atualizadoEm: updatedAt
      });

      return Object.freeze({
        record,
        items,
        subtotal,
        financial,
        paymentMethod,
        operationMetadata
      });
    }
  }

  class OrderCreateShadowPipeline {
    constructor({ canonicalApi, preparationUseCase, shadowPersistence }) {
      this.canonicalApi = canonicalApi;
      this.preparationUseCase = preparationUseCase;
      this.shadowPersistence = shadowPersistence;
    }

    prepare(canonicalPayload, operation = {}) {
      if (!this.canonicalApi?.OrderCreateAdapter || !this.preparationUseCase || !this.shadowPersistence) {
        throw new OrderPreparationError("SHADOW_DEPENDENCY_UNAVAILABLE", "Preparação simulada indisponível.");
      }
      const canonical = this.canonicalApi.createCanonicalOrder(canonicalPayload);
      const mapped = new this.canonicalApi.OrderCreateAdapter().map(canonical);
      const prepared = this.preparationUseCase.prepare({
        customer: { name: mapped.cliente, phone: mapped.clienteTelefone, email: mapped.clienteEmail },
        items: mapped.itens,
        discount: { value: mapped.desconto },
        downPayment: mapped.down_payment,
        paymentMethodId: mapped.payment_method_id,
        status: mapped.status,
        notes: mapped.observacao,
        dueDate: mapped.prazo,
        operation
      });
      return this.shadowPersistence.persist(prepared.record, { payload: canonical, prepared });
    }
  }

  global.Simplifica3dOrderCreatePreparation = Object.freeze({ OrderPreparationError, OrderCreatePreparationUseCase, OrderCreateShadowPipeline });
  if (typeof module !== "undefined" && module.exports) module.exports = global.Simplifica3dOrderCreatePreparation;
})(typeof window !== "undefined" ? window : globalThis);
