import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CheckBullet } from "@/components/icons";

export function Transparency() {
  const t = useTranslations("home.transparency");

  const checklist = ["item1", "item2", "item3"] as const;

  // Allocation bars — 50 / 40 / 10
  const rows = [
    {
      key: "animal" as const,
      barColor: "bg-green-olive",
      amountColor: "text-green-olive",
      width: "50%",
    },
    {
      key: "care" as const,
      barColor: "bg-camel",
      amountColor: "text-camel",
      width: "40%",
    },
    {
      key: "reserve" as const,
      barColor: "bg-terracotta",
      amountColor: "text-terracotta",
      width: "10%",
    },
  ];

  return (
    <Section size="xl" className="bg-stone">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:gap-24">
          {/* Left */}
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <Heading as="h2" size="section">
                {t("heading")}
              </Heading>
            </div>

            <p className="text-[15px] leading-[1.75] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>

            <ul className="flex flex-col gap-5">
              {checklist.map((key) => (
                <li key={key} className="flex items-start gap-3.5">
                  <CheckBullet />
                  <span className="pt-[1px] text-[14px] leading-[1.5] text-ink-button">
                    {t(`checklist.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — allocation card */}
          <div className="flex flex-col gap-8 rounded-[8px] border border-border-light bg-white p-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
                {t("breakdown.label")}
              </span>
              <span className="font-serif text-[26px] leading-[1.35] text-ink">
                {t("breakdown.total")}
              </span>
            </div>

            <div className="flex flex-col gap-6">
              {rows.map((row, index) => (
                <div key={row.key} className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[14px] font-semibold text-ink-button">
                      {t(`breakdown.rows.${row.key}.title`)}
                    </span>
                    <span className={`text-[16px] font-bold ${row.amountColor}`}>
                      {t(`breakdown.rows.${row.key}.amount`)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone">
                    <div
                      className={`h-full rounded-full ${row.barColor}`}
                      style={{ width: row.width }}
                    />
                  </div>

                  <span className="text-[11px] leading-tight text-ink-tertiary">
                    {t(`breakdown.rows.${row.key}.note`)}
                  </span>

                  {index < rows.length - 1 && (
                    <div className="h-px w-full bg-stone" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}