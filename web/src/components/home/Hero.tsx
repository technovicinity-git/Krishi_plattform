import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const STAGES: { key: string; icon: NavIconName }[] = [
  { key: "capital", icon: "wallet" },
  { key: "onboarded", icon: "tag" },
  { key: "updates", icon: "chart" },
  { key: "sale", icon: "receipt" },
  { key: "settlement", icon: "coins" },
];

export function Hero() {
  const t = useTranslations("home.hero");
  const tStages = useTranslations("home.lifecycle.stages");

  // What the platform actually does: the investor share of profit, live farm
  // updates, and NID checks. No invented totals.
  const metrics = [
    { value: "30%", labelKey: "metricInvestedLabel" as const },
    { value: t("metricLive"), labelKey: "metricAssetsLabel" as const },
    { value: t("metricVerified"), labelKey: "metricHealthLabel" as const },
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
                  className="inline-flex items-center justify-center rounded-[5px] bg-brand px-9 py-5 text-[15px] font-bold leading-none text-white transition-colors hover:bg-brand-hover"
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

            {/* Image, with the five steps of a batch on top */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl sm:aspect-[550/480] lg:aspect-auto lg:h-[580px]">
              <Image
                src="/images/hero-image-wrapper.png"
                alt={t("imageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 550px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur sm:inset-x-5 sm:bottom-5 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-bold text-ink">{t("stagesTitle")}</span>
                  <span className="hidden text-[11px] text-ink-muted sm:inline">{t("stagesBody")}</span>
                </div>
                <ol className="relative mt-4 grid grid-cols-5">
                  <span aria-hidden className="absolute left-[10%] right-[10%] top-[15px] h-[2px] bg-brand/25" />
                  {STAGES.map((stage) => (
                    <li key={stage.key} className="relative flex flex-col items-center gap-1.5 text-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white ring-4 ring-white">
                        <NavIcon name={stage.icon} className="h-4 w-4" />
                      </span>
                      <span className="text-[9.5px] font-semibold leading-tight text-ink-secondary sm:text-[10.5px]">
                        {tStages(`${stage.key}.title`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}