"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/dashboard/ui";
import type { Animal } from "@/lib/animals";
import { ANIMAL_TONE, weightGain } from "./shared";
import { AnimalDetailModal } from "./AnimalDetailModal";
import { AnimalRecordModal } from "./AnimalRecordModal";
import { DeathReviewList } from "./DeathReviewList";

/**
 * The animals in one batch. Farmers (and stewards) add weight and health
 * records; farmers can also edit details and report deaths, which the
 * steward confirms here. Investors see everything read-only.
 */
export function AnimalsPanel({
  animals,
  canEdit = false,
  recordAs,
}: {
  animals: Animal[];
  canEdit?: boolean;
  /** Who adds records (and how deaths are handled); omit for read-only. */
  recordAs?: "farmer" | "steward";
}) {
  const canRecord = recordAs !== undefined;
  const t = useTranslations("app.animals");
  const [openId, setOpenId] = useState<string | null>(null);
  const [recording, setRecording] = useState<{ id: string; kind: "weight" | "death" } | null>(null);

  const open = animals.find((a) => a.id === openId) ?? null;
  const recordAnimal = recording ? animals.find((a) => a.id === recording.id) ?? null : null;

  const count = (s: string) => animals.filter((a) => a.status === s).length;
  const gains = animals.map(weightGain).filter((g): g is number => g !== null);
  const avgGain = gains.length ? Math.round((gains.reduce((s, g) => s + g, 0) / gains.length) * 10) / 10 : null;

  return (
    <section className="rounded-2xl border border-border-light bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-6 py-4">
        <div className="flex flex-col">
          <h2 className="text-[15px] font-semibold text-ink">{t("heading")}</h2>
          {animals.length > 0 && (
            <span className="text-[12px] text-ink-muted">
              {t("summary", { active: count("active"), sold: count("sold"), dead: count("dead") })}
              {count("death_reported") > 0 && ` · ${t("reportedSummary", { count: count("death_reported") })}`}
              {avgGain !== null && ` · ${t("avgGain", { value: avgGain })}`}
            </span>
          )}
        </div>
      </div>

      {recordAs === "steward" && <DeathReviewList animals={animals} />}

      {animals.length === 0 ? (
        <p className="px-6 py-6 text-[13px] text-ink-muted">{t("emptyBatch")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {animals.map((a) => {
            const gain = weightGain(a);
            const last = a.records.find((r) => r.kind !== "weight");
            return (
              <li key={a.id}>
                <div className="flex h-full flex-col gap-3 rounded-xl border border-border-light p-4 transition-colors hover:border-brand/50">
                  <button type="button" onClick={() => setOpenId(a.id)} className="flex flex-col gap-2 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-serif text-[22px] leading-none text-ink">{a.tag}</span>
                        <span className="mt-1 text-[11.5px] text-ink-muted">
                          {[a.earTag ? t("earTagShort", { earTag: a.earTag }) : null, a.breed].filter(Boolean).join(" · ") || t("noDetails")}
                        </span>
                      </div>
                      <StatusBadge tone={ANIMAL_TONE[a.status] ?? "neutral"}>{t(`status.${a.status}`)}</StatusBadge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[17px] font-bold text-ink">
                        {a.currentWeightKg !== null ? t("kg", { value: a.currentWeightKg }) : t("noWeight")}
                      </span>
                      {gain !== null && (
                        <span className={cn("text-[12px] font-semibold", gain >= 0 ? "text-green-deep" : "text-danger")}>
                          {gain >= 0 ? "+" : ""}
                          {t("kg", { value: gain })}
                        </span>
                      )}
                    </div>
                    {last && (
                      <span className="line-clamp-1 text-[12px] text-ink-secondary">
                        {t(`kind.${last.kind}`)}: {last.note}
                      </span>
                    )}
                  </button>
                  {canRecord && a.status === "active" && (
                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRecording({ id: a.id, kind: "weight" })}
                        className="inline-flex h-[34px] flex-1 items-center justify-center rounded-[8px] border border-brand/40 text-[12.5px] font-semibold text-green-deep hover:bg-brand-tint"
                      >
                        {t("addRecord")}
                      </button>
                      {recordAs === "farmer" && (
                        <button
                          type="button"
                          onClick={() => setRecording({ id: a.id, kind: "death" })}
                          className="inline-flex h-[34px] items-center justify-center rounded-[8px] border border-border-light px-3 text-[12.5px] font-semibold text-ink-secondary hover:border-danger hover:text-danger"
                        >
                          {t("reportDeath")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && !recordAnimal && (
        <AnimalDetailModal
          animal={open}
          canEdit={canEdit}
          canRecord={canRecord}
          onAddRecord={() => setRecording({ id: open.id, kind: "weight" })}
          onClose={() => setOpenId(null)}
        />
      )}
      {recordAnimal && recording && recordAs && (
        <AnimalRecordModal
          animal={recordAnimal}
          role={recordAs}
          initialKind={recording.kind}
          onClose={() => setRecording(null)}
        />
      )}
    </section>
  );
}
