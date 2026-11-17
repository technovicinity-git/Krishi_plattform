import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvestorInvestmentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") redirect("/login");

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
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          My Investments
        </h1>
        <p className="text-[13px] text-ink-secondary">
          Track your active livestock investments and their progress.
        </p>
      </div>

      {!investments || investments.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            You don't have any active investments yet.
          </p>
          <Link
            href="/plans"
            className="mt-4 inline-flex h-[44px] items-center justify-center rounded-[4px] bg-terracotta px-6 text-[13px] font-semibold text-white hover:bg-[#B85A3F]"
          >
            Explore Investment Plans →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {investments.map((inv: any) => {
            const plan = inv.offering?.investment_plans;
            const planName = plan?.name_en || "Unknown Plan";
            
            return (
              <div key={inv.id} className="flex flex-col overflow-hidden rounded-xl border border-border-light bg-white">
                {/* Header */}
                <div className="border-b border-border-light bg-stone/30 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-ink-muted">{inv.reference}</span>
                    <span className="inline-flex rounded bg-[#E8F0EA] px-2 py-0.5 text-[10px] font-bold uppercase text-green-deep">
                      {inv.status}
                    </span>
                  </div>
                  <h3 className="mt-1 font-serif text-[20px] text-ink">{planName}</h3>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">Invested Amount</span>
                    <span className="font-bold text-ink">{formatBDT(inv.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">Units</span>
                    <span className="font-semibold text-ink">{inv.units} Units</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">Duration</span>
                    <span className="font-semibold text-ink">{plan?.duration_months} Months</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">Est. ROI</span>
                    <span className="font-semibold text-terracotta">
                      {plan?.estimated_roi_min}–{plan?.estimated_roi_max}%
                    </span>
                  </div>
                  
                  <div className="mt-4 border-t border-border-light pt-4">
                    <Link
                      href={`/portal/investments/${inv.id}`}
                      className="inline-flex h-[40px] w-full items-center justify-center rounded-[4px] bg-ink text-[13px] font-semibold text-white hover:bg-[#2A2A2A]"
                    >
                      View Investment →
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