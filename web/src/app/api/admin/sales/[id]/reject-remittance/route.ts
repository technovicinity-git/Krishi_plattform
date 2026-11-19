import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notify, investmentParties } from "@/lib/notifications/notify";
import { timeline } from "@/lib/investments/timeline";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500),
});

/**
 * Admin could not find the farmer's payment. Sends the sale back to
 * awaiting_remittance with a reason so the farmer can submit again.
 * For a total-loss closing (no money involved) it is sent back to the
 * steward instead: the closing becomes rejected and the batch returns to
 * growing_care.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const db = createAdminClient();
  const { data: current } = await db.from("investment_sales").select("kind, remit_method").eq("id", id).maybeSingle();
  // A total loss with no money involved goes back to the steward; one where the
  // farmer sent back unspent fund money is a payment check like any sale.
  if (current?.kind === "total_loss" && !current.remit_method) {
    return rejectTotalLoss(request, id, admin.id, parsed.data.reason);
  }

  const { data: updated, error } = await db
    .from("investment_sales")
    .update({ status: "awaiting_remittance", remit_rejection_reason: parsed.data.reason })
    .eq("id", id)
    .eq("status", "remittance_submitted")
    .select("id, investment_id, reference, farmer_id, sale_amount, funds_returned");

  if (error) {
    console.error("[admin/sales/reject-remittance] failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  const sale = updated?.[0];
  if (!sale) {
    return NextResponse.json({ error: "This payment is not waiting for review" }, { status: 409 });
  }

  await db.from("investment_updates").insert({
    investment_id: sale.investment_id,
    author_id: admin.id,
    author_role: "admin",
    update_type: "note",
    title: "Sale payment not received",
    body: `Krishi could not confirm the payment. Reason: ${parsed.data.reason}`,
    metadata: { i18n: timeline("remit_rejected", { reason: parsed.data.reason }) },
  });

  await notify(
    "remittance_rejected",
    { userId: sale.farmer_id, href: `/farmer/investments/${sale.investment_id}` },
    { reference: sale.reference, amount: Number(sale.sale_amount) + Number(sale.funds_returned ?? 0), reason: parsed.data.reason },
  );

  await logAdminAction({
    adminId: admin.id,
    action: "sale.remittance_reject",
    targetType: "investment_sale",
    targetId: id,
    metadata: { reference: sale.reference, reason: parsed.data.reason },
    request,
  });

  return NextResponse.json({ success: true });
}

async function rejectTotalLoss(request: Request, id: string, adminId: string, reason: string) {
  const db = createAdminClient();
  const { data: updated, error } = await db
    .from("investment_sales")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id)
    .eq("kind", "total_loss")
    .eq("status", "remittance_submitted")
    .select("id, investment_id, reference");
  if (error) {
    console.error("[admin/sales/reject-remittance] total loss failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  const sale = updated?.[0];
  if (!sale) {
    return NextResponse.json({ error: "This closing is not waiting for review" }, { status: 409 });
  }

  await db
    .from("investments")
    .update({ current_stage: "growing_care" })
    .eq("id", sale.investment_id)
    .eq("current_stage", "sale_pending");

  await db.from("investment_updates").insert({
    investment_id: sale.investment_id,
    author_id: adminId,
    author_role: "admin",
    update_type: "note",
    title: "Total loss not accepted",
    body: `Krishi sent the total-loss closing back. Reason: ${reason}`,
    metadata: { i18n: timeline("total_loss_rejected", { reason }) },
  });

  const parties = await investmentParties(sale.investment_id);
  if (parties) {
    await notify(
      "total_loss_rejected",
      { userId: parties.stewardId, href: `/steward/investments/${sale.investment_id}` },
      { reference: parties.reference, plan: parties.plan, planBn: parties.planBn, reason },
    );
  }

  await logAdminAction({
    adminId,
    action: "sale.total_loss_reject",
    targetType: "investment_sale",
    targetId: id,
    metadata: { reference: sale.reference, reason },
    request,
  });

  return NextResponse.json({ success: true });
}
