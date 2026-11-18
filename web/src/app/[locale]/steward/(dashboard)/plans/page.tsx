import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildOfferingSlug } from "@/lib/public/plans";
import { formatBDT } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { Link } from "@/i18n/navigation";
import { EmptyState, PageHeader, StatCard, StatusBadge, type BadgeTone } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const TONE: Record<string, BadgeTone> = {
  approved: "success",
  pending_approval: "warning",
  paused: "neutral",
  closed: "neutral",
  rejected: "danger",
};

interface OfferingRow {
  id: string;
  units_offered: number;
  units_funded: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  investment_plans: {
    slug: string;
    name_en: string | null;
    name_bn: string | null;
    status: string;
    unit_price: number | string;
    duration_months: number;
    estimated_roi_min: number | string;
    estimated_roi_max: number | string;
    livestock_categories: { name_en: string | null; name_bn: string | null } | null;
    districts: { slug: string; name_en: string | null; name_bn: string | null } | null;
  } | null;
}

/** Every plan this steward has been added to, with units and activity. */
export default async function StewardPlansPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const db = createAdminClient();
  const bn = (await getLocale()) === "bn";
  const [t, ts] = await Promise.all([getTranslations("app.stewardPlans"), getTranslations("app.offeringStatus")]);

  const { data } = await db
    .from("steward_plan_offerings")
    .select(`
      id, units_offered, units_funded, status, rejection_reason, created_at,
      investment_plans (
        slug, name_en, name_bn, status, unit_price, duration_months, estimated_roi_min, estimated_roi_max,
        livestock_categories ( name_en, name_bn ),
        districts ( slug, name_en, name_bn )
      )
    `)
    .eq("steward_id", user.id)
    .order("created_at", { ascending: false });
  const offerings = (data ?? []) as unknown as OfferingRow[];
  const ids = offerings.map((o) => o.id);

  // Activity per offering: open interests and active batches.
  const [{ data: interestRows }, { data: investmentRows }] = ids.length
    ? await Promise.all([
        db.from("investment_interests").select("offering_id").in("offering_id", ids).in("status", ["submitted", "under_review"]),
        db.from("investments").select("offering_id").in("offering_id", ids).eq("status", "active"),
      ])
    : [{ data: [] }, { data: [] }];
  const countBy = (rows: { offering_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.offering_id, (m.get(r.offering_id) ?? 0) + 1);
    return m;
  };
  const openInterests = countBy(interestRows);
  const activeBatches = countBy(investmentRows);

  const live = offerings.filter((o) => o.status === "approved");
  const sum = (key: "units_offered" | "units_funded") => live.reduce((s, o) => s + o[key], 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label={t("livePlans")} value={live.length} icon="clipboard" tone="brand" />
        <StatCard label={t("unitsOffered")} value={sum("units_offered")} />
        <StatCard label={t("unitsFunded")} value={sum("units_funded")} />
        <StatCard
          label={t("openInterests")}
          value={[...openInterests.values()].reduce((s, n) => s + n, 0)}
          href="/steward/interests"
          tone={openInterests.size > 0 ? "warning" : "default"}
        />
      </div>

      {offerings.length === 0 ? (
        <EmptyState icon="clipboard" title={t("empty")} description={t("emptyHint")} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {offerings.map((o) => {
            const plan = o.investment_plans;
            const name = (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? "—";
            const category = (bn ? plan?.livestock_categories?.name_bn : plan?.livestock_categories?.name_en) ?? "—";
            const district = (bn ? plan?.districts?.name_bn : plan?.districts?.name_en) ?? "—";
            const pct = o.units_offered > 0 ? Math.min(100, Math.round((o.units_funded / o.units_offered) * 100)) : 0;
            const left = Math.max(0, o.units_offered - o.units_funded);
            const publicSlug =
              plan && o.status === "approved" && plan.districts?.slug
                ? buildOfferingSlug(plan.slug, plan.districts.slug, user.fullName ?? "steward")
                : null;
            const interests = openInterests.get(o.id) ?? 0;
            const batches = activeBatches.get(o.id) ?? 0;

            return (
              <li key={o.id} className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[16px] font-semibold text-ink">{name}</span>
                    <span className="text-[12px] text-ink-muted">
                      {category} · {district} · {t("months", { count: plan?.duration_months ?? 0 })}
                    </span>
                  </div>
                  <StatusBadge tone={TONE[o.status] ?? "neutral"}>{ts.has(o.status) ? ts(o.status) : o.status}</StatusBadge>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-cream px-4 py-3 text-[12px]">
                  <div className="flex flex-col">
                    <span className="text-ink-muted">{t("unitPrice")}</span>
                    <span className="text-[14px] font-bold text-ink">{formatBDT(Number(plan?.unit_price ?? 0))}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-ink-muted">{t("estReturn")}</span>
                    <span className="text-[14px] font-bold text-ink">
                      {Number(plan?.estimated_roi_min ?? 0)}–{Number(plan?.estimated_roi_max ?? 0)}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-ink-muted">{t("left")}</span>
                    <span className="text-[14px] font-bold text-green-deep">{left}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[12px] text-ink-secondary">
                    <span>{t("funded", { funded: o.units_funded, offered: o.units_offered })}</span>
                    <span className="font-semibold">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone" aria-hidden="true">
                    <div className={cn("h-full rounded-full", pct >= 100 ? "bg-green-deep" : "bg-brand")} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {o.status === "pending_approval" && <p className="text-[12.5px] text-[#9A6B1F]">{t("pendingNote")}</p>}
                {o.status === "rejected" && o.rejection_reason && (
                  <p className="text-[12.5px] text-danger">{t("rejectedNote", { reason: o.rejection_reason })}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-light pt-3 text-[12.5px]">
                  <Link href="/steward/interests" className={cn("font-semibold hover:underline", interests ? "text-[#9A6B1F]" : "text-ink-secondary")}>
                    {t("interestsLink", { count: interests })}
                  </Link>
                  <Link href="/steward/investments" className="font-semibold text-ink-secondary hover:underline">
                    {t("batchesLink", { count: batches })}
                  </Link>
                  {publicSlug && (
                    <Link href={`/plans/${publicSlug}`} className="ml-auto font-semibold text-brand hover:underline">
                      {t("viewPublic")} →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
