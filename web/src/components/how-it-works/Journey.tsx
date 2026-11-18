import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";

const TOP = ["explore", "express", "approved", "kyc", "deposit"] as const;
const BOTTOM = ["assigned", "care", "updates", "sale", "settlement"] as const;

export function Journey() {
  const t = useTranslations("howItWorks.journey");

  const renderRow = (keys: readonly string[], startNumber: number) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {keys.map((key, i) => {
        const number = String(startNumber + i).padStart(2, "0");
        const isSecondHalf = startNumber > 1;
        return (
          <article
            key={key}
            className="flex flex-col gap-4 rounded-[8px] border border-border-light bg-cream p-6"
          >
            <span
              className={cn(
                "text-[12px] font-bold leading-none",
                isSecondHalf ? "text-green-olive" : "text-brand",
              )}
            >
              {number}
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif text-[18px] leading-[1.4] text-ink">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-[12px] leading-[1.4] text-ink-secondary">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          <div className="flex flex-col gap-4">
            {renderRow(TOP, 1)}
            {renderRow(BOTTOM, 6)}
          </div>
        </div>
      </Container>
    </Section>
  );
}