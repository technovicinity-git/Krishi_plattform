"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";

export function StewardApprovalActions({
  stewardId,
}: {
  stewardId: string;
}) {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    const ok = await confirm({
      title: "Approve this steward?",
      message:
        "They will be able to operate as a steward and manage farmers and livestock. This action is logged.",
      confirmLabel: "Approve Steward",
      variant: "success",
    });
    if (!ok) return;

    setError(null);
    setSubmitting("approve");
    try {
      const res = await fetch(`/api/admin/stewards/${stewardId}/approve`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to approve");
        setSubmitting(null);
        return;
      }
      router.push("/krishi-console/stewards");
      router.refresh();
    } catch {
      setError("Network error");
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    setError(null);
    if (reason.trim().length < 10) {
      await alert({
        title: "Reason is too short",
        message: "The rejection reason must be at least 10 characters.",
        variant: "danger",
      });
      return;
    }

    const ok = await confirm({
      title: "Reject this steward application?",
      message: "The applicant will see your reason. This action is logged.",
      confirmLabel: "Confirm Rejection",
      variant: "danger",
    });
    if (!ok) return;

    setSubmitting("reject");
    try {
      const res = await fetch(`/api/admin/stewards/${stewardId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to reject");
        setSubmitting(null);
        return;
      }
      router.push("/krishi-console/stewards");
      router.refresh();
    } catch {
      setError("Network error");
      setSubmitting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
        Decision
      </h2>

      {error && (
        <div className="rounded-[6px] border border-[#F0C9C0] bg-[#FAF0ED] px-3 py-2 text-[12px] text-[#A13D2B]">
          {error}
        </div>
      )}

      {!showReject ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting !== null}
            className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[8px] bg-green-deep text-[14px] font-bold text-white transition-colors hover:bg-[#24492F] disabled:opacity-60"
          >
            {submitting === "approve" ? "Approving..." : "Approve Steward"}
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={submitting !== null}
            className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[8px] border border-border-light bg-white text-[14px] font-semibold text-danger transition-colors hover:bg-[#FAF0ED] disabled:opacity-60"
          >
            Reject Application
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label
            htmlFor="steward-rejection"
            className="text-[12px] font-semibold text-ink"
          >
            Rejection reason <span className="text-danger">*</span>
          </label>
          <textarea
            id="steward-rejection"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this application is being rejected."
            className="w-full resize-none rounded-[8px] border border-border-light bg-cream px-4 py-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleReject}
              disabled={submitting !== null || reason.trim().length < 10}
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[8px] bg-danger text-[14px] font-bold text-white transition-colors hover:bg-[#8A2F20] disabled:opacity-60"
            >
              {submitting === "reject" ? "Rejecting..." : "Confirm Rejection"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setReason("");
                setError(null);
              }}
              disabled={submitting !== null}
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[8px] border border-border-light bg-white text-[14px] font-semibold text-ink-nav transition-colors hover:bg-stone disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}