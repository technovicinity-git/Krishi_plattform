"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatBDT } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { DetailRow, StatusBadge } from "@/components/dashboard/ui";
import { FieldLabel, FormError, Modal, fieldClass } from "@/components/dashboard/Modal";
import type { Animal } from "@/lib/animals";
import { ANIMAL_TONE, weightGain } from "./shared";

/** One animal: details, (farmer) edit form, and full record history. */
export function AnimalDetailModal({
  animal,
  canEdit,
  canRecord,
  onAddRecord,
  onClose,
}: {
  animal: Animal;
  canEdit: boolean;
  canRecord: boolean;
  onAddRecord: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("app.animals");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const router = useRouter();
  const ids = { ear: useId(), breed: useId(), sex: useId(), notes: useId() };
  const [editing, setEditing] = useState(false);
  const [earTag, setEarTag] = useState(animal.earTag ?? "");
  const [breed, setBreed] = useState(animal.breed ?? "");
  const [sex, setSex] = useState(animal.sex ?? "");
  const [notes, setNotes] = useState(animal.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  const kg = (v: number | null) => (v === null ? "—" : t("kg", { value: v }));
  const gain = weightGain(animal);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/animals/${animal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ear_tag: earTag, breed, sex, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("saveFailed"));
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={t("animalTitle", { tag: animal.tag })}
      subtitle={<span className="font-mono text-[12px]">{animal.reference}</span>}
      onClose={onClose}
      className="sm:max-w-[560px]"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge tone={ANIMAL_TONE[animal.status] ?? "neutral"}>{t(`status.${animal.status}`)}</StatusBadge>
          <div className="flex gap-3">
            {canEdit && !editing && (
              <button type="button" onClick={() => setEditing(true)} className="text-[12.5px] font-semibold text-brand hover:underline">
                {t("editDetails")}
              </button>
            )}
            {canRecord && animal.status === "active" && (
              <button type="button" onClick={onAddRecord} className="text-[12.5px] font-semibold text-brand hover:underline">
                {t("addRecord")}
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor={ids.ear}>{t("earTag")}</FieldLabel>
                <input id={ids.ear} value={earTag} onChange={(e) => setEarTag(e.target.value)} className={`${fieldClass} h-[42px]`} />
              </div>
              <div>
                <FieldLabel htmlFor={ids.sex}>{t("sex")}</FieldLabel>
                <select id={ids.sex} value={sex} onChange={(e) => setSex(e.target.value)} className={`${fieldClass} h-[42px]`}>
                  <option value="">—</option>
                  <option value="male">{t("sexMale")}</option>
                  <option value="female">{t("sexFemale")}</option>
                </select>
              </div>
            </div>
            <div>
              <FieldLabel htmlFor={ids.breed}>{t("breed")}</FieldLabel>
              <input id={ids.breed} value={breed} onChange={(e) => setBreed(e.target.value)} className={`${fieldClass} h-[42px]`} />
            </div>
            <div>
              <FieldLabel htmlFor={ids.notes}>{t("notes")}</FieldLabel>
              <textarea id={ids.notes} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${fieldClass} py-2`} />
            </div>
            <FormError>{error}</FormError>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[8px] bg-brand text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
              >
                {saving ? tc("saving") : tc("save")}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="inline-flex h-[40px] items-center justify-center rounded-[8px] border border-border-light px-4 text-[13px] font-semibold text-ink-secondary"
              >
                {tc("cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <DetailRow label={t("earTag")} value={animal.earTag ?? "—"} />
            <DetailRow label={t("breed")} value={animal.breed ?? "—"} />
            <DetailRow label={t("sex")} value={animal.sex ? t(animal.sex === "male" ? "sexMale" : "sexFemale") : "—"} />
            <DetailRow label={t("purchased")} value={`${fmtDate(animal.purchasedAt)} · ${animal.purchasePrice !== null ? formatBDT(animal.purchasePrice) : "—"}`} />
            <DetailRow label={t("startWeight")} value={kg(animal.purchaseWeightKg)} />
            <DetailRow
              label={t("currentWeight")}
              value={
                <>
                  {kg(animal.currentWeightKg)}
                  {gain !== null && (
                    <span className={cn("ml-1.5 text-[12px]", gain >= 0 ? "text-green-deep" : "text-danger")}>
                      ({gain >= 0 ? "+" : ""}
                      {t("kg", { value: gain })})
                    </span>
                  )}
                </>
              }
            />
            {animal.status === "sold" && (
              <DetailRow label={t("sold")} value={`${fmtDate(animal.soldAt)} · ${animal.salePrice !== null ? formatBDT(animal.salePrice) : "—"}`} />
            )}
            {animal.status === "dead" && <DetailRow label={t("died")} value={fmtDate(animal.diedAt)} />}
            {animal.notes && <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-[13px] text-ink-secondary">{animal.notes}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">{t("history")}</span>
          {animal.records.length === 0 ? (
            <p className="text-[13px] text-ink-muted">{t("noRecords")}</p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {animal.records.map((r) => (
                <li key={r.id} className="flex gap-3 rounded-xl border border-border-light px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className={cn("text-[13px] font-semibold", r.kind === "death" ? "text-danger" : "text-ink")}>
                        {t(`kind.${r.kind}`)}
                        {r.weightKg !== null && ` · ${t("kg", { value: r.weightKg })}`}
                      </span>
                      <span className="text-[11px] text-ink-muted">{fmtDate(r.recordedOn)}</span>
                    </div>
                    {r.note && <span className="text-[12.5px] text-ink-secondary">{r.note}</span>}
                    {r.authorRole && <span className="text-[11px] text-ink-muted">{t(`by.${r.authorRole}`)}</span>}
                  </div>
                  {r.photoUrl && (
                    <a href={r.photoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.photoUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Modal>
  );
}
