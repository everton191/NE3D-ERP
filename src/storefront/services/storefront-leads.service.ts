import { cartAdapter, type CartInputItem } from "../adapters/cart.adapter";
import type {
  StorefrontLeadPayload,
  StorefrontLeadRecord,
  StorefrontProductRecord,
  StorefrontStoreRecord,
  StorefrontSupabasePort,
} from "../types";

export class StorefrontLeadsService {
  constructor(private readonly supabase: StorefrontSupabasePort) {}

  buildLeadPayload(input: {
    store: StorefrontStoreRecord;
    products: StorefrontProductRecord[];
    cartItems: CartInputItem[];
    storeUrl: string;
    customerName?: string | null;
    customerPhone?: string | null;
    customerNote?: string | null;
  }): StorefrontLeadPayload {
    const items = cartAdapter.toLeadItems(input.cartItems, input.products);
    const subtotal = cartAdapter.subtotal(items);
    const whatsappMessage = cartAdapter.buildWhatsAppMessage({
      storeName: input.store.name,
      items,
      subtotal,
      storeUrl: input.storeUrl,
      customerName: input.customerName,
      customerNote: input.customerNote,
    });

    return {
      store_id: input.store.id,
      owner_id: input.store.owner_id,
      customer_name: input.customerName || null,
      customer_phone: input.customerPhone || null,
      customer_note: input.customerNote || null,
      items_json: items,
      subtotal,
      whatsapp_message: whatsappMessage,
      status: "novo",
      source: "storefront",
    };
  }

  async createLead(payload: StorefrontLeadPayload) {
    await this.supabase.post<null>("/rest/v1/store_cart_leads", payload, {
      auth: false,
      headers: { Prefer: "return=minimal" },
    });
    return null;
  }

  async createLeadBestEffort(payload: StorefrontLeadPayload) {
    try {
      return { ok: true as const, lead: await this.createLead(payload), error: null };
    } catch (error) {
      return { ok: false as const, lead: null, error };
    }
  }

  buildWhatsAppUrl(whatsapp: string | null | undefined, message: string) {
    if (!whatsapp) return null;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  }
}
