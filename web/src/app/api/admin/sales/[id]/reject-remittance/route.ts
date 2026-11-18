import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500),
});

/**
 * Admin could not find the farmer's payment. Sends the sale back to
 * awaiting_remittance with a reason so the farmer can submit again.
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
  const { data: updated, error } = await db
    .from("investment_sales")
    .update({ status: "awaiting_remittance", remit_rejection_reason: parsed.data.reason })
    .eq("id", id)
    .eq("status", "remittance_submitted")
    .select("id, investment_id, reference");

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
  });

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
