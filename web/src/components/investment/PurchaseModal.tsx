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

/** Farmer confirms the animals were bought; moves the batch to Growing & Care. */
export function PurchaseModal({
  investmentId,
  defaultAnimals,
  onClose,
}: {
  investmentId: string;
  defaultAnimals: number;
  onClose: () => void;
}) {
  const t = useTranslations("app.purchaseForm");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const ids = { animals: useId(), cost: useId(), note: useId() };
  const [animals, setAnimals] = useState(String(defaultAnimals || 1));
  const [cost, setCost] = useState("");
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
      fd.set("animals", animals);
      fd.set("total_cost", cost);
      fd.set("note", note);
      if (photo) fd.set("photo", await compressImage(photo, 1600, 1));

      const res = await fetch(`/api/farmer/investments/${investmentId}/purchase`, {
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
            <FieldLabel htmlFor={ids.cost}>{t("totalCost")}</FieldLabel>
            <input
              id={ids.cost}
              type="number"
              min={1}
              required
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
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
          disabled={loading || !animals || !cost}
        />
      </form>
    </Modal>
  );
}
