/**
 * How a sold batch is settled. Pure functions: safe on client and server.
 *
 * Money model
 * - The investor's capital sits with Krishi. Approved fund requests are the
 *   part of it released to the farmer; the rest stays unspent.
 * - The farmer sells the animals and sends the full sale money to Krishi.
 * - Total return = sale money + unspent capital.
 * - Net result   = total return - capital  (= sale money - funds released).
 *
 * Profit: the net is split by PROFIT_SPLIT; the investor also gets their
 * capital back. Loss or break-even: nobody takes a share and the investor
 * receives the whole total return (they carry the loss).
 */
export const PROFIT_SPLIT = {
  farmer: 60,
  investor: 30,
  platform: 5,
  steward: 5,
} as const;

export interface SettlementInput {
  capital: number;
  fundsReleased: number;
  saleAmount: number;
}

export interface SettlementBreakdown {
  capital: number;
  fundsReleased: number;
  unspent: number;
  saleAmount: number;
  totalReturn: number;
  netResult: number;
  outcome: "profit" | "loss" | "break_even";
  investorPayout: number;
  investorProfit: number;
  farmerShare: number;
  stewardShare: number;
  platformShare: number;
  split: typeof PROFIT_SPLIT;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeSettlement({
  capital,
  fundsReleased,
  saleAmount,
}: SettlementInput): SettlementBreakdown {
  const unspent = round2(Math.max(0, capital - fundsReleased));
  const totalReturn = round2(saleAmount + unspent);
  const netResult = round2(totalReturn - capital);

  if (netResult <= 0) {
    return {
      capital,
      fundsReleased,
      unspent,
      saleAmount,
      totalReturn,
      netResult,
      outcome: netResult < 0 ? "loss" : "break_even",
      investorPayout: totalReturn,
      investorProfit: netResult,
      farmerShare: 0,
      stewardShare: 0,
      platformShare: 0,
      split: PROFIT_SPLIT,
    };
  }

  const farmerShare = round2((netResult * PROFIT_SPLIT.farmer) / 100);
  const stewardShare = round2((netResult * PROFIT_SPLIT.steward) / 100);
  const platformShare = round2((netResult * PROFIT_SPLIT.platform) / 100);
  // Investor takes the remainder so rounding never loses or invents a paisa.
  const investorProfit = round2(netResult - farmerShare - stewardShare - platformShare);

  return {
    capital,
    fundsReleased,
    unspent,
    saleAmount,
    totalReturn,
    netResult,
    outcome: "profit",
    investorPayout: round2(capital + investorProfit),
    investorProfit,
    farmerShare,
    stewardShare,
    platformShare,
    split: PROFIT_SPLIT,
  };
}

/** Sum of fund requests that count as money released to the farmer. */
export function releasedFunds(requests: Array<{ status: string; amount: number }>): number {
  return round2(
    requests
      .filter((r) => r.status === "approved" || r.status === "disbursed")
      .reduce((sum, r) => sum + Number(r.amount), 0),
  );
}
