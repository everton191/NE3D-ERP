import type {
  StorefrontCategoryRecord,
  StorefrontProductImageRecord,
  StorefrontProductRecord,
  StorefrontStoreRecord,
  StorefrontSupabasePort,
} from "../types";
import { StorefrontMemoryCache } from "../utils/storefront-cache";

const PUBLIC_CACHE_TTL_MS = 60_000;

export class StorefrontPublicService {
  constructor(
    private readonly supabase: StorefrontSupabasePort,
    private readonly cache = new StorefrontMemoryCache(),
  ) {}

  async getStoreBySlug(slug: string) {
    const cacheKey = `store:${slug}`;
    const cached = this.cache.get<StorefrontStoreRecord>(cacheKey);
    if (cached) return cached;

    const stores = await this.supabase.get<StorefrontStoreRecord[]>(
      `/rest/v1/stores?select=*&slug=eq.${encodeURIComponent(slug)}&active=eq.true&limit=1`,
      { auth: false },
    );
    const store = stores[0] || null;
    return store ? this.cache.set(cacheKey, store, PUBLIC_CACHE_TTL_MS) : null;
  }

  async getCategories(storeId: string) {
    const cacheKey = `categories:${storeId}`;
    const cached = this.cache.get<StorefrontCategoryRecord[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.supabase.get<StorefrontCategoryRecord[]>(
      `/rest/v1/store_categories?select=*&store_id=eq.${encodeURIComponent(storeId)}&visible=eq.true&order=order_index.asc`,
      { auth: false },
    );
    return this.cache.set(cacheKey, categories, PUBLIC_CACHE_TTL_MS);
  }

  async getProducts(storeId: string) {
    const cacheKey = `products:${storeId}`;
    const cached = this.cache.get<StorefrontProductRecord[]>(cacheKey);
    if (cached) return cached;

    const [products, images] = await Promise.all([
      this.supabase.get<StorefrontProductRecord[]>(
        `/rest/v1/store_products?select=*&store_id=eq.${encodeURIComponent(storeId)}&visible=eq.true&order=featured.desc,created_at.desc`,
        { auth: false },
      ),
      this.supabase.get<StorefrontProductImageRecord[]>(
        `/rest/v1/store_product_images?select=*&store_id=eq.${encodeURIComponent(storeId)}&order=order_index.asc`,
        { auth: false },
      ),
    ]);
    const imagesByProduct = new Map<string, StorefrontProductImageRecord[]>();
    images.forEach((image) => {
      if (!image.product_id) return;
      imagesByProduct.set(image.product_id, [...(imagesByProduct.get(image.product_id) || []), image]);
    });

    const hydrated = products.map((product) => ({
      ...product,
      images: imagesByProduct.get(product.id) || [],
    }));

    return this.cache.set(cacheKey, hydrated, PUBLIC_CACHE_TTL_MS);
  }

  async getProductBySlug(storeId: string, productSlug: string) {
    const products = await this.getProducts(storeId);
    return products.find((product) => product.slug === productSlug) || null;
  }

  async getPublicStorefront(slug: string) {
    const store = await this.getStoreBySlug(slug);
    if (!store) return null;
    const [categories, products] = await Promise.all([this.getCategories(store.id), this.getProducts(store.id)]);
    return { store, categories, products };
  }

  invalidateStore(storeIdOrSlug: string) {
    this.cache.invalidate(`store:${storeIdOrSlug}`);
    this.cache.invalidate(`products:${storeIdOrSlug}`);
    this.cache.invalidate(`categories:${storeIdOrSlug}`);
  }
}
