import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ITEMS = ["allocation", "track", "care", "settlement"] as const;

export function TrustIndicators() {
  const t = useTranslations("plansPage.trust");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-3.5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.map((key, i) => (
              <article
                key={key}
                className="transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_12px_28px_-16px_rgba(0,0,0,0.2)] flex flex-col gap-4 rounded-[8px] border border-border-light bg-cream p-7"
              >
                <span className="text-[11px] font-bold uppercase leading-none tracking-[0.02em] text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-serif text-[20px] leading-[1.35] text-ink">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="text-[13px] leading-[1.6] text-ink-secondary">
                    {t(`items.${key}.description`)}
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