import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStewardInvestmentIds } from "@/lib/steward/investments";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";
import { ExpensesList } from "@/components/investment/ExpensesList";
import { signFileUrls } from "@/lib/storage/private-files";

export const dynamic = "force-dynamic";

interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  receipt_path: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  investment: {
    id: string;
    reference: string;
    farmer: { full_name: string | null } | null;
    offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null;
  } | null;
}

/** Expenses farmers logged on this steward's batches, for review. */
export default async function StewardExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const { view: viewParam } = await searchParams;
  const view = viewParam === "history" ? "history" : "pending";
  const statuses = view === "pending" ? ["pending"] : ["approved", "rejected"];

  const investmentIds = await getStewardInvestmentIds(user.id);
  const { data } = investmentIds.length
    ? await createAdminClient()
        .from("expenses")
        .select(`
          id, amount, category, description, receipt_path, status, rejection_reason, created_at,
          investment:investments!investment_id (
            id, reference,
            farmer:users!farmer_id ( full_name ),
            offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )
          )
        `)
        .in("investment_id", investmentIds)
        .in("status", statuses)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  const t = await getTranslations("app.stewardExpenses");
  const bn = (await getLocale()) === "bn";
  const rows = (data ?? []) as unknown as ExpenseRow[];
  const urls = await signFileUrls(rows.map((e) => e.receipt_path));
  const expenses = rows.map((e) => {
    const plan = e.investment?.offering?.investment_plans;
    const planName = (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? "—";
    const farmer = e.investment?.farmer?.full_name;
    return {
      id: e.id,
      amount: Number(e.amount),
      category: e.category,
      description: e.description,
      receiptPath: e.receipt_path,
      receiptUrl: e.receipt_path ? urls.get(e.receipt_path) ?? null : null,
      status: e.status,
      rejectionReason: e.rejection_reason,
      createdAt: e.created_at,
      batch: e.investment
        ? {
            href: `/steward/investments/${e.investment.id}`,
            reference: e.investment.reference,
            label: farmer ? `${planName} · ${farmer}` : planName,
          }
        : undefined,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Tabs
        items={[
          { label: t("pending"), href: "/steward/expenses", active: view === "pending" },
          { label: t("history"), href: "/steward/expenses?view=history", active: view === "history" },
        ]}
      />
      {expenses.length === 0 ? (
        <EmptyState icon="receipt" title={view === "pending" ? t("emptyPending") : t("emptyHistory")} />
      ) : (
        <ExpensesList expenses={expenses} isSteward={view === "pending"} bare />
      )}
    </div>
  );
}
