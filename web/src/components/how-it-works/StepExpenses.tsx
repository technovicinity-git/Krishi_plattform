import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { Badge } from "@/components/ui/Badge";
import { ExternalLinkIcon } from "@/components/icons";

const PROCESS = ["request", "review", "payout", "recorded"] as const;

export function StepExpenses() {
  const t = useTranslations("howItWorks.stepExpenses");

  return (
    <Section size="xl" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section" className="max-w-[900px]">
              {t("heading")}
            </Heading>
            <p className="max-w-[640px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start">
            <div className="flex flex-col gap-6">
              {PROCESS.map((key, i) => (
                <div key={key} className="flex items-start gap-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-divider bg-white text-[13px] font-bold text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-serif text-[20px] leading-[1.4] text-ink">
                      {t(`process.${key}.title`)}
                    </h3>
                    <p className="text-[13px] leading-[1.5] text-ink-secondary">
                      {t(`process.${key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ledger card */}
            <div className="flex flex-col gap-6 rounded-xl border border-border-light bg-white p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-tertiary">
                  {t("ledger.voucher")}
                </span>
                <Badge variant="approved">{t("ledger.status")}</Badge>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-ink-tertiary">
                  {t("ledger.itemLabel")}
                </span>
                <span className="font-serif text-[24px] leading-tight text-ink">
                  {t("ledger.itemValue")}
                </span>
              </div>

              <div className="flex gap-8">
                <MetaCell label={t("ledger.amountLabel")} value={t("ledger.amountValue")} />
                <MetaCell label={t("ledger.dateLabel")} value={t("ledger.dateValue")} />
                <MetaCell label={t("ledger.verifiedLabel")} value={t("ledger.verifiedValue")} valueColor="text-green-olive" />
              </div>

              <div className="h-px w-full bg-border-divider" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] italic text-green-olive">
                  {t("ledger.invoiceNote")}
                </span>
                <button className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand">
                  {t("ledger.viewProof")}
                  <ExternalLinkIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function MetaCell({
  label, value, valueColor = "text-ink-button",
}: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-ink-tertiary">{label}</span>
      <span className={`text-[15px] font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}