import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
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
  rejected: "bg-[#FAF0ED] text-terracotta",
  requires_update: "bg-[#FAF0ED] text-terracotta",
  not_started: "bg-stone text-ink-muted",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function KycQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === params.status)
    ? (params.status as FilterKey)
    : "pending";

  const db = createAdminClient();

  let query = db
    .from("kyc_profiles")
    .select("id, user_id, status, submitted_at, nid_number")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(100);

  if (filter !== "all") {
    if (filter === "pending") {
      query = query.in("status", ["pending", "under_review"]);
    } else {
      query = query.eq("status", filter);
    }
  }

  const { data: profiles } = await query;

  // Fetch users for the retrieved profiles
  const userIds = (profiles ?? []).map((p) => p.user_id);
  const { data: users } = userIds.length
    ? await db
        .from("users")
        .select("id, full_name, phone, email")
        .in("id", userIds)
    : { data: [] };

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          KYC Queue
        </h1>
        <p className="text-[13px] text-ink-secondary">
          Review investor identity submissions and approve or reject.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border-light">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={`/krishi-console/kyc?status=${f.key}`}
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

      {/* Table */}
      {!profiles || profiles.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            No KYC submissions in this view.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Applicant
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  NID
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Submitted
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const user = userMap.get(p.user_id);
                const statusLabel = STATUS_LABEL[p.status] ?? p.status;
                const statusStyle = STATUS_STYLE[p.status] ?? STATUS_STYLE.not_started;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-stone/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-ink">
                          {user?.full_name ?? "—"}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {user?.phone ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {p.nid_number ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {formatDate(p.submitted_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/krishi-console/kyc/${p.id}`}
                        className="text-[12px] font-semibold text-terracotta hover:underline"
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