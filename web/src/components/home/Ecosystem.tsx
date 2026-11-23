import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const STEP_ORDER: { number: string; key: string; icon: NavIconName }[] = [
  { number: "01", key: "investor", icon: "user" },
  { number: "02", key: "platform", icon: "shield" },
  { number: "03", key: "steward", icon: "clipboard" },
  { number: "04", key: "farmer", icon: "leaf" },
  { number: "05", key: "distribution", icon: "coins" },
];

export function Ecosystem() {
  const t = useTranslations("home.ecosystem");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-10 lg:gap-14">
          <div className="flex flex-col gap-3.5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          {/* A chain of five: a vertical line on phones, a horizontal one on desktop. */}
          <ol className="relative grid grid-cols-1 gap-3 lg:grid-cols-5 lg:gap-4">
            <span aria-hidden className="absolute bottom-8 left-[35px] top-8 w-px bg-brand/25 lg:hidden" />
            <span aria-hidden className="absolute left-[10%] right-[10%] top-[52px] hidden h-px bg-brand/25 lg:block" />
            {STEP_ORDER.map((step) => (
              <li
                key={step.key}
                className="relative flex gap-4 rounded-xl border border-border-light bg-cream p-4 lg:flex-col lg:gap-5 lg:p-7"
              >
                <span className="relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-brand text-white ring-4 ring-cream lg:h-12 lg:w-12">
                  <NavIcon name={step.icon} className="h-[18px] w-[18px] lg:h-5 lg:w-5" />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase leading-none tracking-[0.04em] text-brand">
                    {step.number}
                  </span>
                  <h3 className="font-serif text-[18px] leading-[1.3] text-ink lg:text-[21px]">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="text-[13px] leading-[1.6] text-ink-secondary">
                    {t(`steps.${step.key}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
