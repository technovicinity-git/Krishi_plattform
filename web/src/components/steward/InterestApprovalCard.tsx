"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { StewardInterestRow } from "./types";

interface Props {
  interest: StewardInterestRow;
}

export function InterestApprovalCard({ interest }: Props) {
  const t = useTranslations("app.interestCard");
  const ts = useTranslations("app.status");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const investorName =
    interest.investor?.full_name || interest.guest_name || t("guest");
  const investorPhone =
    interest.investor?.phone || interest.guest_phone || "—";
  const plan = interest.offering?.investment_plans;
  const planName =
    (locale === "bn" ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? t("unknownPlan");

  const handleAction = async (action: "approve" | "reject") => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/steward/interests/${interest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("failed"));
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError(tc("networkError"));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {interest.reference}
          </span>
          <h3 className="mt-1 font-serif text-[20px] text-ink">{planName}</h3>
        </div>
        <span className="inline-flex rounded bg-[#FEF6E5] px-2 py-1 text-[10px] font-bold uppercase text-[#C48A2E]">
          {ts.has(interest.status) ? ts(interest.status) : interest.status.replace("_", " ")}
        </span>
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

      {error && <p className="text-[12px] text-[#A13D2B]">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction("approve")}
          disabled={loading}
          className="flex-1 rounded bg-ink py-2 text-[12px] font-bold text-white hover:bg-[#2A2A2A] disabled:opacity-60"
        >
          {loading ? t("processing") : tc("approve")}
        </button>
        <button
          onClick={() => handleAction("reject")}
          disabled={loading}
          className="flex-1 rounded border border-[#F0C9C0] bg-white py-2 text-[12px] font-bold text-[#A13D2B] hover:bg-[#FAF0ED] disabled:opacity-60"
        >
          {tc("reject")}
        </button>
      </div>
    </div>
  );
}