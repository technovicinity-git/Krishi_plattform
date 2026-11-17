import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { ArrowRightIcon } from "@/components/icons";

export function AboutHero() {
  const t = useTranslations("aboutPage.hero");

  return (
    <section className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:gap-20 lg:py-[100px] lg:pb-[120px]">
          <div className="flex flex-col gap-8">
            <Pill>{t("tag")}</Pill>
            <Heading as="h1" size="hero" className="max-w-[680px]">
              {t("headingLine1")}
              <br />
              {t("headingLine2")}
            </Heading>
            <p className="max-w-[680px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-terracotta px-7 py-4 text-[15px] font-bold leading-none text-white transition-colors hover:bg-[#B3634A]"
              >
                {t("ctaPrimary")}
                <ArrowRightIcon />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-[5px] border border-border-light px-7 py-4 text-[15px] font-medium leading-none text-ink-nav transition-colors hover:bg-stone"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>

          <div className="relative aspect-[520/560] w-full overflow-hidden rounded-2xl">
            <Image
              src="/images/why-visual.png"
              alt={t("imageAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}