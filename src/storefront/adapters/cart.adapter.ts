import type { StorefrontCartItem, StorefrontProductRecord } from "../types";

export type CartInputItem = {
  productId: string;
  quantity: number;
};

export const cartAdapter = {
  toLeadItems(items: CartInputItem[], products: StorefrontProductRecord[]): StorefrontCartItem[] {
    const productById = new Map(products.map((product) => [String(product.id), product]));
    return items
      .map((item) => {
        const product = productById.get(String(item.productId));
        const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
        if (!product || !product.visible || product.stock_mode === "unavailable") return null;
        const unitPrice = Number(product.price || 0);
        return {
          product_id: product.id,
          title: product.title,
          quantity,
          unit_price: unitPrice,
          subtotal: Number((unitPrice * quantity).toFixed(2)),
        };
      })
      .filter(Boolean) as StorefrontCartItem[];
  },

  subtotal(items: StorefrontCartItem[]) {
    return Number(items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toFixed(2));
  },

  buildWhatsAppMessage(input: {
    storeName: string;
    items: StorefrontCartItem[];
    subtotal: number;
    storeUrl: string;
    customerName?: string | null;
    customerNote?: string | null;
  }) {
    const lines = input.items.map((item, index) => {
      const unitText = item.quantity > 1 ? ` - R$ ${item.unit_price.toFixed(2).replace(".", ",")} cada` : "";
      return `${index + 1}. ${item.quantity}x ${item.title}${unitText}`;
    });
    return [
      `Olá! Tenho interesse nestes produtos da loja ${input.storeName}:`,
      "",
      ...lines,
      "",
      `Subtotal estimado: R$ ${input.subtotal.toFixed(2).replace(".", ",")}`,
      "",
      `Meu nome: ${input.customerName || ""}`,
      `Observação: ${input.customerNote || ""}`,
      "",
      "Link da loja:",
      input.storeUrl,
    ].join("\n");
  },
};
