import { formatBDT } from "@/lib/utils";

interface StatsGridProps {
  items: Array<{ label: string; value: string; accent?: boolean }>;
}

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border-light bg-white p-4"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
            {item.label}
          </div>
          <div
            className={`mt-1 text-[18px] font-bold ${
              item.accent ? "text-brand" : "text-ink"
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export { formatBDT };