"use client";

import { useTranslations } from "next-intl";

interface OnboardingBatchCardProps {
  reference: string;
  status: string;
  planTitle: string;
  units: number;
  deposit: number;
}

export function OnboardingBatchCard({
  reference,
  status,
  planTitle,
  units,
  deposit,
}: OnboardingBatchCardProps) {
  const t = useTranslations("onboarding.batch");

  const format = (n: number) =>
    `৳${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-border-light bg-white p-5">
      <div className="flex items-center justify-between gap-3 border-b border-border-light pb-3">
        <span className="text-[12px] font-semibold text-ink-secondary">
          {t("reference")}: {reference}
        </span>
        <span className="inline-flex items-center rounded-[4px] bg-[#FEF6E5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] text-[#C48A2E]">
          {status}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Row label={t("planLabel")} value={planTitle} />
        <Row label={t("unitsLabel")} value={`${units} ${units === 1 ? t("unit") : t("units")}`} />
        <div className="border-t border-border-light pt-2">
          <Row label={t("depositLabel")} value={format(deposit)} valueTone="terracotta" valueSize="lg" />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueTone = "default",
  valueSize = "default",
}: {
  label: string;
  value: string;
  valueTone?: "default" | "terracotta";
  valueSize?: "default" | "lg";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[13px] text-ink-secondary">{label}</span>
      <span
        className={
          valueTone === "terracotta"
            ? valueSize === "lg"
              ? "text-[20px] font-bold text-terracotta"
              : "text-[14px] font-semibold text-terracotta"
            : "text-[14px] font-semibold text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}