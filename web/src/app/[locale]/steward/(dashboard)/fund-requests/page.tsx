import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";
import {
  FundRequestsInlineList,
  type FundRequestRow,
} from "@/components/investment/FundRequestsInlineList";

export const dynamic = "force-dynamic";

export default async function StewardFundRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const { view: viewParam } = await searchParams;
  const view = viewParam === "history" ? "history" : "pending";
  const statuses =
    view === "pending" ? ["pending"] : ["approved", "rejected", "disbursed"];

  const db = createAdminClient();

  // Step 1: my offerings
  const { data: myOfferings } = await db
    .from("steward_plan_offerings")
    .select("id")
    .eq("steward_id", user.id);

  const offeringIds = (myOfferings ?? []).map((o) => o.id);

  // Step 2: my investments
  const { data: myInvestments } = offeringIds.length
    ? await db
        .from("investments")
        .select("id")
        .in("offering_id", offeringIds)
    : { data: [] as { id: string }[] };

  const investmentIds = (myInvestments ?? []).map((i) => i.id);

  // Step 3: fund requests
  const { data: fundRequests } = investmentIds.length
    ? await db
        .from("fund_requests")
        .select(
          `
          id, reference, amount, purpose, status, rejection_reason, created_at,
          investment:investments!investment_id (
            id, reference,
            farmer:users!farmer_id ( full_name, phone ),
            offering:steward_plan_offerings!offering_id (
              investment_plans ( name_en, name_bn )
            )
          )
          `,
        )
        .in("investment_id", investmentIds)
        .in("status", statuses)
        .order("created_at", { ascending: false })
    : { data: [] };

  const count = (fundRequests ?? []).length;
  const t = await getTranslations("app.stewardFundRequests");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <Tabs
        items={[
          { label: t("pending"), href: "/steward/fund-requests", active: view === "pending" },
          { label: t("history"), href: "/steward/fund-requests?view=history", active: view === "history" },
        ]}
      />

      {count === 0 ? (
        <EmptyState
          icon="coins"
          title={view === "pending" ? t("emptyPending") : t("emptyHistory")}
        />
      ) : (
        <FundRequestsInlineList
          requests={(fundRequests ?? []) as unknown as FundRequestRow[]}
          showActions={view === "pending"}
        />
      )}
    </div>
  );
}
