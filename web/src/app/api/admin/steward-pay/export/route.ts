import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { getStewardPayOverview } from "@/lib/investments/monthly-pay";

export const runtime = "nodejs";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(",")).join("\n");

/** CSV of one Steward pay tab (?view=due|sent|batches|losses). */
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const view = new URL(request.url).searchParams.get("view") ?? "due";
  const data = await getStewardPayOverview();
  const name = (id: string) => data.names.get(id) ?? "";
  const batch = new Map(data.batches.map((b) => [b.investmentId, b]));
  let rows: unknown[][];

  if (view === "sent") {
    rows = [
      ["sent_at", "steward", "batch", "month", "period_start", "period_end", "amount", "status", "at_settlement", "reversal_reason"],
      ...data.payments.map((p) => [
        p.sentAt, name(p.stewardId), batch.get(p.investmentId)?.reference, p.monthNo, p.periodStart, p.periodEnd,
        p.amount, p.status, p.atSettlement, p.reversalReason,
      ]),
    ];
  } else if (view === "batches" || view === "losses") {
    const list = view === "losses" ? data.batches.filter((b) => b.settled && b.settled.platformLoss > 0) : data.batches;
    rows = [
      ["batch", "plan", "steward", "started", "rate", "months_sent", "sent_total", "months_due", "due_total",
        "settled_at", "months_counted", "monthly_total", "steward_5pct_share", "topup", "krishi_loss"],
      ...list.map((b) => [
        b.reference, b.plan, name(b.stewardId), b.start, b.rate, b.sentMonths, b.sentTotal, b.dueMonths, b.dueTotal,
        b.settled?.settledAt, b.settled?.months, b.settled?.monthlyTotal, b.settled?.share, b.settled?.topup, b.settled?.platformLoss,
      ]),
    ];
  } else {
    rows = [
      ["steward", "batch", "month", "period_start", "period_end", "amount"],
      ...data.due.map((d) => [name(d.stewardId), d.reference, d.monthNo, d.periodStart, d.periodEnd, d.amount]),
    ];
  }

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="krishi-steward-pay-${view}-${day}.csv"`,
    },
  });
}
