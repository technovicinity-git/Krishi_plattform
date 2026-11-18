"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { fieldClass } from "@/components/dashboard/Modal";
import { formatBDT } from "@/lib/utils";

/** Mark a withdrawal paid (with the transfer's transaction ID) or reject it. */
export function WithdrawalActions({
  id,
  amount,
  name,
}: {
  id: string;
  amount: number;
  name: string;
}) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [mode, setMode] = useState<"idle" | "pay" | "reject">("idle");
  const [txnId, setTxnId] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (path: "pay" | "reject", body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setBusy(false);
    }
  };

  const pay = async () => {
    const ok = await confirm({
      title: `Mark ${formatBDT(amount)} as paid?`,
      message: `Only confirm after the money reached ${name}'s account. This is logged in the audit trail.`,
      confirmLabel: "Mark as paid",
      cancelLabel: "Cancel",
      variant: "success",
    });
    if (ok) await post("pay", { txnId: txnId.trim(), note: note.trim() });
  };

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-[6px] border border-[#F0C9C0] bg-[#FAF0ED] px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}

      {mode === "idle" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setMode("pay")}
            className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[8px] bg-green-deep text-[13px] font-bold text-white hover:bg-[#24492F]"
          >
            Mark as paid
          </button>
          <button
            type="button"
            onClick={() => setMode("reject")}
            className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[8px] border border-border-light text-[13px] font-semibold text-danger hover:bg-[#FAF0ED]"
          >
            Reject
          </button>
        </div>
      )}

      {mode === "pay" && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            placeholder="Transaction ID of your transfer"
            className={`${fieldClass} mt-0 h-[40px]`}
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the user (optional)"
            className={`${fieldClass} mt-0 h-[40px]`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={pay}
              disabled={busy || txnId.trim().length < 3}
              className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[8px] bg-green-deep text-[13px] font-bold text-white disabled:opacity-50"
            >
              {busy ? "Saving..." : "Confirm paid"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={busy}
              className="inline-flex h-[40px] items-center justify-center rounded-[8px] border border-border-light px-4 text-[13px] font-semibold text-ink-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div className="flex flex-col gap-2">
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason, shown to the user (e.g. the bKash number is not registered)"
            className={`${fieldClass} mt-0 py-2`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => post("reject", { reason: reason.trim() })}
              disabled={busy || reason.trim().length < 5}
              className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[8px] bg-danger text-[13px] font-bold text-white disabled:opacity-50"
            >
              {busy ? "Saving..." : "Reject & return money"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={busy}
              className="inline-flex h-[40px] items-center justify-center rounded-[8px] border border-border-light px-4 text-[13px] font-semibold text-ink-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
