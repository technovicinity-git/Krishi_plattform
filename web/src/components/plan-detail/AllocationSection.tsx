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
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
      <h2 className="font-serif text-[24px] text-ink">{t("heading")}</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] uppercase text-ink-muted">{ta("animalAllocation")}</div>
          <div className="text-[22px] font-bold text-ink">{fmt(animalAllocation)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-ink-muted">{ta("careEmergency")}</div>
          <div className="text-[22px] font-bold text-ink">{fmt(careAllocation)}</div>
        </div>
      </div>
      <p className="text-[13px] text-ink-muted">{ta("totalPerUnit", { amount: fmt(unitPrice) })}</p>
    </div>
  );
}