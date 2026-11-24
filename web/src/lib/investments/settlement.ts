/**
 * How a sold batch is settled. Pure functions: safe on client and server.
 *
 * Money model
 * - The investor's capital sits with Krishi. What is spent on the batch is
 *   the animal purchase cost plus approved fund requests (see capitalSpent);
 *   the rest stays unspent.
 * - The farmer sells the animals and sends the full sale money to Krishi.
 * - Total return = sale money + unspent capital.
 * - Net result   = total return - capital  (= sale money - money spent).
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

/**
 * Money taken out of a batch's capital, and how much of it was really spent.
 *
 * - purchase: what the animals really cost, as recorded when the farmer
 *   confirmed the purchase. An "animal_purchase" fund request pays toward that
 *   same purchase (whenever it was made). If the request was larger than the
 *   recorded cost, the difference was not spent: it is part of `leftover` and
 *   goes back with the sale money. Until a purchase is recorded, the request
 *   counts as spent.
 * - otherRequests: approved fund requests for care (feed, medical, ...).
 * - released: everything paid out of the capital (the larger of the purchase
 *   request and the recorded cost, plus care requests).
 *   `includePending` also counts requests still waiting for the steward
 *   (used to cap new requests).
 * - careSpent: approved care expenses, up to the care money released.
 * - leftover: purchase or care money released but not spent; the farmer sends
 *   it back with the sale money.
 * - spent: purchase + careSpent, what counts against the investor.
 *
 * Without `expenses`, all released care money counts as spent.
 */
export interface CapitalSpending {
  purchase: number;
  otherRequests: number;
  released: number;
  careSpent: number;
  leftover: number;
  spent: number;
}

export function capitalSpent(input: {
  purchaseCost: number;
  requests: Array<{ status: string; amount: number; purpose: string }>;
  /** Expenses the farmer logged (only approved ones count). */
  expenses?: Array<{ status: string; amount: number; category: string }>;
  includePending?: boolean;
}): CapitalSpending {
  const counted = input.requests.filter(
    (r) =>
      r.status === "approved" ||
      r.status === "disbursed" ||
      (input.includePending && r.status === "pending"),
  );
  const animalRequests = counted
    .filter((r) => r.purpose === "animal_purchase")
    .reduce((s, r) => s + Number(r.amount), 0);
  const otherRequests = counted
    .filter((r) => r.purpose !== "animal_purchase")
    .reduce((s, r) => s + Number(r.amount), 0);
  const recorded = Number(input.purchaseCost) || 0;
  // Paid out for the purchase vs what the animals actually cost.
  const purchaseReleased = Math.max(recorded, animalRequests);
  const purchase = recorded > 0 ? recorded : animalRequests;
  // Animal-purchase expenses belong to the purchase, which is counted above.
  const careExpenses = input.expenses
    ? input.expenses
        .filter((e) => e.status === "approved" && e.category !== "animal_purchase")
        .reduce((s, e) => s + Number(e.amount), 0)
    : otherRequests;
  const careSpent = Math.min(careExpenses, otherRequests);
  return {
    purchase: round2(purchase),
    otherRequests: round2(otherRequests),
    released: round2(purchaseReleased + otherRequests),
    careSpent: round2(careSpent),
    leftover: round2(purchaseReleased - purchase + otherRequests - careSpent),
    spent: round2(purchase + careSpent),
  };
}


/**
 * Steward monthly pay against the steward's profit share, at settlement.
 *
 * The steward is paid a monthly amount for every month of a batch (from the
 * farmer being assigned until settlement; the month in progress at
 * settlement counts as a full month). That pay is an advance on the 5% share:
 * - share larger: the steward gets the rest of the share as a top-up.
 * - monthly pay larger: the steward keeps it; the difference is Krishi's loss.
 * Monthly pay is never taken back. Investor and farmer are not affected.
 * (Mirrors public.settle_monthly_pay in the database.)
 */
export interface StewardPayMatch {
  share: number;
  monthlyTotal: number;
  topup: number;
  platformLoss: number;
  /** What the steward ends up with from this batch: the larger of the two. */
  stewardTotal: number;
}

export function matchStewardPay(share: number, monthlyTotal: number): StewardPayMatch {
  const s = round2(Math.max(0, share));
  const m = round2(Math.max(0, monthlyTotal));
  return {
    share: s,
    monthlyTotal: m,
    topup: round2(Math.max(0, s - m)),
    platformLoss: round2(Math.max(0, m - s)),
    stewardTotal: round2(Math.max(s, m)),
  };
}
