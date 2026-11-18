import { createAdminClient } from "@/lib/supabase/admin";

export type InvestmentRole = "investor" | "farmer" | "steward";

/**
 * Which side of an investment the user is on, or null if they have no
 * access. Server-only.
 */
export async function investmentRoleFor(
  user: { id: string; role: string },
  investmentId: string,
): Promise<{ role: InvestmentRole; currentStage: string | null } | null> {
  const { data } = await createAdminClient()
    .from("investments")
    .select("investor_id, farmer_id, current_stage, offering:steward_plan_offerings!offering_id ( steward_id )")
    .eq("id", investmentId)
    .maybeSingle();
  if (!data) return null;

  const stewardId = (data.offering as unknown as { steward_id: string } | null)?.steward_id;
  if (user.role === "farmer" && data.farmer_id === user.id) return { role: "farmer", currentStage: data.current_stage };
  if (user.role === "steward" && stewardId === user.id) return { role: "steward", currentStage: data.current_stage };
  if (user.role === "investor" && data.investor_id === user.id) return { role: "investor", currentStage: data.current_stage };
  return null;
}
