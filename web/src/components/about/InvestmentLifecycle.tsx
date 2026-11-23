import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const STAGES = ["investment", "deposited", "assigned", "purchased", "growing", "updates", "sale", "settlement"] as const;

const ICON: Record<(typeof STAGES)[number], NavIconName> = {
  investment: "briefcase",
  deposited: "wallet",
  assigned: "user",
  purchased: "tag",
  growing: "leaf",
  updates: "chart",
  sale: "receipt",
  settlement: "coins",
};

export function InvestmentLifecycle() {
  const t = useTranslations("aboutPage.lifecycle");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" className="max-w-[900px]">
              {t("heading")}
            </Heading>
          </div>

          <ol className="relative grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-8">
            {/* Progress line behind the icons (wide screens). */}
            <span aria-hidden className="k-grow-x absolute left-[22px] right-[8%] top-[21px] hidden h-[2px] bg-gradient-to-r from-brand to-brand/15 lg:block" />
            {STAGES.map((key, i) => (
              <li key={key} className="group relative flex flex-col gap-3">
                <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand bg-cream text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                  <NavIcon name={ICON[key]} className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-bold text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-[18px] leading-[1.3] text-ink lg:text-[20px]">
                  {t(`stages.${key}`)}
                </span>
              </li>
            ))}
          </ol>

          <p className="max-w-[760px] text-[15px] leading-[1.65] text-ink-secondary">
            {t("paragraph")}
          </p>
        </div>
      </Container>
    </Section>
  );
}