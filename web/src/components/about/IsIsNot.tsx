import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { NavIcon } from "@/components/dashboard/NavIcon";

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
            <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-brand">
              {t("isLabel")}
            </span>
            <div className="flex flex-col">
              {IS_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-4 border-t border-border-divider py-5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand" aria-hidden="true">
                    <NavIcon name="check" className="h-3.5 w-3.5" />
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
            <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-danger">
              {t("isNotLabel")}
            </span>
            <div className="flex flex-col">
              {IS_NOT_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-4 border-t border-border-divider py-5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBEDEA] text-danger" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3">
                      <path d="M5 5l10 10M15 5L5 15" />
                    </svg>
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