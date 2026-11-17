"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { formatBDT } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#FEF6E5] text-[#C48A2E]",
  approved: "bg-[#E8F0EA] text-green-deep",
  disbursed: "bg-[#E8F0EA] text-green-deep",
  rejected: "bg-[#FAF0ED] text-terracotta",
};

export function FundRequestsList({ requests, isSteward = false }: { requests: any[], isSteward?: boolean }) {
  const t = useTranslations("app.fundRequests");
  const tp = useTranslations("app.purpose");
  const ts = useTranslations("app.status");
  const tc = useTranslations("app.common");
  const router = useRouter();
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
      if (!res.ok) throw new Error("Failed");
      setRejectId(null);
      setReason("");
      router.refresh();
    } catch {
      alert(t("actionFailed"));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border-light bg-white p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
        {t("heading")}
      </h2>
      {requests.length === 0 ? (
        <p className="mt-4 text-[13px] text-ink-muted">{t("empty")}</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-left">
            <thead className="bg-stone text-[10px] font-bold uppercase text-ink-muted">
              <tr>
                <th className="px-3 py-2">{t("reference")}</th>
                <th className="px-3 py-2">{t("purpose")}</th>
                <th className="px-3 py-2 text-right">{t("amount")}</th>
                <th className="px-3 py-2">{t("status")}</th>
                {isSteward && <th className="px-3 py-2 text-right">{t("actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-border-light text-[12px]">
                  <td className="px-3 py-2 font-mono text-ink">{r.reference}</td>
                  <td className="px-3 py-2 capitalize text-ink-secondary">{tp.has(r.purpose) ? tp(r.purpose) : r.purpose.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2 text-right font-bold text-ink">{formatBDT(r.amount)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLE[r.status] ?? "bg-stone text-ink-muted"}`}>
                      {ts.has(r.status) ? ts(r.status) : r.status}
                    </span>
                  </td>
                  {isSteward && r.status === "pending" && (
                    <td className="px-3 py-2 text-right">
                      {rejectId === r.id ? (
                        <div className="flex flex-col items-end gap-1">
                          <input type="text" placeholder={t("reason")} value={reason} onChange={(e) => setReason(e.target.value)} className="h-[28px] w-[120px] rounded border border-[#F0C9C0] px-2 text-[11px]" />
                          <div className="flex gap-1">
                            <button onClick={() => handleAction(r.id, "reject")} disabled={loadingId === r.id || !reason} className="rounded bg-[#A13D2B] px-2 py-1 text-[10px] font-bold text-white">{tc("confirm")}</button>
                            <button onClick={() => setRejectId(null)} className="rounded border border-border-light px-2 py-1 text-[10px] text-ink-secondary">{tc("cancel")}</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setRejectId(r.id)} disabled={loadingId === r.id} className="rounded border border-border-light px-2 py-1 text-[10px] font-bold text-ink-secondary">{tc("reject")}</button>
                          <button onClick={() => handleAction(r.id, "approve")} disabled={loadingId === r.id} className="rounded bg-ink px-2 py-1 text-[10px] font-bold text-white">{loadingId === r.id ? "..." : tc("approve")}</button>
                        </div>
                      )}
                    </td>
                  )}
                  {isSteward && r.status !== "pending" && <td />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}