import { useTranslations } from "next-intl";

const STAGES = ["awaiting_farmer", "awaiting_purchase", "growing_care", "sale_pending", "settled"] as const;

const ORDER: Record<string, number> = {
  awaiting_farmer: 0,
  awaiting_purchase: 1,
  growing_care: 2,
  sale_pending: 3,
  sold: 3,
  settled: 4,
};

export function StageTimeline({ currentStage }: { currentStage: string }) {
  const t = useTranslations("app.stageTimeline");
  const current = ORDER[currentStage] ?? 0;
  return (
    <div className="rounded-xl border border-border-light bg-white p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
        {t("heading")}
      </h2>
      <div className="mt-4 flex items-center gap-1">
        {STAGES.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                    done
                      ? "bg-green-deep text-white"
                      : active
                        ? "bg-terracotta text-white"
                        : "bg-stone text-ink-muted"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-1.5 whitespace-nowrap text-[9px] font-semibold uppercase ${
                    active ? "text-terracotta" : "text-ink-muted"
                  }`}
                >
                  {t(s)}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    i < current ? "bg-green-deep" : "bg-stone"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}