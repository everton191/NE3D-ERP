import type { StorefrontProductImageRecord, StorefrontProductRecord, StorefrontStockMode } from "../types";

const slugify = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const asMoney = (value: unknown) => Math.max(0, Number(value || 0) || 0);

export type ErpProductLike = {
  id?: string;
  nome?: string;
  name?: string;
  descricao?: string;
  description?: string;
  preco?: number;
  price?: number;
  mostrar_na_loja?: boolean;
  titulo_publico?: string;
  descricao_publica?: string;
  preco_publico?: number;
  categoria_loja?: string;
  imagens_publicas?: string[];
  destaque?: boolean;
  produto_personalizado?: boolean;
  prazo_estimado?: string;
  visivel?: boolean;
  estoque?: number;
};

export const productAdapter = {
  fromErpProduct(input: ErpProductLike, context: { storeId: string; ownerId: string; categoryId?: string | null }) {
    const title = String(input.titulo_publico || input.nome || input.name || "Produto").trim();
    const price = asMoney(input.preco_publico ?? input.preco ?? input.price);
    const stockMode: StorefrontStockMode =
      typeof input.estoque === "number" && input.estoque >= 0 ? "manual" : "unlimited";

    const product: Omit<StorefrontProductRecord, "id"> = {
      store_id: context.storeId,
      owner_id: context.ownerId,
      erp_product_id: input.id || null,
      title,
      slug: slugify(title || input.id || "produto"),
      short_description: String(input.descricao_publica || input.descricao || input.description || "").trim().slice(0, 100),
      description: String(input.descricao_publica || input.descricao || input.description || "").trim(),
      price,
      compare_price: null,
      category_id: context.categoryId ?? null,
      visible: input.visivel === true && input.mostrar_na_loja === true,
      featured: input.destaque === true,
      is_customizable: input.produto_personalizado === true,
      estimated_production_time: input.prazo_estimado || null,
      stock_mode: stockMode,
      stock_quantity: stockMode === "manual" ? Math.max(0, Number(input.estoque || 0)) : null,
    };

    const images: Omit<StorefrontProductImageRecord, "id" | "product_id">[] = (input.imagens_publicas || []).map(
      (imageUrl, index) => ({
        store_id: context.storeId,
        owner_id: context.ownerId,
        image_url: imageUrl,
        alt_text: title,
        order_index: index,
      }),
    );

    return { product, images };
  },

  toPublicProduct(record: StorefrontProductRecord) {
    return {
      id: record.id,
      slug: record.slug,
      title: record.title,
      shortDescription: record.short_description || "",
      description: record.description || "",
      price: Number(record.price || 0),
      comparePrice: record.compare_price ? Number(record.compare_price) : null,
      visible: record.visible,
      featured: record.featured,
      customizable: record.is_customizable,
      stockMode: record.stock_mode,
      stockQuantity: record.stock_quantity ?? null,
      estimatedProductionTime: record.estimated_production_time || "",
      images: (record.images || []).sort((a, b) => a.order_index - b.order_index).map((image) => image.image_url),
    };
  },
};
