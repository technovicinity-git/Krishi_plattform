import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const STEP_ORDER = [
  { number: "01", key: "investor" },
  { number: "02", key: "platform" },
  { number: "03", key: "steward" },
  { number: "04", key: "farmer" },
  { number: "05", key: "distribution" },
] as const;

export function Ecosystem() {
  const t = useTranslations("home.ecosystem");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-14">
          {/* Heading group */}
          <div className="flex flex-col gap-3.5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          {/* Cards row — gap-px technique creates clean 1px dividers */}
          <div className="grid grid-cols-1 gap-px bg-border-divider lg:grid-cols-5">
            {STEP_ORDER.map((step) => (
              <article
                key={step.key}
                className="flex flex-col gap-5 bg-cream p-7 lg:px-8 lg:py-9"
              >
                <span className="text-[11px] font-bold uppercase leading-none tracking-[0.02em] text-terracotta">
                  {step.number}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-serif text-[20px] leading-[1.35] text-ink lg:text-[22px]">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="text-[13px] leading-[1.6] text-ink-secondary">
                    {t(`steps.${step.key}.description`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}