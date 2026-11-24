import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestmentDetail } from "@/lib/investments/detail";
import { StageTimeline } from "@/components/investment/StageTimeline";
import { StatsGrid, formatBDT } from "@/components/investment/StatsGrid";
import { UpdatesList } from "@/components/investment/UpdatesList";
import { FundRequestsList } from "@/components/investment/FundRequestsList";
import { ExpensesList } from "@/components/investment/ExpensesList";
import { SalePanel } from "@/components/investment/SalePanel";
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
import { TotalLossCard } from "@/components/investment/TotalLossCard";
import { totalLossBlocker } from "@/lib/investments/total-loss";
import { createAdminClient } from "@/lib/supabase/admin";
import { AssignFarmerPanel } from "@/components/steward/AssignFarmerPanel";
import { StewardMonthlyPayPanel } from "@/components/steward/StewardMonthlyPayPanel";
import { getBatchMonthlyPay } from "@/lib/investments/monthly-pay";

export const dynamic = "force-dynamic";

export default async function StewardInvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const { id } = await params;
  const inv = await getInvestmentDetail(id);
  if (!inv || inv.steward.id !== user.id) notFound();

  const monthlyPay = await getBatchMonthlyPay(id);
  const t = await getTranslations("app.investmentDetail");
  const tst = await getTranslations("app.stage");
  const locale = await getLocale();
  const bn = locale === "bn";
  const planName = bn ? inv.offering.planNameBn : inv.offering.planNameEn;

  // Waiting for a farmer: this steward's active farmers, to assign one here.
  const awaitingFarmer = inv.currentStage === "awaiting_farmer";
  const { data: farmers } = awaitingFarmer
    ? await createAdminClient()
        .from("users")
        .select("id, full_name")
        .eq("role", "farmer")
        .eq("assigned_steward_id", user.id)
        .eq("status", "active")
        .order("full_name", { ascending: true })
    : { data: [] };

  // Every animal died (or is reported dead): offer to close as a total loss.
  const saleOpen = inv.sale && inv.sale.status !== "rejected";
  const showTotalLoss =
    inv.currentStage === "growing_care" &&
    !saleOpen &&
    inv.animals.length > 0 &&
    inv.animals.every((a) => a.status === "dead" || a.status === "death_reported");
  const lossBlocker = showTotalLoss
    ? totalLossBlocker({
        stage: inv.currentStage,
        animalStatuses: inv.animals.map((a) => a.status),
        pendingFundRequests: inv.fundRequests.filter((r) => r.status === "pending").length,
        saleStatus: inv.sale?.status ?? null,
      })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={<BackLink href="/steward/investments">{t("backToInvestments")}</BackLink>}
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

      {awaitingFarmer && <AssignFarmerPanel investmentId={inv.id} farmers={farmers ?? []} />}

      <StatsGrid
        items={[
          { label: t("units"), value: `${inv.units}` },
          { label: t("investor"), value: inv.investor.fullName ?? "—" },
          { label: t("farmer"), value: inv.farmer?.fullName ?? t("unassigned") },
          { label: t("fundsReleased"), value: formatBDT(inv.stats.fundsReleased), accent: true },
        ]}
      />

      {showTotalLoss && (
        <TotalLossCard
          investmentId={inv.id}
          capital={inv.amount}
          spent={inv.stats.capitalSpent}
          animals={inv.animals.length}
          blocker={lossBlocker}
          sentBackReason={inv.sale?.kind === "total_loss" ? inv.sale.rejectionReason : null}
        />
      )}

      {inv.sale && !(showTotalLoss && inv.sale.kind === "total_loss") && (
        <SalePanel investmentId={inv.id} sale={inv.sale} settlement={inv.settlement} viewer="steward" />
      )}

      {inv.animals.length > 0 && <AnimalsPanel animals={inv.animals} recordAs="steward" />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <FundRequestsList requests={inv.fundRequests} isSteward />
          <ExpensesList expenses={inv.expenses} isSteward />
          <UpdatesList updates={inv.updates} />
        </div>
        <div className="flex flex-col gap-6">
          <Panel title={t("summary")} className="h-fit">
            <DetailRow label={t("investor")} value={inv.investor.fullName ?? "—"} />
            <DetailRow label={t("investorPhone")} value={inv.investor.phone ?? "—"} />
            <DetailRow label={t("farmer")} value={inv.farmer?.fullName ?? t("unassigned")} />
            <DetailRow label={t("farmerPhone")} value={inv.farmer?.phone ?? "—"} />
            <DetailRow label={t("invested")} value={formatBDT(inv.amount)} />
            <DetailRow label={t("duration")} value={t("months", { count: inv.offering.durationMonths })} />
          </Panel>
          {monthlyPay && (monthlyPay.rate || monthlyPay.payments.length > 0) && <StewardMonthlyPayPanel pay={monthlyPay} />}
        </div>
      </div>
    </div>
  );
}
