import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/cn";

type StatusTone = "success" | "warning" | "info" | "error";

interface StatusRow {
  label: string;
  value: string;
  valueTone?: "default" | "terracotta" | "green" | "muted";
}

interface PrimaryAction {
  label: string;
  href: string;
  variant: "dark" | "terracotta";
}

interface SecondaryAction {
  label: string;
  href: string;
}

interface InterestStatusProps {
  icon: React.ReactNode;
  tone: StatusTone;
  heading: string;
  description: string;
  referenceLabel?: string;
  referenceValue?: string;
  badgeLabel?: string;
  badgeTone?: StatusTone;
  rows: StatusRow[];
  primaryAction: PrimaryAction;
  secondaryAction?: SecondaryAction;
  tertiaryNote?: string;
  /** Optional content rendered below the actions (e.g. lifecycle, next-steps list) */
  extras?: React.ReactNode;
}

const toneToBg: Record<StatusTone, string> = {
  success: "bg-[#E8F0EA]",
  warning: "bg-[#FEF6E5]",
  info: "bg-stone",
  error: "bg-[#FAF0ED]",
};

const toneToText: Record<StatusTone, string> = {
  success: "text-green-deep",
  warning: "text-[#C48A2E]",
  info: "text-ink-secondary",
  error: "text-terracotta",
};

const rowValueColor: Record<NonNullable<StatusRow["valueTone"]>, string> = {
  default: "text-ink",
  terracotta: "text-terracotta",
  green: "text-green-olive",
  muted: "text-ink-muted",
};

export function InterestStatus({
  icon,
  tone,
  heading,
  description,
  referenceLabel,
  referenceValue,
  badgeLabel,
  badgeTone = "success",
  rows,
  primaryAction,
  secondaryAction,
  tertiaryNote,
  extras,
}: InterestStatusProps) {
  return (
    <Container>
      <div className="mx-auto flex max-w-[720px] flex-col items-center gap-8 py-10 lg:py-16">
        {/* Icon */}
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            toneToBg[tone],
            toneToText[tone],
          )}
        >
          {icon}
        </div>

        {/* Heading block */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Heading as="h1" size="section" className="max-w-[560px]">
            {heading}
          </Heading>
          <p className="max-w-[600px] text-[15px] leading-[1.7] text-ink-secondary">
            {description}
          </p>
        </div>

        {/* Reference card */}
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-border-light bg-white p-6 lg:p-7">
          {(referenceLabel || badgeLabel) && (
            <div className="flex items-center justify-between gap-4 border-b border-border-light pb-4">
              {referenceLabel && (
                <span className="text-[13px] font-medium text-ink-secondary">
                  {referenceLabel}
                </span>
              )}
              {badgeLabel && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-[4px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.02em]",
                    toneToBg[badgeTone],
                    toneToText[badgeTone],
                  )}
                >
                  {badgeLabel}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {rows.map((row, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="text-[14px] text-ink-secondary">
                  {row.label}
                </span>
                <span
                  className={cn(
                    "text-right text-[15px] font-semibold",
                    rowValueColor[row.valueTone ?? "default"],
                  )}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Extras (lifecycle, next steps, etc.) */}
        {extras}

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <a
            href={primaryAction.href}
            className={cn(
              "inline-flex h-[52px] flex-1 items-center justify-center rounded-[8px] text-[15px] font-bold text-white transition-colors",
              primaryAction.variant === "dark" && "bg-ink hover:bg-[#2A2A2A]",
              primaryAction.variant === "terracotta" &&
                "bg-terracotta hover:bg-[#B3634A]",
            )}
          >
            {primaryAction.label}
          </a>
          {secondaryAction && (
            <a
              href={secondaryAction.href}
              className="inline-flex h-[52px] flex-1 items-center justify-center rounded-[8px] border border-border-light bg-white text-[15px] font-semibold text-ink-nav transition-colors hover:bg-stone"
            >
              {secondaryAction.label}
            </a>
          )}
        </div>

        {tertiaryNote && (
          <p className="text-center text-[13px] leading-tight text-ink-muted">
            {tertiaryNote}
          </p>
        )}
      </div>
    </Container>
  );
}