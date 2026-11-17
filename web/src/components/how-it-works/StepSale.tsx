import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";

export function StepSale() {
  const t = useTranslations("howItWorks.stepSale");

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

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_500px] lg:items-center">
            {/* Table */}
            <div className="flex flex-col gap-6 rounded-xl border border-border-light bg-stone p-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-serif text-[22px] leading-tight text-ink">
                  {t("table.title")}
                </h3>
                <span className="text-[11px] italic text-ink-tertiary">
                  {t("table.asset")}
                </span>
              </div>

              <div className="h-px w-full bg-border-divider" />

              <div className="flex flex-col gap-4">
                <Row label={t("table.revenueLabel")} value={t("table.revenueValue")} />
                <Row label={t("table.purchaseLabel")} value={t("table.purchaseValue")} valueColor="text-brand" />
                <Row label={t("table.careLabel")} value={t("table.careValue")} valueColor="text-brand" />
                <div className="h-px w-full bg-border-divider" />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[16px] font-bold text-green-olive">
                    {t("table.profitLabel")}
                  </span>
                  <span className="text-[20px] font-bold text-green-olive">
                    {t("table.profitValue")}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="flex flex-col gap-6">
              <h3 className="font-serif text-[28px] leading-tight text-ink">
                {t("formula.title")}
              </h3>
              <p className="text-[15px] leading-[1.6] text-ink-secondary">
                {t("formula.description")}
              </p>
              <div className="w-fit rounded-[4px] bg-stone px-4 py-3">
                <span className="text-[12px] font-semibold text-ink-button">
                  {t("formula.equation")}
                </span>
              </div>
              <p className="text-[12px] italic text-ink-tertiary">
                {t("formula.footnote")}
              </p>
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