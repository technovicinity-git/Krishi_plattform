import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const schema = z.object({ reason: z.string().trim().min(5).max(500) });

const ERRORS: Record<string, [string, number]> = {
  NOT_FOUND: ["This payment was not found or is already reversed", 404],
  ALREADY_SETTLED: ["The batch is settled; this monthly pay was already matched with the steward's share", 409],
  INSUFFICIENT_BALANCE: ["The steward has already withdrawn this money, so it cannot be taken back", 409],
};

/**
 * Takes back one month sent by mistake (before the batch is settled). The
 * month becomes due again; the reversal is an adjustment in the wallet.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Write a reason (at least 5 characters)" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.rpc("reverse_monthly_pay", {
    p_payment_id: id,
    p_admin_id: admin.id,
    p_reason: parsed.data.reason,
  });
  if (error) {
    const code = Object.keys(ERRORS).find((k) => error.message?.includes(k));
    if (code) return NextResponse.json({ error: ERRORS[code][0] }, { status: ERRORS[code][1] });
    console.error("[admin/steward-pay/reverse] failed:", error);
    return NextResponse.json({ error: "Could not reverse" }, { status: 500 });
  }

  const { data: row } = await db
    .from("steward_monthly_payments")
    .select("investment_id, month_no, amount, steward_id")
    .eq("id", id)
    .maybeSingle();
  await logAdminAction({
    adminId: admin.id,
    action: "steward_pay.reverse",
    targetType: "steward_monthly_payment",
    targetId: id,
    metadata: { ...row, reason: parsed.data.reason },
    request,
  });

  return NextResponse.json({ success: true });
}
