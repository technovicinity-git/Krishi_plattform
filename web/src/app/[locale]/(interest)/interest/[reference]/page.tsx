import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getInterestByReference } from "@/lib/public/interests";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InterestStatusPage({
  params,
}: {
  params: Promise<{ locale: string; reference: string }>;
}) {
  const { locale, reference } = await params;
  const interest = await getInterestByReference(reference);
  if (!interest) notFound();

  const planName = locale === "bn" ? interest.planNameBn : interest.planNameEn;
  const totalIntended = interest.unitPrice * interest.requestedUnits;
  const status = interest.status;

  const isPending = status === "submitted" || status === "under_review";
  const isApproved = status === "approved" || status === "onboarding";
  const isRejected = status === "not_approved";

  return (
    <div className="mx-auto max-w-[720px] px-6 py-16">
      {/* Header icon + title */}
      <div className="flex flex-col items-center text-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            isRejected
              ? "bg-[#F5EBE6] text-terracotta"
              : "bg-[#EEF5EB] text-green-deep"
          }`}
        >
          {isRejected ? <WarnIcon /> : <CheckIcon />}
        </div>
        <h1 className="mt-6 font-serif text-[32px] leading-[1.15] text-ink md:text-[40px]">
          {isPending && "Interest received"}
          {isApproved && "Your interest has been approved"}
          {isRejected && "Interest not approved at this time"}
        </h1>
        <p className="mt-3 max-w-[600px] text-[14px] leading-[1.65] text-ink-secondary">
          {isPending &&
            `Thank you for your interest in the ${planName}. Our team will review your request and notify you when there is an update.`}
          {isApproved &&
            "Your request has been approved. Continue to investment onboarding to complete the required setup and deposit."}
          {isRejected &&
            `After reviewing your interest in the ${planName}, we are unable to proceed with this request at this time.`}
        </p>
      </div>

      {/* Reference box */}
      <div className="mt-10 rounded-xl border border-border-light bg-white p-6">
        <div className="flex items-center justify-between gap-4 border-b border-border-light pb-4">
          <span className="text-[12px] text-ink-muted">Reference</span>
          <span
            className={`inline-flex rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${
              isRejected
                ? "bg-stone text-ink-muted"
                : isApproved
                  ? "bg-[#E8F0EA] text-green-deep"
                  : "bg-[#FEF6E5] text-[#C48A2E]"
            }`}
          >
            {status === "submitted" || status === "under_review"
              ? "Under Review"
              : status === "approved" || status === "onboarding"
                ? "Approved"
                : status === "not_approved"
                  ? "Not Approved"
                  : status}
          </span>
        </div>
        <Row label="Reference ID" value={interest.reference} bold />
        <Row label="Plan" value={planName} />
        <Row
          label="Intended Units"
          value={`${interest.requestedUnits} ${
            interest.requestedUnits === 1 ? "Unit" : "Units"
          }`}
        />
        <Row label="Intended Investment" value={formatBDT(totalIntended)} accent />
        {interest.rejectionReason && isRejected && (
          <div className="mt-4 rounded-[6px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[12px] text-[#A13D2B]">
            <strong>Reason:</strong> {interest.rejectionReason}
          </div>
        )}
      </div>

      {/* Next steps */}
      {isPending && (
        <div className="mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Next Steps
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Step n="01" title="Interest Submitted" body="Done" active />
            <Step n="02" title="Review & Approval" body="Pending" />
            <Step n="03" title="Onboarding" body="Upcoming" />
          </div>
        </div>
      )}

    {isApproved && (
        <div className="mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Investment Onboarding Pipeline
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Step n="1" title="Account / KYC" body="Required" />
            <Step n="2" title="Withdrawal Setup" body="Required" />
            <Step n="3" title="Deposit" body="Required" />
            <Step n="4" title="Activation" body="After Payment" />
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="mt-10 flex flex-col gap-3">
        {isApproved && (
          <Link
            href={`/onboarding/${interest.reference}`}
            className="inline-flex h-[52px] items-center justify-center rounded-[4px] bg-terracotta text-[14px] font-bold text-white hover:bg-[#B85A3F]"
            >
            Continue Investment Onboarding →
            </Link>
        )}
        {isRejected && (
          <Link
            href="/plans"
            className="inline-flex h-[52px] items-center justify-center rounded-[4px] bg-terracotta text-[14px] font-bold text-white hover:bg-[#B85A3F]"
          >
            Explore Other Plans
          </Link>
        )}
        <Link
          href="/plans"
          className="inline-flex h-[48px] items-center justify-center rounded-[4px] border border-border-light bg-white text-[13px] font-semibold text-ink-nav hover:bg-stone"
        >
          Return to Investment Plans
        </Link>
      </div>

      <p className="mt-6 text-center text-[11px] text-ink-muted">
        {isPending &&
          "Submitting interest does not guarantee approval or final unit allocation."}
        {isApproved &&
          "Approved interest is not an active investment. Activation follows successful deposit and payment confirmation."}
        {isRejected && "Contact support if you have questions about your request."}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-light py-3 last:border-b-0">
      <span className="text-[12px] text-ink-muted">{label}</span>
      <span
        className={`text-[13px] ${
          bold
            ? "font-mono font-semibold text-ink"
            : accent
              ? "font-bold text-terracotta"
              : "font-medium text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  active,
}: {
  n: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[8px] border p-4 ${
        active
          ? "border-terracotta bg-[#FAF0ED]"
          : "border-border-light bg-white"
      }`}
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-[0.02em] ${
          active ? "text-terracotta" : "text-ink-muted"
        }`}
      >
        Step {n}
      </div>
      <div className="mt-1 text-[13px] font-semibold text-ink">{title}</div>
      <div className="mt-0.5 text-[11px] text-ink-muted">{body}</div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12.5l4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l9 16H3l9-16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}