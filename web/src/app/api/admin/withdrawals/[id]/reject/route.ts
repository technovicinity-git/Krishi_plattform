import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500),
});

/** Admin rejects a withdrawal; the held money goes back to the user's wallet. */
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
    p_status: "rejected",
    p_reviewer_id: admin.id,
    p_payout_txn_id: null,
    p_note: null,
    p_reason: parsed.data.reason,
  });
  if (error) {
    if (error.message?.includes("NOT_PENDING")) {
      return NextResponse.json({ error: "This withdrawal is no longer pending" }, { status: 409 });
    }
    console.error("[admin/withdrawals/reject] failed:", error);
    return NextResponse.json({ error: "Could not reject" }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "withdrawal.reject",
    targetType: "withdrawal_request",
    targetId: id,
    metadata: { reason: parsed.data.reason },
    request,
  });
  return NextResponse.json({ success: true });
}
