import { getLocale, getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { PageHeader, Panel, StatusBadge, toneFor } from "@/components/dashboard/ui";
import { ReportDownload } from "./ReportDownload";

/** Wallet statement + one statement per batch (investor and steward). */
export async function ReportsView({
  investmentIds,
  batchHref,
}: {
  investmentIds: string[];
  batchHref: (id: string) => string;
}) {
  const t = await getTranslations("app.reports");
  const tst = await getTranslations("app.stage");
  const bn = (await getLocale()) === "bn";

  const { data } = investmentIds.length
    ? await createAdminClient()
        .from("investments")
        .select(`
          id, reference, amount, units, current_stage, created_at,
          offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )
        `)
        .in("id", investmentIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const batches = (data ?? []).map((r) => {
    const plan = (r.offering as unknown as { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null)
      ?.investment_plans;
    return { ...r, plan: (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? "—" };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <Panel title={t("walletHeading")} description={t("walletHint")}>
        <ReportDownload endpoint="/api/reports/wallet" />
      </Panel>

      <Panel title={t("batchesHeading")} description={t("batchesHint")} bodyClassName="p-0">
        {batches.length === 0 ? (
          <p className="px-6 py-6 text-[13px] text-ink-muted">{t("noBatches")}</p>
        ) : (
          <ul className="divide-y divide-border-light">
            {batches.map((b) => (
              <li key={b.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={batchHref(b.id)} className="text-[14px] font-semibold text-ink hover:text-brand">
                      {b.plan}
                    </Link>
                    <StatusBadge tone={toneFor(b.current_stage ?? "")}>
                      {tst.has(b.current_stage ?? "") ? tst(b.current_stage ?? "") : b.current_stage}
                    </StatusBadge>
                  </div>
                  <span className="text-[12px] text-ink-muted">
                    <span className="font-mono">{b.reference}</span> · {formatBDT(Number(b.amount))}
                  </span>
                </div>
                <ReportDownload endpoint={`/api/reports/investment/${b.id}`} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
