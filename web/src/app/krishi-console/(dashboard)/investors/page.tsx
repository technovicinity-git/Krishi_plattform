import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";

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
  rejected: "bg-[#FAF0ED] text-terracotta",
  requires_update: "bg-[#FAF0ED] text-terracotta",
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
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Investors
        </h1>
        <p className="text-[13px] text-ink-secondary">
          All investor accounts. Total: <strong>{rows.length}</strong>
        </p>
      </div>

      <div className="flex gap-1 border-b border-border-light">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={`/krishi-console/investors?filter=${f.key}`}
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            No investors in this view.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
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
                    className="border-b border-border-light last:border-b-0 hover:bg-stone/40"
                  >
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-semibold text-ink">
                        {inv.full_name ?? "—"}
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
                      <Link
                        href={`/krishi-console/investors/${inv.id}`}
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