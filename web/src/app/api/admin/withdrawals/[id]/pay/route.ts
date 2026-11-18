import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/notify";
import { walletHref } from "@/lib/notifications/wallet-href";

export const runtime = "nodejs";

const schema = z.object({
  txnId: z.string().trim().min(3, "Enter the transaction ID of the payment").max(80),
  note: z.string().trim().max(500).optional().default(""),
});

/** Admin sent the money to the user's account and records the transaction ID. */
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

  const { error } = await createAdminClient().rpc("close_withdrawal", {
    p_withdrawal_id: id,
    p_status: "paid",
    p_reviewer_id: admin.id,
    p_payout_txn_id: parsed.data.txnId,
    p_note: parsed.data.note || null,
    p_reason: null,
  });
  if (error) {
    if (error.message?.includes("NOT_PENDING")) {
      return NextResponse.json({ error: "This withdrawal is no longer pending" }, { status: 409 });
    }
    console.error("[admin/withdrawals/pay] failed:", error);
    return NextResponse.json({ error: "Could not mark as paid" }, { status: 500 });
  }

  const { data: w } = await createAdminClient()
    .from("withdrawal_requests")
    .select("reference, amount, user:users!user_id ( id, role )")
    .eq("id", id)
    .maybeSingle();
  if (w) {
    const owner = w.user as unknown as { id: string; role: string } | null;
    await notify("withdrawal_paid", { userId: owner?.id, href: walletHref(owner?.role) }, { reference: w.reference, amount: Number(w.amount) });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "withdrawal.pay",
    targetType: "withdrawal_request",
    targetId: id,
    metadata: { txn_id: parsed.data.txnId },
    request,
  });
  return NextResponse.json({ success: true });
}
