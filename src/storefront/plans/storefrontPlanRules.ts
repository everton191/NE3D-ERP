import type { StorefrontPlan } from "../types";

const normalizePlan = (plan: StorefrontPlan = "free") => String(plan || "free").toLowerCase().replace(/-/g, "_");

export type StorefrontLimits = {
  enabled: boolean;
  productLimit: number;
  leadsEnabled: boolean;
  qrCodeEnabled: boolean;
  customThemeEnabled: boolean;
  metricsEnabled: boolean;
  simplificaBrandingRequired: boolean;
};

export function getStorefrontLimits(userPlan: StorefrontPlan = "free"): StorefrontLimits {
  const plan = normalizePlan(userPlan);
  if (["pro", "premium", "premium_trial", "trial"].includes(plan)) {
    return {
      enabled: true,
      productLimit: 250,
      leadsEnabled: true,
      qrCodeEnabled: true,
      customThemeEnabled: true,
      metricsEnabled: true,
      simplificaBrandingRequired: false,
    };
  }

  return {
    enabled: false,
    productLimit: 5,
    leadsEnabled: false,
    qrCodeEnabled: false,
    customThemeEnabled: false,
    metricsEnabled: false,
    simplificaBrandingRequired: true,
  };
}

export function canUseStorefront(userPlan: StorefrontPlan = "free") {
  return getStorefrontLimits(userPlan).enabled;
}

export function canPublishProduct(userPlan: StorefrontPlan, currentPublishedCount: number) {
  const limits = getStorefrontLimits(userPlan);
  return limits.enabled && currentPublishedCount < limits.productLimit;
}
