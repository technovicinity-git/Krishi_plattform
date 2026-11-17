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

  // 1. Fetch deposit and interest details
  const { data: deposit } = await db
    .from("deposits")
    .select(`
      id, status, amount, interest_id,
      interest:investment_interests (
        id, investor_id, offering_id, requested_units, status
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!deposit) return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
  if (deposit.status !== "pending") return NextResponse.json({ error: "Deposit already processed" }, { status: 400 });

  const interest: any = deposit.interest;

  // 2. Approve the deposit
  await db.from("deposits").update({
    status: "approved",
    reviewed_at: new Date().toISOString(),
    reviewed_by: admin.id,
  }).eq("id", id);

  // 3. Update interest status to 'converted'
  await db.from("investment_interests").update({
    status: "converted",
  }).eq("id", interest.id);

  // 4. Create the active investment record
  const { data: investment, error: invError } = await db.from("investments").insert({
    interest_id: interest.id,
    investor_id: interest.investor_id,
    offering_id: interest.offering_id,
    units: interest.requested_units,
    amount: deposit.amount,
    status: "active",
  }).select("id, reference").single();

  if (invError) {
    console.error("[deposit approve] investment insert error:", invError);
    return NextResponse.json({ error: "Failed to create investment record" }, { status: 500 });
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