import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInvestmentDetail } from "@/lib/investments/detail";
import { StageTimeline } from "@/components/investment/StageTimeline";
import { StatsGrid, formatBDT } from "@/components/investment/StatsGrid";
import { UpdatesList } from "@/components/investment/UpdatesList";
import { BackLink } from "@/components/ui/BackLink";

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
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackLink href="/portal/investments">{t("backToInvestments")}</BackLink>
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] font-bold text-ink-muted">
              {inv.reference}
            </span>
            <h1 className="mt-1 font-serif text-[28px] text-ink">
              {planName}
            </h1>
          </div>
          <span className="inline-flex rounded bg-[#FEF6E5] px-2.5 py-1 text-[10px] font-bold uppercase text-[#C48A2E]">
            {tst.has(inv.currentStage) ? tst(inv.currentStage) : inv.currentStage.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <StageTimeline currentStage={inv.currentStage} />

      <StatsGrid
        items={[
          { label: t("invested"), value: formatBDT(inv.amount) },
          { label: t("units"), value: `${inv.units}` },
          { label: t("estReturn"), value: `${inv.offering.roiMin}–${inv.offering.roiMax}%`, accent: true },
          { label: t("careUsed"), value: formatBDT(inv.stats.careBudgetUsed) },
        ]}
      />

      <UpdatesList updates={inv.updates} />

      <div className="rounded-xl border border-border-light bg-white p-6">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
          {t("summary")}
        </h2>
        <div className="mt-3 flex flex-col gap-2 text-[13px]">
          <Row label={t("plan")} value={planName} />
          <Row label={t("category")} value={bn ? inv.offering.categoryNameBn : inv.offering.categoryName} />
          <Row label={t("district")} value={bn ? inv.offering.districtNameBn : inv.offering.districtName} />
          <Row label={t("duration")} value={t("months", { count: inv.offering.durationMonths })} />
          <Row label={t("steward")} value={inv.steward.fullName ?? "—"} />
          <Row label={t("farmer")} value={inv.farmer?.fullName ?? t("unassigned")} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-light py-2 last:border-b-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}