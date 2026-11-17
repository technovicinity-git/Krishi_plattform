"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  interest: any;
}

export function InterestApprovalCard({ interest }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const investorName =
    interest.investor?.full_name || interest.guest_name || "Guest";
  const investorPhone =
    interest.investor?.phone || interest.guest_phone || "—";
  const planName =
    interest.offering?.investment_plans?.name_en ?? "Unknown plan";

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
        setError(data.error || "Failed to process request");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Network error");
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
          {interest.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-border-light py-3 text-[13px]">
        <div>
          <span className="text-ink-muted">Investor</span>
          <div className="font-semibold text-ink">{investorName}</div>
          <div className="text-[11px] text-ink-secondary">{investorPhone}</div>
        </div>
        <div>
          <span className="text-ink-muted">Requested Units</span>
          <div className="font-bold text-ink">
            {interest.requested_units} Units
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
          {loading ? "Processing…" : "Approve"}
        </button>
        <button
          onClick={() => handleAction("reject")}
          disabled={loading}
          className="flex-1 rounded border border-[#F0C9C0] bg-white py-2 text-[12px] font-bold text-[#A13D2B] hover:bg-[#FAF0ED] disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}