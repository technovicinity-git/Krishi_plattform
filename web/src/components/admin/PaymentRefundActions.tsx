"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { formatBDT } from "@/lib/utils";

/**
 * Refund a paid online payment (SSLCommerz or manual), or check a pending
 * SSLCommerz refund.
 */
export function PaymentRefundActions({
  paymentId,
  status,
  amount,
  gatewayAvailable,
}: {
  paymentId: string;
  status: string;
  amount: number;
  /** SSLCommerz is configured and gave a bank transaction ID for this payment. */
  gatewayAvailable: boolean;
}) {
  const router = useRouter();
  const { alert, confirm } = useDialog();
  const [mode, setMode] = useState<"gateway" | "manual" | null>(null);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [allowRetry, setAllowRetry] = useState(false);
  const [busy, setBusy] = useState(false);

  const post = async (path: string, body?: unknown) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      return data as { status?: string; gatewayStatus?: string };
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!mode) return;
    const ok = await confirm({
      title: mode === "gateway" ? "Refund through SSLCommerz?" : "Mark as refunded?",
      message:
        mode === "gateway"
          ? `SSLCommerz will return ${formatBDT(amount)} to the investor's card or wallet. The deposit is closed and the investor is notified.`
          : `Confirm you already sent ${formatBDT(amount)} back to the investor. The deposit is closed and the investor is notified.`,
      confirmLabel: mode === "gateway" ? "Refund" : "Mark refunded",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await post("refund", { method: mode, reason: reason.trim(), reference: reference.trim(), allow_retry: allowRetry });
      router.refresh();
    } catch (err) {
      await alert({ title: "Refund failed", message: err instanceof Error ? err.message : undefined, variant: "danger" });
    }
  };

  const checkStatus = async () => {
    try {
      const data = await post("refund-status");
      if (data.status === "refunded") router.refresh();
      else await alert({ title: "Not refunded yet", message: `SSLCommerz says: ${data.gatewayStatus ?? "processing"}.` });
    } catch (err) {
      await alert({ title: "Couldn't check", message: err instanceof Error ? err.message : undefined, variant: "danger" });
    }
  };

  if (status === "refund_pending") {
    return (
      <button
        type="button"
        onClick={checkStatus}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex h-[36px] items-center justify-center rounded border border-border-light bg-white px-4 text-[12px] font-bold text-ink-secondary hover:bg-stone disabled:opacity-60"
      >
        {busy ? "Checking…" : "Check refund status"}
      </button>
    );
  }
  if (status !== "paid") return null;

  if (!mode) {
    return (
      <div className="flex flex-wrap gap-2">
        {gatewayAvailable && (
          <button
            type="button"
            onClick={() => setMode("gateway")}
            className="inline-flex h-[36px] items-center justify-center rounded border border-[#F0C9C0] bg-white px-4 text-[12px] font-bold text-danger hover:bg-[#FAF0ED]"
          >
            Refund via SSLCommerz
          </button>
        )}
        <button
          type="button"
          onClick={() => setMode("manual")}
          className="inline-flex h-[36px] items-center justify-center rounded border border-border-light bg-white px-4 text-[12px] font-bold text-ink-secondary hover:bg-stone"
        >
          Refunded manually
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-[#F0C9C0] bg-[#FAF0ED] p-3">
      <span className="text-[12px] font-bold text-danger">
        {mode === "gateway" ? "Refund through SSLCommerz" : "Record a refund you already sent"}
      </span>
      <input
        type="text"
        placeholder="Reason (shown to the investor), e.g. units sold out"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="h-[36px] w-full rounded border border-[#F0C9C0] bg-white px-2 text-[12px] focus:outline-none"
      />
      {mode === "manual" && (
        <input
          type="text"
          placeholder="Transaction ID of the refund (bKash, bank, ...)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="h-[36px] w-full rounded border border-[#F0C9C0] bg-white px-2 text-[12px] focus:outline-none"
        />
      )}
      <label className="flex items-center gap-2 text-[12px] text-ink-secondary">
        <input type="checkbox" checked={allowRetry} onChange={(e) => setAllowRetry(e.target.checked)} />
        Let the investor pay again for this interest
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || reason.trim().length < 5 || (mode === "manual" && !reference.trim())}
          aria-busy={busy}
          className="flex-1 rounded bg-[#A13D2B] py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
        >
          {busy ? "Refunding…" : mode === "gateway" ? `Refund ${formatBDT(amount)}` : "Mark refunded"}
        </button>
        <button
          type="button"
          onClick={() => setMode(null)}
          disabled={busy}
          className="rounded border border-[#F0C9C0] bg-white px-3 py-1.5 text-[11px] font-bold text-[#A13D2B]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
