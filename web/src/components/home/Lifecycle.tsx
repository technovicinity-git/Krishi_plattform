import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const STAGES = [
  { number: "Stage 01", key: "capital" },
  { number: "Stage 02", key: "onboarded" },
  { number: "Stage 03", key: "updates" },
  { number: "Stage 04", key: "sale" },
  { number: "Stage 05", key: "settlement" },
] as const;

export function Lifecycle() {
  const t = useTranslations("home.lifecycle");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-[72px]">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" className="max-w-[836px]">
              {t("heading")}
            </Heading>
          </div>

          <div className="grid grid-cols-1 gap-px bg-border-divider lg:grid-cols-5">
            {STAGES.map((stage) => (
              <div
                key={stage.key}
                className="flex flex-col gap-6 bg-cream p-6 lg:p-8"
              >
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                    {stage.number}
                  </span>
                  <div className="h-px w-8 bg-border-divider" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-serif text-[20px] leading-[1.35] text-ink lg:text-[22px]">
                    {t(`stages.${stage.key}.title`)}
                  </h3>
                  <p className="text-[13px] leading-[1.65] text-ink-secondary">
                    {t(`stages.${stage.key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}