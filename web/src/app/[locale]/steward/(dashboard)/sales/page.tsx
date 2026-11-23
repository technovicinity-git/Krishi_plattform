import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStewardInvestmentIds } from "@/lib/steward/investments";
import { formatBDT } from "@/lib/utils";
import { EmptyState, PageHeader, StatusBadge, Tabs, type BadgeTone } from "@/components/dashboard/ui";
import { RowAction } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const VIEWS = {
  review: ["pending_review"],
  progress: ["rejected", "awaiting_remittance", "remittance_submitted"],
  settled: ["settled"],
} as const;
type View = keyof typeof VIEWS;

const TONE: Record<string, BadgeTone> = {
  pending_review: "info",
  rejected: "danger",
  awaiting_remittance: "warning",
  remittance_submitted: "info",
  settled: "success",
};

interface SaleRow {
  id: string;
  reference: string;
  sale_amount: number;
  sale_date: string;
  status: string;
  animals_sold: number;
  investment: {
    id: string;
    reference: string;
    amount: number;
    farmer: { full_name: string | null } | null;
    offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null;
  } | null;
}

/** Sales on this steward's batches: confirm new ones, follow the rest. */
export default async function StewardSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const { view: viewParam } = await searchParams;
  const view: View = viewParam && viewParam in VIEWS ? (viewParam as View) : "review";

  const investmentIds = await getStewardInvestmentIds(user.id);
  const { data } = investmentIds.length
    ? await createAdminClient()
        .from("investment_sales")
        .select(`
          id, reference, sale_amount, sale_date, status, animals_sold,
          investment:investments!investment_id (
            id, reference, amount,
            farmer:users!farmer_id ( full_name ),
            offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )
          )
        `)
        .in("investment_id", investmentIds)
        .in("status", [...VIEWS[view]])
        .order("updated_at", { ascending: false })
    : { data: [] };
  const sales = (data ?? []) as unknown as SaleRow[];

  const t = await getTranslations("app.stewardSales");
  const ts = await getTranslations("app.saleStatus");
  const locale = await getLocale();
  const bn = locale === "bn";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Tabs
        items={[
          { label: t("review"), href: "/steward/sales", active: view === "review" },
          { label: t("progress"), href: "/steward/sales?view=progress", active: view === "progress" },
          { label: t("settled"), href: "/steward/sales?view=settled", active: view === "settled" },
        ]}
      />

      {sales.length === 0 ? (
        <EmptyState icon="tag" title={t(`empty_${view}`)} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sales.map((s) => {
            const plan = s.investment?.offering?.investment_plans;
            const planName = (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? "—";
            const amount = Number(s.sale_amount);
            const capital = Number(s.investment?.amount ?? 0);
            return (
              <li key={s.id} className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-mono text-[11px] font-bold text-ink-muted">{s.reference}</span>
                    <span className="truncate text-[15px] font-semibold text-ink">{planName}</span>
                    <span className="text-[12px] text-ink-secondary">
                      {s.investment?.farmer?.full_name ?? "—"} ·{" "}
                      {new Date(s.sale_date).toLocaleDateString(bn ? "bn-BD" : "en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <StatusBadge tone={TONE[s.status] ?? "neutral"}>
                    {ts.has(s.status) ? ts(s.status) : s.status}
                  </StatusBadge>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-cream px-4 py-3 text-[12px]">
                  <div className="flex flex-col">
                    <span className="text-ink-muted">{t("animals")}</span>
                    <span className="text-[14px] font-bold text-ink">{s.animals_sold}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-ink-muted">{t("invested")}</span>
                    <span className="text-[14px] font-bold text-ink">{formatBDT(capital)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-ink-muted">{t("soldFor")}</span>
                    <span className="text-[14px] font-bold text-green-deep">{formatBDT(amount)}</span>
                  </div>
                </div>
                {s.investment && (
                  <div className="self-start">
                    {s.status === "pending_review" ? (
                      <RowAction href={`/steward/investments/${s.investment.id}`} icon="receipt" primary localized>
                        {t("reviewSale")}
                      </RowAction>
                    ) : (
                      <RowAction href={`/steward/investments/${s.investment.id}`} icon="briefcase" localized>
                        {t("openBatch")}
                      </RowAction>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
