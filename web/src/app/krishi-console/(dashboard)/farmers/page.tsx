import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending Activation" },
  { key: "active", label: "Active" },
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

export default async function AdminFarmersPage({
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

  let query = db
    .from("users")
    .select(
      "id, full_name, phone, status, created_at, assigned_steward_id",
    )
    .eq("role", "farmer")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter === "pending") {
    query = query.eq("status", "pending_activation");
  } else if (filter === "active") {
    query = query.eq("status", "active");
  }

  const { data: farmers } = await query;

  const stewardIds = [
    ...new Set(
      (farmers ?? [])
        .map((f) => f.assigned_steward_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const { data: stewards } = stewardIds.length
    ? await db
        .from("users")
        .select("id, full_name")
        .in("id", stewardIds)
    : { data: [] };

  const stewardMap = new Map((stewards ?? []).map((s) => [s.id, s.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Farmers
        </h1>
        <p className="text-[13px] text-ink-secondary">
          All farmer accounts across every steward. Total:{" "}
          <strong>{farmers?.length ?? 0}</strong>
        </p>
      </div>

      <div className="flex gap-1 border-b border-border-light">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={`/krishi-console/farmers?filter=${f.key}`}
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

      {!farmers || farmers.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            No farmers in this view.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Farmer
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Phone
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Steward
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Added
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((farmer) => {
                const active = farmer.status === "active";
                const style = active
                  ? "bg-[#E8F0EA] text-green-deep"
                  : "bg-[#FEF6E5] text-[#C48A2E]";
                return (
                  <tr
                    key={farmer.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-stone/40"
                  >
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">
                      {farmer.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {farmer.phone ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {farmer.assigned_steward_id
                        ? stewardMap.get(farmer.assigned_steward_id) ?? "—"
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${style}`}
                      >
                        {active ? "Active" : "Pending Activation"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {formatDate(farmer.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/krishi-console/farmers/${farmer.id}`}
                        className="text-[12px] font-semibold text-terracotta hover:underline"
                      >
                        View →
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