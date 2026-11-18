import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/** Filter tabs: key → action prefix ("" = everything). */
const FILTERS = [
  { key: "all", label: "All", prefix: "" },
  { key: "auth", label: "Sign-ins", prefix: "admin." },
  { key: "kyc", label: "KYC", prefix: "kyc." },
  { key: "steward", label: "Stewards", prefix: "steward." },
  { key: "deposit", label: "Deposits", prefix: "deposit." },
  { key: "sale", label: "Sales", prefix: "sale." },
  { key: "withdrawal", label: "Withdrawals", prefix: "withdrawal." },
  { key: "plan", label: "Plans", prefix: "plan." },
  { key: "offering", label: "Offerings", prefix: "offering." },
  { key: "category", label: "Categories", prefix: "category." },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

interface AuditRow {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin: { full_name: string | null } | null;
}

const ACTION_STYLE: Record<string, string> = {
  approve: "bg-[#E8F0EA] text-green-deep",
  create: "bg-[#E8F0EA] text-green-deep",
  success: "bg-[#E8F0EA] text-green-deep",
  reject: "bg-[#FAF0ED] text-danger",
  failure: "bg-[#FAF0ED] text-danger",
  rate_limited: "bg-[#FAF0ED] text-danger",
  settle: "bg-[#E8F0EA] text-green-deep",
  pay: "bg-[#E8F0EA] text-green-deep",
  remittance_reject: "bg-[#FAF0ED] text-danger",
  close: "bg-[#FEF6E5] text-[#C48A2E]",
  update: "bg-[#FEF6E5] text-[#C48A2E]",
};

function actionStyle(action: string): string {
  const verb = action.split(".").pop() ?? "";
  return ACTION_STYLE[verb] ?? "bg-stone text-ink-secondary";
}

/** Link to the affected record when the console has a page for it. */
function targetHref(row: AuditRow): string | null {
  if (!row.target_id) return null;
  switch (row.target_type) {
    case "kyc_profile":
      return `/krishi-console/kyc/${row.target_id}`;
    case "investment_sale":
      return `/krishi-console/sales/${row.target_id}`;
    case "investment_plan":
      return `/krishi-console/plans/${row.target_id}`;
    case "user":
      return row.action.startsWith("steward.")
        ? `/krishi-console/stewards/${row.target_id}`
        : null;
    default:
      return null;
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatMetadata(metadata: AuditRow["metadata"]): string | null {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  return Object.entries(metadata)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filterKey: FilterKey = FILTERS.some((f) => f.key === params.filter)
    ? (params.filter as FilterKey)
    : "all";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const db = createAdminClient();
  let query = db
    .from("admin_audit_log")
    .select(
      `
      id, action, target_type, target_id, metadata, ip_address, created_at,
      admin:users!admin_id ( full_name )
      `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filter.prefix) query = query.like("action", `${filter.prefix}%`);

  const { data, count, error: queryError } = await query;
  // PGRST103 = page past the end (e.g. a stale ?page=); show an empty page.
  const error = queryError?.code === "PGRST103" ? null : queryError;
  const rows = (data ?? []) as unknown as AuditRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) =>
    `/krishi-console/audit?filter=${filterKey}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<>Audit Log</>}
        description={<>Every admin action, newest first. Times are Bangladesh time.
          Total: <strong>{total}</strong></>}
      />

      <Tabs localized={false}
        items={FILTERS.map((f) => ({
          label: f.label,
          href: `/krishi-console/audit?filter=${f.key}`,
          active: f.key === filterKey,
        }))}
      />

      {error ? (
        <div className="rounded-2xl border border-[#F0C9C0] bg-[#FAF0ED] px-8 py-6 text-[13px] text-danger">
          Could not load the audit log: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={<>No audit entries in this view.</>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                {["Time", "Admin", "Action", "Target", "IP"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const href = targetHref(row);
                const meta = formatMetadata(row.metadata);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border-light align-top last:border-b-0 hover:bg-cream/60"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-[12px] text-ink-secondary">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">
                      {row.admin?.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-[4px] px-2.5 py-1 font-mono text-[11px] font-semibold ${actionStyle(row.action)}`}
                      >
                        {row.action}
                      </span>
                      {meta && (
                        <div className="mt-1.5 max-w-[360px] break-words text-[11px] text-ink-muted">
                          {meta}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-ink-secondary">
                      {row.target_type ? (
                        <>
                          <div className="text-ink-muted">{row.target_type}</div>
                          {href ? (
                            <Link
                              href={href}
                              className="break-all font-mono text-[11px] font-semibold text-brand hover:underline"
                            >
                              {row.target_id}
                            </Link>
                          ) : (
                            <div className="break-all font-mono text-[11px]">
                              {row.target_id ?? "—"}
                            </div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-[11px] text-ink-muted">
                      {row.ip_address ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-ink-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-[6px] border border-border-light bg-white px-4 py-2 font-semibold text-ink-secondary hover:bg-stone"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-[6px] border border-border-light bg-white px-4 py-2 font-semibold text-ink-secondary hover:bg-stone"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
