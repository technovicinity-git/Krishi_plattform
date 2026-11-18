"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";
import { useDialog } from "@/components/ui/dialog-provider";
import { StatusBadge, toneFor } from "@/components/dashboard/ui";
import type { InvestmentDetail } from "@/lib/investments/detail";

type FundRequest = InvestmentDetail["fundRequests"][number];

export function FundRequestsList({
  requests,
  isSteward = false,
}: {
  requests: FundRequest[];
  isSteward?: boolean;
}) {
  const t = useTranslations("app.fundRequests");
  const tp = useTranslations("app.purpose");
  const ts = useTranslations("app.status");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const router = useRouter();
  const { alert } = useDialog();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (action === "reject" && !reason) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/steward/fund-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("actionFailed"));
      }
      setRejectId(null);
      setReason("");
      router.refresh();
    } catch (err) {
      await alert({
        title: t("actionFailed"),
        message: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border-light bg-white">
      <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{t("heading")}</h2>
        {requests.length > 0 && (
          <span className="rounded-full bg-stone px-2 py-0.5 text-[11px] font-bold text-ink-secondary">
            {requests.length}
          </span>
        )}
      </div>
      {requests.length === 0 ? (
        <p className="px-6 py-6 text-[13px] text-ink-muted">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border-light">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink">
                    {tp.has(r.purpose) ? tp(r.purpose) : r.purpose.replace(/_/g, " ")}
                  </span>
                  <StatusBadge tone={toneFor(r.status)}>
                    {ts.has(r.status) ? ts(r.status) : r.status}
                  </StatusBadge>
                </div>
                <span className="font-mono text-[11px] text-ink-muted">
                  {r.reference} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {r.status === "rejected" && r.rejectionReason && (
                  <span className="text-[12px] text-danger">{r.rejectionReason}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <span className="text-[16px] font-bold text-green-deep">{formatBDT(r.amount)}</span>
                {isSteward && r.status === "pending" &&
                  (rejectId === r.id ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input
                        type="text"
                        placeholder={t("reason")}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="h-[34px] w-[180px] rounded-[6px] border border-[#F0C9C0] px-2.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-danger/20"
                      />
                      <button
                        onClick={() => handleAction(r.id, "reject")}
                        disabled={loadingId === r.id || !reason}
                        className="h-[34px] rounded-[6px] bg-danger px-3 text-[12px] font-bold text-white disabled:opacity-50"
                      >
                        {tc("confirm")}
                      </button>
                      <button
                        onClick={() => setRejectId(null)}
                        className="h-[34px] rounded-[6px] border border-border-light px-3 text-[12px] font-semibold text-ink-secondary"
                      >
                        {tc("cancel")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setRejectId(r.id)}
                        disabled={loadingId === r.id}
                        className="h-[34px] rounded-[6px] border border-border-light px-3 text-[12px] font-semibold text-ink-secondary hover:bg-stone disabled:opacity-50"
                      >
                        {tc("reject")}
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "approve")}
                        disabled={loadingId === r.id}
                        className="h-[34px] rounded-[6px] bg-brand px-3 text-[12px] font-bold text-white hover:bg-brand-hover disabled:opacity-50"
                      >
                        {loadingId === r.id ? "..." : tc("approve")}
                      </button>
                    </div>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
