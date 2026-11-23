import { useTranslations } from "next-intl";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ROWS = [
  { key: "farmer", barColor: "bg-green-deep", width: "60%" },
  { key: "investor", barColor: "bg-brand", width: "30%" },
  { key: "platform", barColor: "bg-ink", width: "5%" },
  { key: "steward", barColor: "bg-green-olive", width: "5%" },
] as const;

export function ProfitSharingSection() {
  const t = useTranslations("planDetail.profitSharing");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h2" size="subsection" className="lg:text-[36px]">
          {t("heading")}
        </Heading>
        <p className="text-[15px] leading-[1.6] text-ink-secondary">
          {t("paragraph")}
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-xl border border-border-light bg-white p-8">
        {ROWS.map((row) => (
          <div key={row.key} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[14px] font-semibold text-ink">
                {t(`rows.${row.key}.label`)}
              </span>
              <span className="text-[14px] font-bold text-ink">
                {t(`rows.${row.key}.value`)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
              <div className={`k-grow-x h-full rounded-full ${row.barColor}`} style={{ width: row.width }} />
            </div>
          </div>
        ))}

        <p className="pt-2 text-[12px] italic leading-[1.5] text-ink-secondary">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}