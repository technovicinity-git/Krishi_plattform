import Link from "next/link";
import { requireAdmin } from "@/lib/admin/current-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepositApprovalActions } from "@/components/admin/DepositApprovalActions";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const db = createAdminClient();
  const { view: viewParam } = await searchParams;
  const view = viewParam === "history" ? "history" : "pending";

  const statuses = view === "history" ? ["approved", "rejected"] : ["pending"];

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">Deposits</h1>
        <p className="text-[13px] text-ink-secondary">Review pending transfers and track history.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-light">
        <Link
          href="/krishi-console/deposits"
          className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
            view === "pending" ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Pending Review
        </Link>
        <Link
          href="/krishi-console/deposits?view=history"
          className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
            view === "history" ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          History
        </Link>
      </div>

      {!deposits || deposits.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            {view === "pending" ? "No pending deposits at the moment." : "No historical deposits yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {deposits.map((dep: any) => (
            <div key={dep.id} className="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6">
              <div className="flex items-start justify-between border-b border-border-light pb-3">
                <div>
                  <span className="font-mono text-[12px] font-bold text-ink-muted">{dep.reference}</span>
                  <div className="mt-1 font-serif text-[18px] text-ink">
                    {dep.interest?.offering?.investment_plans?.name_en}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[20px] font-bold text-brand">{formatBDT(dep.amount)}</div>
                  <div className="text-[11px] text-ink-muted">{new Date(dep.created_at).toLocaleString()}</div>
                  {view === "history" && (
                    <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${dep.status === "approved" ? "bg-[#E8F0EA] text-green-deep" : "bg-brand-tint text-brand"}`}>
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
                  <div className="font-semibold uppercase text-ink">{dep.method}</div>
                  <div className="text-ink-secondary">
                    {dep.method === "bank" ? `TXN: ${dep.txn_id}` : `Sender: ${dep.sender_number}`}
                  </div>
                </div>
              </div>

              {/* Rejection Reason for History */}
              {view === "history" && dep.status === "rejected" && dep.rejection_reason && (
                <div className="rounded bg-[#FAF0ED] p-3 text-[12px] text-[#A13D2B]">
                  <strong>Rejection Reason:</strong> {dep.rejection_reason}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-border-light pt-4">
                <div>
                  {dep.proof_path ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/deposit-proofs/${dep.proof_path}`}
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
                {view === "pending" && <DepositApprovalActions depositId={dep.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}