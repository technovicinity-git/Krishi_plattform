import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestmentDetail } from "@/lib/investments/detail";
import { StageTimeline } from "@/components/investment/StageTimeline";
import { StatsGrid, formatBDT } from "@/components/investment/StatsGrid";
import { UpdatesList } from "@/components/investment/UpdatesList";
import { FundRequestsList } from "@/components/investment/FundRequestsList";
import { FarmerActions } from "@/components/investment/FarmerActions";
import { ExpensesList } from "@/components/investment/ExpensesList";
import { SalePanel } from "@/components/investment/SalePanel";
import { createAdminClient } from "@/lib/supabase/admin";
import { BackLink } from "@/components/ui/BackLink";
import {
  DetailRow,
  PageHeader,
  Panel,
  StatusBadge,
  toneFor,
} from "@/components/dashboard/ui";
import { AnimalsPanel } from "@/components/animals/AnimalsPanel";
import { ReportDownload } from "@/components/reports/ReportDownload";

export const dynamic = "force-dynamic";

export default async function FarmerInvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const { id } = await params;
  const inv = await getInvestmentDetail(id);

  // Only the assigned farmer may open this batch.
  if (!inv || inv.farmer?.id !== user.id) notFound();

  const t = await getTranslations("app.investmentDetail");
  const tst = await getTranslations("app.stage");
  const locale = await getLocale();
  const bn = locale === "bn";
  const planName = bn ? inv.offering.planNameBn : inv.offering.planNameEn;

  // Krishi's receiving accounts, shown when the farmer sends the sale money.
  const needsAccounts = inv.sale?.status === "awaiting_remittance";
  const { data: accountRows } = needsAccounts
    ? await createAdminClient()
        .from("platform_accounts")
        .select("id, method, provider, account_name, account_number, branch_name")
        .eq("is_active", true)
    : { data: [] };
  const accounts = (accountRows ?? []).map((a) => ({
    id: a.id,
    method: a.method,
    provider: a.provider,
    accountName: a.account_name,
    accountNumber: a.account_number,
    branchName: a.branch_name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={<BackLink href="/farmer">{t("backToAssignments")}</BackLink>}
        eyebrow={<span className="font-mono">{inv.reference}</span>}
        title={planName}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ReportDownload endpoint={`/api/reports/investment/${inv.id}`} />
            <StatusBadge tone={toneFor(inv.currentStage)} className="text-[11px]">
              {tst.has(inv.currentStage) ? tst(inv.currentStage) : inv.currentStage}
            </StatusBadge>
          </div>
        }
      />

      <StageTimeline currentStage={inv.currentStage} />

      <StatsGrid
        items={[
          { label: t("units"), value: `${inv.units}` },
          { label: t("animalBudget"), value: formatBDT(inv.stats.animalBudgetTotal) },
          { label: t("careBudget"), value: formatBDT(inv.stats.careBudgetTotal) },
          { label: t("fundsReceived"), value: formatBDT(inv.stats.fundsDisbursed), accent: true },
        ]}
      />

      {inv.sale && (
        <SalePanel
          investmentId={inv.id}
          sale={inv.sale}
          settlement={inv.settlement}
          viewer="farmer"
          accounts={accounts}
        />
      )}

      <FarmerActions
        investmentId={inv.id}
        currentStage={inv.currentStage}
        units={inv.units}
        saleRejected={inv.sale?.status === "rejected"}
        activeAnimals={inv.animals.filter((a) => a.status === "active")}
      />

      {inv.animals.length > 0 && <AnimalsPanel animals={inv.animals} canEdit canRecord />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <UpdatesList updates={inv.updates} />
          <FundRequestsList requests={inv.fundRequests} />
          <ExpensesList expenses={inv.expenses} />
        </div>
        <Panel title={t("details")} className="h-fit">
          <DetailRow label={t("plan")} value={planName} />
          <DetailRow label={t("category")} value={(bn ? inv.offering.categoryNameBn : inv.offering.categoryName) ?? "—"} />
          <DetailRow label={t("district")} value={(bn ? inv.offering.districtNameBn : inv.offering.districtName) ?? "—"} />
          <DetailRow label={t("duration")} value={t("months", { count: inv.offering.durationMonths })} />
          <DetailRow label={t("steward")} value={inv.steward.fullName ?? "—"} />
          <DetailRow label={t("investor")} value={inv.investor.fullName ?? "—"} />
        </Panel>
      </div>
    </div>
  );
}
