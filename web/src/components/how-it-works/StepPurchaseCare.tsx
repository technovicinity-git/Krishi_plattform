import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";

export function StepPurchaseCare() {
  const t = useTranslations("howItWorks.stepPurchaseCare");

  return (
    <Section size="xl" className="bg-stone">
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

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Animal Allocation */}
            <article className="flex flex-col gap-8 rounded-xl border border-border-divider bg-white p-10">
              <div className="flex flex-col gap-2">
                <h3 className="font-serif text-[28px] leading-tight text-ink">
                  {t("animalCard.title")}
                </h3>
                <p className="text-[14px] leading-tight text-ink-secondary">
                  {t("animalCard.description")}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <Row label={t("animalCard.plannedLabel")} value={t("animalCard.plannedValue")} />
                <Row label={t("animalCard.actualLabel")} value={t("animalCard.actualValue")} valueColor="text-green-olive" labelColor="text-green-olive" />
                <div className="h-px w-full bg-border-divider" />
                <Row label={t("animalCard.remainingLabel")} value={t("animalCard.remainingValue")} valueColor="text-terracotta" labelColor="text-terracotta" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone">
                  <div className="h-full bg-green-olive" style={{ width: "97%" }} />
                  <div className="h-full bg-terracotta" style={{ width: "3%" }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
                  <span>{t("animalCard.barPrimaryLabel")}</span>
                  <span>{t("animalCard.barSecondaryLabel")}</span>
                </div>
              </div>
            </article>

            {/* Care Allocation */}
            <article className="flex flex-col gap-8 rounded-xl border border-border-divider bg-white p-10">
              <div className="flex flex-col gap-2">
                <h3 className="font-serif text-[28px] leading-tight text-ink">
                  {t("careCard.title")}
                </h3>
                <p className="text-[14px] leading-tight text-ink-secondary">
                  {t("careCard.description")}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <Row label={t("careCard.poolLabel")} value={t("careCard.poolValue")} />
                <Row label={t("careCard.usedLabel")} value={t("careCard.usedValue")} valueColor="text-terracotta" labelColor="text-terracotta" />
                <div className="h-px w-full bg-border-divider" />
                <Row label={t("careCard.remainingLabel")} value={t("careCard.remainingValue")} valueColor="text-green-olive" labelColor="text-green-olive" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone">
                  <div className="h-full bg-terracotta" style={{ width: "13%" }} />
                  <div className="h-full bg-green-olive" style={{ width: "87%" }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
                  <span>{t("careCard.barPrimaryLabel")}</span>
                  <span>{t("careCard.barSecondaryLabel")}</span>
                </div>
              </div>
            </article>
          </div>

          {/* Notice */}
          <div className="rounded-[4px] border-l-4 border-terracotta bg-cream p-6">
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-bold text-terracotta">
                {t("notice.title")}
              </span>
              <p className="text-[13px] leading-[1.5] text-ink-secondary">
                {t("notice.body")}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Row({
  label, value, labelColor = "text-ink-tertiary", valueColor = "text-ink",
}: { label: string; value: string; labelColor?: string; valueColor?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`text-[14px] ${labelColor}`}>{label}</span>
      <span className={`text-[18px] font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}