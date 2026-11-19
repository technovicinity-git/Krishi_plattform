"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";
import { useDialog } from "@/components/ui/dialog-provider";
import { FieldLabel, FormError, fieldClass } from "@/components/dashboard/Modal";
import type { TotalLossBlocker } from "@/lib/investments/total-loss";

/**
 * Steward: every animal in the batch died, so there is nothing to sell.
 * Closes the batch as a total loss for Krishi to settle.
 */
export function TotalLossCard({
  investmentId,
  capital,
  spent,
  animals,
  blocker,
  sentBackReason,
}: {
  investmentId: string;
  capital: number;
  spent: number;
  animals: number;
  /** Why it can't be closed yet (death report or fund request waiting), or null. */
  blocker: TotalLossBlocker | null;
  /** Krishi sent an earlier closing back. */
  sentBackReason?: string | null;
}) {
  const t = useTranslations("app.totalLoss");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const { confirm } = useDialog();
  const noteId = useId();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unspent = Math.max(0, capital - spent);
  const loss = capital - unspent;

  const submit = async () => {
    const ok = await confirm({
      title: t("confirmTitle"),
      message: t("confirmMessage", { amount: formatBDT(unspent) }),
      confirmLabel: t("submit"),
      cancelLabel: tc("cancel"),
      variant: "danger",
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/steward/investments/${investmentId}/total-loss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("failed"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#F0C9C0] bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-danger">{t("heading")}</h2>
        <p className="text-[13px] text-ink-secondary">{t("intro", { count: animals })}</p>
      </div>

      {sentBackReason && (
        <p className="rounded-xl border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-danger">
          {t("sentBack", { reason: sentBackReason })}
        </p>
      )}

      <dl className="grid grid-cols-1 gap-3 rounded-xl bg-cream px-4 py-3 text-[13px] sm:grid-cols-3">
        <div>
          <dt className="text-ink-muted">{t("invested")}</dt>
          <dd className="font-semibold text-ink">{formatBDT(capital)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">{t("returned")}</dt>
          <dd className="font-semibold text-ink">{formatBDT(unspent)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">{t("loss")}</dt>
          <dd className="font-semibold text-danger">{formatBDT(loss)}</dd>
        </div>
      </dl>

      {blocker ? (
        <p className="text-[13px] font-semibold text-[#9A6B12]">{t(`blocker.${blocker}`)}</p>
      ) : (
        <>
          <div>
            <FieldLabel htmlFor={noteId}>{t("note")}</FieldLabel>
            <textarea
              id={noteId}
              rows={3}
              value={note}
              placeholder={t("notePlaceholder")}
              onChange={(e) => setNote(e.target.value)}
              className={`${fieldClass} py-2.5`}
            />
          </div>
          <FormError>{error}</FormError>
          <button
            type="button"
            onClick={submit}
            disabled={busy || note.trim().length < 5}
            className="inline-flex h-[44px] items-center justify-center rounded-[8px] bg-danger px-5 text-[14px] font-bold text-white hover:bg-[#8A2F20] disabled:opacity-60"
          >
            {busy ? tc("saving") : t("submit")}
          </button>
        </>
      )}
    </section>
  );
}
