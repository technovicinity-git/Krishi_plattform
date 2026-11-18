"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fieldClass, FormError } from "@/components/dashboard/Modal";
import type { InvestmentReview } from "@/lib/reviews";
import { Stars } from "./Stars";

const STAR = "M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z";

/** Investor rates the steward once a batch is settled; shows/edits the review. */
export function ReviewPanel({
  investmentId,
  stewardName,
  review,
}: {
  investmentId: string;
  stewardName: string;
  review: InvestmentReview | null;
}) {
  const t = useTranslations("app.review");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const router = useRouter();
  const commentId = useId();
  const [editing, setEditing] = useState(!review);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investment_id: investmentId, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("failed"));
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setSaving(false);
    }
  };

  const shown = hover || rating;

  return (
    <section className="rounded-2xl border border-border-light bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-6 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{t("heading", { name: stewardName })}</h2>
        {review && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-[12.5px] font-semibold text-brand hover:underline">
            {t("edit")}
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {!editing && review ? (
          <div className="flex flex-col gap-2">
            <Stars value={review.rating} size={20} label={t("starsLabel", { count: review.rating })} />
            {review.comment && <p className="text-[13.5px] leading-[1.6] text-ink-secondary">“{review.comment}”</p>}
            <span className="text-[11.5px] text-ink-muted">
              {new Date(review.updatedAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
              {review.status === "hidden" && ` · ${t("hiddenNote")}`}
            </span>
          </div>
        ) : (
          <form onSubmit={save} className="flex flex-col gap-4">
            <p className="text-[13px] text-ink-secondary">{t("prompt", { name: stewardName })}</p>
            <div className="flex items-center gap-3">
              <div className="flex gap-1" role="radiogroup" aria-label={t("ratingLabel")} onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={rating === i}
                    aria-label={t("starsLabel", { count: i })}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(0)}
                    onClick={() => setRating(i)}
                    className="rounded-md p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <svg width="30" height="30" viewBox="0 0 20 20" aria-hidden="true">
                      <path d={STAR} fill={i <= shown ? "#D99A2B" : "#E3DED4"} className="transition-colors" />
                    </svg>
                  </button>
                ))}
              </div>
              <span className={cn("text-[13px] font-semibold", shown ? "text-ink" : "text-ink-muted")}>
                {shown ? t(`level.${shown}`) : t("choose")}
              </span>
            </div>
            <div>
              <label htmlFor={commentId} className="text-[12.5px] font-semibold text-ink-nav">
                {t("comment")}
              </label>
              <textarea
                id={commentId}
                rows={3}
                maxLength={1000}
                value={comment}
                placeholder={t("commentPlaceholder")}
                onChange={(e) => setComment(e.target.value)}
                className={`${fieldClass} py-2.5`}
              />
              <p className="mt-1 text-[11.5px] text-ink-muted">{t("publicNote")}</p>
            </div>
            <FormError>{error}</FormError>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || rating === 0}
                className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-brand px-5 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {saving ? tc("saving") : review ? t("update") : t("submit")}
              </button>
              {review && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setRating(review.rating);
                    setComment(review.comment ?? "");
                  }}
                  className="inline-flex h-[42px] items-center justify-center rounded-[8px] border border-border-light px-4 text-[13px] font-semibold text-ink-secondary"
                >
                  {tc("cancel")}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
