import { formatBDT } from "@/lib/utils";
import { DetailRow, Panel, StatusBadge } from "@/components/dashboard/ui";
import type { BatchMonthlyPay } from "@/lib/investments/monthly-pay";
import { MonthlyPayRateForm, ReverseMonthlyPayButton, SendMonthlyPayButton } from "./StewardPayActions";

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric" });

/** Admin: a batch's steward monthly pay (rate, months sent and due, settlement). */
export function BatchMonthlyPayPanel({
  investmentId,
  pay,
  stewardName,
}: {
  investmentId: string;
  pay: BatchMonthlyPay;
  stewardName: string;
}) {
  const settled = pay.settled !== null;
  const started = pay.started;
  const dueTotal = pay.due.reduce((t, d) => t + d.amount, 0);

  return (
    <Panel
      title="Steward monthly pay"
      description="Paid by Krishi every month from farmer assigned to settlement, then matched with the steward's 5% share."
      className="h-fit"
    >
      <div className="flex flex-col gap-4">
        <div>
          <DetailRow
            label="Rate"
            value={
              <span className="flex flex-col items-end gap-2">
                <span>{pay.rate ? `${formatBDT(pay.rate)} / month` : pay.planRate ? "Not set" : "Plan has no rate"}</span>
                {!settled && <MonthlyPayRateForm investmentId={investmentId} rate={pay.rate} planRate={pay.planRate} />}
              </span>
            }
          />
          <DetailRow
            label={started ? "Started" : "Starts"}
            value={pay.start ? day(pay.start) : "When a farmer is assigned"}
          />
          <DetailRow label="Sent" value={`${pay.sentMonths} month${pay.sentMonths === 1 ? "" : "s"} · ${formatBDT(pay.sentTotal)}`} />
          {pay.nextDueAt && pay.rate ? <DetailRow label="Next month due" value={day(pay.nextDueAt)} /> : null}
        </div>

        {pay.due.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#EBD9A8] bg-[#FBF5E6] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-[#7A5418]">
                {pay.due.length} month{pay.due.length === 1 ? "" : "s"} due · {formatBDT(dueTotal)}
              </span>
              <SendMonthlyPayButton
                items={pay.due.map((d) => ({ investmentId, monthNo: d.monthNo }))}
                total={dueTotal}
                who={`${stewardName} (${pay.due.length} month${pay.due.length === 1 ? "" : "s"})`}
                label={pay.due.length === 1 ? "Send" : "Send all"}
              />
            </div>
            <ul className="flex flex-col gap-1 text-[12.5px] text-[#7A5418]">
              {pay.due.map((d) => (
                <li key={d.monthNo}>
                  Month {d.monthNo}: {day(d.periodStart)} – {day(d.periodEnd)} · {formatBDT(d.amount)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pay.payments.length > 0 && (
          <ul className="flex flex-col divide-y divide-border-light rounded-xl border border-border-light">
            {pay.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-ink">
                    Month {p.monthNo} · {formatBDT(p.amount)}
                  </span>
                  <span className="text-[11.5px] text-ink-muted">
                    {day(p.periodStart)} – {day(p.periodEnd)} · sent {day(p.sentAt)}
                    {p.atSettlement ? " at settlement" : ""}
                    {p.reversalReason ? ` · ${p.reversalReason}` : ""}
                  </span>
                </div>
                {p.status === "reversed" ? (
                  <StatusBadge tone="neutral">Reversed</StatusBadge>
                ) : !settled && !p.atSettlement ? (
                  <ReverseMonthlyPayButton id={p.id} amount={p.amount} />
                ) : (
                  <StatusBadge tone="success">Sent</StatusBadge>
                )}
              </li>
            ))}
          </ul>
        )}

        {pay.settled && (
          <div className="rounded-xl bg-cream px-4 py-3">
            <DetailRow label="Steward's 5% share" value={formatBDT(pay.settled.share)} />
            <DetailRow label={`Monthly pay (${pay.settled.months} months)`} value={formatBDT(pay.settled.monthlyTotal)} />
            <DetailRow label="Top-up at settlement" value={formatBDT(pay.settled.topup)} />
            <DetailRow
              label="Krishi loss"
              value={
                <span className={pay.settled.platformLoss > 0 ? "text-danger" : undefined}>
                  {formatBDT(pay.settled.platformLoss)}
                </span>
              }
            />
          </div>
        )}
        {!settled && pay.preview && pay.preview.months > 0 && (
          <p className="text-[12px] text-ink-muted">
            If settled today: {pay.preview.months} month{pay.preview.months === 1 ? "" : "s"} counted (the month in progress counts as full), {formatBDT(pay.preview.total)} in all.
          </p>
        )}
      </div>
    </Panel>
  );
}
