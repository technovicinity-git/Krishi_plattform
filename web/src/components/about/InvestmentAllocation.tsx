import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const ITEMS = ["animal", "care", "record"] as const;

const ICON: Record<(typeof ITEMS)[number], NavIconName> = {
  animal: "tag",
  care: "leaf",
  record: "history",
};

export function InvestmentAllocation() {
  const t = useTranslations("aboutPage.allocation");

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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {ITEMS.map((key, i) => (
              <article
                key={key}
                className="group flex flex-col gap-4 rounded-xl border border-border-light bg-cream p-7 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_12px_28px_-16px_rgba(0,0,0,0.2)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-tint text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                    <NavIcon name={ICON[key]} className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-bold uppercase leading-none tracking-[0.02em] text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
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