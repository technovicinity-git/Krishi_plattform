import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlanForm } from "@/components/admin/PlanForm";
import {
  StewardOfferingsSection,
  type OfferingRow,
} from "@/components/admin/StewardOfferingsSection";
import { planImageUrl } from "@/lib/admin/plan-helpers";
import { BackLink } from "@/components/ui/BackLink";

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

  const offerings: OfferingRow[] = (offeringRows ?? []).map((row: any) => ({
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
    </div>
  );
}