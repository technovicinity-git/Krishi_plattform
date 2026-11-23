import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { delay } from "./motion";

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
          <div data-reveal className="flex flex-col gap-3.5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          {/* A chain of five: a vertical line on phones, a horizontal one on desktop. */}
          <ol data-reveal="none" className="relative grid grid-cols-1 gap-3 lg:grid-cols-5 lg:gap-4">
            <span aria-hidden className="k-grow-y absolute bottom-8 left-[35px] top-8 w-px bg-brand/25 lg:hidden" />
            <span aria-hidden className="k-grow-x absolute left-[10%] right-[10%] top-[52px] hidden h-px bg-brand/25 lg:block" />
            {STEP_ORDER.map((step, i) => (
              <li
                key={step.key}
                data-reveal
                style={delay(i * 110)}
                className="group relative flex gap-4 rounded-xl border border-border-light bg-cream p-4 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.18)] lg:flex-col lg:gap-5 lg:p-7"
              >
                <span className="relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-brand text-white ring-4 ring-cream transition-transform duration-300 group-hover:scale-110 lg:h-12 lg:w-12">
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
