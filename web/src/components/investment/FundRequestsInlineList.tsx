"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { formatBDT } from "@/lib/utils";
import { useDialog } from "@/components/ui/dialog-provider";

import { StatusBadge, toneFor } from "@/components/dashboard/ui";
import { RowAction } from "@/components/dashboard/ui";

export interface FundRequestRow {
  id: string;
  reference: string;
  amount: number;
  purpose: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  investment: {
    id: string;
    farmer: { full_name: string | null } | null;
    offering: {
      investment_plans: { name_en: string | null; name_bn: string | null } | null;
    } | null;
  } | null;
}

export function FundRequestsInlineList({
  requests,
  showActions,
}: {
  requests: FundRequestRow[];
  showActions: boolean;
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
    <div className="flex flex-col gap-3">
      {requests.map((r) => {
        const inv = r.investment;
        const plan = inv?.offering?.investment_plans;
        const planName =
          (locale === "bn" ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? t("unknownPlan");
        const farmerName = inv?.farmer?.full_name ?? t("unknownFarmer");

        return (
          <div
            key={r.id}
            className="rounded-2xl border border-border-light bg-white p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-ink-muted">
                  {r.reference}
                </span>
                <div className="mt-0.5 text-[12px] text-ink-secondary">
                  {new Date(r.created_at).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <StatusBadge tone={toneFor(r.status)}>{ts.has(r.status) ? ts(r.status) : r.status}</StatusBadge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] md:grid-cols-4">
              <div>
                <span className="text-[10px] uppercase text-ink-muted">
                  {t("farmer")}
                </span>
                <div className="font-semibold text-ink">{farmerName}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-ink-muted">
                  {t("plan")}
                </span>
                <div className="font-semibold text-ink">{planName}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-ink-muted">
                  {t("purpose")}
                </span>
                <div className="font-semibold capitalize text-ink">
                  {tp.has(r.purpose) ? tp(r.purpose) : r.purpose.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-ink-muted">
                  {t("amount")}
                </span>
                <div className="font-bold text-brand">
                  {formatBDT(r.amount)}
                </div>
              </div>
            </div>

            {r.status === "rejected" && r.rejection_reason && (
              <div className="mt-3 rounded bg-[#FAF0ED] p-2 text-[11px] text-[#A13D2B]">
                <strong>{t("rejectedLabel")}</strong> {r.rejection_reason}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-light pt-3">
              <RowAction href={`/steward/investments/${inv?.id}`} icon="briefcase" localized>
                {t("viewInvestment")}
              </RowAction>

              {showActions && (
                <>
                  {rejectId === r.id ? (
                    <div className="flex flex-col items-end gap-1">
                      <input
                        type="text"
                        placeholder={t("rejectReason")}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="h-[32px] w-[220px] rounded border border-[#F0C9C0] px-2 text-[12px]"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAction(r.id, "reject")}
                          disabled={loadingId === r.id || !reason}
                          className="rounded bg-[#A13D2B] px-3 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                        >
                          {tc("confirm")}
                        </button>
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setReason("");
                          }}
                          className="rounded border border-border-light px-3 py-1 text-[11px] font-semibold text-ink-secondary"
                        >
                          {tc("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRejectId(r.id)}
                        disabled={loadingId === r.id}
                        className="rounded border border-border-light px-3 py-1.5 text-[11px] font-semibold text-ink-secondary hover:bg-stone disabled:opacity-50"
                      >
                        {tc("reject")}
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "approve")}
                        disabled={loadingId === r.id}
                        className="rounded bg-brand px-3 py-1.5 text-[11px] font-bold text-white hover:bg-brand-hover disabled:opacity-50"
                      >
                        {loadingId === r.id ? "..." : tc("approve")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}