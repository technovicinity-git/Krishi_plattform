import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const STAGES = ["investor", "krishi", "steward", "farmer", "livestock"] as const;

const ICON: Record<(typeof STAGES)[number], NavIconName> = {
  investor: "user",
  krishi: "shield",
  steward: "clipboard",
  farmer: "users",
  livestock: "leaf",
};

const CARD_HOVER =
  "transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_12px_28px_-16px_rgba(0,0,0,0.2)]";

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
          <ol className="relative flex flex-col gap-3">
            {/* The line that joins the chain. */}
            <span aria-hidden className="k-grow-y absolute bottom-8 left-[43px] top-8 w-[2px] bg-gradient-to-b from-brand to-brand/15" />
            {STAGES.map((key) => {
              const isHighlighted = key === "krishi";
              return (
                <li
                  key={key}
                  className={`group relative flex w-full flex-col gap-3 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:gap-6 ${CARD_HOVER} ${
                    isHighlighted ? "border-brand bg-brand-tint" : "border-border-light bg-white"
                  }`}
                >
                  <span className="flex items-center gap-4 sm:w-[190px] sm:shrink-0">
                    <span
                      className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4 transition-transform duration-300 group-hover:scale-110 ${
                        isHighlighted ? "bg-brand text-white ring-brand-tint" : "bg-brand-tint text-brand ring-white"
                      }`}
                    >
                      <NavIcon name={ICON[key]} className="h-5 w-5" />
                    </span>
                    <span className={`font-serif text-[21px] leading-tight ${isHighlighted ? "text-brand" : "text-ink"}`}>
                      {t(`stages.${key}.title`)}
                    </span>
                  </span>
                  <span className="pl-[60px] text-[14px] leading-[1.6] text-ink-secondary sm:pl-0">
                    {t(`stages.${key}.description`)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </Section>
  );
}