import { createAdminClient } from "@/lib/supabase/admin";
import { computeSettlement, type SettlementBreakdown } from "./settlement";
import { getCapitalSpent } from "./spending";

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

  const capital = Number(
    (sale.investment as unknown as { amount: number | string } | null)?.amount ?? 0,
  );
  // Animal purchase + approved fund requests (not just the requests).
  const { spent } = await getCapitalSpent(sale.investment_id);
  const breakdown = computeSettlement({
    capital,
    fundsReleased: spent,
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
