import { NextResponse } from "next/server";
import { requireMobileUser, json } from "@/lib/mobile/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Steward: their offerings on Krishi's plans, with units and activity. */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  if (user.role !== "steward") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const db = createAdminClient();
  const { data } = await db
    .from("steward_plan_offerings")
    .select(`
      id, units_offered, units_funded, status, rejection_reason, created_at,
      investment_plans ( name_en, name_bn, status, unit_price, duration_months, estimated_roi_min, estimated_roi_max )
    `)
    .eq("steward_id", user.id)
    .order("created_at", { ascending: false });

  type Row = {
    id: string; units_offered: number; units_funded: number; status: string; rejection_reason: string | null; created_at: string;
    investment_plans: {
      name_en: string | null; name_bn: string | null; status: string; unit_price: number | string;
      duration_months: number; estimated_roi_min: number | string; estimated_roi_max: number | string;
    } | null;
  };
  const rows = (data ?? []) as unknown as Row[];
  const ids = rows.map((r) => r.id);
  const [{ data: interests }, { data: batches }] = ids.length
    ? await Promise.all([
        db.from("investment_interests").select("offering_id").in("offering_id", ids).in("status", ["submitted", "under_review"]),
        db.from("investments").select("offering_id").in("offering_id", ids).eq("status", "active"),
      ])
    : [{ data: [] }, { data: [] }];
  const count = (list: { offering_id: string }[] | null, id: string) => (list ?? []).filter((x) => x.offering_id === id).length;

  return json({
    plans: rows.map((r) => ({
      id: r.id,
      status: r.status,
      rejectionReason: r.rejection_reason,
      unitsOffered: r.units_offered,
      unitsFunded: r.units_funded,
      planEn: r.investment_plans?.name_en ?? "",
      planBn: r.investment_plans?.name_bn ?? r.investment_plans?.name_en ?? "",
      planStatus: r.investment_plans?.status ?? null,
      unitPrice: Number(r.investment_plans?.unit_price ?? 0),
      durationMonths: r.investment_plans?.duration_months ?? null,
      roiMin: Number(r.investment_plans?.estimated_roi_min ?? 0),
      roiMax: Number(r.investment_plans?.estimated_roi_max ?? 0),
      openInterests: count(interests, r.id),
      activeBatches: count(batches, r.id),
    })),
  });
}
