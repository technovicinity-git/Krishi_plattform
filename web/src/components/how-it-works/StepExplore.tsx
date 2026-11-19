import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";

const PARAMS = ["unit", "duration", "roi", "location", "category", "availability"] as const;

export function StepExplore() {
  const t = useTranslations("howItWorks.stepExplore");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-20">
          <div className="flex flex-col gap-6">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="text-[15px] leading-[1.65] text-ink-secondary">
              {t("paragraph")}
            </p>

            <div className="flex flex-col gap-3 pt-4">
              <span className="text-[12px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                {t("parametersLabel")}
              </span>
              <div className="flex flex-col">
                {PARAMS.map((key) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 gap-1 border-b border-border-light py-3 sm:grid-cols-[200px_1fr] sm:gap-6"
                  >
                    <span className="text-[14px] font-semibold text-ink">
                      {t(`parameters.${key}.label`)}
                    </span>
                    <span className="text-[14px] text-ink-secondary">
                      {t(`parameters.${key}.value`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-border-light bg-white">
            <div className="relative aspect-[480/240] w-full">
              <Image
                src="/images/card-image.png"
                alt={t("preview.title")}
                fill
                sizes="480px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-6 p-8">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-serif text-[28px] leading-[1.3] text-ink">
                  {t("preview.title")}
                </h3>
                <p className="text-[14px] text-ink-muted">{t("preview.meta")}</p>
              </div>

              <div className="flex flex-col gap-1 border-y border-border-light py-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
                  {t("preview.returnLabel")}
                </span>
                <span className="text-[28px] font-bold leading-tight text-ink">
                  {t("preview.returnValue")}
                </span>
                <span className="text-[11px] italic text-brand">
                  {t("preview.roiNote")}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
                  {t("preview.unitLabel")}
                </span>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[24px] font-bold leading-tight text-ink">
                    {t("preview.unitValue")}
                  </span>
                  <span className="text-right text-[11px] text-ink-muted">
                    {t("preview.breakdown")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}