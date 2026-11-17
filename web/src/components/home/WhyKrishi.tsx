import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const FEATURES = [
  { number: "01", key: "tracking" },
  { number: "02", key: "journey" },
  { number: "03", key: "sharing" },
] as const;

export function WhyKrishi() {
  const t = useTranslations("home.whyKrishi");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[520px_minmax(0,1fr)] lg:items-center lg:gap-24">
          {/* Image */}
          <div className="relative aspect-[520/560] w-full overflow-hidden rounded-[8px]">
            <Image
              src="/images/why-visual.png"
              alt={t("imageAlt")}
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <Heading as="h2" size="section">
                {t("heading")}
              </Heading>
            </div>

            <div className="flex flex-col gap-9">
              {FEATURES.map((feature, index) => (
                <div key={feature.key}>
                  <div className="flex items-start gap-6">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone text-[14px] font-bold text-green-olive">
                      {feature.number}
                    </span>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[16px] font-bold leading-tight text-ink">
                        {t(`items.${feature.key}.title`)}
                      </h3>
                      <p className="text-[14px] leading-[1.65] text-ink-secondary">
                        {t(`items.${feature.key}.description`)}
                      </p>
                    </div>
                  </div>
                  {index < FEATURES.length - 1 && (
                    <div className="my-9 h-px w-full bg-stone" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}