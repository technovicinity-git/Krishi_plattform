import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";

export function Hero() {
  const t = useTranslations("howItWorks.hero");

  return (
    <section className="bg-cream">
      <Container>
        <div className="py-14 md:py-20 lg:pt-[100px] lg:pb-[120px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:gap-20">
            <div className="flex flex-col gap-8">
              <Pill>{t("tag")}</Pill>

              <Heading as="h1" size="hero">
                {t("headingLine1")}
                <br />
                {t("headingLine2")}
              </Heading>

              <p className="font-serif text-[20px] leading-[1.3] text-brand lg:text-[24px]">
                {t("subline")}
              </p>

              <p className="max-w-[540px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
                {t("paragraph")}
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-[5px] bg-brand px-8 py-4 text-[14px] font-semibold leading-none text-white transition-colors hover:bg-brand-hover"
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="/stewards"
                  className="inline-flex items-center justify-center rounded-[5px] border border-border-divider px-7 py-[15px] text-[14px] font-medium leading-none text-ink-button transition-colors hover:bg-stone"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>

            <div className="relative aspect-[520/560] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/hero-image-container.png"
                alt={t("imageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}