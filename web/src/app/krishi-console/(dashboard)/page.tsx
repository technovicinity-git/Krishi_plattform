import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { PageHeader, Panel, RowAction, StatCard } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** "sale.settled" → "Sale settled", "notification.sent" → "Notification sent". */
function describeAction(action: string): string {
  const text = action.replace(/[._]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const STAGES: { key: string; label: string; view: string }[] = [
  { key: "awaiting_farmer", label: "Awaiting farmer", view: "awaiting_farmer" },
  { key: "awaiting_purchase", label: "Buying animals", view: "awaiting_purchase" },
  { key: "growing_care", label: "Raising", view: "growing_care" },
  { key: "sale_pending", label: "Sale pending", view: "sale" },
  { key: "sold", label: "Sold, payment due", view: "sale" },
];

/** Every row of a query, paging past the API's 1,000-row limit. */
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await page(from, from + 999);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) return rows;
  }
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const db = createAdminClient();
  const count = { count: "exact" as const, head: true };

  const [
    investors,
    stewards,
    farmers,
    kycPending,
    depositsPending,
    onlineUnmatched,
    salePayments,
    stewardsPending,
    offeringsPending,
    { data: withdrawals },
    investments,
    settlements,
    walletRows,
    { data: audit },
  ] = await Promise.all([
    db.from("users").select("*", count).eq("role", "investor"),
    db.from("users").select("*", count).eq("role", "steward"),
    db.from("users").select("*", count).eq("role", "farmer"),
    db.from("kyc_profiles").select("*", count).eq("status", "pending"),
    db.from("deposits").select("*", count).eq("status", "pending"),
    // Paid online but no deposit was recorded.
    db.from("online_payments").select("*", count).eq("status", "paid").is("deposit_id", null),
    db.from("investment_sales").select("*", count).eq("status", "remittance_submitted"),
    db.from("users").select("*", count).eq("role", "steward").eq("steward_approval_status", "pending"),
    db.from("steward_plan_offerings").select("*", count).eq("status", "pending_approval"),
    db.from("withdrawal_requests").select("amount").eq("status", "pending"),
    allRows<{ amount: number | string; current_stage: string | null }>((f, t) =>
      db.from("investments").select("amount, current_stage").order("id").range(f, t),
    ),
    allRows<{ platform_share: number | string }>((f, t) =>
      db.from("investment_settlements").select("platform_share").order("id").range(f, t),
    ),
    allRows<{ amount: number | string }>((f, t) => db.from("wallet_transactions").select("amount").order("id").range(f, t)),
    db
      .from("admin_audit_log")
      .select("id, action, created_at, admin:users!admin_id ( full_name )")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const running = investments.filter((i) => i.current_stage !== "settled");
  const runningCapital = running.reduce((s, i) => s + Number(i.amount), 0);
  const settledCount = investments.length - running.length;
  const earnings = settlements.reduce((s, r) => s + Number(r.platform_share), 0);
  const owed = walletRows.reduce((s, r) => s + Number(r.amount), 0);
  const withdrawalTotal = (withdrawals ?? []).reduce((s, w) => s + Number(w.amount), 0);

  const queues: { icon: NavIconName; label: string; hint?: string; count: number; href: string }[] = [
    { icon: "receipt", label: "Sale payments to confirm and settle", count: salePayments.count ?? 0, href: "/krishi-console/sales" },
    {
      icon: "wallet",
      label: "Withdrawals to pay",
      hint: withdrawalTotal > 0 ? formatBDT(withdrawalTotal) : undefined,
      count: withdrawals?.length ?? 0,
      href: "/krishi-console/withdrawals",
    },
    { icon: "coins", label: "Deposits to verify", count: depositsPending.count ?? 0, href: "/krishi-console/deposits" },
    { icon: "coins", label: "Online payments with no deposit", count: onlineUnmatched.count ?? 0, href: "/krishi-console/deposits?view=online" },
    { icon: "shield", label: "KYC submissions to review", count: kycPending.count ?? 0, href: "/krishi-console/kyc" },
    { icon: "users", label: "Steward applications", count: stewardsPending.count ?? 0, href: "/krishi-console/stewards" },
    { icon: "clipboard", label: "Plan offerings to approve", count: offeringsPending.count ?? 0, href: "/krishi-console/plans" },
  ];
  const waiting = queues.filter((q) => q.count > 0);
  const clear = queues.filter((q) => q.count === 0);

  const byStage = STAGES.map((s) => ({ ...s, count: running.filter((i) => i.current_stage === s.key).length }));
  const maxStage = Math.max(1, ...byStage.map((s) => s.count));

  const recent = (audit ?? []) as unknown as {
    id: string;
    action: string;
    created_at: string;
    admin: { full_name: string | null } | null;
  }[];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Krishi Console"
        title={`Welcome, ${admin.fullName?.split(" ")[0] ?? "Admin"}`}
        description="What needs an admin decision, and where the money is."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          localized={false}
          label="Capital in running batches"
          value={formatBDT(runningCapital)}
          hint={`${running.length} running · ${settledCount} settled`}
          icon="briefcase"
          tone="brand"
          href="/krishi-console/investments"
        />
        <StatCard
          localized={false}
          label="Krishi earnings"
          value={formatBDT(earnings)}
          hint="5% of profit on settled batches"
          icon="chart"
          href="/krishi-console/transactions"
        />
        <StatCard
          localized={false}
          label="Owed in user wallets"
          value={formatBDT(owed)}
          hint={withdrawalTotal > 0 ? `${formatBDT(withdrawalTotal)} requested for withdrawal` : "Not yet withdrawn"}
          icon="wallet"
          href="/krishi-console/withdrawals"
        />
        <StatCard
          localized={false}
          label="People"
          value={(investors.count ?? 0) + (stewards.count ?? 0) + (farmers.count ?? 0)}
          hint={`${investors.count ?? 0} investors · ${stewards.count ?? 0} stewards · ${farmers.count ?? 0} farmers`}
          icon="users"
          href="/krishi-console/investors"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title={
            <span className="flex items-center gap-2">
              Needs a decision
              {waiting.length > 0 && (
                <span className="rounded-full bg-[#FBF5E6] px-2 py-0.5 text-[11px] font-bold text-[#9A6B12]">
                  {waiting.reduce((s, q) => s + q.count, 0)}
                </span>
              )}
            </span>
          }
          description="Queues waiting for an admin"
          bodyClassName="p-0"
        >
          {waiting.length === 0 ? (
            <div className="flex items-center gap-4 px-6 py-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                <NavIcon name="check" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-ink">All clear</p>
                <p className="text-[13px] text-ink-secondary">No queue is waiting for an admin.</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border-light">
              {waiting.map((q) => (
                <li key={q.label} className="flex items-center gap-4 px-6 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <NavIcon name={q.icon} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[14px] font-semibold text-ink">{q.label}</span>
                    {q.hint && <span className="text-[12px] text-ink-muted">{q.hint}</span>}
                  </span>
                  <span className="rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-bold text-white">{q.count}</span>
                  <RowAction href={q.href}>Open</RowAction>
                </li>
              ))}
            </ul>
          )}
          {clear.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border-light px-6 py-3 text-[12px] text-ink-muted">
              {clear.map((q) => (
                <Link key={q.label} href={q.href} className="flex items-center gap-1.5 hover:text-ink">
                  <NavIcon name="check" className="h-3.5 w-3.5 text-brand" />
                  {q.label}
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Batches by stage"
          description={`${running.length} running`}
          actions={<RowAction href="/krishi-console/investments" icon="briefcase">Batches</RowAction>}
          bodyClassName="flex flex-col gap-3 p-6"
        >
          {byStage.map((s) => (
            <Link key={s.key} href={`/krishi-console/investments?view=${s.view}`} className="group flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink-secondary group-hover:text-ink">{s.label}</span>
                <span className="font-bold text-ink">{s.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone">
                <div
                  className={
                    (s.key === "awaiting_farmer" || s.key === "sold") && s.count > 0
                      ? "h-full rounded-full bg-camel"
                      : "h-full rounded-full bg-brand"
                  }
                  style={{ width: `${(s.count / maxStage) * 100}%` }}
                />
              </div>
            </Link>
          ))}
        </Panel>
      </div>

      <Panel
        title="Recent admin activity"
        actions={<RowAction href="/krishi-console/audit" icon="history">Audit log</RowAction>}
        bodyClassName="p-0"
      >
        {recent.length === 0 ? (
          <p className="px-6 py-6 text-[13px] text-ink-muted">No admin activity yet.</p>
        ) : (
          <ul className="grid grid-cols-1 divide-y divide-border-light md:grid-cols-2 md:divide-y-0">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-border-light px-6 py-3 md:border-b">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone text-ink-secondary">
                    <NavIcon name="history" className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold text-ink">{describeAction(r.action)}</span>
                    <span className="truncate text-[11.5px] text-ink-muted">{r.admin?.full_name ?? "—"}</span>
                  </div>
                </div>
                <span className="shrink-0 text-[11.5px] text-ink-muted">{timeAgo(r.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
