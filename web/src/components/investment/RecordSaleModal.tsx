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
import { PhotoField } from "./PhotoField";

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Farmer records the sale of the animals; the steward then confirms it. */
export function RecordSaleModal({
  investmentId,
  defaultAnimals,
  onClose,
}: {
  investmentId: string;
  defaultAnimals: number;
  onClose: () => void;
}) {
  const t = useTranslations("app.saleForm");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const ids = {
    animals: useId(),
    amount: useId(),
    date: useId(),
    buyer: useId(),
    phone: useId(),
    note: useId(),
  };
  const [animals, setAnimals] = useState(String(defaultAnimals || 1));
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [buyer, setBuyer] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("animals_sold", animals);
      fd.set("sale_amount", amount);
      fd.set("sale_date", date);
      fd.set("buyer_name", buyer);
      fd.set("buyer_phone", phone);
      fd.set("note", note);
      if (photo) fd.set("photo", await compressImage(photo, 1600, 1));

      const res = await fetch(`/api/farmer/investments/${investmentId}/sale`, {
        method: "POST",
        body: fd,
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor={ids.animals}>{t("animals")}</FieldLabel>
            <input
              id={ids.animals}
              type="number"
              min={1}
              required
              inputMode="numeric"
              value={animals}
              onChange={(e) => setAnimals(e.target.value)}
              className={`${fieldClass} h-[44px]`}
            />
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
          <FieldLabel htmlFor={ids.date}>{t("date")}</FieldLabel>
          <input
            id={ids.date}
            type="date"
            required
            max={today()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${fieldClass} h-[44px]`}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={ids.buyer}>{t("buyer")}</FieldLabel>
            <input
              id={ids.buyer}
              type="text"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className={`${fieldClass} h-[44px]`}
            />
          </div>
          <div>
            <FieldLabel htmlFor={ids.phone}>{t("buyerPhone")}</FieldLabel>
            <input
              id={ids.phone}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${fieldClass} h-[44px]`}
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor={ids.note}>{t("note")}</FieldLabel>
          <textarea
            id={ids.note}
            rows={3}
            value={note}
            placeholder={t("notePlaceholder")}
            onChange={(e) => setNote(e.target.value)}
            className={`${fieldClass} py-2.5`}
          />
        </div>
        <PhotoField label={t("photo")} file={photo} onChange={setPhoto} />
        <FormError>{error}</FormError>
        <ModalActions
          onCancel={onClose}
          cancelLabel={tc("cancel")}
          submitLabel={loading ? t("submitting") : t("submit")}
          disabled={loading || !animals || !amount || !date}
        />
      </form>
    </Modal>
  );
}
