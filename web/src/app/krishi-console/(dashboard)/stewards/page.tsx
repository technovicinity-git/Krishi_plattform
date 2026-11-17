import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, full_name, phone, email, steward_approval_status, created_at")
    .eq("role", "steward")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter !== "all") {
    query = query.eq("steward_approval_status", filter);
  }

  const { data: stewards } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Stewards
        </h1>
        <p className="text-[13px] text-ink-secondary">
          Steward accounts require admin approval before they can operate.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border-light">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={`/krishi-console/stewards?filter=${f.key}`}
              className={`border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-secondary hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {!stewards || stewards.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            No stewards in this view.
          </p>
          <p className="mt-2 text-[12px] text-ink-muted">
            Steward registration is not yet wired — this list will populate
            once the public steward application flow is active.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
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
                    className="border-b border-border-light last:border-b-0 hover:bg-stone/40"
                  >
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">
                      {s.full_name ?? "—"}
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
                      <Link
                        href={`/krishi-console/stewards/${s.id}`}
                        className="text-[12px] font-semibold text-brand hover:underline"
                      >
                        Review →
                      </Link>
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