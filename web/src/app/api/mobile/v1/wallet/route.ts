import { requireMobileUser, json } from "@/lib/mobile/api";
import { getWallet } from "@/lib/wallet";
import { WITHDRAWAL_MIN } from "@/lib/wallet/config";

export const runtime = "nodejs";

/**
 * Balance, transactions, withdrawals and payout account. Withdraw with
 * POST /api/wallet/withdrawals {amount}; cancel with
 * POST /api/wallet/withdrawals/[id]/cancel; set the payout account with
 * POST /api/onboarding/withdrawal.
 */
export async function GET() {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  const wallet = await getWallet(user.id);
  return json({ ...wallet, minimumWithdrawal: WITHDRAWAL_MIN });
}
