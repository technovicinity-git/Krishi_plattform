import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { BackLink } from "@/components/ui/BackLink";
import { RowAction } from "@/components/dashboard/ui";

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

export default async function AdminFarmerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const { data: farmer } = await db
    .from("users")
    .select(
      "id, full_name, phone, email, status, created_at, phone_verified_at, assigned_steward_id, created_by",
    )
    .eq("id", id)
    .eq("role", "farmer")
    .maybeSingle();

  if (!farmer) notFound();

  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  let steward: { id: string; full_name: string | null; phone: string | null } | null = null;
  if (farmer.assigned_steward_id) {
    const { data } = await db
      .from("users")
      .select("id, full_name, phone")
      .eq("id", farmer.assigned_steward_id)
      .maybeSingle();
    steward = data;
  }

  const isActive = farmer.status === "active";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink href="/krishi-console/farmers" localized={false}>Back to Farmers</BackLink>
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
            Assigned Steward
          </h2>
          {steward ? (
            <>
              <Row label="Name" value={steward.full_name ?? "—"} />
              <Row label="Phone" value={steward.phone ?? "—"} />
              <div className="mt-2">
                <RowAction href={`/krishi-console/stewards/${steward.id}`} icon="user">
                  View steward
                </RowAction>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-ink-muted">No steward assigned.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
          KYC
        </h2>
        {kyc ? (
          <>
            <Row label="Status" value={kyc.status} />
            <Row label="NID Number" value={kyc.nid_number ?? "—"} />
            <Row label="Present Address" value={kyc.present_address ?? "—"} />
            <Row label="Permanent Address" value={kyc.permanent_address ?? "—"} />
          </>
        ) : (
          <p className="text-[13px] text-ink-muted">No KYC record yet.</p>
        )}
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
}