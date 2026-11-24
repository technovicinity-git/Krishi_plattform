import { createAdminClient } from "@/lib/supabase/admin";
import { describeDestination } from "@/lib/wallet";

/**
 * Every money movement in one list, for the Transactions page of each panel.
 *
 * Sources: deposits (manual + online), online-payment refunds, fund requests
 * released to farmers, sale money sent by farmers, wallet credits
 * (settlement payouts, profit shares, adjustments), withdrawals, and Krishi's
 * platform share.
 *
 * `direction` is from the viewer's side:
 *  - a person (investor / farmer / steward): "in" = Krishi gave or credited
 *    them money, "out" = they paid Krishi or took money out of their wallet.
 *  - the platform (admin): "in" / "out" = money into / out of Krishi's
 *    accounts; "internal" = moved between wallets inside Krishi (credits,
 *    platform share), no cash moved.
 * Server-only.
 */

export type TxKind =
  | "deposit"
  | "refund"
  | "fund_release"
  | "remittance"
  | "payout"
  | "share"
  | "monthly_pay"
  | "adjustment"
  | "withdrawal"
  | "platform_share"
  | "platform_loss";

export const TX_KINDS: TxKind[] = [
  "deposit",
  "refund",
  "fund_release",
  "remittance",
  "payout",
  "share",
  "monthly_pay",
  "adjustment",
  "withdrawal",
  "platform_share",
  "platform_loss",
];

export type TxDirection = "in" | "out" | "internal";

export interface TxEntry {
  id: string;
  at: string;
  kind: TxKind;
  direction: TxDirection;
  amount: number;
  /** pending | completed | rejected | refunded | cancelled | processing */
  status: string;
  reference: string | null;
  /** Free text from the record: payment method, purpose, payout account, note. */
  detail: string | null;
  investmentId: string | null;
  investmentRef: string | null;
  /** Admin view: who the money belongs to. */
  party: string | null;
  partyRole: string | null;
  /** Admin view: the console page for this record. */
  adminHref: string | null;
}

export interface TxSummary {
  /** Sum of completed "in" entries. */
  totalIn: number;
  /** Sum of completed "out" entries. */
  totalOut: number;
  /** Completed amount per kind. */
  byKind: Partial<Record<TxKind, number>>;
  /** Count of entries still pending. */
  pending: number;
}

export interface LedgerFilters {
  kinds?: TxKind[];
  /** ISO dates (inclusive), e.g. "2026-11-01". */
  from?: string;
  to?: string;
  search?: string;
}

export type LedgerScope =
  | { kind: "user"; userId: string; role: "investor" | "farmer" | "steward" }
  | { kind: "platform" };

const PER_SOURCE_LIMIT = 2000;
const num = (v: unknown) => Number(v ?? 0);

type Names = Map<string, { name: string | null; role: string | null }>;
type InvRefs = Map<string, string>;

