import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notify, investmentParties } from "@/lib/notifications/notify";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();

  // 1. Claim the deposit: only one request can move it out of "pending".
  //    This prevents a double-click from creating two investments.
  const { data: claimed, error: claimError } = await db
    .from("deposits")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, amount, interest_id");

  if (claimError) {
    console.error("[deposit approve] claim error:", claimError);
    return NextResponse.json({ error: "Failed to approve deposit" }, { status: 500 });
  }
  const deposit = claimed?.[0];
  if (!deposit) {
    const { data: existing } = await db.from("deposits").select("id").eq("id", id).maybeSingle();
    return existing
      ? NextResponse.json({ error: "Already processed" }, { status: 400 })
      : NextResponse.json({ error: "Deposit not found" }, { status: 404 });
  }

  // Put the deposit back to "pending" so the admin can retry after a failure.
  const releaseDeposit = () =>
    db
      .from("deposits")
      .update({ status: "pending", reviewed_at: null, reviewed_by: null })
      .eq("id", id);

  // 2. Fetch interest
  const { data: interest } = await db
    .from("investment_interests")
    .select("id, investor_id, offering_id, requested_units")
    .eq("id", deposit.interest_id)
    .maybeSingle();
  if (!interest) {
    await releaseDeposit();
    return NextResponse.json({ error: "Interest not found" }, { status: 404 });
  }

  // 3. Create the investment
  const { data: investment, error: invError } = await db
    .from("investments")
    .insert({
      interest_id: interest.id,
      investor_id: interest.investor_id,
      offering_id: interest.offering_id,
      units: interest.requested_units,
      amount: deposit.amount,
      status: "active",
    })
    .select("id, reference")
    .single();

  if (invError || !investment) {
    console.error("[deposit approve] inv error:", invError);
    await releaseDeposit();
    return NextResponse.json({ error: "Failed to create investment record" }, { status: 500 });
  }

  // 4. Mark the interest as converted
  await db.from("investment_interests").update({ status: "converted" }).eq("id", interest.id);

  // 5. Reserve the units on the offering
  const { data: offering } = await db
    .from("steward_plan_offerings")
    .select("units_funded")
    .eq("id", interest.offering_id)
    .maybeSingle();
  if (offering) {
    await db
      .from("steward_plan_offerings")
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

  const parties = await investmentParties(investment.id);
  if (parties) {
    const params = { reference: parties.reference, plan: parties.plan, planBn: parties.planBn };
    await notify(
      "deposit_approved",
      { userId: parties.investorId, href: `/portal/investments/${investment.id}` },
      { ...params, amount: Number(deposit.amount) },
    );
    await notify(
      "investment_new",
      { userId: parties.stewardId, href: `/steward/investments/${investment.id}` },
      params,
    );
  }

  return NextResponse.json({ success: true, investment_reference: investment.reference });
}
