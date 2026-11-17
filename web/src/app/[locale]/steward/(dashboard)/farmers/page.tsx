import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

const FILTERS = [{ key: "all" }, { key: "pending" }, { key: "active" }] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function StewardFarmersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === params.filter)
    ? (params.filter as FilterKey)
    : "all";

  const t = await getTranslations("app.stewardFarmers");
  const locale = await getLocale();
  const db = createAdminClient();

  let query = db
    .from("users")
    .select("id, full_name, phone, status, created_at")
    .eq("assigned_steward_id", user.id)
    .eq("role", "farmer")
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    query = query.eq("status", "pending_activation");
  } else if (filter === "active") {
    query = query.eq("status", "active");
  }

  const { data: farmers } = await query;

  return (
    <div className="flex w-full max-w-[1040px] flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            {t("title")}
          </h1>
          <p className="text-[13px] text-ink-secondary">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/steward/farmers/new"
          className="inline-flex h-[42px] w-fit items-center justify-center rounded-[8px] bg-ink px-5 text-[13px] font-bold text-white hover:bg-[#2A2A2A]"
        >
          {t("addFarmer")}
        </Link>
      </div>

      <div className="flex gap-1 border-b border-border-light">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={`/steward/farmers?filter=${f.key}`}
              className={`border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-secondary hover:text-ink"
              }`}
            >
              {t(`filter.${f.key}`)}
            </Link>
          );
        })}
      </div>

      {!farmers || farmers.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            {t("empty")}
          </p>
          <p className="mt-2 text-[12px] text-ink-muted">
            {t.rich("emptyHint", { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("colFarmer")}
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("colPhone")}
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("colStatus")}
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("colAdded")}
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => {
                const active = f.status === "active";
                const style = active
                  ? "bg-[#E8F0EA] text-green-deep"
                  : "bg-[#FEF6E5] text-[#C48A2E]";
                return (
                  <tr
                    key={f.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-stone/40"
                  >
                    <td className="px-5 py-4 text-[13px] font-semibold text-ink">
                      {f.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {f.phone ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${style}`}
                      >
                        {active ? t("filter.active") : t("filter.pending")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {formatDate(f.created_at, locale)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/steward/farmers/${f.id}`}
                        className="text-[12px] font-semibold text-brand hover:underline"
                      >
                        {t("view")}
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