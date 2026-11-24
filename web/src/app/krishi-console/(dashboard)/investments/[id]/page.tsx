import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/current-admin";
import { getInvestmentDetail } from "@/lib/investments/detail";
import { formatBDT } from "@/lib/utils";
import { BackLink } from "@/components/ui/BackLink";
import { DetailRow, PageHeader, Panel, StatusBadge, toneFor } from "@/components/dashboard/ui";
import { StageTimeline } from "@/components/investment/StageTimeline";
import { StatsGrid } from "@/components/investment/StatsGrid";
import { SalePanel } from "@/components/investment/SalePanel";
import { FundRequestsList } from "@/components/investment/FundRequestsList";
import { ExpensesList } from "@/components/investment/ExpensesList";
import { UpdatesList } from "@/components/investment/UpdatesList";
import { AnimalsPanel } from "@/components/animals/AnimalsPanel";
import { ReportDownload } from "@/components/reports/ReportDownload";
import { BatchMonthlyPayPanel } from "@/components/admin/BatchMonthlyPayPanel";
import { getBatchMonthlyPay } from "@/lib/investments/monthly-pay";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  awaiting_farmer: "Awaiting farmer",
  awaiting_purchase: "Buying animals",
  growing_care: "Raising",
  sale_pending: "Sale pending",
  sold: "Sold",
  settled: "Settled",
};

/**
 * One batch's progress for admins, at any stage: stage, money, animals, fund
 * requests, expenses, timeline, and the sale / settlement once there is one.
 * Read-only; decisions stay with the steward (and the sale review page).
 */
export default async function AdminInvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [inv, monthlyPay] = await Promise.all([getInvestmentDetail(id), getBatchMonthlyPay(id)]);
  if (!inv) notFound();

  const s = inv.stats;
  const pendingFunds = inv.fundRequests.filter((r) => r.status === "pending").length;
  const pendingExpenses = inv.expenses.filter((e) => e.status === "pending").length;
  const deathReports = inv.animals.filter((a) => a.status === "death_reported").length;
  const saleNeedsAdmin = inv.sale?.status === "remittance_submitted";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={
          <BackLink href="/krishi-console/investments" localized={false}>
            Back to Batches
          </BackLink>
        }
        eyebrow={<span className="font-mono">{inv.reference}</span>}
        title={inv.offering.planNameEn}
        description={
          <>
            {inv.units} unit{inv.units === 1 ? "" : "s"} · invested {formatBDT(inv.amount)} · started{" "}
            {new Date(inv.createdAt).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric" })}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ReportDownload endpoint={`/api/reports/investment/${inv.id}`} locale="en" />
            <StatusBadge tone={toneFor(inv.currentStage)} className="text-[11px]">
              {STAGE_LABEL[inv.currentStage] ?? inv.currentStage}
            </StatusBadge>
          </div>
        }
      />

      {(saleNeedsAdmin || pendingFunds > 0 || pendingExpenses > 0 || deathReports > 0) && (
        <div className="flex flex-col gap-1 rounded-xl border border-[#EBD9A8] bg-[#FBF5E6] px-4 py-3 text-[13px] text-[#9A6B12]">
          {saleNeedsAdmin && inv.sale && (
            <span>
              Krishi needs to confirm the payment and settle.{" "}
              <Link href={`/krishi-console/sales/${inv.sale.id}`} className="font-semibold underline">
                Open the sale review
              </Link>
            </span>
          )}
          {pendingFunds > 0 && <span>{pendingFunds} fund request{pendingFunds === 1 ? "" : "s"} waiting for the steward.</span>}
          {pendingExpenses > 0 && <span>{pendingExpenses} expense{pendingExpenses === 1 ? "" : "s"} waiting for the steward.</span>}
          {deathReports > 0 && <span>{deathReports} reported animal death{deathReports === 1 ? "" : "s"} waiting for the steward.</span>}
        </div>
      )}

      <StageTimeline currentStage={inv.currentStage} />

      <StatsGrid
        items={[
          { label: "Invested", value: formatBDT(inv.amount) },
          { label: "Animal purchase", value: formatBDT(s.purchaseCost) },
          { label: "Paid out of capital", value: formatBDT(s.fundsReleased) },
          { label: "Spent on the batch", value: formatBDT(s.capitalSpent), accent: true },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {inv.sale && <SalePanel investmentId={inv.id} sale={inv.sale} settlement={inv.settlement} viewer="admin" />}
          {inv.animals.length > 0 && <AnimalsPanel animals={inv.animals} />}
          <FundRequestsList requests={inv.fundRequests} />
          <ExpensesList expenses={inv.expenses} />
          <UpdatesList updates={inv.updates} />
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="People" className="h-fit">
            <DetailRow label="Investor" value={inv.investor.fullName ?? "—"} />
            <DetailRow label="Investor phone" value={inv.investor.phone ?? "—"} />
            <DetailRow label="Steward" value={inv.steward.fullName ?? "—"} />
            <DetailRow label="Farmer" value={inv.farmer?.fullName ?? "Not assigned yet"} />
            <DetailRow label="Farmer phone" value={inv.farmer?.phone ?? "—"} />
          </Panel>
          <Panel title="Money" className="h-fit">
            <DetailRow label="Invested" value={formatBDT(inv.amount)} />
            <DetailRow label="Animal budget" value={formatBDT(s.animalBudgetTotal)} />
            <DetailRow label="Care budget" value={formatBDT(s.careBudgetTotal)} />
            <DetailRow label="Animal purchase" value={formatBDT(s.purchaseCost)} />
            <DetailRow label="Fund requests approved" value={formatBDT(s.fundsDisbursed)} />
            <DetailRow label="Expenses approved" value={formatBDT(s.expensesApproved)} />
            {s.leftover > 0 && <DetailRow label="Unspent fund money" value={formatBDT(s.leftover)} />}
            <DetailRow label="Spent on the batch" value={formatBDT(s.capitalSpent)} />
            <DetailRow label="Not yet spent" value={formatBDT(Math.max(0, inv.amount - s.capitalSpent))} />
          </Panel>
          {monthlyPay && (
            <BatchMonthlyPayPanel investmentId={inv.id} pay={monthlyPay} stewardName={inv.steward.fullName ?? "the steward"} />
          )}
          <Panel title="Plan" className="h-fit">
            <DetailRow label="Duration" value={`${inv.offering.durationMonths} months`} />
            <DetailRow label="Est. return" value={`${inv.offering.roiMin}–${inv.offering.roiMax}%`} />
            <DetailRow label="Unit price" value={formatBDT(inv.offering.unitPrice)} />
            <DetailRow label="Category" value={inv.offering.categoryName} />
            <DetailRow label="District" value={inv.offering.districtName} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
