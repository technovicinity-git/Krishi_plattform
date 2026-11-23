import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader, Tabs, RowAction } from "@/components/dashboard/ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "kyc_pending", label: "KYC Pending" },
  { key: "kyc_verified", label: "KYC Verified" },
  { key: "no_kyc", label: "No KYC Yet" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminInvestorsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === params.filter)
    ? (params.filter as FilterKey)
    : "all";

  const db = createAdminClient();

  const { data: investors } = await db
    .from("users")
    .select("id, full_name, phone, email, status, created_at")
    .eq("role", "investor")
    .order("created_at", { ascending: false })
    .limit(200);

  const ids = (investors ?? []).map((i) => i.id);

  const { data: kycs } = ids.length
    ? await db
        .from("kyc_profiles")
        .select("user_id, status, submitted_at")
        .in("user_id", ids)
    : { data: [] };

  const kycMap = new Map((kycs ?? []).map((k) => [k.user_id, k]));

  const rows = (investors ?? []).map((inv) => {
    const kyc = kycMap.get(inv.id);
    return {
      ...inv,
      kycStatus: kyc?.status ?? "not_started",
      kycSubmittedAt: kyc?.submitted_at ?? null,
    };
  });

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "no_kyc") return r.kycStatus === "not_started";
    if (filter === "kyc_pending")
      return r.kycStatus === "pending" || r.kycStatus === "under_review";
    if (filter === "kyc_verified") return r.kycStatus === "verified";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<>Investors</>}
        description={<>All investor accounts. Total: <strong>{rows.length}</strong></>}
      />

      <Tabs localized={false}
        items={FILTERS.map((f) => ({
          label: f.label,
          href: `/krishi-console/investors?filter=${f.key}`,
          active: f.key === filter,
        }))}
      />

      {filtered.length === 0 ? (
        <EmptyState title={<>No investors in this view.</>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Investor
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Phone
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  KYC
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Joined
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const label = STATUS_LABEL[inv.kycStatus] ?? inv.kycStatus;
                const style = STATUS_STYLE[inv.kycStatus] ?? STATUS_STYLE.not_started;
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-cream/60"
                  >
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-semibold text-ink">
                        {inv.full_name ?? "—"} {inv.status === "suspended" && (
                        <span className="ml-2 inline-flex rounded-[4px] bg-[#FAF0ED] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] text-danger">Suspended</span>
                      )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {inv.phone ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${style}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <RowAction href={`/krishi-console/investors/${inv.id}`} icon="eye">View</RowAction>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}