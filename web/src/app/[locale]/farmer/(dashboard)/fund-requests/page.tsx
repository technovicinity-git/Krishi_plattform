import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  toneFor,
} from "@/components/dashboard/ui";
import { NewFundRequestButton } from "@/components/investment/NewFundRequestButton";

export const dynamic = "force-dynamic";

interface FundRequestRow {
  id: string;
  reference: string;
  amount: number;
  purpose: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  investment: {
    id: string;
    reference: string;
    offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null;
  } | null;
}

export default async function FarmerFundRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const [t, tf, tp, ts, locale] = await Promise.all([
    getTranslations("app.farmerFundRequests"),
    getTranslations("app.fundRequests"),
    getTranslations("app.purpose"),
    getTranslations("app.status"),
    getLocale(),
  ]);
  const bn = locale === "bn";
  const db = createAdminClient();

  const { data } = await db
    .from("fund_requests")
    .select(
      `
      id, reference, amount, purpose, status, rejection_reason, created_at,
      investment:investments!investment_id (
        id, reference,
        offering:steward_plan_offerings!offering_id (
          investment_plans ( name_en, name_bn )
        )
      )
      `,
    )
    .eq("farmer_id", user.id)
    .order("created_at", { ascending: false });

  const requests = (data ?? []) as unknown as FundRequestRow[];

  // Batches the farmer can still request money for (buying or raising animals).
  const { data: batchRows } = await db
    .from("investments")
    .select("id, reference, amount, current_stage, offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )")
    .eq("farmer_id", user.id)
    .in("current_stage", ["awaiting_purchase", "growing_care"])
    .order("created_at", { ascending: false });
  const { data: committedRows } = batchRows?.length
    ? await db
        .from("fund_requests")
        .select("investment_id, amount")
        .in("investment_id", batchRows.map((b) => b.id))
        .in("status", ["pending", "approved", "disbursed"])
    : { data: [] };
  const committed = new Map<string, number>();
  for (const r of committedRows ?? []) {
    committed.set(r.investment_id, (committed.get(r.investment_id) ?? 0) + Number(r.amount));
  }
  const batches = (batchRows ?? []).map((b) => {
    const plan = (b.offering as unknown as { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null)
      ?.investment_plans;
    return {
      id: b.id,
      reference: b.reference,
      plan: (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? "—",
      remaining: Math.max(0, Number(b.amount) - (committed.get(b.id) ?? 0)),
    };
  });
  const sum = (statuses: string[]) =>
    requests.filter((r) => statuses.includes(r.status)).reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={<NewFundRequestButton batches={batches} />}
      />

      {requests.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={ts("pending")} value={formatBDT(sum(["pending"]))} icon="history" tone={sum(["pending"]) > 0 ? "warning" : "default"} />
          <StatCard label={ts("approved")} value={formatBDT(sum(["approved", "disbursed"]))} icon="coins" />
          <StatCard label={ts("rejected")} value={formatBDT(sum(["rejected"]))} icon="inbox" />
        </div>
      )}

      {requests.length === 0 ? (
        <EmptyState
          icon="coins"
          title={t("empty")}
          description={batches.length === 0 ? t("noBatches") : undefined}
          action={<NewFundRequestButton batches={batches} />}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <ul className="divide-y divide-border-light">
            {requests.map((r) => {
              const plan = r.investment?.offering?.investment_plans;
              const planName = (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? tf("unknownPlan");
              return (
                <li key={r.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold text-ink">
                        {tp.has(r.purpose) ? tp(r.purpose) : r.purpose.replace(/_/g, " ")}
                      </span>
                      <StatusBadge tone={toneFor(r.status)}>
                        {ts.has(r.status) ? ts(r.status) : r.status}
                      </StatusBadge>
                    </div>
                    <span className="text-[12.5px] text-ink-secondary">{planName}</span>
                    <span className="font-mono text-[11px] text-ink-muted">
                      {r.reference} ·{" "}
                      {new Date(r.created_at).toLocaleDateString(bn ? "bn-BD" : "en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {r.status === "rejected" && r.rejection_reason && (
                      <span className="text-[12px] text-danger">
                        <strong>{tf("rejectedLabel")}</strong> {r.rejection_reason}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                    <span className="text-[17px] font-bold text-green-deep">{formatBDT(r.amount)}</span>
                    {r.investment && (
                      <Link
                        href={`/farmer/investments/${r.investment.id}`}
                        className="text-[12.5px] font-semibold text-brand hover:underline"
                      >
                        {tf("viewInvestment")}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
