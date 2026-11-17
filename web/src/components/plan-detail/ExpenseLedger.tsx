import { useTranslations } from "next-intl";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ROWS = ["medicine", "feed"] as const;

export function ExpenseLedger() {
  const t = useTranslations("planDetail.expenses");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h2" size="subsection" className="lg:text-[36px]">
          {t("heading")}
        </Heading>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6">
        <div className="flex items-center justify-between gap-4 border-b border-border-light pb-3">
          <span className="text-[12px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("headers.category")}
          </span>
          <span className="text-[12px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("headers.amount")}
          </span>
        </div>

        {ROWS.map((key, i) => (
          <div key={key}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-ink">
                  {t(`rows.${key}.title`)}
                </span>
                <span className="text-[11px] text-ink-muted">
                  {t(`rows.${key}.note`)}
                </span>
              </div>
              <span className="text-[15px] font-bold text-ink">
                {t(`rows.${key}.amount`)}
              </span>
            </div>
            {i < ROWS.length - 1 && (
              <div className="mt-4 h-px w-full bg-border-light" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}