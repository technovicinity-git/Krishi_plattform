import { createAdminClient } from "@/lib/supabase/admin";
import { getWithdrawalPreference, type WithdrawalPreference } from "@/lib/auth/current-user";
import { WITHDRAWAL_MIN } from "./config";

export { WITHDRAWAL_MIN };

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  investmentId: string | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  reference: string;
  amount: number;
  method: string;
  destination: string;
  status: string;
  payoutTxnId: string | null;
  rejectionReason: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Wallet {
  balance: number;
  pending: number;
  earned: number;
  withdrawn: number;
  transactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  payout: WithdrawalPreference | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** "bKash 017•••678" / "City Bank •••4321" for showing where money goes. */
export function describeDestination(row: {
  method: string;
  mfs_provider?: string | null;
  mobile_number?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
}): string {
  const tail = (v: string | null | undefined) => (v ? `•••${v.slice(-4)}` : "");
  if (row.method === "mobile") {
    const provider = row.mfs_provider
      ? row.mfs_provider.charAt(0).toUpperCase() + row.mfs_provider.slice(1)
      : "Mobile";
    return `${provider} ${tail(row.mobile_number)}`.trim();
  }
  return `${row.bank_name ?? "Bank"} ${tail(row.bank_account_number)}`.trim();
}

/** Balance, totals, recent activity and payout account for one user. Server-only. */
export async function getWallet(userId: string): Promise<Wallet> {
  const db = createAdminClient();
  const [{ data: txRows }, { data: wdRows }, payout] = await Promise.all([
    db
      .from("wallet_transactions")
      .select("id, type, amount, description, investment_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    db
      .from("withdrawal_requests")
      .select("id, reference, amount, method, mfs_provider, mobile_number, bank_name, bank_account_number, status, payout_txn_id, rejection_reason, admin_note, created_at, reviewed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    getWithdrawalPreference(userId),
  ]);

  const transactions = (txRows ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    investmentId: t.investment_id,
    createdAt: t.created_at,
  }));
  const withdrawals = (wdRows ?? []).map((w) => ({
    id: w.id,
    reference: w.reference,
    amount: Number(w.amount),
    method: w.method,
    destination: describeDestination(w),
    status: w.status,
    payoutTxnId: w.payout_txn_id,
    rejectionReason: w.rejection_reason,
    adminNote: w.admin_note,
    createdAt: w.created_at,
    reviewedAt: w.reviewed_at,
  }));

  return {
    balance: round2(transactions.reduce((s, t) => s + t.amount, 0)),
    pending: round2(withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + w.amount, 0)),
    earned: round2(
      transactions
        .filter((t) => t.type === "settlement_payout" || t.type === "settlement_share")
        .reduce((s, t) => s + t.amount, 0),
    ),
    withdrawn: round2(withdrawals.filter((w) => w.status === "paid").reduce((s, w) => s + w.amount, 0)),
    transactions,
    withdrawals,
    payout,
  };
}
