import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { NavIcon } from "@/components/dashboard/NavIcon";

const ROWS = ["one", "two", "five"] as const;

export function StepDeposit() {
  const t = useTranslations("howItWorks.stepDeposit");

  return (
    <Section size="xl" className="bg-stone">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_500px] lg:items-center lg:gap-20">
          <div className="flex flex-col gap-6">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>

            <div className="rounded-xl border border-border-light bg-white/60 p-5">
              <span className="text-[14px] font-semibold text-ink">
                {t("paymentNotice.title")}
              </span>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                  <NavIcon name="shield" className="h-[18px] w-[18px]" />
                </span>
                <p className="text-[13px] leading-[1.5] text-ink-secondary">
                  {t("paymentNotice.body")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 rounded-xl border border-border-light bg-white p-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
                {t("unitCard.label")}
              </span>
              <span className="font-serif text-[28px] leading-[1.35] text-ink">
                {t("unitCard.title")}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {ROWS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-[6px] border border-border-light bg-cream p-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-[18px] leading-[1.4] text-ink">
                      {t(`unitCard.rows.${key}.units`)}
                    </span>
                    <span className="text-[11px] leading-tight text-ink-muted">
                      {t(`unitCard.rows.${key}.description`)}
                    </span>
                  </div>
                  <span className="text-[18px] font-bold text-brand">
                    {t(`unitCard.rows.${key}.amount`)}
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