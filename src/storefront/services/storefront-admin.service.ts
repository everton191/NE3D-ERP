import { orderAdapter } from "../adapters/order.adapter";
import type {
  StorefrontCategoryRecord,
  StorefrontLeadRecord,
  StorefrontOrderDraftRecord,
  StorefrontProductRecord,
  StorefrontStoreRecord,
  StorefrontSupabasePort,
} from "../types";

export class StorefrontAdminService {
  constructor(private readonly supabase: StorefrontSupabasePort) {}

  async getMyStore(ownerId: string) {
    const stores = await this.supabase.get<StorefrontStoreRecord[]>(
      `/rest/v1/stores?select=*&owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`,
    );
    return stores[0] || null;
  }

  async upsertStore(store: Partial<StorefrontStoreRecord> & { owner_id: string; slug: string; name: string }) {
    const [record] = await this.supabase.post<StorefrontStoreRecord[]>("/rest/v1/stores", store, {
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    });
    return record;
  }

  async listCategories(storeId: string) {
    return this.supabase.get<StorefrontCategoryRecord[]>(
      `/rest/v1/store_categories?select=*&store_id=eq.${encodeURIComponent(storeId)}&order=order_index.asc`,
    );
  }

  async listProducts(storeId: string) {
    return this.supabase.get<StorefrontProductRecord[]>(
      `/rest/v1/store_products?select=*&store_id=eq.${encodeURIComponent(storeId)}&order=featured.desc,updated_at.desc`,
    );
  }

  async listLeads(storeId: string) {
    return this.supabase.get<StorefrontLeadRecord[]>(
      `/rest/v1/store_cart_leads?select=*&store_id=eq.${encodeURIComponent(storeId)}&order=created_at.desc`,
    );
  }

  async listOrderDrafts(storeId: string) {
    return this.supabase.get<StorefrontOrderDraftRecord[]>(
      `/rest/v1/store_order_drafts?select=*&store_id=eq.${encodeURIComponent(storeId)}&order=created_at.desc`,
    );
  }

  async convertLeadToOrderDraft(lead: StorefrontLeadRecord) {
    const payload = orderAdapter.leadToOrderDraft(lead);
    const [draft] = await this.supabase.post<StorefrontOrderDraftRecord[]>("/rest/v1/store_order_drafts", payload, {
      headers: { Prefer: "return=representation" },
    });

    await this.supabase.patch(
      `/rest/v1/store_cart_leads?id=eq.${encodeURIComponent(lead.id)}`,
      { status: "convertido" },
      { headers: { Prefer: "return=minimal" } },
    );

    return draft;
  }
}
