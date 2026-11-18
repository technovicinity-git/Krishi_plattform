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

  const t = await getTranslations("app.investmentDetail");
  const tst = await getTranslations("app.stage");
  const locale = await getLocale();
  const bn = locale === "bn";
  const planName = bn ? inv.offering.planNameBn : inv.offering.planNameEn;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={<BackLink href="/steward/investments">{t("backToInvestments")}</BackLink>}
        eyebrow={<span className="font-mono">{inv.reference}</span>}
        title={planName}
        actions={
          <StatusBadge tone={toneFor(inv.currentStage)} className="text-[11px]">
            {tst.has(inv.currentStage) ? tst(inv.currentStage) : inv.currentStage}
          </StatusBadge>
        }
      />

      <StageTimeline currentStage={inv.currentStage} />

      <StatsGrid
        items={[
          { label: t("units"), value: `${inv.units}` },
          { label: t("investor"), value: inv.investor.fullName ?? "—" },
          { label: t("farmer"), value: inv.farmer?.fullName ?? t("unassigned") },
          { label: t("fundsReleased"), value: formatBDT(inv.stats.fundsDisbursed), accent: true },
        ]}
      />

      {inv.sale && (
        <SalePanel investmentId={inv.id} sale={inv.sale} settlement={inv.settlement} viewer="steward" />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <FundRequestsList requests={inv.fundRequests} isSteward />
          <ExpensesList expenses={inv.expenses} isSteward />
          <UpdatesList updates={inv.updates} />
        </div>
        <Panel title={t("summary")} className="h-fit">
          <DetailRow label={t("investor")} value={inv.investor.fullName ?? "—"} />
          <DetailRow label={t("investorPhone")} value={inv.investor.phone ?? "—"} />
          <DetailRow label={t("farmer")} value={inv.farmer?.fullName ?? t("unassigned")} />
          <DetailRow label={t("farmerPhone")} value={inv.farmer?.phone ?? "—"} />
          <DetailRow label={t("invested")} value={formatBDT(inv.amount)} />
          <DetailRow label={t("duration")} value={t("months", { count: inv.offering.durationMonths })} />
        </Panel>
      </div>
    </div>
  );
}
