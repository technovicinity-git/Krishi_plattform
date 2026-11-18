import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";
import { EmptyState, PageHeader, StatusBadge, Tabs, type BadgeTone } from "@/components/dashboard/ui";
import { WithdrawalActions } from "@/components/admin/WithdrawalActions";

export const dynamic = "force-dynamic";

const TONE: Record<string, BadgeTone> = {
  pending: "warning",
  paid: "success",
  rejected: "danger",
  cancelled: "neutral",
};

interface Row {
  id: string;
  reference: string;
  amount: number;
  method: string;
  account_holder_name: string;
  mfs_provider: string | null;
  mobile_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  bank_routing_number: string | null;
  status: string;
  payout_txn_id: string | null;
  admin_note: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  user: { full_name: string | null; phone: string | null; role: string } | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const { view: viewParam } = await searchParams;
  const view = viewParam === "history" ? "history" : "pending";

  const { data } = await createAdminClient()
    .from("withdrawal_requests")
    .select("*, user:users!user_id ( full_name, phone, role )")
    .in("status", view === "pending" ? ["pending"] : ["paid", "rejected", "cancelled"])
    .order("created_at", { ascending: view === "pending" })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const pendingTotal = view === "pending" ? rows.reduce((s, r) => s + Number(r.amount), 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<>Withdrawals</>}
        description={
          <>
            Send the money to the account shown, then mark it paid with your transaction ID.
            {view === "pending" && rows.length > 0 && (
              <> Waiting: <strong>{formatBDT(pendingTotal)}</strong></>
            )}
          </>
        }
      />

      <Tabs
        localized={false}
        items={[
          { label: "To pay", href: "/krishi-console/withdrawals", active: view === "pending" },
          { label: "History", href: "/krishi-console/withdrawals?view=history", active: view === "history" },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon="wallet"
          title={view === "pending" ? <>No withdrawals waiting.</> : <>No past withdrawals yet.</>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {rows.map((w) => (
            <div key={w.id} className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
              <div className="flex items-start justify-between gap-3 border-b border-border-light pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[12px] font-bold text-ink-muted">{w.reference}</span>
                  <span className="text-[16px] font-semibold text-ink">{w.user?.full_name ?? "—"}</span>
                  <span className="text-[12px] capitalize text-ink-secondary">
                    {w.user?.role ?? "—"} · {w.user?.phone ?? "—"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="font-serif text-[24px] leading-none text-green-deep">
                    {formatBDT(Number(w.amount))}
                  </span>
                  <StatusBadge tone={TONE[w.status] ?? "neutral"}>{w.status}</StatusBadge>
                </div>
              </div>

              <div className="rounded-xl bg-cream px-4 py-3 text-[13px]">
                {w.method === "mobile" ? (
                  <>
                    <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                      {w.mfs_provider ?? "Mobile wallet"}
                    </div>
                    <div className="font-mono text-[16px] font-semibold text-ink">{w.mobile_number}</div>
                  </>
                ) : (
                  <>
                    <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                      {w.bank_name ?? "Bank"}
                      {w.bank_branch ? ` · ${w.bank_branch}` : ""}
                    </div>
                    <div className="font-mono text-[16px] font-semibold text-ink">{w.bank_account_number}</div>
                    {w.bank_routing_number && (
                      <div className="text-[12px] text-ink-secondary">Routing {w.bank_routing_number}</div>
                    )}
                  </>
                )}
                <div className="text-[12px] text-ink-secondary">{w.account_holder_name}</div>
              </div>

              <div className="flex flex-wrap justify-between gap-2 text-[12px] text-ink-muted">
                <span>Requested {formatDateTime(w.created_at)}</span>
                {w.reviewed_at && <span>Closed {formatDateTime(w.reviewed_at)}</span>}
              </div>

              {w.payout_txn_id && (
                <div className="text-[12.5px] text-ink-secondary">
                  Paid · Txn <span className="font-mono font-semibold text-ink">{w.payout_txn_id}</span>
                </div>
              )}
              {w.rejection_reason && <div className="text-[12.5px] text-danger">{w.rejection_reason}</div>}
              {w.admin_note && <div className="text-[12.5px] text-ink-secondary">{w.admin_note}</div>}

              {w.status === "pending" && (
                <WithdrawalActions id={w.id} amount={Number(w.amount)} name={w.user?.full_name ?? "the user"} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
