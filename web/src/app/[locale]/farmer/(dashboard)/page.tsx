import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/icons";
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  toneFor,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

interface AssignmentRow {
  id: string;
  reference: string;
  units: number;
  current_stage: string;
  created_at: string;
  offering: {
    users: { full_name: string | null } | null;
    investment_plans: {
      name_en: string | null;
      name_bn: string | null;
      duration_months: number;
      animal_allocation: number;
      care_allocation: number;
    } | null;
  } | null;
}

const CLOSED_STAGES = ["sold", "settled"];

export default async function FarmerDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const [t, tst, locale] = await Promise.all([
    getTranslations("app.farmerDash"),
    getTranslations("app.stage"),
    getLocale(),
  ]);
  const bn = locale === "bn";
  const db = createAdminClient();

  const [{ data: investmentRows }, { data: fundRows }, { count: expenseCount }] =
    await Promise.all([
      db
        .from("investments")
        .select(
          `
          id, reference, units, current_stage, created_at,
          offering:steward_plan_offerings!offering_id (
            users!steward_id ( full_name ),
            investment_plans ( name_en, name_bn, duration_months, animal_allocation, care_allocation )
          )
          `,
        )
        .eq("farmer_id", user.id)
        .order("created_at", { ascending: false }),
      db.from("fund_requests").select("amount, status").eq("farmer_id", user.id),
      db
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("farmer_id", user.id),
    ]);

  const assignments = (investmentRows ?? []) as unknown as AssignmentRow[];
  const active = assignments.filter((a) => !CLOSED_STAGES.includes(a.current_stage));
  const unitsInCare = active.reduce((sum, a) => sum + a.units, 0);
  const funds = fundRows ?? [];
  const pendingFunds = funds.filter((f) => f.status === "pending").length;
  const approvedFunds = funds
    .filter((f) => f.status === "approved" || f.status === "disbursed")
    .reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("welcome", { name: user.fullName?.split(" ")[0] ?? "" })}
        description={t("subtitle")}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("statBatches")}
          value={active.length}
          hint={t("statUnits", { count: unitsInCare })}
          icon="leaf"
        />
        <StatCard
          label={t("statPendingFunds")}
          value={pendingFunds}
          icon="coins"
          href="/farmer/fund-requests"
          tone={pendingFunds > 0 ? "warning" : "default"}
        />
        <StatCard
          label={t("statApprovedFunds")}
          value={formatBDT(approvedFunds)}
          icon="wallet"
          href="/farmer/fund-requests"
        />
        <StatCard
          label={t("statExpenses")}
          value={expenseCount ?? 0}
          icon="receipt"
          href="/farmer/expenses"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[17px] font-semibold text-ink">{t("assignments")}</h2>
          <p className="text-[13px] text-ink-muted">{t("assignmentsHint")}</p>
        </div>

        {assignments.length === 0 ? (
          <EmptyState icon="leaf" title={t("empty")} description={t("emptyHint")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {assignments.map((a) => {
              const plan = a.offering?.investment_plans;
              const planName = (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? a.reference;
              const needsPurchase = a.current_stage === "awaiting_purchase";
              return (
                <Link
                  key={a.id}
                  href={`/farmer/investments/${a.id}`}
                  className={`group flex flex-col gap-4 rounded-2xl border bg-white p-6 transition-colors hover:border-brand/50 ${
                    needsPurchase ? "border-brand/50 ring-1 ring-brand/15" : "border-border-light"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-mono text-[11px] font-semibold text-ink-muted">
                        {a.reference}
                      </span>
                      <h3 className="font-serif text-[21px] leading-tight text-ink">{planName}</h3>
                    </div>
                    <StatusBadge tone={toneFor(a.current_stage)}>
                      {tst.has(a.current_stage) ? tst(a.current_stage) : a.current_stage}
                    </StatusBadge>
                  </div>

                  <dl className="grid grid-cols-3 gap-3 rounded-xl bg-cream px-4 py-3 text-[12px]">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-ink-muted">{t("steward")}</dt>
                      <dd className="truncate font-semibold text-ink">
                        {a.offering?.users?.full_name ?? "—"}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-ink-muted">{t("animalBudget")}</dt>
                      <dd className="font-semibold text-ink">
                        {formatBDT((plan?.animal_allocation ?? 0) * a.units)}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-ink-muted">{t("careBudget")}</dt>
                      <dd className="font-semibold text-ink">
                        {formatBDT((plan?.care_allocation ?? 0) * a.units)}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-center justify-between gap-3">
                    {needsPurchase ? (
                      <span className="text-[12.5px] font-semibold text-green-deep">
                        {t("purchaseNeeded")}
                      </span>
                    ) : (
                      <span className="text-[12px] text-ink-muted">
                        {t("started")}{" "}
                        {new Date(a.created_at).toLocaleDateString(bn ? "bn-BD" : "en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[13px] font-bold text-brand">
                      {t("open")}
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
