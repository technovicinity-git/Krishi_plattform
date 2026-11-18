"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FieldLabel,
  FormError,
  Modal,
  ModalActions,
  fieldClass,
} from "@/components/dashboard/Modal";

export const PURPOSES = ["animal_purchase", "feed", "medical", "transport", "other"] as const;

export function FundRequestModal({
  investmentId,
  onClose,
}: {
  investmentId: string;
  onClose: () => void;
}) {
  const t = useTranslations("app.fundRequest");
  const tp = useTranslations("app.purpose");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const ids = { purpose: useId(), amount: useId(), note: useId() };
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState<string>("animal_purchase");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/farmer/fund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investment_id: investmentId,
          amount: Number(amount),
          purpose,
          note,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("failed"));

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setLoading(false);
    }
  };

  return (
    <Modal title={t("title")} subtitle={t("subtitle")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor={ids.purpose}>{t("purpose")}</FieldLabel>
          <select
            id={ids.purpose}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className={`${fieldClass} h-[44px]`}
          >
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {tp(p)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor={ids.amount}>{t("amount")}</FieldLabel>
          <input
            id={ids.amount}
            type="number"
            min={1}
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${fieldClass} h-[44px]`}
          />
        </div>
        <div>
          <FieldLabel htmlFor={ids.note}>{t("note")}</FieldLabel>
          <textarea
            id={ids.note}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={`${fieldClass} py-2.5`}
          />
        </div>

        <FormError>{error}</FormError>

        <ModalActions
          onCancel={onClose}
          cancelLabel={tc("cancel")}
          submitLabel={loading ? t("sending") : t("submit")}
          disabled={loading || !amount}
        />
      </form>
    </Modal>
  );
}
