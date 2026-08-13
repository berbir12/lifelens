export type Plan = "PERSONAL" | "PLUS" | "FAMILY";

export const PLAN_LIMITS: Record<Plan, { documents: number; familyMembers: number }> = {
  PERSONAL: { documents: 25, familyMembers: 1 },
  PLUS: { documents: 250, familyMembers: 2 },
  FAMILY: { documents: 500, familyMembers: 5 },
};

type Subscription = { plan?: string | null; status?: string | null; current_period_end?: string | null } | null;

export function activePlan(subscription: Subscription): Plan {
  if (subscription?.status !== "ACTIVE") return "PERSONAL";
  if (subscription.current_period_end && new Date(subscription.current_period_end) <= new Date()) return "PERSONAL";
  return subscription.plan === "PLUS" || subscription.plan === "FAMILY" ? subscription.plan : "PERSONAL";
}
