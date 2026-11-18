import { createAdminClient } from "@/lib/supabase/admin";
import { notify, investmentParties } from "@/lib/notifications/notify";

export type ApproveResult =
  | { ok: true; investmentId: string; investmentReference: string }
  | { ok: false; status: number; error: string };

/**
 * Approves a pending deposit and starts the investment:
 * claims the deposit, checks units are still available, creates the
 * investment, converts the interest, reserves the units and notifies the
 * investor and steward. Used by admin approval and by verified online
 * payments (reviewerId = null). On failure the deposit goes back to pending.
 * Server-only.
 */
export async function approveDeposit(depositId: string, reviewerId: string | null): Promise<ApproveResult> {
  const db = createAdminClient();

  // 1. Claim the deposit: only one caller can move it out of "pending".
  const { data: claimed, error: claimError } = await db
    .from("deposits")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq("id", depositId)
    .eq("status", "pending")
    .select("id, amount, interest_id");
  if (claimError) {
    console.error("[approveDeposit] claim error:", claimError);
    return { ok: false, status: 500, error: "Failed to approve deposit" };
  }
  const deposit = claimed?.[0];
  if (!deposit) {
    const { data: existing } = await db.from("deposits").select("id").eq("id", depositId).maybeSingle();
    return existing
      ? { ok: false, status: 400, error: "Already processed" }
      : { ok: false, status: 404, error: "Deposit not found" };
  }

  const release = async (status: number, error: string): Promise<ApproveResult> => {
    await db
      .from("deposits")
      .update({ status: "pending", reviewed_at: null, reviewed_by: null })
      .eq("id", depositId);
    return { ok: false, status, error };
  };

  // 2. Interest and offering capacity
  const { data: interest } = await db
    .from("investment_interests")
    .select("id, investor_id, offering_id, requested_units, status")
    .eq("id", deposit.interest_id)
    .maybeSingle();
  if (!interest) return release(404, "Interest not found");
  if (interest.status === "converted") return release(409, "This interest already has an investment");

  const { data: offering } = await db
    .from("steward_plan_offerings")
    .select("units_offered, units_funded")
    .eq("id", interest.offering_id)
    .maybeSingle();
  if (!offering) return release(404, "Offering not found");
  if (offering.units_funded + interest.requested_units > offering.units_offered) {
    return release(409, "Not enough units left on this offering");
  }

  // 3. Reserve the units first, only if nobody else took them meanwhile.
  const { data: reserved } = await db
    .from("steward_plan_offerings")
    .update({ units_funded: offering.units_funded + interest.requested_units })
    .eq("id", interest.offering_id)
    .eq("units_funded", offering.units_funded)
    .select("id");
  if (!reserved?.length) return release(409, "Units changed while approving; try again");

  const unreserve = () =>
    db
      .from("steward_plan_offerings")
      .update({ units_funded: offering.units_funded })
      .eq("id", interest.offering_id)
      .eq("units_funded", offering.units_funded + interest.requested_units);

  // 4. Create the investment
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
    console.error("[approveDeposit] investment error:", invError);
    await unreserve();
    return release(500, "Failed to create investment record");
  }

  // 5. Convert the interest
  await db.from("investment_interests").update({ status: "converted" }).eq("id", interest.id);

  // 6. Tell the investor and steward
  const parties = await investmentParties(investment.id);
  if (parties) {
    const params = { reference: parties.reference, plan: parties.plan, planBn: parties.planBn };
    await notify(
      "deposit_approved",
      { userId: parties.investorId, href: `/portal/investments/${investment.id}` },
      { ...params, amount: Number(deposit.amount) },
    );
    await notify("investment_new", { userId: parties.stewardId, href: `/steward/investments/${investment.id}` }, params);
  }

  return { ok: true, investmentId: investment.id, investmentReference: investment.reference };
}
