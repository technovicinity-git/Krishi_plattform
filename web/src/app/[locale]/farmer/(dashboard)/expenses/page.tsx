import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { updatePhotoUrl } from "@/lib/investments/photo-url";
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  toneFor,
} from "@/components/dashboard/ui";

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
  investment: { id: string; reference: string } | null;
}

export default async function FarmerExpensesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const [t, tp, ts, locale] = await Promise.all([
    getTranslations("app.farmerExpenses"),
    getTranslations("app.purpose"),
    getTranslations("app.status"),
    getLocale(),
  ]);
  const bn = locale === "bn";
  const db = createAdminClient();

  const { data } = await db
    .from("expenses")
    .select(
      `
      id, amount, category, description, receipt_path, status, rejection_reason, created_at,
      investment:investments!investment_id ( id, reference )
      `,
    )
    .eq("farmer_id", user.id)
    .order("created_at", { ascending: false });

  const expenses = (data ?? []) as unknown as ExpenseRow[];
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const pending = expenses.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const approved = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(bn ? "bn-BD" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {expenses.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={t("empty")}
          description={t("emptyHint")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label={t("total")} value={formatBDT(total)} icon="receipt" />
            <StatCard label={t("pending")} value={formatBDT(pending)} icon="history" tone={pending > 0 ? "warning" : "default"} />
            <StatCard label={t("approved")} value={formatBDT(approved)} icon="coins" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-border-light bg-cream">
                <tr>
                  {[t("colDate"), t("colCategory"), t("colBatch"), t("receipt"), t("colStatus")].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                      {h}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                    {t("colAmount")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {expenses.map((e) => {
                  const receipt = updatePhotoUrl(e.receipt_path);
                  return (
                    <tr key={e.id} className="align-top hover:bg-cream/60">
                      <td className="whitespace-nowrap px-5 py-4 text-[13px] text-ink-secondary">{date(e.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="text-[13px] font-semibold text-ink">
                          {tp.has(e.category) ? tp(e.category) : e.category.replace(/_/g, " ")}
                        </div>
                        {e.description && (
                          <div className="mt-0.5 max-w-[260px] text-[12px] text-ink-muted">{e.description}</div>
                        )}
                        {e.status === "rejected" && e.rejection_reason && (
                          <div className="mt-0.5 text-[12px] text-danger">{e.rejection_reason}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {e.investment ? (
                          <Link
                            href={`/farmer/investments/${e.investment.id}`}
                            className="font-mono text-[12px] font-semibold text-brand hover:underline"
                          >
                            {e.investment.reference}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4 text-[12.5px]">
                        {receipt ? (
                          <a href={receipt} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                            {t("viewReceipt")}
                          </a>
                        ) : (
                          <span className="text-ink-muted">{t("noReceipt")}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={toneFor(e.status)}>
                          {ts.has(e.status) ? ts(e.status) : e.status}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[14px] font-bold text-ink">
                        {formatBDT(e.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
