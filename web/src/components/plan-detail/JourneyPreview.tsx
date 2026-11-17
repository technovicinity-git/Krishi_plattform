import { useTranslations } from "next-intl";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const EVENTS = ["purchased", "health", "feeding", "progress"] as const;

export function JourneyPreview() {
  const t = useTranslations("planDetail.journey");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h2" size="subsection" className="lg:text-[36px]">
          {t("heading")}
        </Heading>
      </div>

      <div className="flex flex-col gap-5">
        {EVENTS.map((key) => (
          <div
            key={key}
            className="flex items-start gap-5 rounded-[8px] border border-border-light bg-white p-5"
          >
            <span className="w-[70px] shrink-0 text-[14px] font-bold text-brand">
              {t(`events.${key}.date`)}
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <h3 className="text-[15px] font-bold leading-tight text-ink">
                {t(`events.${key}.title`)}
              </h3>
              <p className="text-[13px] leading-tight text-ink-secondary">
                {t(`events.${key}.description`)}
              </p>
              <span className="text-[11px] text-ink-muted">
                {t(`events.${key}.loggedBy`)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}