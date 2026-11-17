import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { StarIcon } from "@/components/icons";
import type { Steward } from "@/lib/stewards";

export function StewardReviews({ steward }: { steward: Steward }) {
  const t = useTranslations("stewardProfile.reviews");
  const reviews = steward.reviews ?? [];

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="text-[16px] leading-[1.65] text-ink-secondary">
              {t("subheading")}
            </p>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              {/* Summary card */}
              <div className="flex flex-col gap-3 rounded-[8px] border border-border-light bg-white p-8">
                <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-sage">
                  {t("summaryLabel")}
                </span>
                <span className="text-[56px] font-bold leading-none text-ink">
                  {steward.ratingAvg?.toFixed(1) ?? "—"}
                </span>
                <div className="flex gap-0.5 text-terracotta">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                </div>
                <span className="text-[14px] font-semibold text-ink-nav">
                  {t("reviewCount", { count: steward.ratingCount ?? 0 })}
                </span>
                <p className="pt-2 text-[14px] leading-[1.6] text-ink-secondary">
                  {t("summaryNote")}
                </p>
              </div>

              {/* Reviews list */}
              <div className="flex flex-col gap-4">
                {reviews.map((r) => (
                  <article
                    key={r.id}
                    className="flex flex-col gap-3 rounded-[8px] border border-border-light bg-white p-6"
                  >
                    <p className="text-[15px] leading-[1.65] text-ink-secondary">
                      &ldquo;{r.quote}&rdquo;
                    </p>
                    <span className="text-[13px] font-semibold text-ink-nav">
                      — {r.author}, {r.role}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[8px] border border-border-light bg-white p-6">
              <p className="text-[14px] leading-[1.65] text-ink-secondary">
                {t("emptyState")}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-terracotta hover:underline"
            >
              {t("viewAll")} →
            </button>
            <p className="text-[13px] leading-[1.6] text-ink-secondary">
              {t("illustrativeNote")}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}