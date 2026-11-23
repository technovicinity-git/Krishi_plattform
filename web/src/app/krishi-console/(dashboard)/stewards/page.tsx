import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader, Tabs, RowAction } from "@/components/dashboard/ui";

const FILTERS = [
  { key: "pending", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminStewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === params.filter)
    ? (params.filter as FilterKey)
    : "pending";

  const db = createAdminClient();

  let query = db
    .from("users")
    .select("id, full_name, phone, email, status, steward_approval_status, created_at")
    .eq("role", "steward")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter !== "all") {
    query = query.eq("steward_approval_status", filter);
  }

  const { data: stewards } = await query;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<>Stewards</>}
        description={<>Steward accounts require admin approval before they can operate.</>}
      />

      <Tabs localized={false}
        items={FILTERS.map((f) => ({
          label: f.label,
          href: `/krishi-console/stewards?filter=${f.key}`,
          active: f.key === filter,
        }))}
      />

      {!stewards || stewards.length === 0 ? (
        <EmptyState icon="users" title="No stewards in this view." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Steward
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Phone
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Approval
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Applied
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {stewards.map((s) => {
                const status = s.steward_approval_status ?? "pending";
                const style =
                  status === "approved"
                    ? "bg-[#E8F0EA] text-green-deep"
                    : status === "rejected"
                      ? "bg-[#FAF0ED] text-danger"
                      : "bg-[#FEF6E5] text-[#C48A2E]";
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-cream/60"
                  >
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">
                      {s.full_name ?? "—"} {s.status === "suspended" && (
                        <span className="ml-2 inline-flex rounded-[4px] bg-[#FAF0ED] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] text-danger">Suspended</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {s.phone ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${style}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <RowAction href={`/krishi-console/stewards/${s.id}`} icon="eye">View</RowAction>
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