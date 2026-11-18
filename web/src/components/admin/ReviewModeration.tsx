"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fieldClass } from "@/components/dashboard/Modal";

/** Hide a review (with reason) or show it again. */
export function ReviewModeration({ id, hidden }: { id: string; hidden: boolean }) {
  const router = useRouter();
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update");
      setHiding(false);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  };

  if (hidden) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => send({ action: "show" })}
        className="text-[12px] font-semibold text-brand hover:underline disabled:opacity-50"
      >
        {busy ? "..." : "Show again"}
      </button>
    );
  }

  return hiding ? (
    <div className="flex flex-col gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why hide it? (kept in the audit log)"
        className={`${fieldClass} mt-0 h-[36px] text-[12.5px]`}
      />
      {error && <span className="text-[12px] text-danger">{error}</span>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || reason.trim().length < 5}
          onClick={() => send({ action: "hide", reason: reason.trim() })}
          className="h-[32px] rounded-[6px] bg-danger px-3 text-[12px] font-bold text-white disabled:opacity-50"
        >
          Hide review
        </button>
        <button
          type="button"
          onClick={() => setHiding(false)}
          className="h-[32px] rounded-[6px] border border-border-light px-3 text-[12px] font-semibold text-ink-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setHiding(true)}
      className="text-[12px] font-semibold text-danger hover:underline"
    >
      Hide
    </button>
  );
}
