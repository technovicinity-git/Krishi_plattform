import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { Badge } from "@/components/ui/Badge";

const EVENTS = ["purchased", "health", "weight", "care"] as const;

export function StepUpdates() {
  const t = useTranslations("howItWorks.stepUpdates");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="max-w-[640px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[minmax(0,1fr)_520px]">
            {/* Timeline */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-[28px] leading-tight text-ink">
                    {t("animal.tag")}
                  </h3>
                  <Badge variant="approved">{t("animal.stage")}</Badge>
                </div>
                <p className="text-[14px] text-ink-secondary">
                  {t("animal.summary")}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {EVENTS.map((key, i) => {
                  const isHighlight = key === "health";
                  return (
                    <div key={key} className="flex items-start gap-4">
                      <div className="flex w-24 shrink-0 flex-col items-start gap-1">
                        <span className="text-[12px] font-semibold text-ink-tertiary">
                          {t(`events.${key}.date`)}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${
                          isHighlight ? "bg-terracotta" : "bg-border-divider"
                        }`} />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 border-l border-border-light pl-4">
                        <span className={`text-[15px] font-bold ${
                          isHighlight ? "text-terracotta" : "text-ink"
                        }`}>
                          {t(`events.${key}.title`)}
                        </span>
                        <span className="text-[13px] leading-[1.5] text-ink-secondary">
                          {t(`events.${key}.description`)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="inline-flex w-fit items-center justify-center rounded-[5px] bg-ink px-8 py-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#2A2A2A]"
              >
                {t("animal.cta")}
              </button>
            </div>

            {/* Image */}
            <div className="relative aspect-[520/520] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/image-block-steward.png"
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}