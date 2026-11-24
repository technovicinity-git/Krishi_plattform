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
  user_id: string;
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
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const [wallets, { data: prefRows }] = await Promise.all([
    view === "pending" ? walletChecks(userIds) : Promise.resolve(new Map<string, WalletCheck>()),
    view === "pending" && userIds.length
      ? createAdminClient().from("withdrawal_preferences").select("user_id, updated_at").in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; updated_at: string }[] }),
  ]);
  const payoutChanged = new Map((prefRows ?? []).map((p) => [p.user_id, p.updated_at]));

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
                {w.status === "pending" && payoutChanged.get(w.user_id) && (
                  <PayoutChanged changedAt={payoutChanged.get(w.user_id)!} requestedAt={w.created_at} />
                )}
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

              {w.status === "pending" && wallets.get(w.user_id) && (
                <WalletCheckPanel wallet={wallets.get(w.user_id)!} amount={Number(w.amount)} />
              )}

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

/* ─── Wallet check ──────────────────────────────────────────────────── */

interface WalletCheck {
  /** Free to withdraw now: waiting requests are already held (taken out). */
  withdrawable: number;
  /** Held for this user's requests that are waiting to be paid. */
  held: number;
  /** Where the money came from, and what has gone out. */
  settlements: number;
  fundReleases: number;
  monthlyPay: number;
  adjustments: number;
  paidOut: number;
}

/**
 * Each user's wallet, for checking withdrawal requests. A request puts a hold
 * on the wallet straight away (a negative "withdrawal" entry), so the balance
 * is what is still free; a rejected or cancelled request gives it back.
 */
async function walletChecks(userIds: string[]): Promise<Map<string, WalletCheck>> {
  const out = new Map<string, WalletCheck>();
  if (userIds.length === 0) return out;
  const db = createAdminClient();
  const [txs, { data: pending }] = await Promise.all([
    (async () => {
      const all: { user_id: string; type: string; amount: number | string }[] = [];
      for (let from = 0; ; from += 1000) {
        const { data } = await db
          .from("wallet_transactions")
          .select("user_id, type, amount")
          .in("user_id", userIds)
          .order("id")
          .range(from, from + 999);
        all.push(...(data ?? []));
        if ((data ?? []).length < 1000) return all;
      }
    })(),
    db.from("withdrawal_requests").select("user_id, amount").in("user_id", userIds).eq("status", "pending"),
  ]);
  for (const id of userIds) {
    out.set(id, { withdrawable: 0, held: 0, settlements: 0, fundReleases: 0, monthlyPay: 0, adjustments: 0, paidOut: 0 });
  }
  for (const t of txs) {
    const w = out.get(t.user_id)!;
    const amount = Number(t.amount);
    w.withdrawable += amount;
    if (t.type === "settlement_payout" || t.type === "settlement_share") w.settlements += amount;
    else if (t.type === "fund_release") w.fundReleases += amount;
    else if (t.type === "monthly_pay") w.monthlyPay += amount;
    else if (t.type === "adjustment") w.adjustments += amount;
  }
  for (const r of pending ?? []) out.get(r.user_id)!.held += Number(r.amount);
  // Paid out = withdrawal holds that are not still waiting.
  for (const [id, w] of out) {
    const holds = txs.filter((t) => t.user_id === id && (t.type === "withdrawal" || t.type === "withdrawal_reversal"))
      .reduce((s, t) => s + Number(t.amount), 0);
    w.paidOut = Math.max(0, -holds - w.held);
    for (const k of ["withdrawable", "held", "settlements", "fundReleases", "monthlyPay", "adjustments", "paidOut"] as const) {
      w[k] = Math.round(w[k] * 100) / 100;
    }
  }
  return out;
}

function WalletCheckPanel({ wallet, amount }: { wallet: WalletCheck; amount: number }) {
  // Before any of the waiting requests were held.
  const before = wallet.withdrawable + wallet.held;
  const ok = wallet.withdrawable >= 0;
  return (
    <div className={`rounded-xl border px-4 py-3 ${ok ? "border-[#CFE3D3] bg-[#F3F8F4]" : "border-[#F1C9C1] bg-[#FBEDEA]"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">Wallet check</span>
        <span className={`text-[12px] font-bold ${ok ? "text-green-deep" : "text-danger"}`}>
          {ok ? "OK: the wallet covers this request" : `Short by ${formatBDT(-wallet.withdrawable)}`}
        </span>
      </div>
      <dl className="mt-2.5 grid grid-cols-3 gap-3 text-[12px]">
        <div>
          <dt className="text-ink-muted">Balance before requests</dt>
          <dd className="text-[15px] font-bold text-ink">{formatBDT(before)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Held for requests</dt>
          <dd className="text-[15px] font-bold text-ink">
            {formatBDT(wallet.held)}
            {wallet.held > amount && <span className="ml-1 text-[11px] font-normal text-ink-muted">(this + others)</span>}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Still withdrawable</dt>
          <dd className={`text-[15px] font-bold ${ok ? "text-green-deep" : "text-danger"}`}>{formatBDT(wallet.withdrawable)}</dd>
        </div>
      </dl>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-black/5 pt-2 text-[11.5px] text-ink-secondary">
        <span>Settlements {formatBDT(wallet.settlements)}</span>
        {wallet.fundReleases !== 0 && <span>Fund releases {formatBDT(wallet.fundReleases)}</span>}
        {wallet.monthlyPay !== 0 && <span>Monthly pay {formatBDT(wallet.monthlyPay)}</span>}
        {wallet.adjustments !== 0 && <span>Adjustments {formatBDT(wallet.adjustments)}</span>}
        <span>Paid out before {formatBDT(wallet.paidOut)}</span>
      </div>
    </div>
  );
}

/** Hours before a request in which a payout account change deserves a second look. */
const RECENT_CHANGE_HOURS = 72;

/**
 * When the payout account was last changed. A change shortly before the
 * request is a common sign of a taken-over account: check with the person
 * (on their known phone) before paying.
 */
function PayoutChanged({ changedAt, requestedAt }: { changedAt: string; requestedAt: string }) {
  const hoursBefore = (new Date(requestedAt).getTime() - new Date(changedAt).getTime()) / 3_600_000;
  // The request keeps its own copy of the account, so a later change does not affect it.
  if (hoursBefore < 0) {
    return (
      <div className="mt-1 text-[11.5px] text-ink-muted">
        Account changed {formatDateTime(changedAt)}, after this request. Pay the account shown here.
      </div>
    );
  }
  return hoursBefore < RECENT_CHANGE_HOURS ? (
    <div className="mt-2 rounded-lg border border-[#EBD9A8] bg-[#FBF5E6] px-3 py-2 text-[12px] text-[#9A6B12]">
      <strong>Account changed {formatDateTime(changedAt)}</strong>, {Math.max(1, Math.round(hoursBefore))}h before this
      request. Confirm it with the person before paying.
    </div>
  ) : (
    <div className="mt-1 text-[11.5px] text-ink-muted">Account last changed {formatDateTime(changedAt)}</div>
  );
}
