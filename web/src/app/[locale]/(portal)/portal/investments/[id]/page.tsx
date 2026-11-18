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
import { AnimalsPanel } from "@/components/animals/AnimalsPanel";
import { ReviewPanel } from "@/components/reviews/ReviewPanel";
import { getReviewForInvestment } from "@/lib/reviews";
import { ReportDownload } from "@/components/reports/ReportDownload";

export const dynamic = "force-dynamic";

export default async function InvestorInvestmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") redirect("/login");

  const { id } = await params;
  const inv = await getInvestmentDetail(id);
  if (!inv || inv.investor.id !== user.id) notFound();

  const review = inv.currentStage === "settled" ? await getReviewForInvestment(inv.id) : null;
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
          <div className="flex flex-wrap items-center gap-3">
            <ReportDownload endpoint={`/api/reports/investment/${inv.id}`} />
            <StatusBadge tone={toneFor(inv.currentStage)} className="text-[11px]">
              {tst.has(inv.currentStage) ? tst(inv.currentStage) : inv.currentStage}
            </StatusBadge>
          </div>
        }
      />

      {(await searchParams).payment === "success" && (
        <div className="rounded-xl border border-brand/30 bg-brand-tint px-4 py-3 text-[13px] font-semibold text-green-deep">
          {(await getTranslations("app.onlinePayment"))("success", { reference: inv.reference })}
        </div>
      )}

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

      {inv.currentStage === "settled" && (
        <ReviewPanel investmentId={inv.id} stewardName={inv.steward.fullName ?? "—"} review={review} />
      )}

      {inv.animals.length > 0 && <AnimalsPanel animals={inv.animals} />}

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
