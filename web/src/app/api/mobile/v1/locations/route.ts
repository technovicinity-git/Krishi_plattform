import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Divisions and districts, for the steward sign-up form. Public. */
export async function GET() {
  const db = createAdminClient();
  const [{ data: divisions }, { data: districts }] = await Promise.all([
    db.from("divisions").select("id, name_en, name_bn").order("sort_order"),
    db.from("districts").select("id, division_id, name_en, name_bn").order("sort_order"),
  ]);
  return NextResponse.json({
    divisions: (divisions ?? []).map((d) => ({ id: d.id, nameEn: d.name_en, nameBn: d.name_bn ?? d.name_en })),
    districts: (districts ?? []).map((d) => ({ id: d.id, divisionId: d.division_id, nameEn: d.name_en, nameBn: d.name_bn ?? d.name_en })),
  });
}
