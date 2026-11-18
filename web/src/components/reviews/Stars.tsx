import { cn } from "@/lib/cn";

const STAR = "M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z";

/** Read-only star row; supports halves (e.g. 4.5). Server-safe. */
export function Stars({
  value,
  className,
  size = 16,
  label,
}: {
  value: number;
  className?: string;
  size?: number;
  /** Accessible text, e.g. "4.5 out of 5". */
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label ?? `${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
            <path d={STAR} fill="#E3DED4" />
            {fill > 0 && (
              <path
                d={STAR}
                fill="#D99A2B"
                style={fill < 1 ? { clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` } : undefined}
              />
            )}
          </svg>
        );
      })}
    </span>
  );
}
