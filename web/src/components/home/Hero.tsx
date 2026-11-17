import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";

export function Hero() {
  const t = useTranslations("home.hero");

  // TODO: Replace placeholder values with real data before launch (§32).
  const metrics = [
    { value: "৳150M+", labelKey: "metricInvestedLabel" as const },
    { value: "8,500+", labelKey: "metricAssetsLabel" as const },
    { value: "99.8%", labelKey: "metricHealthLabel" as const },
  ];

  return (
    <section className="bg-cream">
      <Container>
        <div className="py-14 md:py-20 lg:pt-[100px] lg:pb-[120px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_550px] lg:items-center lg:gap-20">
            {/* Content */}
            <div className="flex flex-col gap-8 lg:gap-10">
              {/* Tag */}
              <span className="inline-flex w-fit items-center rounded-[2px] bg-stone px-[14px] py-[7px] text-[11px] font-semibold uppercase leading-none tracking-[0.02em] text-sage">
                {t("tag")}
              </span>

              {/* Headline — uses locale-aware sizing automatically */}
              <Heading as="h1" size="hero">
                {t("headlineLine1")}
                <br />
                {t("headlineLine2")}
                <br />
                {t("headlineLine3")}
              </Heading>

              {/* Paragraph */}
              <p className="max-w-[520px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
                {t("paragraph")}
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-[5px] bg-terracotta px-9 py-5 text-[15px] font-bold leading-none text-white transition-colors hover:bg-[#B3634A]"
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center rounded-[5px] border border-[#C8C0B8] px-7 py-[19px] text-[15px] font-medium leading-none text-ink-button transition-colors hover:bg-stone"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>

              {/* Metrics */}
              <div className="mt-2 grid grid-cols-3 gap-4 border-t border-border-divider pt-9 sm:gap-8 lg:gap-14">
                {metrics.map((m) => (
                  <div key={m.labelKey} className="flex flex-col gap-1">
                    <span className="text-[22px] font-bold leading-tight text-ink sm:text-[28px] lg:text-[34px] lg:leading-[41px]">
                      {m.value}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-ink-muted sm:text-[11px] lg:text-[12px]">
                      {t(m.labelKey)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="relative aspect-[550/580] w-full overflow-hidden rounded-2xl lg:aspect-auto lg:h-[580px]">
              <Image
                src="/images/hero-image-wrapper.png"
                alt={t("imageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 550px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}