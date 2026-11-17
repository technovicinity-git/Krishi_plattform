import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedKycUrls } from "@/lib/admin/storage";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  pending: "Under Review",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  requires_update: "Requires Update",
};

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-stone text-ink-muted",
  pending: "bg-[#FEF6E5] text-[#C48A2E]",
  under_review: "bg-[#FEF6E5] text-[#C48A2E]",
  verified: "bg-[#E8F0EA] text-green-deep",
  rejected: "bg-[#FAF0ED] text-terracotta",
  requires_update: "bg-[#FAF0ED] text-terracotta",
};

export default async function PortalKycPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = createAdminClient();
  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = kyc?.status ?? "not_started";
  const statusLabel = STATUS_LABEL[status] ?? status;
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.not_started;

  const urls = kyc
    ? await getSignedKycUrls({
        nidFront: kyc.nid_front_path,
        nidBack: kyc.nid_back_path,
        profile: kyc.profile_photo_path,
      })
    : { nidFront: null, nidBack: null, profile: null };

  const showResubmit = status === "rejected" || status === "requires_update";

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-[28px] leading-tight text-ink lg:text-[32px]">
          KYC Verification
        </h1>
        <span
          className={`inline-flex items-center rounded-[4px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.02em] ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      {status === "verified" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#A8CBB4] bg-[#E8F0EA] p-8">
          <h2 className="font-serif text-[24px] leading-tight text-green-deep">
            Your identity is verified.
          </h2>
          <p className="text-[14px] leading-[1.6] text-green-deep/90">
            You have full access to Krishi. Your documents were reviewed and
            approved.
          </p>
        </div>
      )}

      {(status === "pending" || status === "under_review") && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#F0D9A6] bg-[#FEF6E5] p-8">
          <h2 className="font-serif text-[24px] leading-tight text-[#7A5C1E]">
            Under review
          </h2>
          <p className="text-[14px] leading-[1.6] text-[#7A5C1E]/90">
            Your KYC submission is being reviewed by our team. You'll be able
            to access all features once your identity is verified.
          </p>
        </div>
      )}

      {status === "not_started" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
          <h2 className="font-serif text-[24px] leading-tight text-ink">
            Complete your identity verification.
          </h2>
          <p className="text-[14px] leading-[1.6] text-ink-secondary">
            Submit your National ID and address details to unlock investing,
            wallet, and reporting features.
          </p>
          <Link
            href="/onboarding/kyc"
            className="inline-flex h-[48px] w-fit items-center justify-center rounded-[8px] bg-terracotta px-6 text-[14px] font-bold text-white transition-colors hover:bg-[#B3634A]"
          >
            Start KYC
          </Link>
        </div>
      )}

      {showResubmit && (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#F0C9C0] bg-[#FAF0ED] p-8">
          <h2 className="font-serif text-[24px] leading-tight text-terracotta">
            KYC rejected — please resubmit
          </h2>
          {kyc?.rejection_reason && (
            <p className="text-[14px] leading-[1.6] text-ink-secondary">
              <strong>Reason:</strong> {kyc.rejection_reason}
            </p>
          )}
          <Link
            href="/onboarding/kyc"
            className="inline-flex h-[48px] w-fit items-center justify-center rounded-[8px] bg-terracotta px-6 text-[14px] font-bold text-white transition-colors hover:bg-[#B3634A]"
          >
            Resubmit KYC
          </Link>
        </div>
      )}

      {kyc && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Submitted Details
          </h2>
          <div className="flex flex-col">
            <Row label="NID Number" value={kyc.nid_number ?? "—"} />
            <Row label="Present Address" value={kyc.present_address ?? "—"} />
            <Row label="Permanent Address" value={kyc.permanent_address ?? "—"} />
            <Row label="Submitted" value={formatDateTime(kyc.submitted_at)} />
            <Row label="Last updated" value={formatDateTime(kyc.updated_at)} />
          </div>
        </div>
      )}

      {kyc && (urls.nidFront || urls.nidBack) && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Submitted Documents
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DocPreview label="NID Front" url={urls.nidFront} />
            <DocPreview label="NID Back" url={urls.nidBack} />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-light py-3 last:border-b-0">
      <span className="shrink-0 text-[12px] text-ink-muted">{label}</span>
      <span className="text-right text-[13px] font-medium text-ink">{value}</span>
    </div>
  );
}

function DocPreview({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-ink-muted">{label}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-[8px] border border-border-light bg-stone hover:border-terracotta"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="h-[180px] w-full object-cover" />
        </a>
      ) : (
        <div className="flex h-[180px] items-center justify-center rounded-[8px] border border-dashed border-border-light bg-stone text-[12px] text-ink-muted">
          Not provided
        </div>
      )}
    </div>
  );
}