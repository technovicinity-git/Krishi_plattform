import Link from "next/link";

interface Props {
  interest: any;
}

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  not_approved: "Not Approved",
  onboarding: "Onboarding",
  converted: "Converted",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-[#E8F0EA] text-green-deep",
  not_approved: "bg-[#F5EBE6] text-terracotta",
  onboarding: "bg-[#FEF6E5] text-[#C48A2E]",
  converted: "bg-[#E8F0EA] text-green-deep",
  expired: "bg-stone text-ink-muted",
  cancelled: "bg-stone text-ink-muted",
};

export function InterestHistoryCard({ interest }: Props) {
  const investorName =
    interest.investor?.full_name || interest.guest_name || "Guest";
  const investorPhone =
    interest.investor?.phone || interest.guest_phone || "—";
  const planName =
    interest.offering?.investment_plans?.name_en ?? "Unknown plan";
  const statusStyle =
    STATUS_STYLE[interest.status] ?? "bg-stone text-ink-muted";
  const statusLabel = STATUS_LABEL[interest.status] ?? interest.status;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {interest.reference}
          </span>
          <h3 className="mt-1 font-serif text-[20px] text-ink">{planName}</h3>
        </div>
        <span
          className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-border-light py-3 text-[13px]">
        <div>
          <span className="text-ink-muted">Investor</span>
          <div className="font-semibold text-ink">{investorName}</div>
          <div className="text-[11px] text-ink-secondary">{investorPhone}</div>
        </div>
        <div>
          <span className="text-ink-muted">Requested Units</span>
          <div className="font-bold text-ink">
            {interest.requested_units} Units
          </div>
        </div>
      </div>

      {interest.rejection_reason && interest.status === "not_approved" && (
        <p className="text-[12px] text-[#A13D2B]">
          <strong>Reason:</strong> {interest.rejection_reason}
        </p>
      )}

      <Link
        href={`/interest/${interest.reference}`}
        className="inline-flex h-[40px] items-center justify-center rounded-[4px] border border-border-light text-[12px] font-semibold text-ink-nav hover:bg-stone"
      >
        View status page →
      </Link>
    </div>
  );
}