"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";

/** Approve or reject a deposit. Online payments can't be rejected (they're refunded instead). */
export function DepositApprovalActions({ depositId, canReject = true }: { depositId: string; canReject?: boolean }) {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = async () => {
    setActing("approve");
    const ok = await confirm({
      title: "Approve Deposit?",
      message: "This will activate the investment and mark the units as funded.",
      confirmLabel: "Approve",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      router.refresh();
    } catch (err) {
      await alert({
        title: "Error",
        message: err instanceof Error ? err.message : "Something went wrong",
        variant: "danger",
      });
      setLoading(false);
      setActing(null);
    }
  };

  const handleReject = async () => {
    setActing("reject");
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      router.refresh();
    } catch (err) {
      await alert({
        title: "Error",
        message: err instanceof Error ? err.message : "Something went wrong",
        variant: "danger",
      });
      setLoading(false);
      setActing(null);
    }
  };

  if (showReject) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-lg border border-[#F0C9C0] bg-[#FAF0ED] p-3">
        <input
          type="text"
          placeholder="Reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-[36px] w-full rounded border border-[#F0C9C0] bg-white px-2 text-[12px] focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={handleReject} disabled={loading || reason.trim().length < 3} aria-busy={acting === "reject"} className="inline-flex flex-1 items-center justify-center rounded bg-[#A13D2B] py-1.5 text-[11px] font-bold text-white disabled:opacity-50">{acting === "reject" ? "Rejecting…" : "Confirm Reject"}</button>
          <button onClick={() => setShowReject(false)} className="rounded border border-[#F0C9C0] bg-white px-3 py-1.5 text-[11px] font-bold text-[#A13D2B]">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {canReject && (
      <button
        onClick={() => setShowReject(true)}
        disabled={loading}
        className="inline-flex h-[36px] items-center justify-center rounded border border-border-light bg-white px-4 text-[12px] font-bold text-ink-secondary hover:bg-stone disabled:opacity-60"
      >
        Reject
      </button>
      )}
      <button
        onClick={handleApprove}
        disabled={loading}
        aria-busy={acting === "approve"}
        className="inline-flex h-[36px] items-center justify-center rounded bg-brand px-4 text-[12px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {acting === "approve" ? "Approving…" : "Approve"}
      </button>
    </div>
  );
}