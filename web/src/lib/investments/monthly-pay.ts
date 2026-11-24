import { createAdminClient } from "@/lib/supabase/admin";
import { matchStewardPay, type StewardPayMatch } from "./settlement";

/**
 * Steward monthly pay (see migration 20261125000001_steward_monthly_pay.sql).
 * The database decides which months are due (view steward_monthly_pay_due)
 * and does all sending, reversing and settling; this module only reads.
 * Server-only.
 */

export interface MonthlyPayment {
  id: string;
  investmentId: string;
  stewardId: string;
  monthNo: number;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: "sent" | "reversed";
  atSettlement: boolean;
  sentAt: string;
  reversedAt: string | null;
  reversalReason: string | null;
}

export interface DueMonth {
  investmentId: string;
  reference: string;
  stewardId: string;
  monthNo: number;
  periodStart: string;
  periodEnd: string;
  amount: number;
}

export interface BatchMonthlyPay {
  /** The batch's own rate; null until the plan has one. */
  rate: number | null;
  planRate: number;
  /** When month 1 started (farmer assigned), or null if not started. */
  start: string | null;
  /** Month 1 has begun (running batches set up before launch start later). */
  started: boolean;
  payments: MonthlyPayment[];
  due: DueMonth[];
  sentMonths: number;
  sentTotal: number;
  /** When the month in progress ends (its pay becomes due), if running. */
  nextDueAt: string | null;
  /** Before settlement: what settling now would count. */
  preview: { months: number; total: number } | null;
  /** After settlement: how the monthly pay was matched with the 5% share. */
  settled: (StewardPayMatch & { months: number }) | null;
}

const num = (v: unknown) => Number(v ?? 0);

type PaymentRow = {
  id: string;
  investment_id: string;
  steward_id: string;
  month_no: number;
  period_start: string;
  period_end: string;
  amount: number | string;
  status: string;
  at_settlement: boolean;
  sent_at: string;
  reversed_at: string | null;
  reversal_reason: string | null;
};

const PAYMENT_COLUMNS =
  "id, investment_id, steward_id, month_no, period_start, period_end, amount, status, at_settlement, sent_at, reversed_at, reversal_reason";

function mapPayment(p: PaymentRow): MonthlyPayment {
  return {
    id: p.id,
    investmentId: p.investment_id,
    stewardId: p.steward_id,
    monthNo: p.month_no,
    periodStart: p.period_start,
    periodEnd: p.period_end,
    amount: num(p.amount),
    status: p.status as MonthlyPayment["status"],
    atSettlement: p.at_settlement,
    sentAt: p.sent_at,
    reversedAt: p.reversed_at,
    reversalReason: p.reversal_reason,
  };
}

type DueRow = {
  investment_id: string;
  reference: string;
  steward_id: string;
  month_no: number;
  period_start: string;
  period_end: string;
  amount: number | string;
};

function mapDue(d: DueRow): DueMonth {
  return {
    investmentId: d.investment_id,
    reference: d.reference,
    stewardId: d.steward_id,
    monthNo: d.month_no,
    periodStart: d.period_start,
    periodEnd: d.period_end,
    amount: num(d.amount),
  };
}

/** Adds whole months in Bangladesh time, like the database does. */
export function addMonthsDhaka(iso: string, months: number): string {
  // Bangladesh has no daylight saving: a fixed +06:00 offset.
  const local = new Date(new Date(iso).getTime() + 6 * 3600_000);
  const day = local.getUTCDate();
  const target = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + months, 1,
    local.getUTCHours(), local.getUTCMinutes(), local.getUTCSeconds(), local.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return new Date(target.getTime() - 6 * 3600_000).toISOString();
}

