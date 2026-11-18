import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ButtonLink,
  EmptyState,
  PageHeader,
  StatusBadge,
  Tabs,
} from "@/components/dashboard/ui";

const FILTERS = ["all", "pending", "active"] as const;
type FilterKey = (typeof FILTERS)[number];

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
  if (!user || user.role !== "steward") redirect("/login");

  const params = await searchParams;
  const filter: FilterKey = (FILTERS as readonly string[]).includes(params.filter ?? "")
    ? (params.filter as FilterKey)
    : "all";

  const t = await getTranslations("app.stewardFarmers");
  const locale = await getLocale();
  const db = createAdminClient();

  const { data: all } = await db
    .from("users")
    .select("id, full_name, phone, status, created_at")
    .eq("assigned_steward_id", user.id)
    .eq("role", "farmer")
    .order("created_at", { ascending: false });

  const farmersAll = all ?? [];
  const counts = {
    all: farmersAll.length,
    pending: farmersAll.filter((f) => f.status === "pending_activation").length,
    active: farmersAll.filter((f) => f.status === "active").length,
  };
  const farmers =
    filter === "pending"
      ? farmersAll.filter((f) => f.status === "pending_activation")
      : filter === "active"
        ? farmersAll.filter((f) => f.status === "active")
        : farmersAll;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={<ButtonLink href="/steward/farmers/new">{t("addFarmer")}</ButtonLink>}
      />

      <Tabs
        items={FILTERS.map((f) => ({
          label: t(`filter.${f}`),
          href: f === "all" ? "/steward/farmers" : `/steward/farmers?filter=${f}`,
          active: f === filter,
          count: counts[f],
        }))}
      />

      {farmers.length === 0 ? (
        <EmptyState
          icon="users"
          title={t("empty")}
          description={t.rich("emptyHint", { strong: (chunks) => <strong>{chunks}</strong> })}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                {[t("colFarmer"), t("colPhone"), t("colStatus"), t("colAdded")].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {farmers.map((f) => {
                const active = f.status === "active";
                return (
                  <tr key={f.id} className="hover:bg-cream/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[12px] font-bold text-green-deep">
                          {(f.full_name ?? "?").trim().slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-[13.5px] font-semibold text-ink">{f.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">{f.phone ?? "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={active ? "success" : "warning"}>
                        {active ? t("filter.active") : t("filter.pending")}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">
                      {formatDate(f.created_at, locale)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/steward/farmers/${f.id}`}
                        className="text-[12.5px] font-semibold text-brand hover:underline"
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
