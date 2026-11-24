"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";
import { fieldClass } from "@/components/dashboard/Modal";
import { buttonClass, rowActionClass } from "@/components/dashboard/ui";
import { formatBDT } from "@/lib/utils";

async function call(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as { sent?: number; failed?: { error: string }[] };
}

/** Sends one or more due months to the stewards' wallets (after a confirm). */
export function SendMonthlyPayButton({
  items,
  total,
  who,
  label = "Send",
  variant = "row",
}: {
  items: { investmentId: string; monthNo: number }[];
  total: number;
  /** "Rahim (KR-INV-000028, month 2)" or "3 stewards". */
  who: string;
  label?: string;
  variant?: "row" | "primary";
}) {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const ok = await confirm({
      title: `Send ${formatBDT(total)}?`,
      message: `Monthly pay for ${who} goes to the wallet now, and the steward can withdraw it. It is logged in the audit trail.`,
      confirmLabel: "Send to wallet",
      cancelLabel: "Cancel",
      variant: "success",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await call("/api/admin/steward-pay/send", "POST", {
        items: items.map((i) => ({ investment_id: i.investmentId, month_no: i.monthNo })),
      });
      if (res.failed?.length) {
        await alert({
          title: `${res.sent} sent, ${res.failed.length} not sent`,
          message: [...new Set(res.failed.map((f) => f.error))].join(". "),
          variant: "info",
        });
      }
      router.refresh();
    } catch (err) {
      await alert({ title: "Not sent", message: err instanceof Error ? err.message : "Network error", variant: "danger" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={send}
      disabled={busy || items.length === 0}
      aria-busy={busy}
      className={variant === "primary" ? buttonClass("primary") : rowActionClass("primary")}
    >
      {busy ? "Sending…" : label}
    </button>
  );
}

/** Takes back a month sent by mistake (asks for a reason). */
export function ReverseMonthlyPayButton({ id, amount }: { id: string; amount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={rowActionClass("danger")}>
        Reverse
      </button>
    );
  }

  const reverse = async () => {
    setBusy(true);
    setError(null);
    try {
      await call(`/api/admin/steward-pay/${id}/reverse`, "POST", { reason: reason.trim() });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full min-w-[220px] flex-col gap-2 text-left">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={`Why take back ${formatBDT(amount)}?`}
        className={fieldClass}
        autoFocus
      />
      {error && <p className="text-[12px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reverse}
          disabled={busy || reason.trim().length < 5}
          aria-busy={busy}
          className={rowActionClass("danger")}
        >
          {busy ? "Reversing…" : "Take back"}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={busy} className={rowActionClass()}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Edit one batch's monthly steward pay. */
export function MonthlyPayRateForm({
  investmentId,
  rate,
  planRate,
}: {
  investmentId: string;
  rate: number | null;
  planRate: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(rate ?? planRate));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className={rowActionClass()}>
        Change
      </button>
    );
  }

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await call(`/api/admin/investments/${investmentId}/monthly-pay`, "PATCH", { amount: Number(value) });
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={fieldClass}
          aria-label="Monthly pay (৳)"
          autoFocus
        />
        <button
          type="button"
          onClick={save}
          disabled={busy || value === "" || Number(value) < 0}
          aria-busy={busy}
          className={rowActionClass("primary")}
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} disabled={busy} className={rowActionClass()}>
          Cancel
        </button>
      </div>
      <p className="text-[11.5px] text-ink-muted">Months already sent keep their amount. Plan rate: {formatBDT(planRate)}.</p>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
