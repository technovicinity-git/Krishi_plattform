"use client";

import { useTranslations } from "next-intl";

interface OnboardingContextProps {
  planTitle: string;
  units: number;
  unitPrice: number;
  total: number;
}

export function OnboardingContext({
  planTitle,
  units,
  unitPrice,
  total,
}: OnboardingContextProps) {
  const t = useTranslations("onboarding.context");

  const format = (n: number) =>
    `৳${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex items-center justify-between gap-4 rounded-[8px] border-l-4 border-terracotta bg-[#FAF0ED] px-5 py-4">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.02em] text-terracotta">
          {t("label")}
        </span>
        <span className="text-[13px] font-semibold text-ink">
          {planTitle} · {units} {units === 1 ? t("unit") : t("units")} ({format(unitPrice)}/{t("unit")})
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
          {t("totalLabel")}
        </span>
        <span className="text-[18px] font-bold text-ink">{format(total)}</span>
      </div>
    </div>
  );
}