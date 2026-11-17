import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { PlanCard } from "@/components/plans/PlanCard";
import { PLANS } from "@/lib/plans";
import type { Steward } from "@/lib/stewards";

export function StewardOpportunities({ steward }: { steward: Steward }) {
  const t = useTranslations("stewardProfile.opportunities");
  const tPage = useTranslations("plansPage");

  const related =
    steward.relatedPlans?.map((key) =>
      PLANS.find((p) => p.key === key),
    ).filter(Boolean) ?? [];

  return (
    <Section size="lg" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="text-[16px] leading-[1.65] text-ink-secondary">
              {t("paragraph")}
            </p>
            <p className="text-[13px] leading-[1.65] text-ink-secondary">
              {t("illustrativeNote")}
            </p>
          </div>

          {related.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-[960px] lg:grid-cols-2">
              {related.map((plan) =>
                plan ? (
                  <PlanCard
                    key={plan.key}
                    image={plan.image}
                    imageAlt={tPage(`plans.${plan.key}.title`)}
                    title={tPage(`plans.${plan.key}.title`)}
                    meta={tPage(`plans.${plan.key}.meta`)}
                    status={t("illustrativeBadge")}
                    statusVariant="neutral"
                    estimatedReturn={tPage(`plans.${plan.key}.return`)}
                    estimatedReturnLabel={tPage("card.estimatedReturn")}
                    investmentPerUnit={tPage(`plans.${plan.key}.unit`)}
                    investmentPerUnitLabel={tPage("card.investmentPerUnit")}
                    breakdown={tPage(`plans.${plan.key}.breakdown`)}
                    ctaLabel={tPage("card.viewOpportunity")}
                    ctaHref={plan.ctaHref}
                    ctaVariant="dark"
                  />
                ) : null,
              )}
            </div>
          ) : (
            <div className="rounded-[8px] border border-border-light bg-stone p-6">
              <p className="text-[14px] font-semibold text-ink-secondary">
                {t("emptyState")}
              </p>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}