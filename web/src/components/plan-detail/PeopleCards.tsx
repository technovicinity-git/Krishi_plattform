interface Props {
  stewardName: string;
  stewardId: string;
}

export function PeopleCards({ stewardName }: Props) {
  return (
    <div className="rounded-2xl border border-border-light bg-white p-8">
      <h2 className="font-serif text-[24px] text-ink">Managed by verified professionals</h2>
      <div className="mt-3 text-[14px] text-ink">
        <span className="text-[11px] uppercase text-ink-muted">Steward</span>
        <div className="font-semibold">{stewardName}</div>
      </div>
    </div>
  );
}