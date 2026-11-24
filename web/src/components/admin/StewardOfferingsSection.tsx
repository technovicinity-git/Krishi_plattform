"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog-provider";

interface Steward {
  id: string;
  full_name: string;
}

interface Thana {
  id: string;
  name_en: string;
}

export interface OfferingRow {
  id: string;
  steward_id: string;
  steward_name: string;
  thana_id: string | null;
  thana_name: string | null;
  units_offered: number;
  units_funded: number;
  status: string;
}

interface Props {
  planId: string;
  stewards: Steward[];
  thanas: Thana[];
  offerings: OfferingRow[];
}

const STATUS_LABEL: Record<string, string> = {
  pending_approval: "Pending Approval",
  approved: "Approved",
  paused: "Paused",
  closed: "Closed",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<string, string> = {
  pending_approval: "bg-[#FEF6E5] text-[#C48A2E]",
  approved: "bg-[#E8F0EA] text-green-deep",
  paused: "bg-stone text-ink-muted",
  closed: "bg-stone text-ink-muted",
  rejected: "bg-[#FAF0ED] text-danger",
};

export function StewardOfferingsSection({
  planId,
  stewards,
  thanas,
  offerings,
}: Props) {
  const router = useRouter();
  const { alert, confirm } = useDialog();
  const [isPending, startTransition] = useTransition();
  // The offering and the status being set, while the request runs.
  const [acting, setActing] = useState<{ id: string; status: string } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newStewardId, setNewStewardId] = useState("");
  const [newThanaId, setNewThanaId] = useState("");
  const [newUnits, setNewUnits] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takenStewardIds = new Set(offerings.map((o) => o.steward_id));
  const availableStewards = stewards.filter((s) => !takenStewardIds.has(s.id));

  const resetForm = () => {
    setNewStewardId("");
    setNewThanaId("");
    setNewUnits("10");
    setError(null);
  };

  const handleCreate = async () => {
    setError(null);
    if (!newStewardId) return setError("Choose a steward.");
    const unitsNum = Number(newUnits);
    if (!Number.isFinite(unitsNum) || unitsNum < 1) {
      return setError("Units must be at least 1.");
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${planId}/offerings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steward_id: newStewardId,
          thana_id: newThanaId || null,
          units_offered: unitsNum,
          status: "approved",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create offering");
        setSaving(false);
        return;
      }
      setShowAdd(false);
      resetForm();
      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    offeringId: string,
    status: string,
    rejectionReason?: string,
  ) => {
    setActing({ id: offeringId, status });
    const res = await fetch(`/api/admin/offerings/${offeringId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(rejectionReason !== undefined
          ? { rejection_reason: rejectionReason }
          : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      await alert({
        title: "Could not update offering",
        message: data.error ?? "Unknown error",
      });
      setActing(null);
      return;
    }
    startTransition(() => router.refresh());
    setActing(null);
  };

  const handleApprove = (o: OfferingRow) =>
    changeStatus(o.id, "approved");
  const handlePause = (o: OfferingRow) => changeStatus(o.id, "paused");
  const handleResume = (o: OfferingRow) => changeStatus(o.id, "approved");
  const handleReject = async (o: OfferingRow) => {
    const ok = await confirm({
      title: "Reject this offering?",
      message:
        "The steward will be notified and the offering will not appear publicly.",
      confirmLabel: "Reject",
      variant: "danger",
    });
    if (!ok) return;
    changeStatus(o.id, "rejected");
  };
  const handleClose = async (o: OfferingRow) => {
    if (o.units_funded > 0) {
      await alert({
        title: "Cannot close",
        message:
          "This offering has funded units. Close it after those investments are settled in a future update.",
      });
      return;
    }
    const ok = await confirm({
      title: "Close this offering?",
      message: "It will be removed from the public site. This cannot be undone from the UI.",
      confirmLabel: "Close",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/offerings/${o.id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      await alert({
        title: "Could not close",
        message: data.error ?? "Unknown error",
      });
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Steward Offerings
          </h2>
          <p className="text-[12px] text-ink-secondary">
            Who can offer this plan and how many units each. Only approved
            offerings appear publicly.
          </p>
        </div>
        {!showAdd && availableStewards.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex h-[38px] shrink-0 items-center justify-center rounded-[8px] border border-border-light bg-white px-4 text-[12px] font-semibold text-ink-nav hover:bg-stone"
          >
            + Add offering
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="flex flex-col gap-3 rounded-[8px] border border-border-light bg-cream p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-ink-muted">Steward</span>
              <select
                value={newStewardId}
                onChange={(e) => setNewStewardId(e.target.value)}
                className="h-[38px] rounded-[6px] border border-border-light bg-white px-2 text-[13px] text-ink"
              >
                <option value="">Choose steward</option>
                {availableStewards.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-ink-muted">Thana (optional)</span>
              <select
                value={newThanaId}
                onChange={(e) => setNewThanaId(e.target.value)}
                className="h-[38px] rounded-[6px] border border-border-light bg-white px-2 text-[13px] text-ink"
              >
                <option value="">No specific thana</option>
                {thanas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name_en}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-ink-muted">Units offered</span>
              <input
                type="number"
                min={1}
                value={newUnits}
                onChange={(e) => setNewUnits(e.target.value)}
                className="h-[38px] rounded-[6px] border border-border-light bg-white px-2 text-[13px] text-ink"
              />
            </label>
          </div>

          {error && (
            <p className="text-[12px] text-[#A13D2B]">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                resetForm();
              }}
              disabled={saving}
              className="h-[38px] rounded-[6px] border border-border-light bg-white px-4 text-[12px] font-semibold text-ink-nav hover:bg-stone disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !newStewardId}
              className="h-[38px] rounded-[6px] bg-brand px-5 text-[12px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : "Create offering"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {offerings.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-border-light bg-stone px-6 py-8 text-center text-[13px] text-ink-muted">
          No offerings yet. This plan is <strong>not visible</strong> to investors.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-border-light">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Steward
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Thana
                </th>
                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Units
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {offerings.map((o) => {
                const style = STATUS_STYLE[o.status] ?? STATUS_STYLE.pending_approval;
                const progress =
                  o.units_offered > 0
                    ? (o.units_funded / o.units_offered) * 100
                    : 0;
                return (
                  <tr
                    key={o.id}
                    className="border-b border-border-light last:border-b-0"
                  >
                    <td className="px-4 py-3 text-[13px] font-semibold text-ink">
                      {o.steward_name}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-secondary">
                      {o.thana_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-[12px] font-semibold text-ink">
                        {o.units_funded} / {o.units_offered}
                      </div>
                      <div className="mx-auto mt-1 h-1 w-16 overflow-hidden rounded-full bg-stone">
                        <div
                          className="h-full bg-green-deep"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] ${style}`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {o.status === "pending_approval" && (
                          <>
                            <ActionButton
                              label="Approve"
                              tone="primary"
                              onClick={() => handleApprove(o)}
                              disabled={isPending || acting !== null}
                              busy={acting?.id === o.id && acting.status === "approved"}
                            />
                            <ActionButton
                              label="Reject"
                              tone="danger"
                              onClick={() => handleReject(o)}
                              disabled={isPending || acting !== null}
                              busy={acting?.id === o.id && acting.status === "rejected"}
                            />
                          </>
                        )}
                        {o.status === "approved" && (
                          <>
                            <ActionButton
                              label="Pause"
                              onClick={() => handlePause(o)}
                              disabled={isPending || acting !== null}
                              busy={acting?.id === o.id && acting.status === "paused"}
                            />
                            <ActionButton
                              label="Close"
                              tone="danger"
                              onClick={() => handleClose(o)}
                              disabled={isPending || acting !== null}
                              busy={acting?.id === o.id && acting.status === "closed"}
                            />
                          </>
                        )}
                        {o.status === "paused" && (
                          <>
                            <ActionButton
                              label="Resume"
                              tone="primary"
                              onClick={() => handleResume(o)}
                              disabled={isPending || acting !== null}
                              busy={acting?.id === o.id && acting.status === "approved"}
                            />
                            <ActionButton
                              label="Close"
                              tone="danger"
                              onClick={() => handleClose(o)}
                              disabled={isPending || acting !== null}
                              busy={acting?.id === o.id && acting.status === "closed"}
                            />
                          </>
                        )}
                        {(o.status === "closed" || o.status === "rejected") && (
                          <span className="text-[11px] text-ink-muted">
                            No actions
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {availableStewards.length === 0 && offerings.length > 0 && (
        <p className="text-[11px] text-ink-muted">
          All approved stewards already offer this plan. To add more, approve new
          stewards in the Stewards section.
        </p>
      )}
      {stewards.length === 0 && (
        <p className="text-[11px] text-brand">
          No approved stewards exist yet. Approve a steward first in the Stewards
          section.
        </p>
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  tone = "neutral",
  disabled,
  busy,
}: {
  label: string;
  onClick: () => void;
  tone?: "primary" | "danger" | "neutral";
  disabled?: boolean;
  /** Shows a spinner: this action is running. */
  busy?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "border-[#D6E5D3] bg-[#EEF5EB] text-[#2F5C2A] hover:bg-[#E2EEDE]",
    danger: "border-[#F0C9C0] bg-[#FAF0ED] text-[#A13D2B] hover:bg-[#FAF0ED]",
    neutral: "border-border-light bg-white text-ink-nav hover:bg-stone",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      className={`inline-flex h-[28px] items-center rounded-[4px] border px-2.5 text-[11px] font-semibold disabled:opacity-50 ${styles[tone]}`}
    >
      {label}
    </button>
  );
}