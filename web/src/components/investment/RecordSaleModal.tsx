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
import type { Animal } from "@/lib/animals";

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Farmer records the sale of the animals; the steward then confirms it. */
export function RecordSaleModal({
  investmentId,
  defaultAnimals,
  animals = [],
  onClose,
}: {
  investmentId: string;
  defaultAnimals: number;
  /**
   * Unsold animals in the batch; when present the farmer ticks which were
   * sold. Only active ones can be ticked; dead or death-reported ones are
   * shown greyed out.
   */
  animals?: Pick<Animal, "id" | "tag" | "earTag" | "currentWeightKg" | "status">[];
  onClose: () => void;
}) {
  const t = useTranslations("app.saleForm");
  const tAnimal = useTranslations("app.animals");
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
  const tracked = animals.length > 0;
  const sellable = animals.filter((a) => a.status === "active");
  const nothingToSell = tracked && sellable.length === 0;
  const [count, setCount] = useState(String(defaultAnimals || 1));
  const [picked, setPicked] = useState<Set<string>>(() => new Set(sellable.map((a) => a.id)));
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      if (tracked) picked.forEach((id) => fd.append("animal_ids", id));
      else fd.set("animals_sold", count);
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
        {tracked && (
          <fieldset>
            <legend className="text-[12.5px] font-semibold text-ink-nav">
              {t("whichAnimals", { count: picked.size })}
            </legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {animals.map((a) => {
                const canSell = a.status === "active";
                return (
                  <label
                    key={a.id}
                    title={canSell ? undefined : tAnimal(`status.${a.status}`)}
                    className={`flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[13px] ${
                      !canSell
                        ? "cursor-not-allowed border-border-light bg-cream opacity-60"
                        : picked.has(a.id)
                          ? "cursor-pointer border-brand bg-brand-tint/60"
                          : "cursor-pointer border-border-light"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={canSell && picked.has(a.id)}
                      disabled={!canSell}
                      onChange={() => toggle(a.id)}
                      className="h-4 w-4 accent-[#3A7D44]"
                    />
                    <span className={`font-semibold ${canSell ? "text-ink" : "text-ink-muted line-through"}`}>{a.tag}</span>
                    <span className="truncate text-[11px] text-ink-muted">
                      {canSell ? a.earTag : tAnimal(`status.${a.status}`)}
                    </span>
                  </label>
                );
              })}
            </div>
            {nothingToSell && (
              <p className="mt-2 rounded-xl border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[12.5px] text-danger">
                {animals.some((a) => a.status === "death_reported") ? t("waitDeathReview") : t("noLiveAnimals")}
              </p>
            )}
            {!nothingToSell && sellable.length < animals.length && (
              <p className="mt-2 text-[12px] text-ink-muted">{t("deadNotSellable")}</p>
            )}
          </fieldset>
        )}
        <div className="grid grid-cols-2 gap-3">
          {!tracked && (
          <div>
            <FieldLabel htmlFor={ids.animals}>{t("animals")}</FieldLabel>
            <input
              id={ids.animals}
              type="number"
              min={1}
              required
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className={`${fieldClass} h-[44px]`}
            />
          </div>
          )}
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
          disabled={loading || nothingToSell || (tracked ? picked.size === 0 : !count) || !amount || !date}
        />
      </form>
    </Modal>
  );
}
