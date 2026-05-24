import type { StorefrontEventType, StorefrontSupabasePort } from "../types";

export class StorefrontAnalyticsService {
  constructor(private readonly supabase: StorefrontSupabasePort) {}

  async trackVisit(input: {
    storeId: string;
    productId?: string | null;
    eventType: "store_view" | "product_view";
    sessionId: string;
    userAgent?: string | null;
    referrer?: string | null;
  }) {
    return this.supabase.post(
      "/rest/v1/store_visits",
      {
        store_id: input.storeId,
        product_id: input.productId || null,
        event_type: input.eventType,
        session_id: input.sessionId,
        user_agent: input.userAgent || null,
        referrer: input.referrer || null,
      },
      { auth: false, headers: { Prefer: "return=minimal" } },
    );
  }

  async trackEvent(input: {
    storeId: string;
    productId?: string | null;
    eventType: StorefrontEventType;
    metadata?: Record<string, unknown>;
  }) {
    return this.supabase.post(
      "/rest/v1/store_events",
      {
        store_id: input.storeId,
        product_id: input.productId || null,
        event_type: input.eventType,
        metadata_json: input.metadata || {},
      },
      { auth: false, headers: { Prefer: "return=minimal" } },
    );
  }

  async getBasicMetrics(storeId: string) {
    const [visits, whatsappClicks, leads, addToCart] = await Promise.all([
      this.supabase.get<Array<{ id: string }>>(`/rest/v1/store_visits?select=id&store_id=eq.${encodeURIComponent(storeId)}`),
      this.supabase.get<Array<{ id: string }>>(
        `/rest/v1/store_events?select=id&store_id=eq.${encodeURIComponent(storeId)}&event_type=eq.whatsapp_click`,
      ),
      this.supabase.get<Array<{ id: string; status: string }>>(
        `/rest/v1/store_cart_leads?select=id,status&store_id=eq.${encodeURIComponent(storeId)}`,
      ),
      this.supabase.get<Array<{ product_id: string | null }>>(
        `/rest/v1/store_events?select=product_id&store_id=eq.${encodeURIComponent(storeId)}&event_type=eq.add_to_cart`,
      ),
    ]);

    const converted = leads.filter((lead) => lead.status === "convertido").length;
    return {
      storeVisits: visits.length,
      whatsappClicks: whatsappClicks.length,
      leadsReceived: leads.length,
      addToCartEvents: addToCart.length,
      conversionRate: leads.length ? converted / leads.length : 0,
    };
  }
}
