import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { CheckCircle } from "@/components/icons";

const STEPS = ["phone", "kyc", "withdrawal", "deposit"] as const;
const CHECK_KEYS = ["name", "phone", "email", "nid", "address", "photo"] as const;

export function StepOnboarding() {
  const t = useTranslations("howItWorks.stepOnboarding");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_500px]">
            <div className="flex flex-col gap-4">
              {STEPS.map((key, i) => (
                <div
                  key={key}
                  className="flex items-center gap-5 rounded-[8px] border border-border-light bg-cream p-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone text-[14px] font-bold text-terracotta">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-serif text-[18px] leading-[1.4] text-ink">
                      {t(`items.${key}.title`)}
                    </h3>
                    <p className="text-[13px] leading-tight text-ink-secondary">
                      {t(`items.${key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-6 rounded-xl bg-stone p-10">
              <h3 className="font-serif text-[22px] leading-[1.35] text-ink">
                {t("infoCard.title")}
              </h3>
              <p className="text-[14px] leading-[1.5] text-ink-secondary">
                {t("infoCard.paragraph")}
              </p>
              <ul className="flex flex-col gap-3">
                {CHECK_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-3">
                    <CheckCircle />
                    <span className="text-[14px] text-ink">
                      {t(`infoCard.items.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}