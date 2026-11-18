import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { StewardInterestRow } from "./types";

import { StatusBadge, toneFor } from "@/components/dashboard/ui";

interface Props {
  interest: StewardInterestRow;
}

export function InterestHistoryCard({ interest }: Props) {
  const t = useTranslations("app.interestCard");
  const ts = useTranslations("app.status");
  const locale = useLocale();
  const investorName =
    interest.investor?.full_name || interest.guest_name || t("guest");
  const investorPhone =
    interest.investor?.phone || interest.guest_phone || "—";
  const plan = interest.offering?.investment_plans;
  const planName =
    (locale === "bn" ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? t("unknownPlan");
  const statusLabel = ts.has(interest.status) ? ts(interest.status) : interest.status;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {interest.reference}
          </span>
          <h3 className="mt-1 font-serif text-[20px] text-ink">{planName}</h3>
        </div>
        <StatusBadge tone={toneFor(interest.status)}>{statusLabel}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-border-light py-3 text-[13px]">
        <div>
          <span className="text-ink-muted">{t("investor")}</span>
          <div className="font-semibold text-ink">{investorName}</div>
          <div className="text-[11px] text-ink-secondary">{investorPhone}</div>
        </div>
        <div>
          <span className="text-ink-muted">{t("requestedUnits")}</span>
          <div className="font-bold text-ink">
            {t("unitsCount", { count: interest.requested_units })}
          </div>
        </div>
      </div>

      {interest.rejection_reason && interest.status === "not_approved" && (
        <p className="text-[12px] text-[#A13D2B]">
          <strong>{t("reason")}</strong> {interest.rejection_reason}
        </p>
      )}

      <Link
        href={`/interest/${interest.reference}`}
        className="inline-flex h-[40px] items-center justify-center rounded-[4px] border border-border-light text-[12px] font-semibold text-ink-nav hover:bg-stone"
      >
        {t("viewStatus")}
      </Link>
    </div>
  );
}