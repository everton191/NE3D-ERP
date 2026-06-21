export type StorefrontPlan = "free" | "pro" | "premium" | "trial" | string;

export type StorefrontStockMode = "unlimited" | "manual" | "erp_linked" | "unavailable";
export type StorefrontLeadStatus = "novo" | "em_atendimento" | "convertido" | "perdido" | "arquivado";
export type StorefrontEventType =
  | "store_view"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "whatsapp_click"
  | "lead_created";

export type StorefrontStoreRecord = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  active: boolean;
  theme_config?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type StorefrontCategoryRecord = {
  id: string;
  store_id: string;
  owner_id: string;
  name: string;
  slug: string;
  order_index: number;
  visible: boolean;
};

export type StorefrontProductRecord = {
  id: string;
  store_id: string;
  owner_id: string;
  erp_product_id?: string | null;
  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  price: number;
  compare_price?: number | null;
  price_mode?: "fixed" | "from" | "quote" | "promo";
  show_price?: boolean;
  category_id?: string | null;
  visible: boolean;
  featured: boolean;
  is_customizable: boolean;
  estimated_production_time?: string | null;
  public_observations?: string | null;
  stock_mode: StorefrontStockMode;
  stock_quantity?: number | null;
  images?: StorefrontProductImageRecord[];
};

export type StorefrontProductImageRecord = {
  id?: string;
  product_id?: string;
  store_id: string;
  owner_id: string;
  image_url: string;
  alt_text?: string | null;
  order_index: number;
};

export type StorefrontCartItem = {
  product_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type StorefrontLeadPayload = {
  store_id: string;
  owner_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_note?: string | null;
  items_json: StorefrontCartItem[];
  subtotal: number;
  whatsapp_message: string;
  status?: StorefrontLeadStatus;
  source?: string;
};

export type StorefrontLeadRecord = StorefrontLeadPayload & {
  id: string;
  status: StorefrontLeadStatus;
  created_at: string;
  updated_at: string;
};

export type StorefrontOrderDraftRecord = {
  id: string;
  store_id: string;
  owner_id: string;
  lead_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  items_json: StorefrontCartItem[];
  subtotal: number;
  status: "rascunho" | "em_revisao" | "convertido" | "cancelado";
  erp_order_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type StorefrontSupabasePort = {
  get<T>(path: string, options?: Record<string, unknown>): Promise<T>;
  post<T>(path: string, body: unknown, options?: Record<string, unknown>): Promise<T>;
  patch<T>(path: string, body: unknown, options?: Record<string, unknown>): Promise<T>;
  delete<T>(path: string, options?: Record<string, unknown>): Promise<T>;
};

export type StorefrontCacheEntry<T> = {
  value: T;
  expiresAt: number;
};
