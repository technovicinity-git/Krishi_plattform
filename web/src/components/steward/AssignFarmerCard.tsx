"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { FarmerOption, StewardInvestmentRow } from "./types";

import { StatusBadge, toneFor } from "@/components/dashboard/ui";

export function AssignFarmerCard({
  investment,
  farmers,
}: {
  investment: StewardInvestmentRow;
  farmers: FarmerOption[];
}) {
  const t = useTranslations("app.assignFarmer");
  const tst = useTranslations("app.stage");
  const locale = useLocale();
  const router = useRouter();
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = investment.offering?.investment_plans;
  const planName = (locale === "bn" ? plan?.name_bn : plan?.name_en) || plan?.name_en || t("plan");
  const isAwaitingFarmer = investment.current_stage === "awaiting_farmer";

  const handleAssign = async () => {
    if (!selectedFarmer) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/steward/investments/${investment.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ farmer_id: selectedFarmer }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("failed"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
      <div className="flex items-start justify-between border-b border-border-light pb-3">
        <div>
          <span className="font-mono text-[11px] font-bold text-ink-muted">
            {investment.reference}
          </span>
          <h3 className="mt-1 font-serif text-[20px] text-ink">{planName}</h3>
        </div>
        <StatusBadge tone={toneFor(investment.current_stage)}>
          {tst.has(investment.current_stage) ? tst(investment.current_stage) : investment.current_stage.replace(/_/g, " ")}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[13px]">
        <div>
          <span className="text-ink-muted">{t("investor")}</span>
          <div className="font-semibold text-ink">
            {investment.investor?.full_name}
          </div>
        </div>
        <div>
          <span className="text-ink-muted">{t("units")}</span>
          <div className="font-bold text-ink">{t("unitsCount", { count: investment.units })}</div>
        </div>
      </div>

      {isAwaitingFarmer ? (
        <div className="mt-2 rounded-lg bg-stone/50 p-4">
          <label className="text-[12px] font-semibold text-ink">
            {t("assignLabel")}
          </label>
          <div className="mt-2 flex gap-2">
            <select
              value={selectedFarmer}
              onChange={(e) => setSelectedFarmer(e.target.value)}
              className="h-[40px] flex-1 rounded border border-border-light bg-white px-2 text-[13px]"
            >
              <option value="">{t("selectFarmer")}</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedFarmer || loading}
              className="h-[40px] rounded-[6px] bg-brand hover:bg-brand-hover px-4 text-[12px] font-bold text-white disabled:opacity-50"
            >
              {loading ? "..." : t("assign")}
            </button>
          </div>
          {error && <p className="mt-2 text-[11px] text-[#A13D2B]">{error}</p>}
        </div>
      ) : (
        <>
          <div className="mt-2 rounded-lg bg-[#E8F0EA] p-4 text-[13px]">
            <span className="text-green-deep">{t("assignedTo")} </span>
            <span className="font-semibold text-ink">
              {investment.farmer?.full_name || t("unknown")}
            </span>
          </div>
          <Link
            href={`/steward/investments/${investment.id}`}
            className="inline-flex h-[40px] w-full items-center justify-center rounded bg-brand text-[13px] font-bold text-white hover:bg-brand-hover"
          >
            {t("view")}
          </Link>
        </>
      )}
    </div>
  );
}