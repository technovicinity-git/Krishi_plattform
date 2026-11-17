import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";

const ITEMS = ["transparency", "accountability", "localKnowledge", "participation"] as const;

export function Principles() {
  const t = useTranslations("aboutPage.principles");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-20">
          <Heading as="h2" size="section" className="max-w-[440px]">
            {t("headingLine1")}
            <br />
            {t("headingLine2")}
          </Heading>

          <div className="flex flex-col">
            {ITEMS.map((key, i) => (
              <div
                key={key}
                className="flex items-start gap-6 border-t border-border-divider py-6"
              >
                <span className="w-10 shrink-0 text-[11px] font-semibold uppercase tracking-[0.02em] text-terracotta">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[12px] font-semibold uppercase leading-[1.5] tracking-[0.02em] text-ink">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="text-[15px] leading-[1.65] text-ink-secondary">
                    {t(`items.${key}.description`)}
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