"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";
import { WITHDRAWAL_MIN } from "@/lib/wallet/config";
import { buttonClass } from "@/components/dashboard/ui";
import { Link } from "@/i18n/navigation";
import {
  FieldLabel,
  FormError,
  Modal,
  ModalActions,
  fieldClass,
} from "@/components/dashboard/Modal";

/**
 * Opens a dialog to withdraw part or all of the wallet balance. Never just
 * greyed out: without a payout account, or below the minimum, it explains
 * what is needed instead.
 */
export function WithdrawButton({
  balance,
  destination,
  payoutHref,
}: {
  balance: number;
  /** e.g. "bKash •••5678"; null when no payout account is set. */
  destination: string | null;
  /** Where to add the payout account, e.g. "/farmer/wallet/payout". */
  payoutHref: string;
}) {
  const t = useTranslations("app.wallet");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const amountId = useId();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Why withdrawing is not possible yet, if it is not.
  const [blocked, setBlocked] = useState<"payout" | "minimum" | null>(null);
  const value = Number(amount);
  const valid = value >= WITHDRAWAL_MIN && value <= balance;

  const close = () => {
    setOpen(false);
    setAmount("");
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("withdrawFailed"));
      close();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("withdrawFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          destination === null ? setBlocked("payout") : balance < WITHDRAWAL_MIN ? setBlocked("minimum") : setOpen(true)
        }
        className={buttonClass("primary")}
      >
        {t("withdraw")}
      </button>

      {blocked && (
        <Modal
          title={blocked === "payout" ? t("payoutNeededTitle") : t("minimumNotReachedTitle")}
          onClose={() => setBlocked(null)}
        >
          <p className="text-[14px] leading-relaxed text-ink-secondary">
            {blocked === "payout"
              ? t("payoutNeededBody")
              : t("minimumNotReachedBody", { min: formatBDT(WITHDRAWAL_MIN), balance: formatBDT(balance) })}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setBlocked(null)} className={buttonClass("secondary")}>
              {tc("close")}
            </button>
            {blocked === "payout" && (
              <Link href={payoutHref} className={buttonClass("primary")}>
                {t("addPayout")}
              </Link>
            )}
          </div>
        </Modal>
      )}

      {open && destination && (
        <Modal
          title={t("withdrawTitle")}
          subtitle={t("withdrawSubtitle", { destination })}
          onClose={close}
        >
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <FieldLabel htmlFor={amountId}>{t("amount")}</FieldLabel>
                <button
                  type="button"
                  onClick={() => setAmount(String(balance))}
                  className="text-[12px] font-semibold text-brand hover:underline"
                >
                  {t("withdrawAll", { amount: formatBDT(balance) })}
                </button>
              </div>
              <input
                id={amountId}
                type="number"
                inputMode="decimal"
                min={WITHDRAWAL_MIN}
                max={balance}
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${fieldClass} h-[44px]`}
              />
              <p className="mt-1.5 text-[12px] text-ink-muted">
                {t("limits", { min: formatBDT(WITHDRAWAL_MIN), max: formatBDT(balance) })}
              </p>
            </div>
            <FormError>{error}</FormError>
            <ModalActions
              onCancel={close}
              cancelLabel={tc("cancel")}
              submitLabel={loading ? t("requesting") : t("requestWithdrawal")}
              disabled={loading || !valid}
            />
          </form>
        </Modal>
      )}
    </>
  );
}
