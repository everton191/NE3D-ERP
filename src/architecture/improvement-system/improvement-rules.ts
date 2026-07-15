export type ImprovementStatus = "detected" | "planned" | "in_progress" | "done" | "rejected" | "waiting_dependency";

export type ImprovementRecord = {
  title: string;
  module: string;
  problem: string;
  currentRisk: "low" | "medium" | "high" | "critical";
  suggestion: string;
  priority: "essential" | "important" | "future" | "optional" | "not_recommended";
  effort: "small" | "medium" | "large";
  dependencies: string[];
  status: ImprovementStatus;
};

export const improvementRules = {
  noCriticalAutoChange: true,
  requireFeatureChecklist: true,
  requirePermissionAudit: true,
  requireMobileDesktopAudit: true,
  requireMarketReference: true
};
