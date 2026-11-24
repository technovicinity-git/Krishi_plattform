import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvestmentDetail } from "@/lib/investments/detail";
import { previewSettlement } from "@/lib/investments/settle";
import { formatBDT } from "@/lib/utils";
import { BackLink } from "@/components/ui/BackLink";
import { DetailRow, PageHeader, Panel } from "@/components/dashboard/ui";
import { SalePanel } from "@/components/investment/SalePanel";
import { SettlementSummary } from "@/components/investment/SettlementSummary";
import { FundRequestsList } from "@/components/investment/FundRequestsList";
import { ExpensesList } from "@/components/investment/ExpensesList";
import { UpdatesList } from "@/components/investment/UpdatesList";
import { SettleSaleActions } from "@/components/admin/SettleSaleActions";
import { AnimalsPanel } from "@/components/animals/AnimalsPanel";
import { ReportDownload } from "@/components/reports/ReportDownload";
import { BatchMonthlyPayPanel } from "@/components/admin/BatchMonthlyPayPanel";
import { getBatchMonthlyPay } from "@/lib/investments/monthly-pay";

export const dynamic = "force-dynamic";

export default async function AdminSaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const { data: row } = await createAdminClient()
    .from("investment_sales")
    .select("investment_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  const inv = await getInvestmentDetail(row.investment_id);
  if (!inv || !inv.sale) notFound();
  const sale = inv.sale;

  const awaitingDecision = sale.status === "remittance_submitted";
  const preview = awaitingDecision ? await previewSettlement(sale.id) : null;
  const b = preview?.ok ? preview.breakdown : null;
  const mp = preview?.ok ? preview.monthlyPay : null;
  const monthlyPay = await getBatchMonthlyPay(row.investment_id);
  const outcomeText = b
    ? b.outcome === "profit"
      ? `Profit ${formatBDT(b.netResult)}; investor receives ${formatBDT(b.investorPayout)}.`
      : b.outcome === "loss"
        ? `Loss ${formatBDT(Math.abs(b.netResult))}; investor receives ${formatBDT(b.investorPayout)}.`
        : `Break-even; investor receives ${formatBDT(b.investorPayout)}.`
    : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={
          <BackLink href="/krishi-console/sales" localized={false}>
            Back to Sales
          </BackLink>
        }
        eyebrow={<span className="font-mono">{inv.reference}</span>}
        title={inv.offering.planNameEn}
        description={<>{inv.units} unit{inv.units === 1 ? "" : "s"} · invested {formatBDT(inv.amount)}</>}
        actions={<ReportDownload endpoint={`/api/reports/investment/${inv.id}`} locale="en" />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <SalePanel investmentId={inv.id} sale={sale} settlement={inv.settlement} viewer="admin" />

          {b && (
            <Panel title="Settlement preview" description="What will be saved when you confirm the payment.">
              <SettlementSummary breakdown={b} preview />
              {mp && mp.monthlyTotal > 0 && (
                <div className="mt-5 rounded-xl border border-border-light bg-cream px-4 py-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">Steward monthly pay</p>
                  <DetailRow
                    label={`${mp.months} month${mp.months === 1 ? "" : "s"} × ${formatBDT(mp.rate)}`}
                    value={formatBDT(mp.monthlyTotal)}
                  />
                  <DetailRow label="Already sent" value={formatBDT(mp.sentTotal)} />
                  {mp.sendNow > 0 && <DetailRow label="Sent now (months not sent yet)" value={formatBDT(mp.sendNow)} />}
                  <DetailRow label="Steward's 5% share" value={formatBDT(mp.share)} />
                  <DetailRow label="Steward gets now (share minus monthly pay)" value={formatBDT(mp.topup)} />
                  <DetailRow
                    label="Krishi loss"
                    value={<span className={mp.platformLoss > 0 ? "text-danger" : undefined}>{formatBDT(mp.platformLoss)}</span>}
                  />
                </div>
              )}
            </Panel>
          )}

          {inv.animals.length > 0 && <AnimalsPanel animals={inv.animals} />}
          <FundRequestsList requests={inv.fundRequests} />
          <ExpensesList expenses={inv.expenses} />
          <UpdatesList updates={inv.updates} />
        </div>

        <div className="flex flex-col gap-6">
          {awaitingDecision && b && (
            <SettleSaleActions
              saleId={sale.id}
              amount={sale.saleAmount + sale.fundsReturned}
              outcomeText={outcomeText}
              totalLoss={sale.kind === "total_loss" && sale.fundsReturned === 0}
            />
          )}
          {monthlyPay && (monthlyPay.start || monthlyPay.payments.length > 0) && (
            <BatchMonthlyPayPanel investmentId={inv.id} pay={monthlyPay} stewardName={inv.steward.fullName ?? "the steward"} />
          )}
          <Panel title="Investment" className="h-fit">
            <DetailRow label="Investor" value={inv.investor.fullName ?? "—"} />
            <DetailRow label="Investor phone" value={inv.investor.phone ?? "—"} />
            <DetailRow label="Steward" value={inv.steward.fullName ?? "—"} />
            <DetailRow label="Farmer" value={inv.farmer?.fullName ?? "—"} />
            <DetailRow label="Farmer phone" value={inv.farmer?.phone ?? "—"} />
            <DetailRow label="Invested" value={formatBDT(inv.amount)} />
            <DetailRow label="Animal purchase" value={formatBDT(inv.stats.purchaseCost)} />
            <DetailRow label="Fund requests approved" value={formatBDT(inv.stats.fundsDisbursed)} />
            <DetailRow label="Paid out of capital" value={formatBDT(inv.stats.fundsReleased)} />
            <DetailRow label="Unspent fund money returned" value={formatBDT(sale.fundsReturned)} />
            <DetailRow label="Spent on the batch" value={formatBDT(Math.max(0, inv.stats.fundsReleased - sale.fundsReturned))} />
            <DetailRow label="Expenses approved" value={formatBDT(inv.stats.expensesApproved)} />
            <DetailRow label="Category" value={inv.offering.categoryName} />
            <DetailRow label="District" value={inv.offering.districtName} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
