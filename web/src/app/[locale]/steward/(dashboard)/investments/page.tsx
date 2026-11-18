import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AssignFarmerCard } from "@/components/steward/AssignFarmerCard";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import type { StewardInvestmentRow } from "@/components/steward/types";

export const dynamic = "force-dynamic";

export default async function StewardInvestmentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const t = await getTranslations("app.stewardInvestments");
  const db = createAdminClient();

  // Step 1: fetch all offerings for this steward
  const { data: myOfferings } = await db
    .from("steward_plan_offerings")
    .select("id")
    .eq("steward_id", user.id);

  const offeringIds = (myOfferings ?? []).map((o) => o.id);

  // Step 2: fetch investments for those offerings
  const { data: investments } = offeringIds.length
    ? await db
        .from("investments")
        .select(
          `
          id, reference, units, amount, current_stage, created_at,
          investor:users!investor_id ( full_name ),
          farmer:users!farmer_id ( full_name ),
          offering:steward_plan_offerings!offering_id (
            id,
            investment_plans ( name_en, name_bn )
          )
          `,
        )
        .in("offering_id", offeringIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Fetch approved farmers for the assign dropdown
  const { data: farmers } = await db
    .from("users")
    .select("id, full_name")
    .eq("role", "farmer")
    .eq("assigned_steward_id", user.id)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {!investments || investments.length === 0 ? (
        <EmptyState icon="briefcase" title={t("empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(investments as unknown as StewardInvestmentRow[]).map((inv) => (
            <AssignFarmerCard key={inv.id} investment={inv} farmers={farmers || []} />
          ))}
        </div>
      )}
    </div>
  );
}
