import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { delay } from "@/components/home/motion";

export function AboutHero() {
  const t = useTranslations("aboutPage.hero");

  return (
    <section className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:gap-20 lg:py-[100px] lg:pb-[120px]">
          <div className="flex flex-col gap-8">
            <div className="k-in" style={delay(0)}>
              <Pill>{t("tag")}</Pill>
            </div>
            <div className="k-in" style={delay(120)}>
              <Heading as="h1" size="hero" className="max-w-[680px]">
                {t("headingLine1")}
                <br />
                {t("headingLine2")}
              </Heading>
            </div>
            <p style={delay(240)} className="k-in max-w-[680px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>
            <div style={delay(360)} className="k-in flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-brand px-7 py-4 text-[15px] font-bold leading-none text-white shadow-[0_6px_20px_-8px_rgba(58,125,68,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-hover"
              >
                {t("ctaPrimary")}
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-[5px] border border-border-light px-7 py-4 text-[15px] font-medium leading-none text-ink-nav transition-all duration-300 hover:-translate-y-0.5 hover:bg-stone"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>

          <div style={delay(200)} className="k-in group relative aspect-[520/560] w-full overflow-hidden rounded-2xl">
            <Image
              src="/images/why-visual.png"
              alt={t("imageAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="k-zoom object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}