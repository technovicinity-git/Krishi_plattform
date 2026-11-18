import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ITEMS = ["records", "updates", "expenses", "sale"] as const;

export function Transparency() {
  const t = useTranslations("aboutPage.transparency");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.map((key, i) => (
              <article
                key={key}
                className="flex flex-col gap-4 rounded-[8px] border border-border-light bg-cream p-7"
              >
                <span className="text-[11px] font-bold uppercase leading-none tracking-[0.02em] text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.02em] text-ink">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="text-[15px] leading-[1.65] text-ink-secondary">
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