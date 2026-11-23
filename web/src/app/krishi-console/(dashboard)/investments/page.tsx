import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { EmptyState, PageHeader, StatusBadge, Tabs, toneFor } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  awaiting_farmer: "Awaiting farmer",
  awaiting_purchase: "Buying animals",
  growing_care: "Raising",
  sale_pending: "Sale pending",
  sold: "Sold",
  settled: "Settled",
};

const VIEWS = [
  { key: "active", label: "In progress", stages: ["awaiting_farmer", "awaiting_purchase", "growing_care", "sale_pending", "sold"] },
  { key: "awaiting_farmer", label: "Awaiting farmer", stages: ["awaiting_farmer"] },
  { key: "awaiting_purchase", label: "Buying", stages: ["awaiting_purchase"] },
  { key: "growing_care", label: "Raising", stages: ["growing_care"] },
  { key: "sale", label: "Sale", stages: ["sale_pending", "sold"] },
  { key: "settled", label: "Settled", stages: ["settled"] },
  { key: "all", label: "All", stages: [] as string[] },
] as const;

interface Row {
  id: string;
  reference: string;
  units: number;
  amount: number | string;
  current_stage: string | null;
  created_at: string;
  investor: { full_name: string | null } | null;
  farmer: { full_name: string | null } | null;
  offering: {
    plan_id: string;
    users: { full_name: string | null } | null;
    investment_plans: { name_en: string | null } | null;
  } | null;
}

/** Every batch at any stage: follow progress before and after the sale. */
export default async function AdminInvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; plan?: string; q?: string }>;
}) {
  await requireAdmin();
  const { view: viewParam, plan: planId, q } = await searchParams;
  const view = VIEWS.find((v) => v.key === viewParam) ?? VIEWS[0];
  const db = createAdminClient();

  // `!inner` only when filtering by plan, so the filter drops other rows.
  let query = db
    .from("investments")
    .select(`
      id, reference, units, amount, current_stage, created_at,
      investor:users!investor_id ( full_name ),
      farmer:users!farmer_id ( full_name ),
      offering:steward_plan_offerings!offering_id${planId ? "!inner" : ""} (
        plan_id,
        users!steward_id ( full_name ),
        investment_plans ( name_en )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(500);
  if (view.stages.length) query = query.in("current_stage", view.stages);
  if (planId) query = query.eq("offering.plan_id", planId);
  if (q?.trim()) query = query.ilike("reference", `%${q.trim().replace(/[%_]/g, "")}%`);

  const [{ data }, { data: plan }] = await Promise.all([
    query,
    planId ? db.from("investment_plans").select("name_en").eq("id", planId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const ids = rows.map((r) => r.id);

  // What each batch is waiting on.
  const [{ data: funds }, { data: expenses }, { data: deaths }] = ids.length
    ? await Promise.all([
        db.from("fund_requests").select("investment_id").in("investment_id", ids).eq("status", "pending"),
        db.from("expenses").select("investment_id").in("investment_id", ids).eq("status", "pending"),
        db.from("animals").select("investment_id").in("investment_id", ids).eq("status", "death_reported"),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const count = (list: { investment_id: string }[] | null, id: string) => (list ?? []).filter((x) => x.investment_id === id).length;

  const keep = (key: string) => {
    const p = new URLSearchParams();
    if (key !== "active") p.set("view", key);
    if (planId) p.set("plan", planId);
    if (q) p.set("q", q);
    return `/krishi-console/investments${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<>Batches</>}
        description={
          plan ? (
            <>
              Batches on <strong>{plan.name_en}</strong> ·{" "}
              <Link href="/krishi-console/investments" className="text-brand hover:underline">
                show all plans
              </Link>
            </>
          ) : (
            <>Follow every batch from purchase to settlement.</>
          )
        }
      />

      <Tabs localized={false} items={VIEWS.map((v) => ({ label: v.label, href: keep(v.key), active: v.key === view.key }))} />

      <form method="get" className="flex flex-wrap gap-2">
        {view.key !== "active" && <input type="hidden" name="view" value={view.key} />}
        {planId && <input type="hidden" name="plan" value={planId} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Batch reference, e.g. KR-INV-000012"
          className="h-[40px] min-w-[260px] flex-1 rounded-[8px] border border-border-light bg-white px-3 text-[13px]"
        />
        <button type="submit" className="h-[40px] rounded-[8px] bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-hover">
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon="briefcase" title="No batches in this view." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                {["Batch", "Plan", "Investor", "Steward / Farmer", "Invested", "Stage", "Waiting", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {rows.map((r) => {
                const stage = r.current_stage ?? "";
                const waiting = [
                  count(funds, r.id) && `${count(funds, r.id)} fund request${count(funds, r.id) === 1 ? "" : "s"}`,
                  count(expenses, r.id) && `${count(expenses, r.id)} expense${count(expenses, r.id) === 1 ? "" : "s"}`,
                  count(deaths, r.id) && `${count(deaths, r.id)} death report${count(deaths, r.id) === 1 ? "" : "s"}`,
                ].filter(Boolean);
                return (
                  <tr key={r.id} className="align-top hover:bg-cream/60">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-[12px] font-bold text-ink">{r.reference}</div>
                      <div className="text-[11px] text-ink-muted">
                        {new Date(r.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-ink">{r.offering?.investment_plans?.name_en ?? "—"}</td>
                    <td className="px-5 py-3.5 text-[13px] text-ink-secondary">{r.investor?.full_name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-[12.5px] text-ink-secondary">
                      <div>{r.offering?.users?.full_name ?? "—"}</div>
                      <div className="text-ink-muted">{r.farmer?.full_name ?? "No farmer yet"}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-ink">
                      {formatBDT(Number(r.amount))}
                      <div className="text-[11px] font-normal text-ink-muted">
                        {r.units} unit{r.units === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={toneFor(stage)}>{STAGE_LABEL[stage] ?? stage}</StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-[#9A6B12]">{waiting.length ? waiting.join(", ") : <span className="text-ink-muted">—</span>}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/krishi-console/investments/${r.id}`} className="text-[12px] font-semibold text-brand hover:underline">
                        View progress →
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
