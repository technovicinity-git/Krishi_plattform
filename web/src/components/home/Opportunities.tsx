import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlanCard } from "@/components/plans/PlanCard";
import { Link } from "@/i18n/navigation";
import { planImageUrl } from "@/lib/admin/plan-helpers";
import { listPublicOfferings, type OfferingListItem } from "@/lib/public/plans";
import { formatBDT } from "@/lib/utils";

export async function Opportunities() {
  const t = await getTranslations("home.opportunities");
  const tPlans = await getTranslations("plansPage");
  const locale = await getLocale();
  const { items } = await listPublicOfferings({ limit: 3, status: "all" });

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-[72px]">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3.5">
                <Eyebrow>{t("eyebrow")}</Eyebrow>
                <Heading as="h2" size="section">
                  {t("heading")}
                </Heading>
              </div>
              <p className="max-w-[360px] text-[14px] leading-[1.65] text-ink-muted lg:text-right">
                {t("subtitle")}
              </p>
            </div>
            <div className="h-px w-full bg-border-divider" />
          </div>

          {items.length === 0 ? (
            <div className="rounded-[8px] border border-border-light bg-white px-8 py-12 text-center">
              <p className="text-[14px] text-ink-secondary">{t("empty")}</p>
              <Link
                href="/plans"
                className="mt-4 inline-flex text-[13px] font-semibold text-brand hover:underline"
              >
                {t("viewAll")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <HomePlanCard
                  key={item.offeringId}
                  item={item}
                  locale={locale}
                  monthsLabel={t("months")}
                  estimatedReturnLabel={t("estimatedReturnLabel")}
                  investmentPerUnitLabel={t("investmentPerUnitLabel")}
                  statusLabel={
                    item.status === "open"
                      ? tPlans("statuses.accepting")
                      : item.status === "coming_soon"
                        ? tPlans("statuses.comingSoon")
                        : tPlans("statuses.fullyFunded")
                  }
                  ctaLabel={
                    item.status === "open"
                      ? tPlans("card.viewOpportunity")
                      : item.status === "coming_soon"
                        ? tPlans("card.registerInterest")
                        : tPlans("card.fullyFunded")
                  }
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

function HomePlanCard({
  item,
  locale,
  monthsLabel,
  estimatedReturnLabel,
  investmentPerUnitLabel,
  statusLabel,
  ctaLabel,
}: {
  item: OfferingListItem;
  locale: string;
  monthsLabel: string;
  estimatedReturnLabel: string;
  investmentPerUnitLabel: string;
  statusLabel: string;
  ctaLabel: string;
}) {
  const bn = locale === "bn";
  const title = bn ? item.planNameBn : item.planNameEn;
  const district = bn ? item.districtNameBn : item.districtNameEn;
  const comingSoon = item.status === "coming_soon";
  const funded = item.status === "fully_funded";

  return (
    <PlanCard
      image={planImageUrl(item.imagePath) ?? "/images/card-image.png"}
      imageAlt={title}
      title={title}
      meta={`${district} · ${item.durationMonths} ${monthsLabel} · ${item.steward.name}`}
      status={statusLabel}
      statusVariant={comingSoon ? "neutral" : funded ? "funded" : "success"}
      estimatedReturn={`${item.roiMin}–${item.roiMax}%`}
      estimatedReturnLabel={estimatedReturnLabel}
      investmentPerUnit={formatBDT(item.unitPrice)}
      investmentPerUnitLabel={investmentPerUnitLabel}
      breakdown={
        bn
          ? `পশু ${formatBDT(item.animalAllocation)} + পরিচর্যা ${formatBDT(item.careAllocation)}`
          : `Animal ${formatBDT(item.animalAllocation)} + Care ${formatBDT(item.careAllocation)}`
      }
      ctaLabel={ctaLabel}
      ctaHref={funded ? undefined : `/plans/${item.offeringSlug}`}
      ctaVariant={comingSoon ? "outline" : funded ? "disabled" : "dark"}
      muted={comingSoon}
    />
  );
}
