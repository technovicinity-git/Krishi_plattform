"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export type OnboardingStepStatus = "done" | "active" | "upcoming";

interface OnboardingProgressProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { num: 1 as const, key: "phone" as const },
  { num: 2 as const, key: "kyc" as const },
  { num: 3 as const, key: "withdrawal" as const },
  { num: 4 as const, key: "deposit" as const },
];

function getStatus(stepNum: number, current: number): OnboardingStepStatus {
  if (stepNum < current) return "done";
  if (stepNum === current) return "active";
  return "upcoming";
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const t = useTranslations("onboarding.progress");

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
        {t("label")}
      </span>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(({ num, key }) => {
          const status = getStatus(num, currentStep);
          return (
            <div
              key={num}
              className={cn(
                "flex min-w-[110px] flex-1 flex-col gap-1 rounded-[8px] border px-3 py-3",
                status === "active" && "border-brand bg-brand-tint",
                status === "done" && "border-[#A8CBB4] bg-[#E8F0EA]",
                status === "upcoming" && "border-border-light bg-white",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.02em]",
                  status === "active" && "text-brand",
                  status === "done" && "text-green-deep",
                  status === "upcoming" && "text-ink-muted",
                )}
              >
                {t("step")} {String(num).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "text-[13px] font-semibold leading-tight",
                  status === "upcoming" ? "text-ink-secondary" : "text-ink",
                )}
              >
                {t(`items.${key}`)}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-tight",
                  status === "active" && "font-semibold text-brand",
                  status === "done" && "text-green-deep",
                  status === "upcoming" && "text-ink-muted",
                )}
              >
                {t(`status.${status}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}