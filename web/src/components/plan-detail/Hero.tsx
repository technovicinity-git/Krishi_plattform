import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShieldIcon } from "@/components/icons";
import type { OfferingListItem } from "@/lib/public/plans";

interface HeroProps {
  offering: OfferingListItem;
  title: string;
}

export function Hero({ offering, title }: HeroProps) {
  const t = useTranslations("planDetail.hero");
  const tp = useTranslations("app.planText");
  const bn = useLocale() === "bn";

  const imageUrl = offering.imagePath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/plan-images/${offering.imagePath}`
    : "/images/plan-detail-hero.png";

  const thana = bn ? offering.thanaNameBn ?? offering.thanaNameEn : offering.thanaNameEn;
  const district = bn ? offering.districtNameBn : offering.districtNameEn;
  const locationLabel = thana ? `${thana}, ${district}` : district;

  const statusLabel =
    offering.status === "open"
      ? tp("accepting")
      : offering.status === "coming_soon"
        ? tp("comingSoon")
        : tp("fullyFunded");

  const statusVariant =
    offering.status === "open"
      ? ("approved" as const)
      : offering.status === "coming_soon"
        ? ("neutral" as const)
        : ("funded" as const);

  return (
    <section className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-12 pt-6 pb-16 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-12">
          {/* Image */}
          <div className="relative aspect-[672/480] w-full overflow-hidden rounded-2xl">
            <Image
              src={imageUrl}
              alt={title}
              fill
              priority
              sizes="(min-width: 1024px) 672px, 100vw"
              className="object-cover"
            />
            <div className="absolute right-6 top-6">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-green-olive">
                {bn ? offering.categoryNameBn : offering.categoryNameEn} · {locationLabel} · {tp("months", { count: offering.durationMonths })}
              </span>
              <h1 className="font-serif text-[32px] leading-[1.15] text-ink sm:text-[40px] lg:text-[48px]">
                {title}
              </h1>
              <p className="text-[15px] leading-[1.65] text-ink-secondary">
                {t("paragraph")}
              </p>
            </div>

            {/* Metrics bar */}
            <div className="grid grid-cols-3 gap-8 border-y border-border-light py-6">
              <Metric
                label={t("metrics.durationLabel")}
                value={tp("months", { count: offering.durationMonths })}
                valueColor="text-ink"
              />
              <Metric
                label={t("metrics.returnLabel")}
                value={`${offering.roiMin}–${offering.roiMax}%`}
                valueColor="text-terracotta"
              />
              <Metric
                label={t("metrics.unitsLabel")}
                value={tp("unitsOf", { funded: offering.unitsFunded, total: offering.unitsOffered })}
                valueColor="text-green-deep"
              />
            </div>

            {/* Verification note */}
            <div className="flex items-start gap-3">
              <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-olive" />
              <p className="text-[13px] leading-tight text-ink-secondary">
                {t("verification")}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Metric({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
        {label}
      </span>
      <span
        className={`text-[18px] font-bold leading-tight lg:text-[20px] ${valueColor}`}
      >
        {value}
      </span>
    </div>
  );
}