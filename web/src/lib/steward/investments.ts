import { createAdminClient } from "@/lib/supabase/admin";

/** IDs of every investment on this steward's offerings. Server-only. */
export async function getStewardInvestmentIds(stewardId: string): Promise<string[]> {
  const db = createAdminClient();
  const { data: offerings } = await db
    .from("steward_plan_offerings")
    .select("id")
    .eq("steward_id", stewardId);
  const offeringIds = (offerings ?? []).map((o) => o.id);
  if (offeringIds.length === 0) return [];

  const { data: investments } = await db
    .from("investments")
    .select("id")
    .in("offering_id", offeringIds);
  return (investments ?? []).map((i) => i.id);
}
