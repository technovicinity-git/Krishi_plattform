import { createAdminClient } from "@/lib/supabase/admin";
import { capitalSpent } from "./settlement";

/**
 * Capital spent on one batch, from the database: the confirmed purchase cost
 * plus fund requests (see capitalSpent). Server-only.
 */
export async function getCapitalSpent(
  investmentId: string,
  opts: {
    includePending?: boolean;
    /** A request not saved yet, counted as if pending (to check a new request). */
    extra?: { amount: number; purpose: string };
  } = {},
): Promise<{ purchase: number; otherRequests: number; spent: number }> {
  const db = createAdminClient();
  const [{ data: purchases }, { data: requests }] = await Promise.all([
    db.from("investment_updates").select("amount, created_at").eq("investment_id", investmentId).eq("update_type", "purchase"),
    db.from("fund_requests").select("amount, status, purpose, created_at").eq("investment_id", investmentId),
  ]);
  const purchaseCost = (purchases ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const purchasedAt = (purchases ?? []).map((p) => p.created_at as string).sort()[0] ?? null;
  return capitalSpent({
    purchaseCost,
    purchasedAt,
    requests: [
      ...(requests ?? []).map((r) => ({ status: r.status, amount: Number(r.amount), purpose: r.purpose, createdAt: r.created_at })),
      ...(opts.extra ? [{ status: "pending", amount: opts.extra.amount, purpose: opts.extra.purpose }] : []),
    ],
    includePending: opts.includePending,
  });
}
