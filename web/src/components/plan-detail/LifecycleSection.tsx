import { useTranslations } from "next-intl";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const STEPS = [
  "investment",
  "funds",
  "farmerAssigned",
  "purchased",
  "growing",
  "saleTiming",
  "profitCalc",
  "settlement",
] as const;

export function LifecycleSection() {
  const t = useTranslations("planDetail.lifecycle");

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h2" size="subsection" className="lg:text-[36px]">
          {t("heading")}
        </Heading>
      </div>

      <div className="flex flex-col gap-4">
        {STEPS.map((key, i) => (
          <div
            key={key}
            className="flex items-center gap-5 rounded-[8px] border border-border-light bg-white p-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-[14px] font-bold text-terracotta">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <h3 className="text-[16px] font-bold leading-tight text-ink">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-[13px] leading-tight text-ink-secondary">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}