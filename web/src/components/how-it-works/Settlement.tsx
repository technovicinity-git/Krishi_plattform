import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";

export function Settlement() {
  const t = useTranslations("howItWorks.settlement");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="max-w-[640px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 rounded-xl bg-stone p-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:gap-16">
            <div className="flex flex-col gap-4">
              <h3 className="font-serif text-[32px] leading-[1.3] text-ink">
                {t("explanation.title")}
              </h3>
              <p className="text-[15px] leading-[1.65] text-ink-secondary">
                {t("explanation.paragraph")}
              </p>
              <p className="text-[11px] italic text-ink-tertiary">
                {t("explanation.footnote")}
              </p>
            </div>

            <div className="flex flex-col gap-5 rounded-[8px] border border-border-light bg-white p-8">
              <Row label={t("math.principalLabel")} value={t("math.principalValue")} />
              <Row label={t("math.shareLabel")} value={t("math.shareValue")} valueColor="text-green-olive" />
              <div className="h-px w-full bg-border-divider" />
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[16px] font-bold text-ink">
                  {t("math.totalLabel")}
                </span>
                <span className="text-[24px] font-extrabold text-terracotta">
                  {t("math.totalValue")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Row({
  label, value, valueColor = "text-ink",
}: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[14px] text-ink-secondary">{label}</span>
      <span className={`text-[16px] font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}