"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";

export function KycReviewActions({
  kycId,
  applicantName,
}: {
  kycId: string;
  applicantName: string;
}) {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    const ok = await confirm({
      title: `Approve KYC for ${applicantName}?`,
      message:
        "This will grant full platform access. The decision is logged in the audit trail.",
      confirmLabel: "Approve KYC",
      cancelLabel: "Cancel",
      variant: "success",
    });
    if (!ok) return;

    setError(null);
    setSubmitting("approve");
    try {
      const res = await fetch(`/api/admin/kyc/${kycId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to approve");
        setSubmitting(null);
        return;
      }
      router.push("/krishi-console/kyc");
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
      title: `Reject KYC for ${applicantName}?`,
      message:
        "The applicant will see your reason and can resubmit. This action is logged in the audit trail.",
      confirmLabel: "Confirm Rejection",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;

    setSubmitting("reject");
    try {
      const res = await fetch(`/api/admin/kyc/${kycId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to reject");
        setSubmitting(null);
        return;
      }
      router.push("/krishi-console/kyc");
      router.refresh();
    } catch {
      setError("Network error");
      setSubmitting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
          Decision
        </h2>
        <p className="text-[12px] text-ink-secondary">
          Approving grants the investor full platform access. Rejection sends
          them back to KYC with a reason.
        </p>
      </div>

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
            {submitting === "approve" ? "Approving..." : "Approve KYC"}
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={submitting !== null}
            className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[8px] border border-border-light bg-white text-[14px] font-semibold text-terracotta transition-colors hover:bg-[#FAF0ED] disabled:opacity-60"
          >
            Reject KYC
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label
            htmlFor="rejection-reason"
            className="text-[12px] font-semibold text-ink"
          >
            Rejection reason <span className="text-terracotta">*</span>
          </label>
          <textarea
            id="rejection-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g., NID number does not match the uploaded document. Please re-upload with a clearer image."
            className="w-full resize-none rounded-[8px] border border-border-light bg-cream px-4 py-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-sage focus:outline-none"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleReject}
              disabled={submitting !== null || reason.trim().length < 10}
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[8px] bg-terracotta text-[14px] font-bold text-white transition-colors hover:bg-[#B3634A] disabled:opacity-60"
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