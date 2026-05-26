import type { StorefrontPlan } from "../types";

const normalizePlan = (plan: StorefrontPlan = "free") => String(plan || "free").toLowerCase().replace(/-/g, "_");

export type StorefrontLimits = {
  enabled: boolean;
  publishEnabled: boolean;
  shareEnabled: boolean;
  productLimit: number;
  leadsEnabled: boolean;
  qrCodeEnabled: boolean;
  customThemeEnabled: boolean;
  premiumThemeEnabled: boolean;
  metricsEnabled: boolean;
  simplificaBrandingRequired: boolean;
};

export function getStorefrontLimits(userPlan: StorefrontPlan = "free"): StorefrontLimits {
  const plan = normalizePlan(userPlan);
  if (["pro", "premium", "premium_trial", "trial"].includes(plan)) {
    return {
      enabled: true,
      publishEnabled: true,
      shareEnabled: true,
      productLimit: Number.POSITIVE_INFINITY,
      leadsEnabled: true,
      qrCodeEnabled: true,
      customThemeEnabled: true,
      premiumThemeEnabled: true,
      metricsEnabled: true,
      simplificaBrandingRequired: false,
    };
  }
  if (plan === "start") {
    return {
      enabled: true,
      publishEnabled: true,
      shareEnabled: true,
      productLimit: 300,
      leadsEnabled: true,
      qrCodeEnabled: true,
      customThemeEnabled: true,
      premiumThemeEnabled: false,
      metricsEnabled: false,
      simplificaBrandingRequired: false,
    };
  }

  return {
    enabled: true,
    publishEnabled: false,
    shareEnabled: false,
    productLimit: 25,
    leadsEnabled: false,
    qrCodeEnabled: false,
    customThemeEnabled: false,
    premiumThemeEnabled: false,
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
