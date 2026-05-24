export type StoreAdPlacement = "inline" | "card" | "footer";

export interface StoreAdSlotConfig {
  id: string;
  placement: StoreAdPlacement;
  enabled: boolean;
}

export function createStoreAdSlot(id: string, placement: StoreAdPlacement = "inline"): StoreAdSlotConfig {
  return { id, placement, enabled: false };
}

export const StoreAdSlot = createStoreAdSlot;
export const InlineStoreAd = (id = "inline-store-ad") => createStoreAdSlot(id, "inline");
export const StoreSponsoredCard = (id = "sponsored-store-card") => createStoreAdSlot(id, "card");