/** Monthly pay of one batch. */
export async function getBatchMonthlyPay(investmentId: string): Promise<BatchMonthlyPay | null> {
  const db = createAdminClient();
  const { data: inv } = await db
    .from("investments")
    .select("id, current_stage, status, monthly_pay_start, steward_monthly_pay, offering:steward_plan_offerings!offering_id ( investment_plans ( steward_monthly_pay ) )")
    .eq("id", investmentId)
    .maybeSingle();
  if (!inv) return null;

  const settledStage = inv.current_stage === "settled";
  const [{ data: payRows }, { data: dueRows }, { data: settlement }, preview] = await Promise.all([
    db.from("steward_monthly_payments").select(PAYMENT_COLUMNS).eq("investment_id", investmentId).order("month_no").order("sent_at"),
    db.from("steward_monthly_pay_due").select("*").eq("investment_id", investmentId).order("month_no"),
    settledStage
      ? db
          .from("investment_settlements")
          .select("steward_share, steward_months, steward_monthly_total, steward_topup, platform_loss")
          .eq("investment_id", investmentId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    settledStage ? Promise.resolve(null) : db.rpc("monthly_pay_preview", { p_investment_id: investmentId }),
  ]);

  const payments = ((payRows ?? []) as PaymentRow[]).map(mapPayment);
  const sent = payments.filter((p) => p.status === "sent");
  const plan = (inv.offering as unknown as { investment_plans: { steward_monthly_pay: number | string } | null } | null)
    ?.investment_plans;
  const rate = inv.steward_monthly_pay === null ? null : num(inv.steward_monthly_pay);

  // The month in progress: one after the last month that has ended.
  let nextDueAt: string | null = null;
  const start = inv.monthly_pay_start as string | null;
  if (start && !settledStage && inv.status === "active") {
    const now = Date.now();
    for (let k = 1; k <= 1200; k++) {
      const end = addMonthsDhaka(start, k);
      if (new Date(end).getTime() > now) {
        nextDueAt = end;
        break;
      }
    }
  }

  const p = (preview?.data as { months: number; total: number | string }[] | null)?.[0];
  const st = settlement as {
    steward_share: number | string;
    steward_months: number | null;
    steward_monthly_total: number | string | null;
  } | null;

  return {
    rate,
    planRate: num(plan?.steward_monthly_pay),
    start,
    started: Boolean(start && new Date(start).getTime() <= Date.now()),
    payments,
    due: ((dueRows ?? []) as DueRow[]).map(mapDue),
    sentMonths: sent.length,
    sentTotal: Math.round(sent.reduce((s, x) => s + x.amount, 0) * 100) / 100,
    nextDueAt,
    preview: p ? { months: p.months, total: num(p.total) } : null,
    settled:
      st && st.steward_monthly_total !== null
        ? { ...matchStewardPay(num(st.steward_share), num(st.steward_monthly_total)), months: st.steward_months ?? 0 }
        : null,
  };
}

/** Reads every row of a query, 1000 at a time (PostgREST's page limit). */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await page(from, from + 999);
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) return out;
  }
}

export interface PayBatchRow {
  investmentId: string;
  reference: string;
  plan: string;
  stewardId: string;
  stage: string | null;
  start: string;
  rate: number | null;
  sentMonths: number;
  sentTotal: number;
  dueMonths: number;
  dueTotal: number;
  settled: (StewardPayMatch & { months: number; settledAt: string; saleId: string }) | null;
}

export interface StewardPayOverview {
  due: DueMonth[];
  payments: MonthlyPayment[];
  batches: PayBatchRow[];
  names: Map<string, string>;
  totals: {
    dueTotal: number;
    sentThisMonth: number;
    sentTotal: number;
    lossTotal: number;
    lossBatches: number;
    /** Krishi's 5% minus the losses, over settlements with monthly pay. */
    platformShareTotal: number;
  };
}

