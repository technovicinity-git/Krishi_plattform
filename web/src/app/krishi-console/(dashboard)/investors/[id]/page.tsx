import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedKycUrls } from "@/lib/admin/storage";
import { BackLink } from "@/components/ui/BackLink";

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

function mask(value: string | null): string {
  if (!value) return "—";
  return `•••• ${value.slice(-4)}`;
}

export default async function AdminInvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const { data: user } = await db
    .from("users")
    .select("id, role, full_name, phone, email, status, created_at")
    .eq("id", id)
    .eq("role", "investor")
    .maybeSingle();

  if (!user) notFound();

  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  const { data: withdrawal } = await db
    .from("withdrawal_preferences")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  const urls = kyc
    ? await getSignedKycUrls({
        nidFront: kyc.nid_front_path,
        nidBack: kyc.nid_back_path,
        profile: kyc.profile_photo_path,
      })
    : { nidFront: null, nidBack: null, profile: null };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink href="/krishi-console/investors" localized={false}>Back to Investors</BackLink>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            {user.full_name ?? "Investor"}
          </h1>
          <span className="text-[12px] text-ink-muted">
            Joined {formatDateTime(user.created_at)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-6">
          {/* Account */}
          <Card title="Account">
            <Row label="Phone" value={user.phone ?? "—"} />
            <Row label="Email" value={user.email ?? "—"} />
            <Row label="Role" value={user.role} />
            <Row label="Status" value={user.status} />
          </Card>

          {/* KYC summary */}
          <Card title="KYC">
            {kyc ? (
              <>
                <Row label="Status" value={kyc.status} />
                <Row label="NID Number" value={kyc.nid_number ?? "—"} />
                <Row label="Present Address" value={kyc.present_address ?? "—"} />
                <Row label="Permanent Address" value={kyc.permanent_address ?? "—"} />
                <Row label="Submitted" value={formatDateTime(kyc.submitted_at)} />
                <Row label="Reviewed" value={formatDateTime(kyc.reviewed_at)} />
                {kyc.rejection_reason && (
                  <div className="mt-2 rounded-[6px] border border-[#F0C9C0] bg-[#FAF0ED] px-3 py-2 text-[12px] text-[#A13D2B]">
                    <span className="font-bold">Rejection reason: </span>
                    {kyc.rejection_reason}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px] text-ink-muted">No KYC submission yet.</p>
            )}
          </Card>

          {/* Withdrawal preference */}
          <Card title="Withdrawal Preference">
            {withdrawal ? (
              <>
                <Row label="Method" value={withdrawal.method} />
                {withdrawal.method === "mobile" && (
                  <>
                    <Row label="Provider" value={withdrawal.mfs_provider ?? "—"} />
                    <Row label="Mobile" value={mask(withdrawal.mobile_number)} />
                  </>
                )}
                {withdrawal.method === "bank" && (
                  <>
                    <Row label="Bank" value={withdrawal.bank_name ?? "—"} />
                    <Row label="Account" value={mask(withdrawal.bank_account_number)} />
                    <Row label="Branch" value={withdrawal.bank_branch ?? "—"} />
                  </>
                )}
                <Row label="Holder" value={withdrawal.account_holder_name} />
              </>
            ) : (
              <p className="text-[13px] text-ink-muted">
                No withdrawal preference set.
              </p>
            )}
          </Card>
        </div>

        {/* KYC documents */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            KYC Documents
          </h2>
          {kyc ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DocPreview label="NID Front" url={urls.nidFront} isImage={/\.(jpe?g|png|webp)$/i.test(kyc.nid_front_path ?? "")} />
              <DocPreview label="NID Back" url={urls.nidBack} isImage={/\.(jpe?g|png|webp)$/i.test(kyc.nid_back_path ?? "")} />
            </div>
          ) : (
            <p className="text-[13px] text-ink-muted">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
        {title}
      </h2>
      <div className="flex flex-col">{children}</div>
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

function DocPreview({
  label,
  url,
  isImage,
}: {
  label: string;
  url: string | null;
  isImage: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-ink-muted">{label}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-[8px] border border-border-light bg-stone hover:border-brand"
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-[160px] w-full object-cover" />
          ) : (
            <div className="flex h-[160px] items-center justify-center text-[12px] font-semibold text-brand">
              Open PDF →
            </div>
          )}
        </a>
      ) : (
        <div className="flex h-[160px] items-center justify-center rounded-[8px] border border-dashed border-border-light bg-stone text-[12px] text-ink-muted">
          Not provided
        </div>
      )}
    </div>
  );
}