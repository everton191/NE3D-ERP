import type { StorefrontLeadRecord, StorefrontOrderDraftRecord, StorefrontProductRecord, StorefrontStoreRecord } from "../types";
import type { StorefrontLimits } from "../plans/storefrontPlanRules";

export type StorefrontAdminDashboard = {
  store: StorefrontStoreRecord | null;
  limits: StorefrontLimits;
  publicLink: string;
  qrCodeTarget: string;
  products: StorefrontProductRecord[];
  leads: StorefrontLeadRecord[];
  orderDrafts: StorefrontOrderDraftRecord[];
  metrics: {
    storeVisits: number;
    whatsappClicks: number;
    leadsReceived: number;
    addToCartEvents: number;
    conversionRate: number;
  };
  notifications: {
    unreadLeadCount: number;
    badgeLabel: string;
  };
};

export function buildStorefrontAdminDashboard(input: Omit<StorefrontAdminDashboard, "notifications">): StorefrontAdminDashboard {
  const unreadLeadCount = input.leads.filter((lead) => lead.status === "novo").length;
  return {
    ...input,
    notifications: {
      unreadLeadCount,
      badgeLabel: unreadLeadCount > 0 ? `${unreadLeadCount} novo${unreadLeadCount > 1 ? "s" : ""}` : "",
    },
  };
}
