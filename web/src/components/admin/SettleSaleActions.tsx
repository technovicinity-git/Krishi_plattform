"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { fieldClass } from "@/components/dashboard/Modal";
import { formatBDT } from "@/lib/utils";

/** Admin confirms the farmer's payment (settles) or sends it back. */
export function SettleSaleActions({
  saleId,
  amount,
  outcomeText,
}: {
  saleId: string;
  amount: number;
  outcomeText: string;
}) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"settle" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const post = async (path: string, body: unknown, kind: "settle" | "reject") => {
    setError(null);
    setBusy(kind);
    try {
      const res = await fetch(`/api/admin/sales/${saleId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(null);
    }
  };

  const settle = async () => {
    const ok = await confirm({
      title: "Confirm payment and settle?",
      message: `You confirm Krishi received ${formatBDT(amount)} from the farmer. ${outcomeText} This closes the batch and is logged in the audit trail.`,
      confirmLabel: "Confirm & settle",
      cancelLabel: "Cancel",
      variant: "success",
    });
    if (ok) await post("settle", { note }, "settle");
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">Decision</h2>
        <p className="text-[12.5px] text-ink-secondary">
          Check the transaction ID and proof against Krishi&apos;s account before confirming.
        </p>
      </div>

      {error && (
        <div className="rounded-[6px] border border-[#F0C9C0] bg-[#FAF0ED] px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}

      {rejecting ? (
        <div className="flex flex-col gap-3">
          <label htmlFor="remit-reason" className="text-[12px] font-semibold text-ink">
            Why couldn&apos;t the payment be confirmed? <span className="text-danger">*</span>
          </label>
          <textarea
            id="remit-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g. No transfer with this transaction ID reached the bKash account."
            className={`${fieldClass} py-2.5`}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => post("reject-remittance", { reason: reason.trim() }, "reject")}
              disabled={busy !== null || reason.trim().length < 5}
              className="inline-flex h-[44px] flex-1 items-center justify-center rounded-[8px] bg-danger text-[14px] font-bold text-white hover:bg-[#8A2F20] disabled:opacity-60"
            >
              {busy === "reject" ? "Sending back..." : "Send back to farmer"}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              disabled={busy !== null}
              className="inline-flex h-[44px] flex-1 items-center justify-center rounded-[8px] border border-border-light text-[14px] font-semibold text-ink-nav hover:bg-stone"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="settle-note" className="text-[12px] font-semibold text-ink">
              Note (optional)
            </label>
            <textarea
              id="settle-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Visible to the investor, steward and farmer."
              className={`${fieldClass} py-2.5`}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={settle}
              disabled={busy !== null}
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[8px] bg-green-deep text-[14px] font-bold text-white hover:bg-[#24492F] disabled:opacity-60"
            >
              {busy === "settle" ? "Settling..." : "Confirm payment & settle"}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              disabled={busy !== null}
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[8px] border border-border-light bg-white text-[14px] font-semibold text-danger hover:bg-[#FAF0ED] disabled:opacity-60"
            >
              Payment not received
            </button>
          </div>
        </>
      )}
    </div>
  );
}
