import { useTranslations } from "next-intl";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { delay } from "@/components/home/motion";

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

const ICON: Record<(typeof STEPS)[number], NavIconName> = {
  investment: "briefcase",
  funds: "wallet",
  farmerAssigned: "user",
  purchased: "tag",
  growing: "leaf",
  saleTiming: "receipt",
  profitCalc: "chart",
  settlement: "coins",
};

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

      <div data-reveal="none" className="relative flex flex-col gap-3">
        {/* The line that joins the steps. */}
        <span aria-hidden className="k-grow-y absolute bottom-8 left-[39px] top-8 w-[2px] bg-gradient-to-b from-brand to-brand/15" />
        {STEPS.map((key, i) => (
          <div
            key={key}
            data-reveal
            style={delay(i * 80)}
            className="group relative flex items-center gap-5 rounded-xl border border-border-light bg-white p-5 transition-[translate,box-shadow,border-color] duration-300 hover:translate-x-1 hover:border-brand/30 hover:shadow-[0_10px_24px_-16px_rgba(0,0,0,0.25)]"
          >
            <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white ring-4 ring-white transition-transform duration-300 group-hover:scale-110">
              <NavIcon name={ICON[key]} className="h-[18px] w-[18px]" />
            </span>
            <span className="absolute right-5 top-4 text-[11px] font-bold text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
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