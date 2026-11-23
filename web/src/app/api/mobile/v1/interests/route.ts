import { NextResponse } from "next/server";
import { requireMobileUser, json } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** The investor's interests, newest first, with the plan and amount. */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  if (user.role !== "investor") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data } = await createAdminClient()
    .from("investment_interests")
    .select(`
      id, reference, status, requested_units, rejection_reason, created_at, reviewed_at,
      offering:steward_plan_offerings!offering_id (
        id,
        users!steward_id ( full_name ),
        investment_plans ( name_en, name_bn, unit_price, duration_months )
      ),
      investments ( id )
    `)
    .eq("investor_id", user.id)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    reference: string;
    status: string;
    requested_units: number;
    rejection_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
    offering: {
      id: string;
      users: { full_name: string | null } | null;
      investment_plans: { name_en: string | null; name_bn: string | null; unit_price: number | string; duration_months: number } | null;
    } | null;
    investments: { id: string }[] | { id: string } | null;
  };
  return json({
    interests: ((data ?? []) as unknown as Row[]).map((r) => {
      const plan = r.offering?.investment_plans;
      const inv = Array.isArray(r.investments) ? r.investments[0] : r.investments;
      return {
        id: r.id,
        reference: r.reference,
        status: r.status,
        units: r.requested_units,
        amount: Number(plan?.unit_price ?? 0) * r.requested_units,
        planEn: plan?.name_en ?? "",
        planBn: plan?.name_bn ?? plan?.name_en ?? "",
        durationMonths: plan?.duration_months ?? null,
        offeringId: r.offering?.id ?? null,
        stewardName: r.offering?.users?.full_name ?? null,
        rejectionReason: r.rejection_reason,
        investmentId: inv?.id ?? null,
        createdAt: r.created_at,
        reviewedAt: r.reviewed_at,
      };
    }),
  });
}
