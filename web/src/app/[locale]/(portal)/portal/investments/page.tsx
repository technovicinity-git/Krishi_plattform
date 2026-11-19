import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

/** The columns this page selects (Supabase can't infer the join's shape). */
type InvestmentRow = {
  id: string;
  reference: string;
  status: string;
  units: number;
  amount: number;
  offering: {
    investment_plans: {
      name_en: string | null;
      name_bn: string | null;
      duration_months: number | null;
      estimated_roi_min: number | string | null;
      estimated_roi_max: number | string | null;
    } | null;
  } | null;
};

export default async function InvestorInvestmentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") redirect("/login");

  const t = await getTranslations("app.myInvestments");
  const ts = await getTranslations("app.status");
  const locale = await getLocale();
  const db = createAdminClient();

  const { data: investments } = await db
    .from("investments")
    .select(`
      id, reference, units, amount, status, created_at,
      offering:steward_plan_offerings!offering_id (
        id,
        investment_plans!inner ( name_en, name_bn, duration_months, estimated_roi_min, estimated_roi_max )
      )
    `)
    .eq("investor_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {!investments || investments.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            {t("empty")}
          </p>
          <Link
            href="/plans"
            className="mt-4 inline-flex h-[44px] items-center justify-center rounded-[4px] bg-brand px-6 text-[13px] font-semibold text-white hover:bg-brand-hover"
          >
            {t("explorePlans")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(investments as unknown as InvestmentRow[]).map((inv) => {
            const plan = inv.offering?.investment_plans;
            const planName = (locale === "bn" ? plan?.name_bn : plan?.name_en) || plan?.name_en || t("unknownPlan");
            
            return (
              <div key={inv.id} className="flex flex-col overflow-hidden rounded-xl border border-border-light bg-white">
                {/* Header */}
                <div className="border-b border-border-light bg-stone/30 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-ink-muted">{inv.reference}</span>
                    <span className="inline-flex rounded bg-[#E8F0EA] px-2 py-0.5 text-[10px] font-bold uppercase text-green-deep">
                      {ts.has(inv.status) ? ts(inv.status) : inv.status}
                    </span>
                  </div>
                  <h3 className="mt-1 font-serif text-[20px] text-ink">{planName}</h3>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">{t("investedAmount")}</span>
                    <span className="font-bold text-ink">{formatBDT(inv.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">{t("units")}</span>
                    <span className="font-semibold text-ink">{t("unitsCount", { count: inv.units })}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">{t("duration")}</span>
                    <span className="font-semibold text-ink">{t("months", { count: plan?.duration_months ?? 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">{t("estRoi")}</span>
                    <span className="font-semibold text-brand">
                      {plan?.estimated_roi_min}–{plan?.estimated_roi_max}%
                    </span>
                  </div>
                  
                  <div className="mt-4 border-t border-border-light pt-4">
                    <Link
                      href={`/portal/investments/${inv.id}`}
                      className="inline-flex h-[40px] w-full items-center justify-center rounded-[4px] bg-brand text-[13px] font-semibold text-white hover:bg-brand-hover"
                    >
                      {t("view")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}