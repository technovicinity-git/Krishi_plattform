"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FormError, fieldClass } from "@/components/dashboard/Modal";
import type { Animal } from "@/lib/animals";

/** Steward: death reports from the farmer waiting to be confirmed or rejected. */
export function DeathReviewList({ animals }: { animals: Animal[] }) {
  const t = useTranslations("app.animals");
  const reported = animals.filter((a) => a.status === "death_reported");
  if (reported.length === 0) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-[#F0C9C0] bg-[#FAF0ED] p-4 sm:mx-6">
      <p className="text-[14px] font-semibold text-danger">{t("pendingDeaths", { count: reported.length })}</p>
      <p className="mt-0.5 text-[12.5px] text-ink-secondary">{t("pendingDeathsHint")}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {reported.map((a) => (
          <DeathReport key={a.id} animal={a} />
        ))}
      </ul>
    </div>
  );
}

function DeathReport({ animal }: { animal: Animal }) {
  const t = useTranslations("app.animals");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const router = useRouter();
  const report = animal.records.find((r) => r.kind === "death" && r.reviewStatus === "pending");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = report
    ? new Date(report.recordedOn).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const send = async (action: "approve" | "reject") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/steward/animals/${animal.id}/death`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("saveFailed"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
      setLoading(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border-light bg-white p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-serif text-[20px] leading-none text-ink">
            {animal.tag}
            {animal.earTag && <span className="ml-2 font-sans text-[12px] text-ink-muted">{t("earTagShort", { earTag: animal.earTag })}</span>}
          </span>
          <span className="mt-1 text-[12px] text-ink-muted">
            {t("reportedLine", {
              date,
              cause: animal.deathCause ? t(`causes.${animal.deathCause}`) : "—",
            })}
          </span>
          {report?.note && <p className="mt-1 text-[13px] text-ink-secondary">{report.note}</p>}
        </div>
        <div className="flex gap-2">
          {report?.photoUrl && (
            <a href={report.photoUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.photoUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
            </a>
          )}
          {report?.documentUrl && (
            <a href={report.documentUrl} target="_blank" rel="noopener noreferrer" title={t("vetCertificate")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.documentUrl} alt={t("vetCertificate")} className="h-20 w-20 rounded-lg object-cover" />
            </a>
          )}
        </div>
      </div>

      {rejecting && (
        <textarea
          rows={2}
          value={reason}
          aria-label={t("rejectReason")}
          placeholder={t("rejectPlaceholder")}
          onChange={(e) => setReason(e.target.value)}
          className={`${fieldClass} py-2`}
        />
      )}
      <FormError>{error}</FormError>
      <div className="flex flex-wrap gap-2">
        {rejecting ? (
          <>
            <button
              type="button"
              onClick={() => send("reject")}
              disabled={loading || !reason.trim()}
              className="inline-flex h-[36px] items-center justify-center rounded-[8px] bg-danger px-4 text-[12.5px] font-bold text-white disabled:opacity-60"
            >
              {t("sendReject")}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              disabled={loading}
              className="inline-flex h-[36px] items-center justify-center rounded-[8px] border border-border-light px-4 text-[12.5px] font-semibold text-ink-secondary"
            >
              {tc("cancel")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => send("approve")}
              disabled={loading}
              className="inline-flex h-[36px] items-center justify-center rounded-[8px] bg-brand px-4 text-[12.5px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {t("confirmDeathBtn")}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              disabled={loading}
              className="inline-flex h-[36px] items-center justify-center rounded-[8px] border border-border-light px-4 text-[12.5px] font-semibold text-ink-secondary hover:border-danger hover:text-danger"
            >
              {t("rejectDeath")}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
