import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/cn";
import { formatBDT } from "@/lib/utils";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";
import { FarmerBatchCard } from "@/components/farmer/FarmerBatchCard";
import {
  EmptyState,
  PageHeader,
  RowAction,
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

interface SaleRow {
  investment_id: string;
  status: string;
  sale_amount: number | string;
  funds_returned: number | string | null;
  rejection_reason: string | null;
  remit_rejection_reason: string | null;
}

interface Todo {
  key: string;
  icon: NavIconName;
  text: string;
  hint?: string;
  href: string;
  cta: string;
  urgent?: boolean;
}

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

  const { data: investmentRows } = await db
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
    .order("created_at", { ascending: false });
  const assignments = (investmentRows ?? []) as unknown as AssignmentRow[];
  const ids = assignments.map((a) => a.id);

  const [{ data: saleRows }, { data: fundRows }, { data: walletRows }] = await Promise.all([
    ids.length
      ? db
          .from("investment_sales")
          .select("investment_id, status, sale_amount, funds_returned, rejection_reason, remit_rejection_reason")
          .in("investment_id", ids)
      : Promise.resolve({ data: [] as SaleRow[] }),
    db.from("fund_requests").select("status").eq("farmer_id", user.id).eq("status", "pending"),
    db.from("wallet_transactions").select("type, amount, investment_id").eq("user_id", user.id),
  ]);
  const sales = new Map(((saleRows ?? []) as SaleRow[]).map((s) => [s.investment_id, s]));
  const wallet = walletRows ?? [];
  const balance = wallet.reduce((s, w) => s + Number(w.amount), 0);
  const shares = wallet.filter((w) => w.type === "settlement_share");
  const sharesTotal = shares.reduce((s, w) => s + Number(w.amount), 0);
  const sharesBatches = new Set(shares.map((w) => w.investment_id)).size;
  const pendingFunds = fundRows?.length ?? 0;

  const running = assignments.filter((a) => a.current_stage !== "settled");
  const finished = assignments.filter((a) => a.current_stage === "settled");
  const unitsInCare = running.reduce((sum, a) => sum + a.units, 0);
  const planName = (a: AssignmentRow) => {
    const plan = a.offering?.investment_plans;
    return (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? a.reference;
  };

  // What the farmer has to do next, most urgent first.
  const todos: Todo[] = [];
  for (const a of running) {
    const href = `/farmer/investments/${a.id}`;
    const sale = sales.get(a.id);
    if (a.current_stage === "awaiting_purchase") {
      todos.push({ key: `buy-${a.id}`, icon: "tag", text: t("todoBuy", { plan: planName(a) }), href, cta: t("todoBuyCta") });
    } else if (sale?.status === "awaiting_remittance") {
      const returned = Number(sale.funds_returned ?? 0);
      const amount = formatBDT(Number(sale.sale_amount) + returned);
      todos.push(
        sale.remit_rejection_reason
          ? { key: `send-${a.id}`, icon: "coins", text: t("todoSendAgain", { plan: planName(a), reason: sale.remit_rejection_reason }), href, cta: t("todoSendCta"), urgent: true }
          : {
              key: `send-${a.id}`,
              icon: "coins",
              text: t("todoSend", { plan: planName(a), amount }),
              hint: t("todoSendHint", { returned: returned > 0 ? "yes" : "no" }),
              href,
              cta: t("todoSendCta"),
              urgent: true,
            },
      );
    } else if (sale?.status === "rejected" && a.current_stage === "growing_care") {
      todos.push({ key: `sale-${a.id}`, icon: "receipt", text: t("todoSaleRejected", { plan: planName(a), reason: sale.rejection_reason ?? "—" }), href, cta: t("todoSaleCta"), urgent: true });
    }
  }
  todos.sort((x, y) => Number(Boolean(y.urgent)) - Number(Boolean(x.urgent)));
  if (pendingFunds > 0) {
    todos.push({ key: "funds", icon: "inbox", text: t("todoFunds", { count: pendingFunds }), href: "/farmer/fund-requests", cta: t("todoFundsCta") });
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("welcome", { name: user.fullName?.split(" ")[0] ?? "" })}
        description={t("subtitle")}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("statBatches")} value={running.length} hint={t("statUnits", { count: unitsInCare })} icon="leaf" />
        <StatCard
          label={t("statWallet")}
          value={formatBDT(balance)}
          hint={t("statWalletHint")}
          icon="wallet"
          href="/farmer/wallet"
          tone="brand"
        />
        <StatCard
          label={t("statPendingFunds")}
          value={pendingFunds}
          icon="coins"
          href="/farmer/fund-requests"
          tone={pendingFunds > 0 ? "warning" : "default"}
        />
        <StatCard
          label={t("statShares")}
          value={formatBDT(sharesTotal)}
          hint={t("statSharesHint", { count: sharesBatches })}
          icon="chart"
          href="/farmer/transactions"
        />
      </div>

      {/* Needs your attention */}
      <section className="rounded-2xl border border-border-light bg-white">
        <div className="flex items-center gap-2 border-b border-border-light px-6 py-4">
          <h2 className="text-[15px] font-semibold text-ink">{t("todo")}</h2>
          {todos.length > 0 && (
            <span className="rounded-full bg-[#FBF5E6] px-2 py-0.5 text-[11px] font-bold text-[#9A6B12]">{todos.length}</span>
          )}
        </div>
        {todos.length === 0 ? (
          <p className="flex items-center gap-2 px-6 py-5 text-[13.5px] text-ink-secondary">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-tint text-brand">
              <NavIcon name="check" className="h-3.5 w-3.5" />
            </span>
            {t("todoNone")}
          </p>
        ) : (
          <ul className="divide-y divide-border-light">
            {todos.map((todo) => (
              <li key={todo.key} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    todo.urgent ? "bg-[#FBF5E6] text-[#9A6B12]" : "bg-brand-tint text-brand",
                  )}
                >
                  <NavIcon name={todo.icon} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-ink">{todo.text}</p>
                  {todo.hint && <p className="text-[12px] text-ink-muted">{todo.hint}</p>}
                </div>
                <div className="sm:shrink-0">
                  <RowAction href={todo.href} localized primary={todo.urgent}>
                    {todo.cta}
                  </RowAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Running batches */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[17px] font-semibold text-ink">{t("running")}</h2>
            <p className="text-[13px] text-ink-muted">{t("assignmentsHint")}</p>
          </div>
          {assignments.length > 0 && (
            <RowAction href="/farmer/investments?view=all" localized icon="briefcase">
              {t("viewAll")}
            </RowAction>
          )}
        </div>

        {running.length === 0 ? (
          <EmptyState icon="leaf" title={t("empty")} description={t("emptyHint")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {running.map((a) => {
              const plan = a.offering?.investment_plans;
              const sale = sales.get(a.id);
              return (
                <FarmerBatchCard
                  key={a.id}
                  batch={{
                    id: a.id,
                    reference: a.reference,
                    units: a.units,
                    stage: a.current_stage,
                    createdAt: a.created_at,
                    planEn: plan?.name_en ?? null,
                    planBn: plan?.name_bn ?? null,
                    stewardName: a.offering?.users?.full_name ?? null,
                    animalAllocation: Number(plan?.animal_allocation ?? 0),
                    careAllocation: Number(plan?.care_allocation ?? 0),
                  }}
                  highlight={todos.some((x) => x.href.endsWith(a.id))}
                  note={sale?.status === "remittance_submitted" ? t("waitingKrishi") : undefined}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Finished batches: a short list */}
      {finished.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-ink">{t("finished")}</h2>
          <ul className="divide-y divide-border-light overflow-hidden rounded-2xl border border-border-light bg-white">
            {finished.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/farmer/investments/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-cream"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                    <NavIcon name="check" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{planName(a)}</span>
                    <span className="font-mono text-[11px] text-ink-muted">{a.reference}</span>
                  </span>
                  <StatusBadge tone={toneFor(a.current_stage)}>
                    {tst.has(a.current_stage) ? tst(a.current_stage) : a.current_stage}
                  </StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
