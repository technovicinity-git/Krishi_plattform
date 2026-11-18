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
import { PhotoField } from "@/components/investment/PhotoField";
import type { Animal } from "@/lib/animals";

const KINDS = ["weight", "health", "vaccination", "treatment", "note", "death"] as const;

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Add a weight / health / vaccination / treatment / note / death record. */
export function AnimalRecordModal({
  animal,
  onClose,
  initialKind = "weight",
}: {
  animal: Animal;
  onClose: () => void;
  initialKind?: (typeof KINDS)[number];
}) {
  const t = useTranslations("app.animals");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const ids = { kind: useId(), weight: useId(), date: useId(), note: useId() };
  const [kind, setKind] = useState<(typeof KINDS)[number]>(initialKind);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWeight = kind === "weight";
  const isDeath = kind === "death";
  const valid = isWeight ? Number(weight) > 0 : note.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      if (isWeight) fd.set("weight_kg", weight);
      fd.set("note", note.trim());
      fd.set("recorded_on", date);
      if (photo) fd.set("photo", await compressImage(photo, 1600, 1));
      const res = await fetch(`/api/animals/${animal.id}/records`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("saveFailed"));
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t("addRecordTitle", { tag: animal.tag })}
      subtitle={animal.earTag ? t("earTagLine", { earTag: animal.earTag }) : undefined}
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor={ids.kind}>{t("recordType")}</FieldLabel>
            <select
              id={ids.kind}
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])}
              className={`${fieldClass} h-[44px]`}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`kind.${k}`)}
                </option>
              ))}
            </select>
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
        </div>

        {isWeight && (
          <div>
            <FieldLabel htmlFor={ids.weight}>{t("weightKg")}</FieldLabel>
            <input
              id={ids.weight}
              type="number"
              inputMode="decimal"
              min={1}
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`${fieldClass} h-[44px]`}
            />
          </div>
        )}

        {isDeath && (
          <p className="rounded-xl border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[12.5px] text-danger">
            {t("deathWarning")}
          </p>
        )}

        <div>
          <FieldLabel htmlFor={ids.note}>{isWeight ? t("noteOptional") : t("note")}</FieldLabel>
          <textarea
            id={ids.note}
            rows={3}
            value={note}
            placeholder={t(`placeholder.${kind}`)}
            onChange={(e) => setNote(e.target.value)}
            className={`${fieldClass} py-2.5`}
          />
        </div>
        <PhotoField label={t("photoOptional")} file={photo} onChange={setPhoto} />
        <FormError>{error}</FormError>
        <ModalActions
          onCancel={onClose}
          cancelLabel={tc("cancel")}
          submitLabel={loading ? tc("saving") : isDeath ? t("confirmDeath") : t("saveRecord")}
          disabled={loading || !valid}
        />
      </form>
    </Modal>
  );
}
