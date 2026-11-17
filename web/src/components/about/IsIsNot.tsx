import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

const IS_KEYS = ["platform", "tracking", "stewards", "updates"] as const;
const IS_NOT_KEYS = ["guarantee", "judgment", "promise"] as const;

export function IsIsNot() {
  const t = useTranslations("aboutPage.isIsNot");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Is */}
          <div className="flex flex-col gap-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-sage">
              {t("isLabel")}
            </span>
            <div className="flex flex-col">
              {IS_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-4 border-t border-border-divider py-5"
                >
                  <span className="pt-0.5 text-[16px] text-ink-muted" aria-hidden="true">
                    —
                  </span>
                  <span className="text-[16px] leading-[1.65] text-ink-secondary">
                    {t(`isItems.${key}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Is not */}
          <div className="flex flex-col gap-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-terracotta">
              {t("isNotLabel")}
            </span>
            <div className="flex flex-col">
              {IS_NOT_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-4 border-t border-border-divider py-5"
                >
                  <span className="pt-0.5 text-[16px] text-ink-muted" aria-hidden="true">
                    —
                  </span>
                  <span className="text-[16px] leading-[1.65] text-ink-secondary">
                    {t(`isNotItems.${key}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}