/** Everything the admin Steward pay page needs. */
export async function getStewardPayOverview(): Promise<StewardPayOverview> {
  const db = createAdminClient();
  const [dueRows, payRows, invRows, settleRows] = await Promise.all([
    all<DueRow>((a, b) => db.from("steward_monthly_pay_due").select("*").order("period_end").order("reference").range(a, b)),
    all<PaymentRow>((a, b) => db.from("steward_monthly_payments").select(PAYMENT_COLUMNS).order("sent_at", { ascending: false }).range(a, b)),
    all<{
      id: string;
      reference: string;
      current_stage: string | null;
      monthly_pay_start: string;
      steward_monthly_pay: number | string | null;
      offering: { steward_id: string; investment_plans: { name_en: string } | null } | null;
    }>((a, b) =>
      db
        .from("investments")
        .select("id, reference, current_stage, monthly_pay_start, steward_monthly_pay, offering:steward_plan_offerings!offering_id ( steward_id, investment_plans ( name_en ) )")
        .not("monthly_pay_start", "is", null)
        .order("monthly_pay_start", { ascending: false })
        .range(a, b) as unknown as PromiseLike<{ data: never[] | null }>,
    ),
    all<{
      investment_id: string;
      sale_id: string;
      steward_share: number | string;
      platform_share: number | string;
      steward_months: number | null;
      steward_monthly_total: number | string;
      settled_at: string;
    }>((a, b) =>
      db
        .from("investment_settlements")
        .select("investment_id, sale_id, steward_share, platform_share, steward_months, steward_monthly_total, settled_at")
        .not("steward_monthly_total", "is", null)
        .range(a, b),
    ),
  ]);

  const due = dueRows.map(mapDue);
  const payments = payRows.map(mapPayment);
  const settlements = new Map(settleRows.map((s) => [s.investment_id, s]));

  const batches: PayBatchRow[] = invRows.map((i) => {
    const sent = payments.filter((p) => p.investmentId === i.id && p.status === "sent");
    const d = due.filter((x) => x.investmentId === i.id);
    const s = settlements.get(i.id);
    return {
      investmentId: i.id,
      reference: i.reference,
      plan: i.offering?.investment_plans?.name_en ?? "—",
      stewardId: i.offering?.steward_id ?? "",
      stage: i.current_stage,
      start: i.monthly_pay_start,
      rate: i.steward_monthly_pay === null ? null : num(i.steward_monthly_pay),
      sentMonths: sent.length,
      sentTotal: sent.reduce((t, p) => t + p.amount, 0),
      dueMonths: d.length,
      dueTotal: d.reduce((t, x) => t + x.amount, 0),
      settled: s
        ? {
            ...matchStewardPay(num(s.steward_share), num(s.steward_monthly_total)),
            months: s.steward_months ?? 0,
            settledAt: s.settled_at,
            saleId: s.sale_id,
          }
        : null,
    };
  });

  const ids = new Set<string>([...due.map((d) => d.stewardId), ...payments.map((p) => p.stewardId), ...batches.map((b) => b.stewardId)]);
  const { data: people } = ids.size
    ? await db.from("users").select("id, full_name, phone").in("id", [...ids])
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] };
  const names = new Map((people ?? []).map((u) => [u.id, u.full_name ?? u.phone ?? "—"]));

  // This calendar month in Bangladesh time.
  const nowLocal = new Date(Date.now() + 6 * 3600_000);
  const monthStart = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), 1) - 6 * 3600_000).getTime();
  const r = (n: number) => Math.round(n * 100) / 100;
  const sentRows = payments.filter((p) => p.status === "sent");
  const losses = batches.filter((b) => b.settled && b.settled.platformLoss > 0);

  return {
    due,
    payments,
    batches,
    names,
    totals: {
      dueTotal: r(due.reduce((t, x) => t + x.amount, 0)),
      sentThisMonth: r(sentRows.filter((p) => new Date(p.sentAt).getTime() >= monthStart).reduce((t, p) => t + p.amount, 0)),
      sentTotal: r(sentRows.reduce((t, p) => t + p.amount, 0)),
      lossTotal: r(losses.reduce((t, b) => t + b.settled!.platformLoss, 0)),
      lossBatches: losses.length,
      platformShareTotal: r(settleRows.reduce((t, s) => t + num(s.platform_share), 0)),
    },
  };
}
