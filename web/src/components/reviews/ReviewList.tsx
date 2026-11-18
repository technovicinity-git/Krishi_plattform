import { getLocale, getTranslations } from "next-intl/server";
import type { PublicReview, StewardRating } from "@/lib/reviews";
import { Stars } from "./Stars";

/** Rating summary + list of published reviews (public steward page, steward profile). */
export async function ReviewList({
  rating,
  reviews,
}: {
  rating: StewardRating | null;
  reviews: PublicReview[];
}) {
  const t = await getTranslations("app.review");
  const locale = await getLocale();
  const bn = locale === "bn";

  if (!rating || reviews.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="flex h-fit flex-col gap-2 rounded-2xl border border-border-light bg-white p-6">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">{t("average")}</span>
        <span className="font-serif text-[48px] leading-none text-ink">{rating.avg.toFixed(1)}</span>
        <Stars value={rating.avg} size={18} label={t("avgLabel", { avg: rating.avg.toFixed(1) })} />
        <span className="text-[12.5px] text-ink-secondary">{t("count", { count: rating.count })}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {reviews.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-2xl border border-border-light bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Stars value={r.rating} label={t("starsLabel", { count: r.rating })} />
              <span className="text-[11.5px] text-ink-muted">
                {new Date(r.createdAt).toLocaleDateString(bn ? "bn-BD" : "en-GB", { month: "short", year: "numeric" })}
              </span>
            </div>
            {r.comment && <p className="text-[14px] leading-[1.6] text-ink">“{r.comment}”</p>}
            <span className="text-[12px] text-ink-secondary">
              <span className="font-semibold text-ink">{r.reviewer}</span>
              {(bn ? r.planBn : r.planEn) && ` · ${bn ? r.planBn : r.planEn}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