/** The ledger plus totals, newest first. */
export async function getLedger(scope: LedgerScope, filters: LedgerFilters = {}): Promise<{ entries: TxEntry[]; summary: TxSummary }> {
  const db = createAdminClient();
  const platform = scope.kind === "platform";
  const userId = scope.kind === "user" ? scope.userId : null;
  const role = scope.kind === "user" ? scope.role : null;
  const wants = (k: TxKind) => !filters.kinds?.length || filters.kinds.includes(k);
  // Dates are Bangladesh days (UTC+6), inclusive.
  const lo = filters.from ? `${filters.from}T00:00:00+06:00` : null;
  const hi = filters.to ? `${filters.to}T23:59:59.999+06:00` : null;

  const entries: TxEntry[] = [];
  const userIds = new Set<string>();
  const investmentIds = new Set<string>();
  const base = { investmentId: null, investmentRef: null, party: null, partyRole: null, adminHref: null } as const;

  // ── Deposits and online payments (investor money into Krishi) ────────────
  if ((platform || role === "investor") && (wants("deposit") || wants("refund"))) {
    let deposits = db
      .from("deposits")
      .select("id, reference, investor_id, interest_id, amount, method, status, created_at, rejection_reason")
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);
    if (userId) deposits = deposits.eq("investor_id", userId);
    let payments = db
      .from("online_payments")
      .select("id, tran_id, investor_id, interest_id, amount, status, deposit_id, paid_at, created_at, refund_amount, refund_method, refund_reason, refund_requested_at, refunded_at")
      .in("status", ["paid", "refund_pending", "refunded"])
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);
    if (userId) payments = payments.eq("investor_id", userId);
    if (lo) {
      deposits = deposits.gte("created_at", lo);
      payments = payments.gte("created_at", lo);
    }
    if (hi) {
      deposits = deposits.lte("created_at", hi);
      payments = payments.lte("created_at", hi);
    }
    const [{ data: deps }, { data: pays }] = await Promise.all([deposits, payments]);

    // Deposits -> the investment they started (one per interest).
    const interestIds = [...new Set([...(deps ?? []), ...(pays ?? [])].map((d) => d.interest_id as string))];
    const { data: invs } = interestIds.length
      ? await db.from("investments").select("id, reference, interest_id").in("interest_id", interestIds)
      : { data: [] };
    const invByInterest = new Map((invs ?? []).map((i) => [i.interest_id as string, i]));

    if (wants("deposit")) {
      for (const d of deps ?? []) {
        const inv = invByInterest.get(d.interest_id);
        userIds.add(d.investor_id);
        entries.push({
          ...base,
          id: `dep-${d.id}`,
          at: d.created_at,
          kind: "deposit",
          direction: platform ? "in" : "out",
          amount: num(d.amount),
          status: d.status === "approved" ? "completed" : d.status,
          reference: d.reference,
          detail: d.method === "online" ? "online" : d.method,
          investmentId: inv?.id ?? null,
          investmentRef: inv?.reference ?? null,
          party: d.investor_id,
          adminHref: d.status === "pending" ? "/krishi-console/deposits" : "/krishi-console/deposits?view=history",
        });
      }
      // Paid online but the deposit couldn't be recorded: still money in.
      for (const p of pays ?? []) {
        if (p.deposit_id || p.status !== "paid") continue;
        userIds.add(p.investor_id);
        entries.push({
          ...base,
          id: `pay-${p.id}`,
          at: p.paid_at ?? p.created_at,
          kind: "deposit",
          direction: platform ? "in" : "out",
          amount: num(p.amount),
          status: "pending",
          reference: p.tran_id,
          detail: "online",
          party: p.investor_id,
          adminHref: "/krishi-console/deposits?view=online",
        });
      }
    }
    if (wants("refund")) {
      for (const p of pays ?? []) {
        if (p.status !== "refund_pending" && p.status !== "refunded") continue;
        userIds.add(p.investor_id);
        entries.push({
          ...base,
          id: `ref-${p.id}`,
          at: p.refunded_at ?? p.refund_requested_at ?? p.created_at,
          kind: "refund",
          direction: platform ? "out" : "in",
          amount: num(p.refund_amount ?? p.amount),
          status: p.status === "refunded" ? "completed" : "processing",
          reference: p.tran_id,
          detail: p.refund_reason,
          party: p.investor_id,
          adminHref: "/krishi-console/deposits?view=online",
        });
      }
    }
  }

  // ── Fund requests released to farmers ─────────────────────────────────────
  // Approval credits the farmer's wallet; the cash leaves Krishi when the
  // farmer withdraws it (counted under withdrawals). So for the platform it's
  // internal, for the farmer it's money in.
  if ((platform || role === "farmer") && wants("fund_release")) {
    let q = db
      .from("fund_requests")
      .select("id, reference, investment_id, farmer_id, amount, purpose, status, created_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);
    if (userId) q = q.eq("farmer_id", userId);
    // Platform: only requests that were credited to the farmer.
    if (platform) q = q.in("status", ["approved", "disbursed"]);
    if (lo) q = q.gte("created_at", lo);
    if (hi) q = q.lte("created_at", hi);
    const { data } = await q;
    for (const r of data ?? []) {
      userIds.add(r.farmer_id);
      investmentIds.add(r.investment_id);
      entries.push({
        ...base,
        id: `fr-${r.id}`,
        at: r.reviewed_at ?? r.created_at,
        kind: "fund_release",
        direction: platform ? "internal" : "in",
        amount: num(r.amount),
        status: r.status === "approved" || r.status === "disbursed" ? "completed" : r.status,
        reference: r.reference,
        detail: r.purpose,
        investmentId: r.investment_id,
        party: r.farmer_id,
      });
    }
  }

  // ── Sale money sent by farmers to Krishi ─────────────────────────────────
  if ((platform || role === "farmer") && wants("remittance")) {
    let q = db
      .from("investment_sales")
      .select("id, reference, investment_id, farmer_id, sale_amount, funds_returned, status, remit_method, remit_txn_id, remitted_at, received_at, remit_rejection_reason")
      .not("remitted_at", "is", null)
      .order("remitted_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);
    if (userId) q = q.eq("farmer_id", userId);
    if (lo) q = q.gte("remitted_at", lo);
    if (hi) q = q.lte("remitted_at", hi);
    const { data } = await q;
    for (const s of data ?? []) {
      userIds.add(s.farmer_id);
      investmentIds.add(s.investment_id);
      const status =
        s.status === "settled" ? "completed" : s.status === "awaiting_remittance" ? "rejected" : "pending";
      entries.push({
        ...base,
        id: `rem-${s.id}`,
        at: s.received_at ?? s.remitted_at,
        kind: "remittance",
        direction: platform ? "in" : "out",
        amount: num(s.sale_amount) + num(s.funds_returned),
        status,
        reference: s.reference,
        detail: [s.remit_method, s.remit_txn_id, status === "rejected" ? s.remit_rejection_reason : null].filter(Boolean).join(" · ") || null,
        investmentId: s.investment_id,
        party: s.farmer_id,
        adminHref: `/krishi-console/sales/${s.id}`,
      });
    }
  }

  // ── Wallet credits: settlement payouts, profit shares, monthly pay, adjustments
  if (wants("payout") || wants("share") || wants("monthly_pay") || wants("adjustment")) {
    let q = db
      .from("wallet_transactions")
      .select("id, user_id, type, amount, description, investment_id, created_at")
      .in("type", ["settlement_payout", "settlement_share", "monthly_pay", "adjustment"])
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);
    if (userId) q = q.eq("user_id", userId);
    if (lo) q = q.gte("created_at", lo);
    if (hi) q = q.lte("created_at", hi);
    const { data } = await q;
    for (const t of data ?? []) {
      const kind: TxKind =
        t.type === "settlement_payout" ? "payout" : t.type === "settlement_share" ? "share" : t.type === "monthly_pay" ? "monthly_pay" : "adjustment";
      if (!wants(kind)) continue;
      const amount = num(t.amount);
      userIds.add(t.user_id);
      if (t.investment_id) investmentIds.add(t.investment_id);
      entries.push({
        ...base,
        id: `wt-${t.id}`,
        at: t.created_at,
        kind,
        // Inside Krishi, a wallet credit moves no cash.
        direction: platform ? "internal" : amount < 0 ? "out" : "in",
        amount: Math.abs(amount),
        status: "completed",
        reference: null,
        detail: t.description,
        investmentId: t.investment_id,
        party: t.user_id,
      });
    }
  }

  // ── Withdrawals (wallet money paid out to the person's bank / wallet) ────
  if (wants("withdrawal")) {
    let q = db
      .from("withdrawal_requests")
      .select("id, reference, user_id, amount, method, mfs_provider, mobile_number, bank_name, bank_account_number, status, payout_txn_id, rejection_reason, created_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);
    if (userId) q = q.eq("user_id", userId);
    // Platform: cash only leaves Krishi when the withdrawal is paid.
    if (platform) q = q.eq("status", "paid");
    if (lo) q = q.gte("created_at", lo);
    if (hi) q = q.lte("created_at", hi);
    const { data } = await q;
    for (const w of data ?? []) {
      userIds.add(w.user_id);
      entries.push({
        ...base,
        id: `wd-${w.id}`,
        at: w.reviewed_at && w.status === "paid" ? w.reviewed_at : w.created_at,
        kind: "withdrawal",
        direction: "out",
        amount: num(w.amount),
        status: w.status === "paid" ? "completed" : w.status,
        reference: w.reference,
        detail: [describeDestination(w), w.payout_txn_id, w.status === "rejected" ? w.rejection_reason : null].filter(Boolean).join(" · "),
        party: w.user_id,
        adminHref: "/krishi-console/withdrawals",
      });
    }
  }

  // ── Krishi's 5% of profit (platform only) ────────────────────────────────
  if (platform && wants("platform_share")) {
    let q = db
      .from("investment_settlements")
      .select("id, investment_id, sale_id, platform_share, settled_at")
      .gt("platform_share", 0)
      .order("settled_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);
    if (lo) q = q.gte("settled_at", lo);
    if (hi) q = q.lte("settled_at", hi);
    const { data } = await q;
    for (const s of data ?? []) {
      investmentIds.add(s.investment_id);
      entries.push({
        ...base,
        id: `ps-${s.id}`,
        at: s.settled_at,
        kind: "platform_share",
        direction: "internal",
        amount: num(s.platform_share),
        status: "completed",
        reference: null,
        detail: null,
        investmentId: s.investment_id,
        adminHref: `/krishi-console/sales/${s.sale_id}`,
      });
    }
  }

  // ── Krishi's loss on steward monthly pay (platform only) ──────────────────
  // Monthly pay above the steward's 5% share: Krishi carried the difference.
  if (platform && wants("platform_loss")) {
    let q = db
      .from("investment_settlements")
      .select("id, investment_id, sale_id, platform_loss, steward_share, steward_monthly_total, settled_at")
      .gt("platform_loss", 0)
      .order("settled_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);
    if (lo) q = q.gte("settled_at", lo);
    if (hi) q = q.lte("settled_at", hi);
    const { data } = await q;
    for (const s of data ?? []) {
      investmentIds.add(s.investment_id);
      entries.push({
        ...base,
        id: `pl-${s.id}`,
        at: s.settled_at,
        kind: "platform_loss",
        direction: "internal",
        amount: num(s.platform_loss),
        status: "completed",
        reference: null,
        detail: `Monthly pay ৳${num(s.steward_monthly_total).toLocaleString("en-IN")} vs 5% share ৳${num(s.steward_share).toLocaleString("en-IN")}`,
        investmentId: s.investment_id,
        adminHref: "/krishi-console/steward-pay?view=losses",
      });
    }
  }

  // ── Names and batch references ───────────────────────────────────────────
  const [names, invRefs] = await Promise.all([
    platform ? loadNames(db, [...userIds]) : Promise.resolve<Names>(new Map()),
    loadInvestmentRefs(db, [...investmentIds].filter(Boolean)),
  ]);
  for (const e of entries) {
    if (e.investmentId && !e.investmentRef) e.investmentRef = invRefs.get(e.investmentId) ?? null;
    if (platform && e.party) {
      const who = names.get(e.party);
      e.partyRole = who?.role ?? null;
      e.party = who?.name ?? null;
    } else {
      e.party = null;
    }
  }

  // Search (reference, batch, detail, name).
  const needle = filters.search?.trim().toLowerCase();
  const shown = needle
    ? entries.filter((e) =>
        [e.reference, e.investmentRef, e.detail, e.party].some((v) => v?.toLowerCase().includes(needle)),
      )
    : entries;
  shown.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return { entries: shown, summary: summarize(shown) };
}

function summarize(entries: TxEntry[]): TxSummary {
  const summary: TxSummary = { totalIn: 0, totalOut: 0, byKind: {}, pending: 0 };
  for (const e of entries) {
    if (e.status === "pending" || e.status === "processing") summary.pending += 1;
    if (e.status !== "completed") continue;
    if (e.direction === "in") summary.totalIn += e.amount;
    if (e.direction === "out") summary.totalOut += e.amount;
    summary.byKind[e.kind] = (summary.byKind[e.kind] ?? 0) + (e.kind === "adjustment" && e.direction === "out" ? -e.amount : e.amount);
  }
  const r = (n: number) => Math.round(n * 100) / 100;
  summary.totalIn = r(summary.totalIn);
  summary.totalOut = r(summary.totalOut);
  for (const k of Object.keys(summary.byKind) as TxKind[]) summary.byKind[k] = r(summary.byKind[k]!);
  return summary;
}

async function loadNames(db: ReturnType<typeof createAdminClient>, ids: string[]): Promise<Names> {
  if (ids.length === 0) return new Map();
  const { data } = await db.from("users").select("id, full_name, phone, role").in("id", ids);
  return new Map((data ?? []).map((u) => [u.id, { name: u.full_name ?? u.phone, role: u.role }]));
}

async function loadInvestmentRefs(db: ReturnType<typeof createAdminClient>, ids: string[]): Promise<InvRefs> {
  if (ids.length === 0) return new Map();
  const { data } = await db.from("investments").select("id, reference").in("id", ids);
  return new Map((data ?? []).map((i) => [i.id, i.reference]));
}

/** Reads ?type=&from=&to=&q= into filters (unknown values ignored). */
export function parseLedgerFilters(params: Record<string, string | string[] | undefined>): LedgerFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? undefined;
  const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const kind = one(params.type);
  return {
    kinds: kind && (TX_KINDS as string[]).includes(kind) ? [kind as TxKind] : undefined,
    from: date(one(params.from)),
    to: date(one(params.to)),
    search: one(params.q)?.slice(0, 80) || undefined,
  };
}

/** Kinds that can appear for each viewer (for the type filter). */
export function kindsFor(scope: LedgerScope): TxKind[] {
  if (scope.kind === "platform") return TX_KINDS;
  if (scope.role === "investor") return ["deposit", "refund", "payout", "adjustment", "withdrawal"];
  if (scope.role === "farmer") return ["fund_release", "remittance", "share", "adjustment", "withdrawal"];
  return ["monthly_pay", "share", "adjustment", "withdrawal"];
}

/** CSV of the ledger (for spreadsheets). */
export function ledgerCsv(entries: TxEntry[], platform: boolean): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["date", "type", "direction", "amount", "status", "reference", "batch", ...(platform ? ["party", "role"] : []), "detail"];
  const rows = entries.map((e) => [
    e.at,
    e.kind,
    e.direction,
    e.direction === "out" ? -e.amount : e.amount,
    e.status,
    e.reference,
    e.investmentRef,
    ...(platform ? [e.party, e.partyRole] : []),
    e.detail,
  ]);
  return [head, ...rows].map((r) => r.map(cell).join(",")).join("\n") + "\n";
}

/**
 * An investor's profit in the shown period: payouts received minus the
 * capital of the batches those payouts settled. Batches still running are
 * left out, so paying for a new batch does not look like a loss.
 */
export async function investorProfit(
  entries: { kind: string; status: string; direction: string; amount: number; investmentId: string | null }[],
) {
  const payouts = entries.filter((e) => e.kind === "payout" && e.status === "completed");
  const ids = [...new Set(payouts.map((e) => e.investmentId).filter((id): id is string => Boolean(id)))];
  // Settlement corrections on those batches change what was paid out.
  const corrections = entries.filter((e) => e.kind === "adjustment" && e.investmentId && ids.includes(e.investmentId));
  const received =
    payouts.reduce((s, e) => s + e.amount, 0) +
    corrections.reduce((s, e) => s + (e.direction === "out" ? -e.amount : e.amount), 0);
  if (ids.length === 0) return { amount: Math.round(received * 100) / 100, batches: 0 };
  const { data } = await createAdminClient().from("investments").select("amount").in("id", ids);
  const capital = (data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  return { amount: Math.round((received - capital) * 100) / 100, batches: ids.length };
}
