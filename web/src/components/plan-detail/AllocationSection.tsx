interface Props {
  animalAllocation: number;
  careAllocation: number;
  unitPrice: number;
}

export function AllocationSection({ animalAllocation, careAllocation, unitPrice }: Props) {
  const fmt = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
      <h2 className="font-serif text-[24px] text-ink">Where your investment goes</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] uppercase text-ink-muted">Animal Allocation</div>
          <div className="text-[22px] font-bold text-ink">{fmt(animalAllocation)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-ink-muted">Care &amp; Emergency</div>
          <div className="text-[22px] font-bold text-ink">{fmt(careAllocation)}</div>
        </div>
      </div>
      <p className="text-[13px] text-ink-muted">Total per unit: {fmt(unitPrice)}</p>
    </div>
  );
}