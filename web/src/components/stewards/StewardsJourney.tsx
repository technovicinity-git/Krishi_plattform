import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { ChevronRightIcon } from "@/components/icons";

const CHAIN = ["investor", "krishi", "steward", "farmer", "livestock"] as const;

export function StewardsJourney() {
  const t = useTranslations("stewardsPage.journey");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:gap-24">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="max-w-[700px] text-[16px] leading-[1.65] text-ink-secondary">
              {t("paragraph")}
            </p>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand transition-colors hover:text-brand-hover"
            >
              {t("link")}
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Right — chain */}
          <div className="flex flex-col items-center gap-2.5">
            {CHAIN.map((key, i) => {
              const isSteward = key === "steward";
              const isLast = i === CHAIN.length - 1;
              return (
                <div key={key} className="flex w-full flex-col items-center gap-2.5">
                  <div
                    className={`flex w-full items-center justify-center rounded-[8px] border px-4 py-4 text-center ${
                      isSteward
                        ? "border-brand bg-cream"
                        : "border-border-light bg-white"
                    }`}
                  >
                    <span
                      className={`font-serif text-[22px] leading-tight ${
                        isSteward ? "text-brand" : "text-ink"
                      }`}
                    >
                      {t(`chain.${key}`)}
                    </span>
                  </div>
                  {!isLast && (
                    <span className="text-[20px] leading-none text-brand" aria-hidden="true">
                      ↓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}