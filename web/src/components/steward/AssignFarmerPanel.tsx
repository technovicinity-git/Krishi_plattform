"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { buttonClass, RowAction } from "@/components/dashboard/ui";
import { NavIcon } from "@/components/dashboard/NavIcon";
import type { FarmerOption } from "./types";

/**
 * On a batch that is waiting for a farmer: pick one of the steward's active
 * farmers and assign them (same action as on the Batches list).
 */
export function AssignFarmerPanel({ investmentId, farmers }: { investmentId: string; farmers: FarmerOption[] }) {
  const t = useTranslations("app.assignFarmer");
  const router = useRouter();
  const [farmerId, setFarmerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = async () => {
    if (!farmerId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/steward/investments/${investmentId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmer_id: farmerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("failed"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#EBD9A8] bg-[#FBF5E6] px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#9A6B12]">
          <NavIcon name="users" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold text-ink">{t("panelTitle")}</h2>
            <p className="text-[13px] text-ink-secondary">{t("panelHint")}</p>
          </div>

          {farmers.length === 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-[#7A5418]">{t("noFarmers")}</p>
              <RowAction href="/steward/farmers/new" localized icon="users" primary>
                {t("addFarmer")}
              </RowAction>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                aria-label={t("assignLabel")}
                className="h-[42px] min-w-0 flex-1 rounded-[8px] border border-border-light bg-white px-3 text-[13.5px] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="">{t("selectFarmer")}</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.full_name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={assign} disabled={!farmerId || busy} className={buttonClass("primary")}>
                {busy ? t("assigning") : t("assign")}
              </button>
            </div>
          )}
          {error && <p className="text-[12px] text-danger">{error}</p>}
        </div>
      </div>
    </section>
  );
}
