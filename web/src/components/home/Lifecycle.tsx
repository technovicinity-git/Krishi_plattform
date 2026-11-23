import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { delay } from "./motion";

const STAGES: { key: string; icon: NavIconName }[] = [
  { key: "capital", icon: "wallet" },
  { key: "onboarded", icon: "tag" },
  { key: "updates", icon: "chart" },
  { key: "sale", icon: "receipt" },
  { key: "settlement", icon: "coins" },
];

export function Lifecycle() {
  const t = useTranslations("home.lifecycle");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-10 lg:gap-[72px]">
          <div data-reveal className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" className="max-w-[836px]">
              {t("heading")}
            </Heading>
          </div>

          {/* Timeline: vertical on phones, horizontal on desktop. */}
          <ol data-reveal="none" className="relative grid grid-cols-1 gap-7 lg:grid-cols-5 lg:gap-8">
            <span aria-hidden style={delay(150)} className="k-grow-y absolute bottom-6 left-[19px] top-6 w-[2px] bg-gradient-to-b from-brand to-brand/15 lg:hidden" />
            <span aria-hidden style={delay(150)} className="k-grow-x absolute left-5 right-[19%] top-[19px] hidden h-[2px] bg-gradient-to-r from-brand to-brand/15 lg:block" />
            {STAGES.map((stage, i) => (
              <li key={stage.key} data-reveal style={delay(200 + i * 160)} className="group relative flex gap-4 lg:flex-col lg:gap-6">
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-cream text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                  <NavIcon name={stage.icon} className="h-[18px] w-[18px]" />
                </span>
                <div className="flex flex-col gap-1.5 pt-0.5 lg:pt-0">
                  <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-serif text-[19px] leading-[1.3] text-ink lg:text-[21px]">
                    {t(`stages.${stage.key}.title`)}
                  </h3>
                  <p className="text-[13px] leading-[1.65] text-ink-secondary">
                    {t(`stages.${stage.key}.description`)}
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
