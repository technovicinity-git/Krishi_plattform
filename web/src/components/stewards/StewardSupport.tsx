import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";

const ITEMS = ["coordination", "monitoring", "expense", "sale"] as const;

export function StewardSupport() {
  const t = useTranslations("stewardProfile.support");

  return (
    <Section size="md" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-8">
          <Heading as="h2" size="section">
            {t("heading")}
          </Heading>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.map((key, i) => (
              <article
                key={key}
                className="flex flex-col gap-3 rounded-[8px] border border-border-light bg-cream px-7 py-5"
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-[22px] leading-[1.2] text-ink">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="text-[13px] leading-[1.65] text-ink-secondary">
                  {t(`items.${key}.description`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}