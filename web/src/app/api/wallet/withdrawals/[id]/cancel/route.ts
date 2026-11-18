import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

/** The owner cancels a withdrawal that hasn't been paid yet; the money returns to the wallet. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();
  const { data: wd } = await db
    .from("withdrawal_requests")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!wd || wd.user_id !== user.id) {
    return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
  }

  const { error } = await db.rpc("close_withdrawal", {
    p_withdrawal_id: id,
    p_status: "cancelled",
    p_reviewer_id: user.id,
    p_payout_txn_id: null,
    p_note: null,
    p_reason: null,
  });
  if (error) {
    if (error.message?.includes("NOT_PENDING")) {
      return NextResponse.json({ error: "This withdrawal can no longer be cancelled" }, { status: 409 });
    }
    console.error("[wallet/withdrawals/cancel] failed:", error);
    return NextResponse.json({ error: "Could not cancel" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
