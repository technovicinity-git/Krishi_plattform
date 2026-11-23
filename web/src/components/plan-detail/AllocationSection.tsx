import { useTranslations } from "next-intl";

interface Props {
  animalAllocation: number;
  careAllocation: number;
  unitPrice: number;
}

export function AllocationSection({ animalAllocation, careAllocation, unitPrice }: Props) {
  const t = useTranslations("planDetail.allocation");
  const ta = useTranslations("app.planDetail");
  const fmt = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
  const pct = (n: number) => (unitPrice > 0 ? Math.round((n / unitPrice) * 100) : 0);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
      <h2 className="font-serif text-[24px] text-ink">{t("heading")}</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase text-ink-muted"><span className="h-2 w-2 rounded-full bg-green-olive" />{ta("animalAllocation")}</div>
          <div className="text-[22px] font-bold text-ink">{fmt(animalAllocation)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase text-ink-muted"><span className="h-2 w-2 rounded-full bg-camel" />{ta("careEmergency")}</div>
          <div className="text-[22px] font-bold text-ink">{fmt(careAllocation)}</div>
        </div>
      </div>
      {/* The unit split as one bar. */}
      <div className="k-grow-x flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-stone">
        <div className="bg-green-olive" style={{ width: `${pct(animalAllocation)}%` }} />
        <div className="bg-camel" style={{ width: `${pct(careAllocation)}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-muted">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-olive" />{pct(animalAllocation)}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-camel" />{pct(careAllocation)}%</span>
        </span>
        <span>{ta("totalPerUnit", { amount: fmt(unitPrice) })}</span>
      </div>
    </div>
  );
}