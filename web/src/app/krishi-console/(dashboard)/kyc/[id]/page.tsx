import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedKycUrls } from "@/lib/admin/storage";
import { KycReviewActions } from "@/components/admin/KycReviewActions";
import { BackLink } from "@/components/ui/BackLink";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  pending: "Pending",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  requires_update: "Requires Update",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#FEF6E5] text-[#C48A2E]",
  under_review: "bg-[#FEF6E5] text-[#C48A2E]",
  verified: "bg-[#E8F0EA] text-green-deep",
  rejected: "bg-[#FAF0ED] text-danger",
  requires_update: "bg-[#FAF0ED] text-danger",
  not_started: "bg-stone text-ink-muted",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isImagePath(path: string | null): boolean {
  if (!path) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(path);
}

export default async function KycReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!kyc) notFound();

  const { data: user } = await db
    .from("users")
    .select("id, full_name, phone, email, role, status, created_at")
    .eq("id", kyc.user_id)
    .single();

  const urls = await getSignedKycUrls({
    nidFront: kyc.nid_front_path,
    nidBack: kyc.nid_back_path,
    profile: kyc.profile_photo_path,
  });

  const statusLabel = STATUS_LABEL[kyc.status] ?? kyc.status;
  const statusStyle = STATUS_STYLE[kyc.status] ?? STATUS_STYLE.not_started;

  const documents = [
    { key: "nid-front", label: "NID — Front Side", path: kyc.nid_front_path, url: urls.nidFront },
    { key: "nid-back", label: "NID — Back Side", path: kyc.nid_back_path, url: urls.nidBack },
    { key: "profile", label: "Profile Photo", path: kyc.profile_photo_path, url: urls.profile },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Back + header */}
      <div className="flex flex-col gap-3">
        <BackLink href="/krishi-console/kyc" localized={false}>Back to KYC Queue</BackLink>

        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            KYC Review
          </h1>
          <span
            className={`inline-flex items-center rounded-[4px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.02em] ${statusStyle}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Left: applicant + KYC data */}
        <div className="flex flex-col gap-6">
          {/* Applicant card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
              Applicant
            </h2>
            <div className="flex flex-col">
              <Row label="Full Name" value={user?.full_name ?? "—"} />
              <Row label="Phone" value={user?.phone ?? "—"} />
              <Row label="Email" value={user?.email ?? "—"} />
              <Row label="Role" value={user?.role ?? "—"} />
              <Row label="Account Created" value={formatDateTime(user?.created_at ?? null)} />
            </div>
          </div>

          {/* KYC details card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
              Submitted Details
            </h2>
            <div className="flex flex-col">
              <Row label="NID Number" value={kyc.nid_number ?? "—"} />
              <Row label="Present Address" value={kyc.present_address ?? "—"} />
              <Row label="Permanent Address" value={kyc.permanent_address ?? "—"} />
              <Row label="Submitted At" value={formatDateTime(kyc.submitted_at)} />
              {kyc.reviewed_at && (
                <Row label="Reviewed At" value={formatDateTime(kyc.reviewed_at)} />
              )}
              {kyc.rejection_reason && (
                <div className="mt-3 rounded-[6px] border border-[#F0C9C0] bg-[#FAF0ED] px-3 py-2.5 text-[12px] text-[#A13D2B]">
                  <span className="font-bold">Rejection reason: </span>
                  {kyc.rejection_reason}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: documents */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Uploaded Documents
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {documents.map((doc) => {
              if (!doc.path) {
                return (
                  <div key={doc.key} className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-ink-muted">
                      {doc.label}
                    </span>
                    <div className="flex h-[180px] items-center justify-center rounded-[8px] border border-dashed border-border-light bg-stone text-[12px] text-ink-muted">
                      Not provided
                    </div>
                  </div>
                );
              }

              const image = isImagePath(doc.path);

              return (
                <div key={doc.key} className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-ink-muted">
                    {doc.label}
                  </span>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block overflow-hidden rounded-[8px] border border-border-light bg-stone transition-colors hover:border-brand"
                    >
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={doc.url}
                          alt={doc.label}
                          className="h-[180px] w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-[180px] flex-col items-center justify-center gap-2 px-4 text-center">
                          <span className="text-[13px] font-semibold text-ink">
                            PDF Document
                          </span>
                          <span className="text-[11px] text-brand group-hover:underline">
                            Click to open →
                          </span>
                        </div>
                      )}
                    </a>
                  ) : (
                    <div className="flex h-[180px] items-center justify-center rounded-[8px] border border-dashed border-border-light bg-stone text-[12px] text-ink-muted">
                      Unable to load
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action bar */}
      {(kyc.status === "pending" || kyc.status === "under_review" || kyc.status === "requires_update") && (
        <KycReviewActions kycId={kyc.id} applicantName={user?.full_name ?? "Applicant"} />
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