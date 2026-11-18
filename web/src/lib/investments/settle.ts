import { createAdminClient } from "@/lib/supabase/admin";
import { computeSettlement, releasedFunds, type SettlementBreakdown } from "./settlement";

/**
 * Loads what is needed to settle a sale and computes the breakdown.
 * Server-only. Used by the admin sale page (preview) and the settle API,
 * so both always show and save the same numbers.
 */
export async function previewSettlement(saleId: string): Promise<
  | {
      ok: true;
      sale: { id: string; investmentId: string; status: string; reference: string };
      breakdown: SettlementBreakdown;
    }
  | { ok: false; error: string }
> {
  const db = createAdminClient();
  const { data: sale } = await db
    .from("investment_sales")
    .select("id, investment_id, sale_amount, status, reference, investment:investments!investment_id ( amount )")
    .eq("id", saleId)
    .maybeSingle();
  if (!sale) return { ok: false, error: "Sale not found" };

  const { data: requests } = await db
    .from("fund_requests")
    .select("amount, status")
    .eq("investment_id", sale.investment_id);

  const capital = Number(
    (sale.investment as unknown as { amount: number | string } | null)?.amount ?? 0,
  );
  const breakdown = computeSettlement({
    capital,
    fundsReleased: releasedFunds(
      (requests ?? []).map((r) => ({ status: r.status, amount: Number(r.amount) })),
    ),
    saleAmount: Number(sale.sale_amount),
  });

  return {
    ok: true,
    sale: {
      id: sale.id,
      investmentId: sale.investment_id,
      status: sale.status,
      reference: sale.reference,
    },
    breakdown,
  };
}
