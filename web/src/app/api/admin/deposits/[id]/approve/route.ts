import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();

  // 1. Fetch deposit
  const { data: deposit } = await db.from("deposits").select("*").eq("id", id).maybeSingle();
  if (!deposit) return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
  if (deposit.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });

  // 2. Fetch interest
  const { data: interest } = await db.from("investment_interests").select("*").eq("id", deposit.interest_id).single();
  if (!interest) return NextResponse.json({ error: "Interest not found" }, { status: 404 });

  // 3. Update deposit
  await db.from("deposits").update({
    status: "approved",
    reviewed_at: new Date().toISOString(),
    reviewed_by: admin.id,
  }).eq("id", id);

  // 4. Update interest
  await db.from("investment_interests").update({ status: "converted" }).eq("id", interest.id);

  // 5. Create investment
  const { data: investment, error: invError } = await db.from("investments").insert({
    interest_id: interest.id,
    investor_id: interest.investor_id,
    offering_id: interest.offering_id,
    units: interest.requested_units,
    amount: deposit.amount,
    status: "active",
  }).select("id, reference").single();

  if (invError) {
    console.error("[deposit approve] inv error:", invError);
    return NextResponse.json({ error: "Failed to create investment record" }, { status: 500 });
  }

  // 6. NOW reserve the units on the offering
  const { data: offering } = await db.from("steward_plan_offerings").select("units_funded").eq("id", interest.offering_id).single();
  if (offering) {
    await db.from("steward_plan_offerings")
      .update({ units_funded: offering.units_funded + interest.requested_units })
      .eq("id", interest.offering_id);
  }

  await logAdminAction({
    adminId: admin.id,
    action: "deposit.approve",
    targetType: "deposit",
    targetId: id,
    metadata: { investment_id: investment.id },
    request,
  });

  return NextResponse.json({ success: true, investment_reference: investment.reference });
}