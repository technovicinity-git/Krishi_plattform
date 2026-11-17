import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { StarIcon, ArrowRightIcon } from "@/components/icons";
import type { Steward } from "@/lib/stewards";

export function StewardProfileHero({ steward }: { steward: Steward }) {
  const t = useTranslations("stewardProfile.hero");

  const roleLabel = steward.role
    ? t(`types.role${capitalize(steward.role)}`)
    : null;
  const typeLabel = t(`types.${steward.type}`);
  const typeLine = roleLabel
    ? `${typeLabel} · ${roleLabel}`
    : typeLabel;

  return (
    <section className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-start lg:gap-12 lg:py-[100px]">
          {/* Identity column */}
          <div className="flex flex-col gap-7">
            <Pill>{t("tag")}</Pill>

            <Heading as="h1" size="section" className="lg:text-[56px]">
              {steward.name}
            </Heading>

            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-sage">
                {typeLine}
              </span>
              <span className="text-[16px] leading-tight text-ink-nav">
                {steward.location}
              </span>
              {steward.ratingAvg && (
                <span className="flex items-center gap-2 text-[13px] text-ink-secondary">
                  <StarIcon className="h-3.5 w-3.5 text-brand" />
                  <span className="font-semibold text-ink">
                    {steward.ratingAvg.toFixed(1)}
                  </span>
                  <span>·</span>
                  <span>
                    {t("ratingCount", { count: steward.ratingCount ?? 0 })}
                  </span>
                </span>
              )}
            </div>

            <p className="max-w-[712px] text-[16px] leading-[1.65] text-ink-secondary">
              {steward.description}
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-brand px-7 py-4 text-[15px] font-bold leading-none text-white transition-colors hover:bg-brand-hover"
              >
                {t("ctaPrimary")}
                <ArrowRightIcon />
              </Link>
              <Link
                href="/stewards"
                className="inline-flex items-center justify-center rounded-[5px] border border-border-light px-7 py-4 text-[15px] font-medium leading-none text-ink-nav transition-colors hover:bg-stone"
              >
                {t("ctaSecondary")}
              </Link>
            </div>

            <p className="text-[12px] leading-tight text-ink-secondary">
              {t("illustrativeNote")}
            </p>
          </div>

          {/* Image column */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[520/520] w-full overflow-hidden rounded-2xl">
              <Image
                src={steward.image}
                alt={steward.name}
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
            <p className="text-[11px] leading-tight text-ink-secondary">
              {t("imageCaption")}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}