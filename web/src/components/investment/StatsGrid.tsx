import { formatBDT } from "@/lib/utils";
import { cn } from "@/lib/cn";

interface StatsGridProps {
  items: Array<{ label: string; value: string; accent?: boolean }>;
}

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-2xl border bg-white px-5 py-4",
            item.accent ? "border-brand/40 bg-brand-tint/50" : "border-border-light",
          )}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
            {item.label}
          </div>
          <div
            className={cn(
              "mt-1.5 text-[20px] font-bold leading-tight",
              item.accent ? "text-green-deep" : "text-ink",
            )}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export { formatBDT };
