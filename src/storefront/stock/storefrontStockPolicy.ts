import type { StorefrontProductRecord } from "../types";

export type ErpStockResolver = (erpProductId: string) => Promise<number | null>;

export async function resolveStorefrontAvailability(
  product: StorefrontProductRecord,
  resolveErpStock?: ErpStockResolver,
) {
  if (product.stock_mode === "unavailable") {
    return { available: false, quantity: 0, reason: "Produto indisponível." };
  }

  if (product.stock_mode === "unlimited") {
    return { available: true, quantity: null, reason: null };
  }

  if (product.stock_mode === "manual") {
    const quantity = Math.max(0, Number(product.stock_quantity || 0));
    return { available: quantity > 0, quantity, reason: quantity > 0 ? null : "Estoque esgotado." };
  }

  if (product.stock_mode === "erp_linked") {
    if (!product.erp_product_id || !resolveErpStock) {
      return { available: true, quantity: null, reason: "Estoque será confirmado pelo vendedor." };
    }
    const quantity = await resolveErpStock(product.erp_product_id);
    return {
      available: quantity === null || quantity > 0,
      quantity,
      reason: quantity === 0 ? "Estoque esgotado." : null,
    };
  }

  return { available: true, quantity: null, reason: null };
}
