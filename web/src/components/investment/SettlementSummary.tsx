import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { formatBDT } from "@/lib/utils";
import { PROFIT_SPLIT, type SettlementBreakdown } from "@/lib/investments/settlement";

type Breakdown = Pick<
  SettlementBreakdown,
  | "capital"
  | "fundsReleased"
  | "saleAmount"
  | "totalReturn"
  | "netResult"
  | "outcome"
  | "investorPayout"
  | "farmerShare"
  | "stewardShare"
  | "platformShare"
>;

/**
 * Money breakdown of a settled (or about-to-be-settled) batch.
 * `highlight` picks whose line stands out for the viewer.
 */
export function SettlementSummary({
  breakdown: b,
  highlight,
  preview = false,
}: {
  breakdown: Breakdown;
  highlight?: "investor" | "farmer" | "steward" | "platform";
  preview?: boolean;
}) {
  const t = useTranslations("app.settlement");
  const unspent = Math.max(0, b.capital - b.fundsReleased);
  const profit = b.outcome === "profit";
  const loss = b.outcome === "loss";

  const outcomeLabel = profit
    ? t("profit", { amount: formatBDT(b.netResult) })
    : loss
      ? t("loss", { amount: formatBDT(Math.abs(b.netResult)) })
      : t("breakEven");

  const shares = [
    { key: "investor", label: t("investorPayout"), value: b.investorPayout, hint: profit ? t("investorHint", { pct: PROFIT_SPLIT.investor }) : t("investorLossHint") },
    { key: "farmer", label: t("farmerShare"), value: b.farmerShare, hint: t("shareHint", { pct: PROFIT_SPLIT.farmer }) },
    { key: "steward", label: t("stewardShare"), value: b.stewardShare, hint: t("shareHint", { pct: PROFIT_SPLIT.steward }) },
    { key: "platform", label: t("platformShare"), value: b.platformShare, hint: t("shareHint", { pct: PROFIT_SPLIT.platform }) },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3",
          profit ? "bg-brand-tint text-green-deep" : loss ? "bg-[#FAF0ED] text-danger" : "bg-stone text-ink",
        )}
      >
        <span className="text-[12px] font-bold uppercase tracking-[0.05em]">
          {preview ? t("expectedResult") : t("result")}
        </span>
        <span className="text-[18px] font-bold">{outcomeLabel}</span>
      </div>

      <dl className="flex flex-col text-[13px]">
        <Line label={t("capital")} value={formatBDT(b.capital)} />
        <Line label={t("fundsReleased")} value={`− ${formatBDT(b.fundsReleased)}`} />
        <Line label={t("unspent")} value={formatBDT(unspent)} muted />
        <Line label={t("saleAmount")} value={`+ ${formatBDT(b.saleAmount)}`} />
        <Line label={t("totalReturn")} value={formatBDT(b.totalReturn)} strong />
      </dl>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
          {t("distribution")}
        </span>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {shares.map((s) => (
            <li
              key={s.key}
              className={cn(
                "flex flex-col gap-0.5 rounded-xl border px-4 py-3",
                highlight === s.key ? "border-brand bg-brand-tint/60" : "border-border-light bg-white",
              )}
            >
              <span className="text-[12px] font-semibold text-ink-secondary">{s.label}</span>
              <span className={cn("text-[17px] font-bold", highlight === s.key ? "text-green-deep" : "text-ink")}>
                {formatBDT(s.value)}
              </span>
              <span className="text-[11px] text-ink-muted">{s.hint}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border-light py-2.5 last:border-b-0",
        strong && "border-t border-t-ink/10",
      )}
    >
      <dt className={cn("text-ink-secondary", muted && "pl-3 text-ink-muted")}>{label}</dt>
      <dd className={cn("font-semibold text-ink", strong && "text-[15px] font-bold", muted && "font-medium text-ink-muted")}>
        {value}
      </dd>
    </div>
  );
}
