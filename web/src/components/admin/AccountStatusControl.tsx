"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, rowActionClass } from "@/components/dashboard/ui";
import { NavIcon } from "@/components/dashboard/NavIcon";

/**
 * Suspend or restore a person's account from their console page. Suspended
 * accounts stop working at once: they are signed out everywhere and every
 * request is refused until restored.
 */
export function AccountStatusControl({
  userId,
  name,
  status,
  reason,
  changedAt,
  changedBy,
}: {
  userId: string;
  name: string;
  status: string;
  reason: string | null;
  changedAt: string | null;
  changedBy: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suspended = status === "suspended";

  const send = async (action: "suspend" | "restore") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: text.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setOpen(false);
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const when = changedAt
    ? new Date(changedAt).toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  if (suspended) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-[#F1C9C1] bg-[#FBEDEA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-danger">
            <NavIcon name="lock" className="h-[18px] w-[18px]" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-bold text-danger">Account suspended</span>
            {reason && <span className="text-[13px] text-ink">{reason}</span>}
            {when && (
              <span className="text-[11.5px] text-ink-muted">
                {when}
                {changedBy ? ` · by ${changedBy}` : ""}
              </span>
            )}
            <span className="text-[11.5px] text-ink-muted">They cannot sign in or use the website or app until restored.</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          {open ? (
            <div className="flex flex-col gap-2 sm:w-[320px]">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Note (optional, kept in the audit log)"
                className="h-9 rounded-[8px] border border-border-light bg-white px-3 text-[13px]"
              />
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => send("restore")} className={buttonClass("primary", "h-9 px-4 text-[12.5px]")}>
                  {busy ? "Restoring…" : `Restore ${name}`}
                </button>
                <button type="button" onClick={() => setOpen(false)} className={rowActionClass()}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setOpen(true)} className={rowActionClass("primary")}>
              <NavIcon name="check" className="h-[15px] w-[15px]" />
              Restore account
            </button>
          )}
          {error && <span className="text-[12px] text-danger">{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      {open ? (
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-[#F1C9C1] bg-white p-4 sm:max-w-[460px]">
          <span className="text-[13.5px] font-semibold text-ink">Suspend {name}?</span>
          <span className="text-[12px] text-ink-secondary">
            They are signed out everywhere at once and cannot use the website or app until an admin restores the account.
            Their batches, wallet and records stay as they are.
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Reason (required, shown here and kept in the audit log)"
            className="rounded-[8px] border border-border-light px-3 py-2 text-[13px]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || text.trim().length < 5}
              onClick={() => send("suspend")}
              className="inline-flex h-9 items-center rounded-[8px] bg-danger px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
            >
              {busy ? "Suspending…" : "Suspend account"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={rowActionClass()}>
              Cancel
            </button>
          </div>
          {error && <span className="text-[12px] text-danger">{error}</span>}
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={rowActionClass("danger")}>
          <NavIcon name="lock" className="h-[15px] w-[15px]" />
          Suspend account
        </button>
      )}
      {!open && when && reason && (
        <span className="text-[11.5px] text-ink-muted">
          Restored {when}
          {changedBy ? ` by ${changedBy}` : ""}: {reason}
        </span>
      )}
    </div>
  );
}
