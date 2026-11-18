import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { WITHDRAWAL_MIN } from "@/lib/wallet/config";

export const runtime = "nodejs";

const schema = z.object({
  amount: z.coerce.number().positive().max(100_000_000),
});

const ERRORS: Record<string, [string, number]> = {
  BELOW_MINIMUM: [`The minimum withdrawal is ৳${WITHDRAWAL_MIN.toLocaleString("en-IN")}`, 400],
  INSUFFICIENT_BALANCE: ["You don't have that much in your wallet", 400],
  NO_PAYOUT_ACCOUNT: ["Add a payout account before withdrawing", 400],
};

/**
 * Investor, farmer or steward asks to withdraw from their wallet.
 * The amount is held at once; an admin pays it and marks it paid.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["investor", "farmer", "steward"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  // Whole paisa only.
  const amount = Math.round(parsed.data.amount * 100) / 100;

  const { data: id, error } = await createAdminClient().rpc("request_withdrawal", {
    p_user_id: user.id,
    p_amount: amount,
    p_min_amount: WITHDRAWAL_MIN,
  });

  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message?.includes(k));
    if (known) {
      const [message, status] = ERRORS[known];
      return NextResponse.json({ error: message }, { status });
    }
    console.error("[wallet/withdrawals] request failed:", error);
    return NextResponse.json({ error: "Could not create the withdrawal" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}
