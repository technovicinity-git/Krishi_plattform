import { getLocale, getTranslations } from "next-intl/server";
import { formatBDT } from "@/lib/utils";
import { DetailRow, Panel, StatusBadge } from "@/components/dashboard/ui";
import type { BatchMonthlyPay } from "@/lib/investments/monthly-pay";

/** Steward: their monthly pay for one batch, and how it met the 5% share. */
export async function StewardMonthlyPayPanel({ pay }: { pay: BatchMonthlyPay }) {
  const [t, locale] = await Promise.all([getTranslations("app.monthlyPay"), getLocale()]);
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
      timeZone: "Asia/Dhaka",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const started = pay.started;
  const dueTotal = pay.due.reduce((s, d) => s + d.amount, 0);

  return (
    <Panel title={t("title")} description={t("hint")} className="h-fit">
      {!pay.rate && pay.payments.length === 0 ? (
        <p className="text-[13px] text-ink-secondary">{t("noRate")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            {pay.rate ? <DetailRow label={t("rate")} value={t("perMonth", { amount: formatBDT(pay.rate) })} /> : null}
            <DetailRow label={started ? t("started") : t("starts")} value={pay.start ? day(pay.start) : t("startsOnAssign")} />
            <DetailRow label={t("received")} value={t("receivedValue", { count: pay.sentMonths, amount: formatBDT(pay.sentTotal) })} />
            {pay.due.length > 0 && (
              <DetailRow label={t("waiting")} value={t("waitingValue", { count: pay.due.length, amount: formatBDT(dueTotal) })} />
            )}
            {pay.nextDueAt && pay.rate ? <DetailRow label={t("nextDue")} value={day(pay.nextDueAt)} /> : null}
          </div>

          {pay.payments.length > 0 && (
            <ul className="flex flex-col divide-y divide-border-light rounded-xl border border-border-light">
              {pay.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-ink">{t("month", { n: p.monthNo })}</span>
                    <span className="text-[11.5px] text-ink-muted">
                      {day(p.periodStart)} – {day(p.periodEnd)}
                      {p.atSettlement ? ` · ${t("atSettlement")}` : ""}
                    </span>
                  </div>
                  {p.status === "reversed" ? (
                    <StatusBadge tone="neutral">{t("reversed")}</StatusBadge>
                  ) : (
                    <span className="text-[13px] font-semibold text-green-deep">+{formatBDT(p.amount)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {pay.settled && (
            <div className="rounded-xl bg-cream px-4 py-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">{t("settledTitle")}</p>
              <DetailRow label={t("share")} value={formatBDT(pay.settled.share)} />
              <DetailRow label={t("monthlyTotal", { count: pay.settled.months })} value={formatBDT(pay.settled.monthlyTotal)} />
              {pay.settled.topup > 0 && <DetailRow label={t("topup")} value={formatBDT(pay.settled.topup)} />}
              {pay.settled.platformLoss > 0 && <DetailRow label={t("kept")} value={formatBDT(pay.settled.platformLoss)} />}
              <DetailRow label={t("total")} value={<span className="text-green-deep">{formatBDT(pay.settled.stewardTotal)}</span>} />
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
