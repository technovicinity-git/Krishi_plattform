"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { formatBDT } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#FEF6E5] text-[#C48A2E]",
  approved: "bg-[#E8F0EA] text-green-deep",
  disbursed: "bg-[#E8F0EA] text-green-deep",
  rejected: "bg-[#FAF0ED] text-terracotta",
};

export function FundRequestsInlineList({
  requests,
  showActions,
}: {
  requests: any[];
  showActions: boolean;
}) {
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
      alert("Failed to process request");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {requests.map((r) => {
        const inv = r.investment;
        const planName =
          inv?.offering?.investment_plans?.name_en ?? "Unknown plan";
        const farmerName = inv?.farmer?.full_name ?? "Unknown farmer";

        return (
          <div
            key={r.id}
            className="rounded-xl border border-border-light bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-ink-muted">
                  {r.reference}
                </span>
                <div className="mt-0.5 text-[12px] text-ink-secondary">
                  {new Date(r.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <span
                className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                  STATUS_STYLE[r.status] ?? "bg-stone text-ink-muted"
                }`}
              >
                {r.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] md:grid-cols-4">
              <div>
                <span className="text-[10px] uppercase text-ink-muted">
                  Farmer
                </span>
                <div className="font-semibold text-ink">{farmerName}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-ink-muted">
                  Plan
                </span>
                <div className="font-semibold text-ink">{planName}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-ink-muted">
                  Purpose
                </span>
                <div className="font-semibold capitalize text-ink">
                  {r.purpose.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-ink-muted">
                  Amount
                </span>
                <div className="font-bold text-terracotta">
                  {formatBDT(r.amount)}
                </div>
              </div>
            </div>

            {r.status === "rejected" && r.rejection_reason && (
              <div className="mt-3 rounded bg-[#FAF0ED] p-2 text-[11px] text-[#A13D2B]">
                <strong>Rejected:</strong> {r.rejection_reason}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-light pt-3">
              <Link
                href={`/steward/investments/${inv?.id}`}
                className="text-[12px] font-semibold text-terracotta hover:underline"
              >
                View investment →
              </Link>

              {showActions && (
                <>
                  {rejectId === r.id ? (
                    <div className="flex flex-col items-end gap-1">
                      <input
                        type="text"
                        placeholder="Reason for rejection"
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
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setReason("");
                          }}
                          className="rounded border border-border-light px-3 py-1 text-[11px] font-semibold text-ink-secondary"
                        >
                          Cancel
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
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "approve")}
                        disabled={loadingId === r.id}
                        className="rounded bg-ink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#2A2A2A] disabled:opacity-50"
                      >
                        {loadingId === r.id ? "..." : "Approve"}
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