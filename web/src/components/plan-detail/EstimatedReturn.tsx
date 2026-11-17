interface Props {
  roiMin: number;
  roiMax: number;
}

export function EstimatedReturn({ roiMin, roiMax }: Props) {
  return (
    <div className="rounded-2xl border border-border-light bg-white p-8">
      <h2 className="font-serif text-[24px] text-ink">Estimated Return</h2>
      <div className="mt-2 text-[40px] font-bold text-terracotta">
        {roiMin}–{roiMax}%
      </div>
      <p className="mt-2 text-[13px] text-ink-muted">
        Estimated ROI. Not a guaranteed return.
      </p>
    </div>
  );
}