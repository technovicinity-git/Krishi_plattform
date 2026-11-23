import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { CheckCircle } from "@/components/icons";

const INFO_KEYS = ["farmer", "investor", "platform", "steward"] as const;
const CHART = [
  { key: "farmer", value: "60%", color: "bg-green-olive", text: "text-green-olive", width: "60%" },
  { key: "investor", value: "30%", color: "bg-brand", text: "text-brand", width: "30%" },
  { key: "platform", value: "5%", color: "bg-ink", text: "text-ink", width: "5%" },
  { key: "steward", value: "5%", color: "bg-ink-tertiary", text: "text-ink-tertiary", width: "5%" },
] as const;

export function ProfitSharing() {
  const t = useTranslations("howItWorks.profitSharing");

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

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_500px] lg:items-center">
            <div className="flex flex-col gap-6">
              <h3 className="font-serif text-[28px] leading-tight text-ink">
                {t("info.title")}
              </h3>
              <p className="text-[15px] leading-[1.6] text-ink-secondary">
                {t("info.description")}
              </p>
              <ul className="flex flex-col gap-3">
                {INFO_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-3">
                    <CheckCircle />
                    <span className="text-[14px] text-ink-button">
                      {t(`info.items.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[12px] italic text-brand">
                {t("info.footnote")}
              </p>
            </div>

            {/* Chart card */}
            <div className="flex flex-col gap-8 rounded-xl border border-border-light bg-white p-10">
              <h3 className="font-serif text-[22px] leading-tight text-ink">
                {t("chart.title")}
              </h3>
              <div className="flex flex-col gap-5">
                {CHART.map((row) => (
                  <div key={row.key} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[13px] font-semibold text-ink-button">
                        {t(`chart.rows.${row.key}.label`)}
                      </span>
                      <span className={`text-[14px] font-bold ${row.text}`}>
                        {t(`chart.rows.${row.key}.value`)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone">
                      <div className={`k-grow-x h-full rounded-full ${row.color}`} style={{ width: row.width }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] leading-tight text-ink-tertiary">
                {t("chart.disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}