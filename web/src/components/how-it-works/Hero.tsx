import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { delay } from "@/components/home/motion";

export function Hero() {
  const t = useTranslations("howItWorks.hero");

  return (
    <section className="bg-cream">
      <Container>
        <div className="py-14 md:py-20 lg:pt-[100px] lg:pb-[120px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:gap-20">
            <div className="flex flex-col gap-8">
              <div className="k-in" style={delay(0)}>
                <Pill>{t("tag")}</Pill>
              </div>

              <div className="k-in" style={delay(120)}>
                <Heading as="h1" size="hero">
                  {t("headingLine1")}
                  <br />
                  {t("headingLine2")}
                </Heading>
              </div>

              <p style={delay(240)} className="k-in font-serif text-[20px] leading-[1.3] text-brand lg:text-[24px]">
                {t("subline")}
              </p>

              <p style={delay(340)} className="k-in max-w-[540px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
                {t("paragraph")}
              </p>

              <div style={delay(440)} className="k-in flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-[5px] bg-brand px-8 py-4 text-[14px] font-semibold leading-none text-white shadow-[0_6px_20px_-8px_rgba(58,125,68,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-hover"
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="/stewards"
                  className="inline-flex items-center justify-center rounded-[5px] border border-border-divider px-7 py-[15px] text-[14px] font-medium leading-none text-ink-button transition-all duration-300 hover:-translate-y-0.5 hover:bg-stone"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>

            <div style={delay(200)} className="k-in group relative aspect-[520/560] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/hero-image-container.png"
                alt={t("imageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="k-zoom object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}