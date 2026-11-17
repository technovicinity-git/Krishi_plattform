import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const STAGES = ["investment", "deposited", "assigned", "purchased", "growing", "updates", "sale", "settlement"] as const;

export function InvestmentLifecycle() {
  const t = useTranslations("aboutPage.lifecycle");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" className="max-w-[900px]">
              {t("heading")}
            </Heading>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {STAGES.map((key, i) => (
              <div key={key} className="flex flex-col gap-4 border-t border-border-divider pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-terracotta">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < STAGES.length - 1 && (
                    <span className="hidden text-[18px] leading-none text-terracotta lg:inline" aria-hidden="true">
                      →
                    </span>
                  )}
                </div>
                <span className="font-serif text-[18px] leading-[1.3] text-ink lg:text-[21px]">
                  {t(`stages.${key}`)}
                </span>
              </div>
            ))}
          </div>

          <p className="max-w-[760px] text-[15px] leading-[1.65] text-ink-secondary">
            {t("paragraph")}
          </p>
        </div>
      </Container>
    </Section>
  );
}