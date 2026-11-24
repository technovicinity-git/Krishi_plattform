import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { ButtonLink, PageHeader, Panel, RowAction, StatCard } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

/** A batch's stages, in order, for the "batches by stage" panel. */
const STAGES = ["awaiting_farmer", "awaiting_purchase", "growing_care", "sale_pending", "sold"] as const;

export default async function StewardDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const [t, td, tst] = await Promise.all([
    getTranslations("app.stewardHome"),
    getTranslations("app.stewardDash"),
    getTranslations("app.stage"),
  ]);
  const db = createAdminClient();

  const [{ data: farmers }, { data: offerings }, { data: walletRows }] = await Promise.all([
    db.from("users").select("status").eq("assigned_steward_id", user.id).eq("role", "farmer"),
    db.from("steward_plan_offerings").select("id").eq("steward_id", user.id),
    db.from("wallet_transactions").select("type, amount, investment_id").eq("user_id", user.id),
  ]);
  const offeringIds = (offerings ?? []).map((o) => o.id);

  const [{ count: pendingInterests }, { data: investments }] = offeringIds.length
    ? await Promise.all([
        db
          .from("investment_interests")
          .select("*", { count: "exact", head: true })
          .in("offering_id", offeringIds)
          .in("status", ["submitted", "under_review"]),
        db.from("investments").select("id, current_stage").in("offering_id", offeringIds),
      ])
    : [{ count: 0 }, { data: [] as { id: string; current_stage: string }[] }];

  const investmentIds = (investments ?? []).map((i) => i.id);
  const none = { count: 0 };
  const [{ count: pendingFunds }, { count: pendingExpenses }, { count: pendingSales }, { data: deaths }] = investmentIds.length
    ? await Promise.all([
        db.from("fund_requests").select("*", { count: "exact", head: true }).in("investment_id", investmentIds).eq("status", "pending"),
        db.from("expenses").select("*", { count: "exact", head: true }).in("investment_id", investmentIds).eq("status", "pending"),
        db.from("investment_sales").select("*", { count: "exact", head: true }).in("investment_id", investmentIds).eq("status", "pending_review"),
        db.from("animals").select("investment_id").in("investment_id", investmentIds).eq("status", "death_reported"),
      ])
    : [none, none, none, { data: [] as { investment_id: string }[] }];

  const farmerTotal = farmers?.length ?? 0;
  const farmerPending = (farmers ?? []).filter((f) => f.status === "pending_activation").length;
  const all = investments ?? [];
  const running = all.filter((i) => i.current_stage !== "settled");
  const settledCount = all.length - running.length;
  const awaitingFarmer = running.filter((i) => i.current_stage === "awaiting_farmer").length;
  const wallet = walletRows ?? [];
  const balance = wallet.reduce((s, w) => s + Number(w.amount), 0);
  // Earnings: profit shares and monthly pay.
  const shares = wallet.filter((w) => w.type === "settlement_share" || w.type === "monthly_pay");
  const sharesTotal = shares.reduce((s, w) => s + Number(w.amount), 0);
  const deathCount = deaths?.length ?? 0;

  // Everything waiting for this steward, in the order it usually matters.
  type Item = { icon: NavIconName; label: string; count: number; href: string };
  const items: Item[] = [
    { icon: "tag", label: td("reviewSales"), count: pendingSales ?? 0, href: "/steward/sales" },
    {
      icon: "shield",
      label: td("reviewDeaths"),
      count: deathCount,
      href: deathCount ? `/steward/investments/${deaths![0].investment_id}` : "/steward/investments",
    },
    { icon: "coins", label: td("reviewFunds"), count: pendingFunds ?? 0, href: "/steward/fund-requests" },
    { icon: "receipt", label: td("reviewExpenses"), count: pendingExpenses ?? 0, href: "/steward/expenses" },
    { icon: "inbox", label: td("reviewInterests"), count: pendingInterests ?? 0, href: "/steward/interests" },
    { icon: "briefcase", label: td("assignFarmers"), count: awaitingFarmer, href: "/steward/investments" },
    { icon: "users", label: td("activateFarmers"), count: farmerPending, href: "/steward/farmers?filter=pending" },
  ];
  const attention = items.filter((a) => a.count > 0);

  const byStage = STAGES.map((s) => ({ stage: s, count: running.filter((i) => i.current_stage === s).length }));
  const maxStage = Math.max(1, ...byStage.map((s) => s.count));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={td("eyebrow")}
        title={t("welcome", { name: user.fullName?.split(" ")[0] ?? t("steward") })}
        description={t("subtitle")}
        actions={<ButtonLink href="/steward/farmers/new">{t("addFarmer")}</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("totalFarmers")}
          value={farmerTotal}
          hint={td("activeFarmers", { count: farmerTotal - farmerPending })}
          icon="users"
          href="/steward/farmers"
        />
        <StatCard
          label={td("runningBatches")}
          value={running.length}
          hint={td("runningHint", { count: awaitingFarmer })}
          icon="briefcase"
          href="/steward/investments"
          tone={awaitingFarmer > 0 ? "warning" : "default"}
        />
        <StatCard
          label={td("statWallet")}
          value={formatBDT(balance)}
          hint={td("statWalletHint")}
          icon="wallet"
          href="/steward/wallet"
          tone="brand"
        />
        <StatCard
          label={td("statShares")}
          value={formatBDT(sharesTotal)}
          hint={td("statSharesHint", { count: new Set(shares.map((s) => s.investment_id)).size })}
          icon="chart"
          href="/steward/transactions"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title={
            <span className="flex items-center gap-2">
              {td("attention")}
              {attention.length > 0 && (
                <span className="rounded-full bg-[#FBF5E6] px-2 py-0.5 text-[11px] font-bold text-[#9A6B12]">
                  {attention.reduce((s, a) => s + a.count, 0)}
                </span>
              )}
            </span>
          }
          bodyClassName="p-0"
        >
          {attention.length === 0 ? (
            <div className="flex items-center gap-4 px-6 py-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                <NavIcon name="check" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-ink">{td("allClear")}</p>
                <p className="text-[13px] text-ink-secondary">{td("allClearHint")}</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border-light">
              {attention.map((a) => (
                <li key={a.label} className="flex items-center gap-4 px-6 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <NavIcon name={a.icon} />
                  </span>
                  <span className="flex-1 text-[14px] font-semibold text-ink">{a.label}</span>
                  <span className="rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-bold text-white">{a.count}</span>
                  <RowAction href={a.href} localized>
                    {td("review")}
                  </RowAction>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={td("pipeline")}
          description={td("pipelineHint", { count: settledCount })}
          actions={
            <RowAction href="/steward/investments" localized icon="briefcase">
              {td("viewBatches")}
            </RowAction>
          }
          bodyClassName="flex flex-col gap-3 p-6"
        >
          {byStage.map((s) => (
            <div key={s.stage} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink-secondary">{tst.has(s.stage) ? tst(s.stage) : s.stage}</span>
                <span className="font-bold text-ink">{s.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone">
                <div
                  className={s.stage === "awaiting_farmer" && s.count > 0 ? "h-full rounded-full bg-camel" : "h-full rounded-full bg-brand"}
                  style={{ width: `${(s.count / maxStage) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
