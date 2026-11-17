import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { ArrowDownIcon } from "@/components/icons";

const STAGES = ["investor", "krishi", "steward", "farmer", "livestock"] as const;

export function ConnectedJourney() {
  const t = useTranslations("aboutPage.connected");

  return (
    <Section size="lg" className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_760px] lg:items-center lg:gap-20">
          {/* Left heading */}
          <div className="flex flex-col gap-2">
            <Heading as="h2" size="section">
              {t("headingLine1")}
              <br />
              {t("headingLine2")}
              <br />
              {t("headingLine3")}
            </Heading>
          </div>

          {/* Right chain */}
          <div className="flex flex-col items-center gap-2">
            {STAGES.map((key, i) => {
              const isLast = i === STAGES.length - 1;
              const isHighlighted = key === "krishi";
              return (
                <div key={key} className="flex w-full flex-col items-center gap-2">
                  <div
                    className={`flex w-full flex-row items-center gap-6 rounded-[8px] border px-6 py-5 ${
                      isHighlighted
                        ? "border-terracotta bg-cream"
                        : "border-border-light bg-white"
                    }`}
                  >
                    <span
                      className={`w-[130px] shrink-0 font-serif text-[22px] leading-tight ${
                        isHighlighted ? "text-terracotta" : "text-ink"
                      }`}
                    >
                      {t(`stages.${key}.title`)}
                    </span>
                    <span className="text-[14px] leading-[1.65] text-ink-secondary">
                      {t(`stages.${key}.description`)}
                    </span>
                  </div>
                  {!isLast && (
                    <span className="text-terracotta" aria-hidden="true">
                      <ArrowDownIcon />
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