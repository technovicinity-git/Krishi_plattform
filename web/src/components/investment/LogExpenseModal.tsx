"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { compressImage } from "@/lib/images/compress";
import {
  FieldLabel,
  FormError,
  Modal,
  ModalActions,
  fieldClass,
} from "@/components/dashboard/Modal";
import { PURPOSES } from "./FundRequestModal";
import { PhotoField } from "./PhotoField";

export function LogExpenseModal({
  investmentId,
  onClose,
}: {
  investmentId: string;
  onClose: () => void;
}) {
  const t = useTranslations("app.logExpense");
  const tp = useTranslations("app.purpose");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const ids = { category: useId(), amount: useId(), description: useId() };
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("feed");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.set("investment_id", investmentId);
      fd.set("amount", amount);
      fd.set("category", category);
      fd.set("description", description);
      if (file) fd.set("receipt", await compressImage(file, 1600, 1));

      const res = await fetch("/api/farmer/expenses", { method: "POST", body: fd });
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor={ids.category}>{t("category")}</FieldLabel>
            <select
              id={ids.category}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
        </div>
        <div>
          <FieldLabel htmlFor={ids.description}>{t("description")}</FieldLabel>
          <input
            id={ids.description}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            className={`${fieldClass} h-[44px]`}
          />
        </div>
        <PhotoField label={t("receipt")} file={file} onChange={setFile} />

        <FormError>{error}</FormError>

        <ModalActions
          onCancel={onClose}
          cancelLabel={tc("cancel")}
          submitLabel={loading ? t("saving") : t("submit")}
          disabled={loading || !amount}
        />
      </form>
    </Modal>
  );
}
