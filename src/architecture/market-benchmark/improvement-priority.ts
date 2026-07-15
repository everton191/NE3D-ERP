export type ImprovementPriority = "essential" | "important" | "future" | "optional" | "not_recommended";
export type ImprovementRisk = "low" | "medium" | "high" | "critical";
export type ImprovementEffort = "small" | "medium" | "large";
export type SuggestedPhase = "now" | "next" | "later" | "blocked";

export type ImprovementDecision =
  | "implement_now"
  | "implement_next_phase"
  | "prepare_disabled"
  | "future_backlog"
  | "do_not_implement_now"
  | "remove_excess_complexity";

export function classifyImprovement(priority: ImprovementPriority, risk: ImprovementRisk): ImprovementDecision {
  if (priority === "not_recommended") return "remove_excess_complexity";
  if (risk === "critical") return "prepare_disabled";
  if (priority === "essential" && (risk === "low" || risk === "medium")) return "implement_now";
  if (priority === "important") return "implement_next_phase";
  if (priority === "future" || priority === "optional") return "future_backlog";
  return "do_not_implement_now";
}
