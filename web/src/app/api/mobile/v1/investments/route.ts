import { requireMobileUser, json, investmentIdsFor } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** The user's batches (as investor, farmer or steward), newest first. */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  const ids = await investmentIdsFor(user);
  if (ids.length === 0) return json({ investments: [] });

  const { data } = await createAdminClient()
    .from("investments")
    .select(`
      id, reference, units, amount, status, current_stage, created_at,
      investor:users!investor_id ( full_name ),
      farmer:users!farmer_id ( full_name ),
      offering:steward_plan_offerings!offering_id (
        users!steward_id ( full_name ),
        investment_plans ( name_en, name_bn, duration_months )
      )
    `)
    .in("id", ids)
    .order("created_at", { ascending: false });

  type Row = {
    id: string; reference: string; units: number; amount: number | string; status: string;
    current_stage: string | null; created_at: string;
    investor: { full_name: string | null } | null;
    farmer: { full_name: string | null } | null;
    offering: { users: { full_name: string | null } | null; investment_plans: { name_en: string | null; name_bn: string | null; duration_months: number } | null } | null;
  };
  return json({
    investments: ((data ?? []) as unknown as Row[]).map((r) => ({
      id: r.id,
      reference: r.reference,
      units: r.units,
      amount: Number(r.amount),
      status: r.status,
      stage: r.current_stage ?? "",
      createdAt: r.created_at,
      planEn: r.offering?.investment_plans?.name_en ?? "",
      planBn: r.offering?.investment_plans?.name_bn ?? r.offering?.investment_plans?.name_en ?? "",
      durationMonths: r.offering?.investment_plans?.duration_months ?? null,
      // Investors don't need the farmer's or other investors' details beyond a name.
      investorName: user.role === "investor" ? null : r.investor?.full_name ?? null,
      farmerName: r.farmer?.full_name ?? null,
      stewardName: r.offering?.users?.full_name ?? null,
    })),
  });
}
