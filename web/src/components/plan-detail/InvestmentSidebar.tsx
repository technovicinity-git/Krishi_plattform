"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { OfferingListItem } from "@/lib/public/plans";

export function InvestmentSidebar({ offering }: { offering: OfferingListItem }) {
  const t = useTranslations("planDetail.sidebar");
  const [units, setUnits] = useState(1);

  const total = offering.unitPrice * units;
  const totalAnimal = offering.animalAllocation * units;
  const totalCare = offering.careAllocation * units;

  const format = (n: number) => {
    const s = String(Math.round(n));
    if (s.length <= 3) return `৳${s}`;
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return `৳${rest},${last3}`;
  };

  const remaining = offering.unitsOffered - offering.unitsFunded;
  const maxUnits = Math.max(1, remaining);

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border-light bg-white p-8">
      <h3 className="font-serif text-[24px] leading-tight text-ink">
        {t("heading")}
      </h3>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
          {t("investmentPerUnitLabel")}
        </span>
        <span className="text-[28px] font-bold leading-tight text-ink lg:text-[32px]">
          {format(offering.unitPrice)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-ink-secondary">
          {t("unitSelectorLabel")}
        </span>
        <div className="flex items-center justify-between rounded-[6px] border border-border-light bg-cream px-4 py-3">
          <button
            type="button"
            onClick={() => setUnits((u) => Math.max(1, u - 1))}
            className="text-[18px] font-bold text-ink-secondary hover:text-ink disabled:opacity-30"
            disabled={units <= 1}
            aria-label="Decrease units"
          >
            −
          </button>
          <span className="text-[16px] font-bold text-ink">
            {units} {units === 1 ? t("unitLabel") : t("unitsLabel")}
          </span>
          <button
            type="button"
            onClick={() => setUnits((u) => Math.min(maxUnits, u + 1))}
            className="text-[18px] font-bold text-ink-secondary hover:text-ink disabled:opacity-30"
            disabled={units >= maxUnits}
            aria-label="Increase units"
          >
            +
          </button>
        </div>
        <p className="text-[11px] text-ink-muted">
          {remaining} of {offering.unitsOffered} units still available
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-light pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[14px] font-semibold text-ink-secondary">
            {t("totalCapitalLabel")}
          </span>
          <span className="text-[20px] font-bold text-ink">{format(total)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[12px] text-ink-muted">{t("allocationLabel")}</span>
          <span className="text-[12px] font-semibold text-ink-secondary">
            Animal {format(totalAnimal)} + Care {format(totalCare)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* TODO (Phase 2): wire to /express-interest with offering.offeringId */}
        <Link
          href={`/express-interest?offering=${offering.offeringId}`}
          className="inline-flex items-center justify-center rounded-[4px] bg-ink py-4 text-[14px] font-bold text-white transition-colors hover:bg-[#2A2A2A]"
        >
          {t("showInterest")}
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-[4px] border border-border-light py-3 text-[14px] font-semibold text-ink-secondary transition-colors hover:bg-cream"
        >
          {t("contactSupport")}
        </Link>
      </div>

      <p className="text-[11px] leading-[1.5] text-ink-muted">{t("legalNote")}</p>
    </div>
  );
}