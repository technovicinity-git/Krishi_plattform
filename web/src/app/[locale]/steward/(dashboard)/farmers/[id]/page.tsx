import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { FarmerActivationPanel } from "@/components/steward/FarmerActivationPanel";

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

export default async function StewardFarmerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const db = createAdminClient();

  const { data: farmer } = await db
    .from("users")
    .select(
      "id, full_name, phone, email, status, created_at, phone_verified_at",
    )
    .eq("id", id)
    .eq("role", "farmer")
    .eq("assigned_steward_id", user.id)
    .maybeSingle();

  if (!farmer) notFound();

  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  const isActive = farmer.status === "active";

  // Dev-only: fetch the current plaintext OTP for the activation panel
  let devOtp: string | null = null;
  if (!isActive && process.env.DEV_SHOW_OTP === "true" && farmer.phone) {
    const { data: otpRow } = await db
      .from("dev_otps")
      .select("otp")
      .eq("phone", farmer.phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    devOtp = otpRow?.otp ?? null;
  }

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/steward/farmers"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-ink-secondary hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          Back to Farmers
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            {farmer.full_name ?? "Farmer"}
          </h1>
          <span
            className={`inline-flex items-center rounded-[4px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.02em] ${
              isActive
                ? "bg-[#E8F0EA] text-green-deep"
                : "bg-[#FEF6E5] text-[#C48A2E]"
            }`}
          >
            {isActive ? "Active" : "Pending Activation"}
          </span>
        </div>
      </div>

      {!isActive && farmer.phone && (
        <FarmerActivationPanel
          farmerId={farmer.id}
          phone={farmer.phone}
          devOtp={devOtp}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Contact
          </h2>
          <Row label="Full Name" value={farmer.full_name ?? "—"} />
          <Row label="Phone" value={farmer.phone ?? "—"} />
          <Row label="Email" value={farmer.email ?? "—"} />
          <Row label="Added" value={formatDateTime(farmer.created_at)} />
          <Row
            label="Activated"
            value={
              farmer.phone_verified_at
                ? formatDateTime(farmer.phone_verified_at)
                : "—"
            }
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            KYC Draft
          </h2>
          {kyc ? (
            <>
              <Row label="Status" value={kyc.status} />
              <Row label="NID Number" value={kyc.nid_number ?? "—"} />
              <Row label="Present Address" value={kyc.present_address ?? "—"} />
            </>
          ) : (
            <p className="text-[13px] text-ink-muted">
              No KYC record for this farmer yet.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border-light bg-stone/40 p-6">
        <p className="text-[13px] leading-[1.6] text-ink-secondary">
          Livestock assignment, updates, expense approvals, and sales
          coordination for this farmer will appear here as we build the
          stewardship workflow.
        </p>
      </div>
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
}d