import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { planImageUrl } from "@/lib/admin/plan-helpers";
import { formatBDT } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-stone text-ink-muted",
  open: "bg-[#E8F0EA] text-green-deep",
  coming_soon: "bg-[#FEF6E5] text-[#C48A2E]",
  fully_funded: "bg-[#F5EBE6] text-terracotta",
  closed: "bg-stone text-ink-muted",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  coming_soon: "Coming Soon",
  fully_funded: "Fully Funded",
  closed: "Closed",
};

interface Aggregate {
  offeringCount: number;
  approvedOfferingCount: number;
  totalOffered: number;
  totalFunded: number;
}

export default async function AdminPlansPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: plans, error: plansError } = await db
    .from("investment_plans")
    .select(
      "id, slug, name_en, status, unit_price, image_path, created_at, category_id, district_id",
    )
    .order("created_at", { ascending: false });

  if (plansError) {
    console.error("[admin/plans] list query error:", plansError);
  }

  const categoryIds = [...new Set((plans ?? []).map((p) => p.category_id))];
  const districtIds = [...new Set((plans ?? []).map((p) => p.district_id))];
  const planIds = (plans ?? []).map((p) => p.id);

  const { data: categories } = categoryIds.length
    ? await db.from("livestock_categories").select("id, name_en").in("id", categoryIds)
    : { data: [] as { id: string; name_en: string }[] };

  const { data: districts } = districtIds.length
    ? await db.from("districts").select("id, name_en").in("id", districtIds)
    : { data: [] as { id: string; name_en: string }[] };

  const { data: offerings } = planIds.length
    ? await db
        .from("steward_plan_offerings")
        .select("plan_id, units_offered, units_funded, status")
        .in("plan_id", planIds)
    : { data: [] as { plan_id: string; units_offered: number; units_funded: number; status: string }[] };

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name_en]));
  const distMap = new Map((districts ?? []).map((d) => [d.id, d.name_en]));

  const aggMap = new Map<string, Aggregate>();
  for (const o of offerings ?? []) {
    const cur = aggMap.get(o.plan_id) ?? {
      offeringCount: 0,
      approvedOfferingCount: 0,
      totalOffered: 0,
      totalFunded: 0,
    };
    cur.offeringCount += 1;
    if (o.status === "approved") {
      cur.approvedOfferingCount += 1;
      cur.totalOffered += o.units_offered;
      cur.totalFunded += o.units_funded;
    }
    aggMap.set(o.plan_id, cur);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            Investment Plans
          </h1>
          <p className="text-[13px] text-ink-secondary">
            Plans shown on the public site. Total: {plans?.length ?? 0}
          </p>
        </div>
        <Link
          href="/krishi-console/plans/new"
          className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-ink px-5 text-[13px] font-bold text-white hover:bg-[#2A2A2A]"
        >
          + Create Plan
        </Link>
      </div>

      {!plans || plans.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            No plans yet. Click <strong>Create Plan</strong> to add the first one.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Plan
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Category
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Location
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Unit Price
                </th>
                <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Offerings
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
              {plans.map((plan) => {
                const statusStyle = STATUS_STYLE[plan.status] ?? STATUS_STYLE.draft;
                const thumbUrl = planImageUrl(plan.image_path);
                const agg = aggMap.get(plan.id);
                const approved = agg?.approvedOfferingCount ?? 0;

                return (
                  <tr
                    key={plan.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-stone/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbUrl}
                            alt={plan.name_en}
                            className="h-10 w-14 rounded-[4px] border border-border-light object-cover"
                          />
                        ) : (
                          <div className="h-10 w-14 rounded-[4px] border border-dashed border-border-light bg-stone" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-ink">
                            {plan.name_en}
                          </span>
                          <span className="font-mono text-[11px] text-ink-muted">
                            {plan.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-ink-secondary">
                      {catMap.get(plan.category_id) ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-ink-secondary">
                      {distMap.get(plan.district_id) ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-ink">
                      {formatBDT(Number(plan.unit_price))}
                    </td>
                    <td className="px-5 py-3 text-center text-[12px]">
                      {approved > 0 ? (
                        <span className="text-ink-secondary">
                          <span className="font-semibold text-ink">{approved}</span> approved
                          {agg ? (
                            <span className="block text-[10px] text-ink-muted">
                              {agg.totalFunded} / {agg.totalOffered} units funded
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase text-terracotta">
                          None — hidden
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${statusStyle}`}
                      >
                        {STATUS_LABEL[plan.status] ?? plan.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/krishi-console/plans/${plan.id}`}
                        className="text-[12px] font-semibold text-terracotta hover:underline"
                      >
                        Edit →
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