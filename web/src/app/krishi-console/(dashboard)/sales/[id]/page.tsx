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
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <SalePanel investmentId={inv.id} sale={sale} settlement={inv.settlement} viewer="admin" />

          {b && (
            <Panel title="Settlement preview" description="What will be saved when you confirm the payment.">
              <SettlementSummary breakdown={b} preview />
            </Panel>
          )}

          <FundRequestsList requests={inv.fundRequests} />
          <ExpensesList expenses={inv.expenses} />
          <UpdatesList updates={inv.updates} />
        </div>

        <div className="flex flex-col gap-6">
          {awaitingDecision && b && (
            <SettleSaleActions saleId={sale.id} amount={sale.saleAmount} outcomeText={outcomeText} />
          )}
          <Panel title="Investment" className="h-fit">
            <DetailRow label="Investor" value={inv.investor.fullName ?? "—"} />
            <DetailRow label="Investor phone" value={inv.investor.phone ?? "—"} />
            <DetailRow label="Steward" value={inv.steward.fullName ?? "—"} />
            <DetailRow label="Farmer" value={inv.farmer?.fullName ?? "—"} />
            <DetailRow label="Farmer phone" value={inv.farmer?.phone ?? "—"} />
            <DetailRow label="Invested" value={formatBDT(inv.amount)} />
            <DetailRow label="Funds released" value={formatBDT(inv.stats.fundsDisbursed)} />
            <DetailRow label="Expenses approved" value={formatBDT(inv.stats.expensesApproved)} />
            <DetailRow label="Category" value={inv.offering.categoryName} />
            <DetailRow label="District" value={inv.offering.districtName} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
