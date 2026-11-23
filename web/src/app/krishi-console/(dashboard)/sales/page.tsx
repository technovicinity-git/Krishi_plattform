import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { EmptyState, PageHeader, StatusBadge, Tabs, type BadgeTone, RowAction } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "review", label: "Payment to confirm", statuses: ["remittance_submitted"] },
  { key: "awaiting", label: "Waiting for payment", statuses: ["awaiting_remittance"] },
  { key: "steward", label: "With steward", statuses: ["pending_review", "rejected"] },
  { key: "settled", label: "Settled", statuses: ["settled"] },
  { key: "all", label: "All", statuses: [] as string[] },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending_review: { label: "Steward review", tone: "info" },
  rejected: { label: "Sent back", tone: "danger" },
  awaiting_remittance: { label: "Waiting for payment", tone: "warning" },
  remittance_submitted: { label: "Payment to confirm", tone: "info" },
  settled: { label: "Settled", tone: "success" },
};

interface SaleRow {
  id: string;
  reference: string;
  sale_amount: number;
  kind: string;
  sale_date: string;
  status: string;
  remitted_at: string | null;
  farmer: { full_name: string | null } | null;
  investment: {
    reference: string;
    amount: number;
    offering: { investment_plans: { name_en: string | null } | null } | null;
  } | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filterKey: FilterKey = FILTERS.some((f) => f.key === params.filter)
    ? (params.filter as FilterKey)
    : "review";
  const filter = FILTERS.find((f) => f.key === filterKey)!;

  const db = createAdminClient();
  let query = db
    .from("investment_sales")
    .select(`
      id, reference, kind, sale_amount, sale_date, status, remitted_at,
      farmer:users!farmer_id ( full_name ),
      investment:investments!investment_id (
        reference, amount,
        offering:steward_plan_offerings!offering_id ( investment_plans ( name_en ) )
      )
    `)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (filter.statuses.length) query = query.in("status", filter.statuses);

  const { data } = await query;
  const sales = (data ?? []) as unknown as SaleRow[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<>Sales &amp; Settlement</>}
        description={
          <>
            Farmers send the sale money to Krishi. Confirm the payment arrived to settle the batch
            and split any profit.
          </>
        }
      />

      <Tabs
        localized={false}
        items={FILTERS.map((f) => ({
          label: f.label,
          href: `/krishi-console/sales?filter=${f.key}`,
          active: f.key === filterKey,
        }))}
      />

      {sales.length === 0 ? (
        <EmptyState icon="tag" title={<>No sales in this view.</>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                {["Sale", "Plan / Investment", "Farmer", "Invested", "Sold for", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const st = STATUS[s.status] ?? { label: s.status, tone: "neutral" as BadgeTone };
                const capital = Number(s.investment?.amount ?? 0);
                const amount = Number(s.sale_amount);
                return (
                  <tr key={s.id} className="border-b border-border-light last:border-b-0 hover:bg-cream/60">
                    <td className="px-5 py-4">
                      <div className="font-mono text-[12px] font-bold text-ink">{s.reference}</div>
                      <div className="text-[11px] text-ink-muted">{formatDate(s.sale_date)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[13px] font-semibold text-ink">
                        {s.investment?.offering?.investment_plans?.name_en ?? "—"}
                      </div>
                      <div className="font-mono text-[11px] text-ink-muted">{s.investment?.reference}</div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">{s.farmer?.full_name ?? "—"}</td>
                    <td className="px-5 py-4 text-[13px] text-ink-secondary">{formatBDT(capital)}</td>
                    {s.kind === "total_loss" ? (
                      <td className="px-5 py-4 text-[13px] font-bold text-danger">Total loss</td>
                    ) : (
                      <td className="px-5 py-4 text-[13px] font-bold text-green-deep">{formatBDT(amount)}</td>
                    )}
                    <td className="px-5 py-4">
                      <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {s.status === "remittance_submitted" ? (
                        <RowAction href={`/krishi-console/sales/${s.id}`} icon="receipt" primary>
                          Review
                        </RowAction>
                      ) : (
                        <RowAction href={`/krishi-console/sales/${s.id}`} icon="eye">
                          View
                        </RowAction>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
