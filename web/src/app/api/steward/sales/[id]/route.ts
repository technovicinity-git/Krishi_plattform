import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { notify, investmentParties } from "@/lib/notifications/notify";
import { timeline } from "@/lib/investments/timeline";
import { getCapitalSpent } from "@/lib/investments/spending";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional().default(""),
});

/**
 * Steward confirms or rejects a sale recorded by the farmer.
 * approve: pending_review -> awaiting_remittance, stage sale_pending -> sold
 * reject:  pending_review -> rejected,            stage sale_pending -> growing_care
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { action, reason } = parsed.data;
  if (action === "reject" && reason.length < 5) {
    return NextResponse.json({ error: "Give a reason (at least 5 characters)" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: sale } = await db
    .from("investment_sales")
    .select(`
      id, investment_id, sale_amount, status, reference, animal_ids, sale_date,
      investment:investments!investment_id (
        offering:steward_plan_offerings!offering_id ( steward_id )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  const stewardId = (
    sale.investment as unknown as { offering: { steward_id: string } | null } | null
  )?.offering?.steward_id;
  if (stewardId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const approve = action === "approve";

  // The leftover fund money is fixed now, so every expense must be reviewed.
  let fundsReturned = 0;
  if (approve) {
    const { count: pendingExpenses } = await db
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("investment_id", sale.investment_id)
      .eq("status", "pending");
    if (pendingExpenses) {
      return NextResponse.json({ error: "Review the farmer's pending expenses before confirming the sale" }, { status: 400 });
    }
    fundsReturned = (await getCapitalSpent(sale.investment_id)).leftover;
  }

  const { data: updated, error } = await db
    .from("investment_sales")
    .update({
      status: approve ? "awaiting_remittance" : "rejected",
      funds_returned: fundsReturned,
      rejection_reason: approve ? null : reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", sale.id)
    .eq("status", "pending_review")
    .select("id");

  if (error) {
    console.error("[steward/sales] update failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  if (!updated?.length) {
    return NextResponse.json({ error: "Sale already reviewed" }, { status: 409 });
  }

  // Mark the sold animals, each with an equal share of the price.
  const soldIds = (sale.animal_ids ?? []) as string[];
  if (approve && soldIds.length > 0) {
    const share = Math.round((Number(sale.sale_amount) / soldIds.length) * 100) / 100;
    await db
      .from("animals")
      .update({ status: "sold", sale_price: share, sold_at: sale.sale_date })
      .in("id", soldIds)
      .eq("investment_id", sale.investment_id)
      .eq("status", "active");
  }

  await db
    .from("investments")
    .update({ current_stage: approve ? "sold" : "growing_care" })
    .eq("id", sale.investment_id)
    .eq("current_stage", "sale_pending");

  const amount = Number(sale.sale_amount);
  await db.from("investment_updates").insert({
    investment_id: sale.investment_id,
    author_id: user.id,
    author_role: "steward",
    update_type: approve ? "sale" : "note",
    title: approve ? "Sale confirmed by steward" : "Sale not confirmed",
    body: approve
      ? `Sale of ৳${amount.toLocaleString("en-IN")} confirmed. The farmer can now send the money to Krishi.`
      : `The steward did not confirm the sale. Reason: ${reason}`,
    amount: approve ? amount : null,
    metadata: {
      reference: sale.reference,
      action,
      i18n: approve ? timeline("sale_confirmed", { amount }) : timeline("sale_rejected", { reason }),
    },
  });

  const parties = await investmentParties(sale.investment_id);
  if (parties) {
    const params = { reference: sale.reference, amount, plan: parties.plan, planBn: parties.planBn };
    if (approve) {
      // The farmer sends the sale money plus any unspent fund money.
      await notify(
        "sale_confirmed",
        { userId: parties.farmerId, href: `/farmer/investments/${sale.investment_id}` },
        { ...params, amount: amount + fundsReturned },
      );
      await notify(
        "sale_confirmed_investor",
        { userId: parties.investorId, href: `/portal/investments/${sale.investment_id}` },
        params,
      );
    } else {
      await notify(
        "sale_rejected",
        { userId: parties.farmerId, href: `/farmer/investments/${sale.investment_id}` },
        { ...params, reason },
      );
    }
  }

  return NextResponse.json({ success: true });
}
