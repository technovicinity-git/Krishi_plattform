import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

const STAGES = ["awaiting_farmer", "awaiting_purchase", "growing_care", "sale_pending", "settled"] as const;

const ORDER: Record<string, number> = {
  awaiting_farmer: 0,
  awaiting_purchase: 1,
  growing_care: 2,
  sale_pending: 3,
  // Sale confirmed: the sale step is done and settlement is in progress.
  sold: 4,
  // Settled is the end of the journey, so every step shows as done.
  settled: 5,
};

export function StageTimeline({ currentStage }: { currentStage: string }) {
  const t = useTranslations("app.stageTimeline");
  const current = ORDER[currentStage] ?? 0;
  return (
    <section className="rounded-2xl border border-border-light bg-white px-6 py-5">
      <h2 className="text-[15px] font-semibold text-ink">{t("heading")}</h2>
      <ol className="mt-5 grid grid-cols-5">
        {STAGES.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s} className="relative flex flex-col items-center gap-2 text-center">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-[15px] right-1/2 h-[3px] w-full -translate-y-1/2",
                    i <= current ? "bg-brand" : "bg-stone",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full text-[12px] font-bold",
                  done && "bg-brand text-white",
                  active && "bg-white text-brand ring-[3px] ring-brand",
                  !done && !active && "bg-stone text-ink-muted",
                )}
              >
                {done ? (
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true">
                    <path d="M2 6l3 3 5-6" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "px-1 text-[10.5px] font-semibold leading-tight sm:text-[11.5px]",
                  active ? "text-green-deep" : done ? "text-ink-secondary" : "text-ink-muted",
                )}
              >
                {t(s)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
