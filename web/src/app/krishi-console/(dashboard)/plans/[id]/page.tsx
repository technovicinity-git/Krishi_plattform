import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlanForm } from "@/components/admin/PlanForm";
import {
  StewardOfferingsSection,
  type OfferingRow,
} from "@/components/admin/StewardOfferingsSection";
import { planImageUrl, type OfferingQueryRow } from "@/lib/admin/plan-helpers";
import { BackLink } from "@/components/ui/BackLink";
import Link from "next/link";
import { NavIcon } from "@/components/dashboard/NavIcon";
import { formatBDT } from "@/lib/utils";
import { StatusBadge, toneFor, RowAction, rowActionClass } from "@/components/dashboard/ui";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const { data: plan } = await db
    .from("investment_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!plan) notFound();

  const [
    { data: categories },
    { data: divisions },
    { data: districts },
    { data: offeringRows },
    { data: stewards },
    { data: thanas },
  ] = await Promise.all([
    db
      .from("livestock_categories")
      .select("id, name_en, name_bn, is_active")
      .order("sort_order", { ascending: true }),
    db
      .from("divisions")
      .select("id, name_en, name_bn")
      .order("sort_order", { ascending: true }),
    db
      .from("districts")
      .select("id, division_id, name_en, name_bn")
      .order("sort_order", { ascending: true }),
    db
      .from("steward_plan_offerings")
      .select(
        `
        id, units_offered, units_funded, status, thana_id,
        thanas ( name_en ),
        users!steward_id!inner ( id, full_name )
        `,
      )
      .eq("plan_id", id)
      .order("created_at", { ascending: true }),
    db
      .from("users")
      .select("id, full_name")
      .eq("role", "steward")
      .eq("status", "active")
      .eq("steward_approval_status", "approved")
      .order("full_name", { ascending: true }),
    db
      .from("thanas")
      .select("id, name_en")
      .eq("district_id", plan.district_id)
      .order("sort_order", { ascending: true }),
  ]);

  const offerings: OfferingRow[] = (
    (offeringRows ?? []) as unknown as OfferingQueryRow[]
  ).map((row) => ({
    id: row.id,
    steward_id: row.users?.id ?? "",
    steward_name: row.users?.full_name ?? "—",
    thana_id: row.thana_id,
    thana_name: row.thanas?.name_en ?? null,
    units_offered: row.units_offered,
    units_funded: row.units_funded,
    status: row.status,
  }));

  const approvedCount = offerings.filter((o) => o.status === "approved").length;

  // Batches investors have started on this plan, newest first.
  const { data: batchData } = await db
    .from("investments")
    .select(`
      id, reference, amount, current_stage, created_at,
      investor:users!investor_id ( full_name ),
      farmer:users!farmer_id ( full_name ),
      offering:steward_plan_offerings!offering_id!inner ( plan_id, users!steward_id ( full_name ) )
    `)
    .eq("offering.plan_id", plan.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const planBatches = (batchData ?? []) as unknown as {
    id: string;
    reference: string;
    amount: number | string;
    current_stage: string | null;
    created_at: string;
    investor: { full_name: string | null } | null;
    farmer: { full_name: string | null } | null;
    offering: { users: { full_name: string | null } | null } | null;
  }[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink href="/krishi-console/plans" localized={false}>Back to Plans</BackLink>
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Edit Plan
        </h1>
      </div>

      {approvedCount === 0 ? (
        <div className="rounded-[8px] border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-[#A13D2B]">
          <strong>Not visible publicly.</strong> This plan has no approved
          steward offerings yet. Add one below to make it appear on the public
          site.
        </div>
      ) : (
        <div className="rounded-[8px] border border-[#D6E5D3] bg-[#EEF5EB] px-4 py-3 text-[13px] text-[#2F5C2A]">
          <strong>Visible publicly.</strong> {approvedCount} approved{" "}
          {approvedCount === 1 ? "offering" : "offerings"}.{" "}
          {offerings
            .filter((o) => o.status === "approved")
            .reduce((s, o) => s + o.units_offered, 0)}{" "}
          total units offered.
        </div>
      )}

      <PlanForm
        mode="edit"
        categories={categories ?? []}
        divisions={divisions ?? []}
        districts={districts ?? []}
        imagePublicUrl={planImageUrl(plan.image_path)}
        initial={{
          id: plan.id,
          slug: plan.slug,
          name_en: plan.name_en,
          name_bn: plan.name_bn,
          description_en: plan.description_en ?? "",
          description_bn: plan.description_bn ?? "",
          category_id: plan.category_id,
          division_id: plan.division_id,
          district_id: plan.district_id,
          duration_months: plan.duration_months,
          unit_price: Number(plan.unit_price),
          animal_allocation: Number(plan.animal_allocation),
          care_allocation: Number(plan.care_allocation),
          estimated_roi_min: Number(plan.estimated_roi_min),
          estimated_roi_max: Number(plan.estimated_roi_max),
          steward_monthly_pay: Number(plan.steward_monthly_pay ?? 0),
          risk_information: plan.risk_information ?? "",
          image_path: plan.image_path,
          status: plan.status,
        }}
      />

      <StewardOfferingsSection
        planId={plan.id}
        stewards={(stewards ?? []).map((s) => ({
          id: s.id,
          full_name: s.full_name ?? "—",
        }))}
        thanas={(thanas ?? []).map((t) => ({
          id: t.id,
          name_en: t.name_en,
        }))}
        offerings={offerings}
      />

      <section className="rounded-2xl border border-border-light bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Batches on this plan</h2>
            <p className="text-[12px] text-ink-muted">Follow each batch from purchase to settlement.</p>
          </div>
          {planBatches.length > 0 && (
            <RowAction href={`/krishi-console/investments?view=all&plan=${plan.id}`} icon="briefcase">
              Open in Batches
            </RowAction>
          )}
        </div>
        {planBatches.length === 0 ? (
          <p className="px-6 py-5 text-[13px] text-ink-muted">No batches yet. They appear when an investor&apos;s payment is approved.</p>
        ) : (
          <ul className="divide-y divide-border-light">
            {planBatches.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/krishi-console/investments/${b.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 hover:bg-cream/60"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-mono text-[12px] font-bold text-ink">{b.reference}</span>
                    <span className="text-[12px] text-ink-muted">
                      {b.investor?.full_name ?? "—"} · steward {b.offering?.users?.full_name ?? "—"} · farmer {b.farmer?.full_name ?? "not assigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-ink">{formatBDT(Number(b.amount))}</span>
                    <StatusBadge tone={toneFor(b.current_stage ?? "")}>{(b.current_stage ?? "").replace(/_/g, " ")}</StatusBadge>
                    {/* The whole row is the link; this just looks like the row's button. */}
                    <span className={rowActionClass()}>
                      <NavIcon name="chart" className="h-[15px] w-[15px]" />
                      Progress
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}