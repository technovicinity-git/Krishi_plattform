import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  // Interests on this steward's offerings only. `!inner` makes the filter on
  // the joined offering drop other rows; without it they come back with
  // offering = null (other stewards' investors and phone numbers).
  const { data, error } = await db
    .from("investment_interests")
    .select(`
      id, reference, status, requested_units, created_at, guest_name, guest_phone,
      investor:users!investor_id ( full_name, phone ),
      offering:steward_plan_offerings!offering_id!inner (
        id,
        investment_plans!inner ( name_en, name_bn )
      )
    `)
    .eq("offering.steward_id", user.id)
    .in("status", ["submitted", "under_review"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[steward/interests] fetch error:", error);
    return NextResponse.json({ error: "Failed to load interests" }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}