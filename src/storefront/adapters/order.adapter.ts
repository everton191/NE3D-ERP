import type { StorefrontLeadRecord, StorefrontOrderDraftRecord } from "../types";

export const orderAdapter = {
  leadToOrderDraft(lead: StorefrontLeadRecord): Omit<StorefrontOrderDraftRecord, "id" | "created_at" | "updated_at"> {
    return {
      store_id: lead.store_id,
      owner_id: lead.owner_id,
      lead_id: lead.id,
      customer_name: lead.customer_name || null,
      customer_phone: lead.customer_phone || null,
      items_json: lead.items_json,
      subtotal: lead.subtotal,
      status: "rascunho",
      erp_order_id: null,
    };
  },

  toErpDraft(orderDraft: StorefrontOrderDraftRecord) {
    return {
      origem: "loja_online",
      loja_id: orderDraft.store_id,
      lead_id: orderDraft.lead_id,
      cliente_nome: orderDraft.customer_name || "",
      cliente_telefone: orderDraft.customer_phone || "",
      itens: orderDraft.items_json.map((item) => ({
        produto_id: item.product_id,
        nome: item.title,
        quantidade: item.quantity,
        preco_unitario: item.unit_price,
        subtotal: item.subtotal,
      })),
      total: orderDraft.subtotal,
      status: "rascunho",
      observacoes: "Pedido rascunho criado a partir de lead da Loja Online.",
    };
  },
};
