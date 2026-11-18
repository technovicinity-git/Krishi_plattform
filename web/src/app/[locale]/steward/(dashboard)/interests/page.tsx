import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { InterestApprovalCard } from "@/components/steward/InterestApprovalCard";
import { InterestHistoryCard } from "@/components/steward/InterestHistoryCard";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";
import type { StewardInterestRow } from "@/components/steward/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function StewardInterestsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") {
    redirect("/login");
  }

  const { view: viewParam } = await searchParams;
  const view = viewParam === "history" ? "history" : "pending";

  const statuses =
    view === "history"
      ? ["approved", "not_approved", "onboarding", "converted", "expired", "cancelled"]
      : ["submitted", "under_review"];

  const db = createAdminClient();

  const t = await getTranslations("app.stewardInterests");
  const { data: myOfferings } = await db
    .from("steward_plan_offerings")
    .select("id")
    .eq("steward_id", user.id);

  const offeringIds = (myOfferings ?? []).map((o) => o.id);

  if (offeringIds.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("title")} />
        <EmptyState icon="inbox" title={t("noOfferings")} />
      </div>
    );
  }

  const { data: interests } = await db
    .from("investment_interests")
    .select(
      `
      id, reference, status, requested_units, created_at, reviewed_at,
      guest_name, guest_phone, rejection_reason,
      investor:users!investor_id ( full_name, phone ),
      offering:steward_plan_offerings!offering_id (
        id,
        investment_plans ( name_en, name_bn )
      )
      `,
    )
    .in("offering_id", offeringIds)
    .in("status", statuses)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <Tabs
        items={[
          { label: t("pending"), href: "/steward/interests", active: view === "pending" },
          { label: t("history"), href: "/steward/interests?view=history", active: view === "history" },
        ]}
      />

      {!interests || interests.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={view === "pending" ? t("emptyPending") : t("emptyHistory")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(interests as unknown as StewardInterestRow[]).map((interest) =>
            view === "pending" ? (
              <InterestApprovalCard key={interest.id} interest={interest} />
            ) : (
              <InterestHistoryCard key={interest.id} interest={interest} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
