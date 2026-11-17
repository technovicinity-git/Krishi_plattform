import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FarmerDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const t = await getTranslations("app.farmerHome");
  const tst = await getTranslations("app.stage");
  const locale = await getLocale();
  const db = createAdminClient();

  const { data: investments } = await db
    .from("investments")
    .select(`
      id, reference, units, amount, current_stage, created_at,
      offering:steward_plan_offerings!offering_id (
        investment_plans ( name_en, name_bn, duration_months, animal_allocation, care_allocation )
      )
    `)
    .eq("farmer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-[13px] text-ink-secondary">
          {t("subtitle")}
        </p>
      </div>

      {!investments || investments.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            {t("empty")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {investments.map((inv: any) => {
            const plan = inv.offering?.investment_plans;
            const isAwaitingPurchase = inv.current_stage === "awaiting_purchase";
            
            return (
              <div key={inv.id} className="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6">
                <div className="flex items-start justify-between border-b border-border-light pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-ink-muted">{inv.reference}</span>
                    <h3 className="mt-1 font-serif text-[20px] text-ink">{(locale === "bn" ? plan?.name_bn : plan?.name_en) ?? plan?.name_en}</h3>
                  </div>
                  <span className="inline-flex rounded bg-[#FEF6E5] px-2 py-1 text-[10px] font-bold uppercase text-[#C48A2E]">
                    {tst.has(inv.current_stage) ? tst(inv.current_stage) : inv.current_stage.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <span className="text-ink-muted">{t("units")}</span>
                    <div className="font-bold text-ink">{t("unitsCount", { count: inv.units })}</div>
                  </div>
                  <div>
                    <span className="text-ink-muted">{t("animalBudget")}</span>
                    <div className="font-semibold text-ink">{formatBDT(plan?.animal_allocation * inv.units)}</div>
                  </div>
                </div>

                {isAwaitingPurchase && (
                  <div className="mt-2 rounded-lg border border-[#F0C9C0] bg-[#FAF0ED] p-4 text-center">
                    <p className="text-[12px] text-[#A13D2B] font-semibold mb-2">{t("actionRequired")}</p>
                    <Link href={`/farmer/investments/${inv.id}`} className="inline-flex h-[40px] w-full items-center justify-center rounded bg-brand text-[13px] font-bold text-white hover:bg-brand-hover">
                      {t("actionCta")}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}