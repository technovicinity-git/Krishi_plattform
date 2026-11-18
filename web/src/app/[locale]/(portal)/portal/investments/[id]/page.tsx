import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestmentDetail } from "@/lib/investments/detail";
import { StageTimeline } from "@/components/investment/StageTimeline";
import { StatsGrid, formatBDT } from "@/components/investment/StatsGrid";
import { UpdatesList } from "@/components/investment/UpdatesList";
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

export default async function InvestorInvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") redirect("/login");

  const { id } = await params;
  const inv = await getInvestmentDetail(id);
  if (!inv || inv.investor.id !== user.id) notFound();

  const t = await getTranslations("app.investmentDetail");
  const tst = await getTranslations("app.stage");
  const locale = await getLocale();
  const bn = locale === "bn";
  const planName = bn ? inv.offering.planNameBn : inv.offering.planNameEn;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={<BackLink href="/portal/investments">{t("backToInvestments")}</BackLink>}
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
          { label: t("invested"), value: formatBDT(inv.amount) },
          { label: t("units"), value: `${inv.units}` },
          inv.settlement
            ? { label: t("yourPayout"), value: formatBDT(inv.settlement.investorPayout), accent: true }
            : { label: t("estReturn"), value: `${inv.offering.roiMin}–${inv.offering.roiMax}%`, accent: true },
          inv.settlement
            ? {
                label: t("actualReturn"),
                value: `${inv.settlement.investorPayout >= inv.amount ? "+" : "−"}${formatBDT(Math.abs(inv.settlement.investorPayout - inv.amount))}`,
              }
            : { label: t("careUsed"), value: formatBDT(inv.stats.careBudgetUsed) },
        ]}
      />

      {inv.sale && inv.sale.status !== "rejected" && (
        <SalePanel investmentId={inv.id} sale={inv.sale} settlement={inv.settlement} viewer="investor" />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <UpdatesList updates={inv.updates} />
        <Panel title={t("summary")} className="h-fit">
          <DetailRow label={t("plan")} value={planName} />
          <DetailRow label={t("category")} value={(bn ? inv.offering.categoryNameBn : inv.offering.categoryName) ?? "—"} />
          <DetailRow label={t("district")} value={(bn ? inv.offering.districtNameBn : inv.offering.districtName) ?? "—"} />
          <DetailRow label={t("duration")} value={t("months", { count: inv.offering.durationMonths })} />
          <DetailRow label={t("steward")} value={inv.steward.fullName ?? "—"} />
          <DetailRow label={t("farmer")} value={inv.farmer?.fullName ?? t("unassigned")} />
        </Panel>
      </div>
    </div>
  );
}
