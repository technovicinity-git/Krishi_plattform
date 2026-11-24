import { createAdminClient } from "@/lib/supabase/admin";
import { computeSettlement, matchStewardPay, type SettlementBreakdown, type StewardPayMatch } from "./settlement";
import { getCapitalSpent } from "./spending";

/**
 * Loads what is needed to settle a sale and computes the breakdown.
 * Server-only. Used by the admin sale page (preview) and the settle API,
 * so both always show and save the same numbers.
 */
export async function previewSettlement(saleId: string): Promise<
  | {
      ok: true;
      sale: { id: string; investmentId: string; status: string; reference: string; kind: string };
      breakdown: SettlementBreakdown;
      /** Steward monthly pay: what settling now counts and how it meets the 5% share. */
      monthlyPay: StewardPayMatch & { months: number; rate: number; sentMonths: number; sentTotal: number; sendNow: number };
    }
  | { ok: false; error: string }
> {
  const db = createAdminClient();
  const { data: sale } = await db
    .from("investment_sales")
    .select("id, investment_id, sale_amount, funds_returned, status, reference, kind, investment:investments!investment_id ( amount )")
    .eq("id", saleId)
    .maybeSingle();
  if (!sale) return { ok: false, error: "Sale not found" };

  const capital = Number(
    (sale.investment as unknown as { amount: number | string } | null)?.amount ?? 0,
  );
  // Everything paid out of the capital, minus the unspent fund money the
  // farmer sent back with the sale money (fixed when the sale was confirmed).
  const [{ released }, { data: payRows }] = await Promise.all([
    getCapitalSpent(sale.investment_id),
    db.rpc("monthly_pay_preview", { p_investment_id: sale.investment_id }),
  ]);
  const pay = (payRows as { months: number; rate: number | string; sent_months: number; sent_total: number | string; total: number | string }[] | null)?.[0];
  const spent = Math.max(0, released - Number(sale.funds_returned ?? 0));
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
      kind: sale.kind,
    },
    breakdown,
    monthlyPay: {
      ...matchStewardPay(breakdown.stewardShare, Number(pay?.total ?? 0)),
      months: pay?.months ?? 0,
      rate: Number(pay?.rate ?? 0),
      sentMonths: pay?.sent_months ?? 0,
      sentTotal: Number(pay?.sent_total ?? 0),
      sendNow: Math.round((Number(pay?.total ?? 0) - Number(pay?.sent_total ?? 0)) * 100) / 100,
    },
  };
}
