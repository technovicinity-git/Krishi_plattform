import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepositApprovalActions } from "@/components/admin/DepositApprovalActions";
import { PaymentRefundActions } from "@/components/admin/PaymentRefundActions";
import { isSslcommerzEnabled } from "@/lib/payments/sslcommerz";
import { formatBDT } from "@/lib/utils";
import { signFileUrls } from "@/lib/storage/private-files";
import { EmptyState, PageHeader, Tabs } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

interface DepositRow {
  id: string;
  reference: string;
  amount: number;
  status: string;
  method: string;
  txn_id: string | null;
  sender_number: string | null;
  proof_path: string | null;
  rejection_reason: string | null;
  created_at: string;
  investor: { full_name: string | null; phone: string | null } | null;
  interest: {
    reference: string;
    offering: { investment_plans: { name_en: string | null } | null } | null;
  } | null;
}

export default async function AdminDepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const db = createAdminClient();
  const { view: viewParam } = await searchParams;
  const view = viewParam === "history" ? "history" : viewParam === "online" ? "online" : "pending";
  if (view === "online") return <OnlinePaymentsView />;

  const statuses = view === "history" ? ["approved", "rejected", "refunded"] : ["pending"];

  const { data: deposits } = await db
    .from("deposits")
    .select(`
      *,
      investor:users!investor_id ( full_name, phone ),
      interest:investment_interests!interest_id (
        reference,
        offering:steward_plan_offerings!offering_id (
          investment_plans ( name_en )
        )
      )
    `)
    .in("status", statuses)
    .order("created_at", { ascending: false });

  const proofUrls = await signFileUrls(
    ((deposits ?? []) as unknown as DepositRow[]).map((d) => d.proof_path),
  );

  // Online deposits are refunded, not rejected: find their payments.
  const onlineIds = ((deposits ?? []) as unknown as DepositRow[]).filter((d) => d.method === "online").map((d) => d.id);
  const { data: paymentRows } = onlineIds.length
    ? await db.from("online_payments").select("id, deposit_id, status, amount, bank_tran_id").in("deposit_id", onlineIds)
    : { data: [] };
  const paymentByDeposit = new Map((paymentRows ?? []).map((p) => [p.deposit_id as string, p]));
  const gateway = isSslcommerzEnabled();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<>Deposits</>}
        description={<>Review pending transfers and track history.</>}
      />

      <DepositTabs view={view} />

      {!deposits || deposits.length === 0 ? (
        <EmptyState title={view === "pending" ? "No pending deposits at the moment." : "No historical deposits yet."} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(deposits as unknown as DepositRow[]).map((dep) => (
            <div key={dep.id} className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6">
              <div className="flex items-start justify-between border-b border-border-light pb-3">
                <div>
                  <span className="font-mono text-[12px] font-bold text-ink-muted">{dep.reference}</span>
                  <div className="mt-1 font-serif text-[18px] text-ink">
                    {dep.interest?.offering?.investment_plans?.name_en}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[20px] font-bold text-brand">{formatBDT(dep.amount)}</div>
                  <div className="text-[11px] text-ink-muted">{new Date(dep.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })}</div>
                  {view === "history" && (
                    <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${dep.status === "approved" ? "bg-[#E8F0EA] text-green-deep" : dep.status === "refunded" ? "bg-[#EAF1F6] text-[#2F5D7C]" : "bg-[#FAF0ED] text-danger"}`}>
                      {dep.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <span className="text-ink-muted">Investor</span>
                  <div className="font-semibold text-ink">{dep.investor?.full_name}</div>
                  <div className="text-ink-secondary">{dep.investor?.phone}</div>
                </div>
                <div>
                  <span className="text-ink-muted">Payment Method</span>
                  <div className="font-semibold uppercase text-ink">
                    {dep.method === "online" ? "Online · SSLCommerz" : dep.method}
                  </div>
                  <div className="text-ink-secondary">
                    {dep.method === "mfs" ? `Sender: ${dep.sender_number}` : `TXN: ${dep.txn_id}`}
                  </div>
                </div>
              </div>

              {/* Rejection Reason for History */}
              {view === "history" && (dep.status === "rejected" || dep.status === "refunded") && dep.rejection_reason && (
                <div className="rounded bg-[#FAF0ED] p-3 text-[12px] text-[#A13D2B]">
                  <strong>{dep.status === "refunded" ? "Refund reason:" : "Rejection Reason:"}</strong> {dep.rejection_reason}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-border-light pt-4">
                <div>
                  {dep.proof_path ? (
                    <a
                      href={proofUrls.get(dep.proof_path) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:underline"
                    >
                      View Attachment
                    </a>
                  ) : (
                    <span className="text-[12px] text-ink-muted">No attachment</span>
                  )}
                </div>
                {view === "pending" && dep.method !== "online" && <DepositApprovalActions depositId={dep.id} />}
              </div>
              {view === "pending" && dep.method === "online" && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11.5px] text-ink-muted">
                    Paid online: approve it if units are still available, otherwise refund it.
                  </span>
                  <div className="flex flex-wrap items-start gap-2">
                    <DepositApprovalActions depositId={dep.id} canReject={false} />
                    {paymentByDeposit.get(dep.id) && (
                      <PaymentRefundActions
                        paymentId={paymentByDeposit.get(dep.id)!.id}
                        status={paymentByDeposit.get(dep.id)!.status}
                        amount={Number(paymentByDeposit.get(dep.id)!.amount)}
                        gatewayAvailable={gateway && Boolean(paymentByDeposit.get(dep.id)!.bank_tran_id)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function DepositTabs({ view }: { view: string }) {
  return (
    <Tabs
      localized={false}
      items={[
        { label: "Pending Review", href: "/krishi-console/deposits", active: view === "pending" },
        { label: "Online payments", href: "/krishi-console/deposits?view=online", active: view === "online" },
        { label: "History", href: "/krishi-console/deposits?view=history", active: view === "history" },
      ]}
    />
  );
}

interface PaymentRow {
  id: string;
  tran_id: string;
  amount: number;
  status: string;
  bank_tran_id: string | null;
  card_type: string | null;
  failure_reason: string | null;
  refund_method: string | null;
  refund_reason: string | null;
  refund_reference: string | null;
  refund_ref_id: string | null;
  refunded_at: string | null;
  paid_at: string | null;
  created_at: string;
  deposit: { reference: string; status: string } | null;
  investor: { full_name: string | null; phone: string | null } | null;
  interest: {
    reference: string;
    status: string;
    offering: { investment_plans: { name_en: string | null } | null } | null;
  } | null;
}

/**
 * Paid online payments that need a decision (deposit pending, or no deposit
 * at all), refunds in progress, and finished refunds.
 */
async function OnlinePaymentsView() {
  const db = createAdminClient();
  const { data } = await db
    .from("online_payments")
    .select(`
      id, tran_id, amount, status, bank_tran_id, card_type, failure_reason,
      refund_method, refund_reason, refund_reference, refund_ref_id, refunded_at, paid_at, created_at,
      deposit:deposits!deposit_id ( reference, status ),
      investor:users!investor_id ( full_name, phone ),
      interest:investment_interests!interest_id (
        reference, status,
        offering:steward_plan_offerings!offering_id ( investment_plans ( name_en ) )
      )
    `)
    .in("status", ["paid", "refund_pending", "refunded"])
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as PaymentRow[];
  // Paid and approved = a normal, finished payment: nothing to do here.
  const needsAction = rows.filter((p) => p.status === "paid" && p.deposit?.status !== "approved");
  const refunding = rows.filter((p) => p.status === "refund_pending");
  const refunded = rows.filter((p) => p.status === "refunded");
  const gateway = isSslcommerzEnabled();
  const when = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }) : "—";

  const card = (p: PaymentRow) => (
    <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-border-light bg-white p-6">
      <div className="flex items-start justify-between gap-3 border-b border-border-light pb-3">
        <div>
          <span className="font-mono text-[12px] font-bold text-ink-muted">{p.tran_id}</span>
          <div className="mt-1 font-serif text-[18px] text-ink">{p.interest?.offering?.investment_plans?.name_en ?? "—"}</div>
          <div className="text-[12px] text-ink-muted">
            Interest {p.interest?.reference ?? "—"} · {p.interest?.status ?? "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[20px] font-bold text-brand">{formatBDT(Number(p.amount))}</div>
          <div className="text-[11px] text-ink-muted">Paid {when(p.paid_at ?? p.created_at)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-[13px]">
        <div>
          <span className="text-ink-muted">Investor</span>
          <div className="font-semibold text-ink">{p.investor?.full_name ?? "—"}</div>
          <div className="text-ink-secondary">{p.investor?.phone}</div>
        </div>
        <div>
          <span className="text-ink-muted">Deposit</span>
          <div className="font-semibold text-ink">
            {p.deposit ? `${p.deposit.reference} · ${p.deposit.status}` : "Not recorded"}
          </div>
          <div className="text-ink-secondary">
            {[p.card_type, p.bank_tran_id && `Bank TXN ${p.bank_tran_id}`].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      </div>
      {p.failure_reason && p.status === "paid" && (
        <div className="rounded bg-[#FBF5E6] p-3 text-[12px] text-[#9A6B12]">{p.failure_reason}</div>
      )}
      {p.status !== "paid" && (
        <div className="rounded bg-[#EAF1F6] p-3 text-[12px] text-[#2F5D7C]">
          {p.status === "refund_pending" ? "Refund requested from SSLCommerz" : "Refunded"}
          {p.refund_method === "manual" ? " manually" : ""}
          {p.refund_reference ? ` · Ref ${p.refund_reference}` : ""}
          {p.refund_ref_id ? ` · SSLCommerz ${p.refund_ref_id}` : ""}
          {p.refunded_at ? ` · ${when(p.refunded_at)}` : ""}
          {p.refund_reason ? <div className="mt-1">Reason: {p.refund_reason}</div> : null}
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-2 border-t border-border-light pt-4">
        <PaymentRefundActions
          paymentId={p.id}
          status={p.status}
          amount={Number(p.amount)}
          gatewayAvailable={gateway && Boolean(p.bank_tran_id)}
        />
      </div>
    </div>
  );

  const section = (title: string, hint: string, items: PaymentRow[]) =>
    items.length === 0 ? null : (
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">{title} ({items.length})</h2>
          <p className="text-[12.5px] text-ink-muted">{hint}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{items.map(card)}</div>
      </section>
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={<>Deposits</>} description={<>Online payments that need a decision or a refund.</>} />
      <DepositTabs view="online" />
      {!gateway && (
        <p className="rounded-xl border border-[#EBD9A8] bg-[#FBF5E6] px-4 py-3 text-[12.5px] text-[#9A6B12]">
          SSLCommerz isn&apos;t configured, so refunds can only be recorded manually.
        </p>
      )}
      {needsAction.length + refunding.length + refunded.length === 0 ? (
        <EmptyState title="No online payments need attention." />
      ) : (
        <>
          {section(
            "Needs a decision",
            "Paid, but not turned into an investment. Approve the deposit on Pending Review if units are available, otherwise refund.",
            needsAction,
          )}
          {section("Refund in progress", "Waiting for SSLCommerz to complete the refund.", refunding)}
          {section("Refunded", "Most recent first.", refunded)}
        </>
      )}
    </div>
  );
}
