import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#FEF6E5] text-[#C48A2E]",
  approved: "bg-[#E8F0EA] text-green-deep",
  disbursed: "bg-[#E8F0EA] text-green-deep",
  rejected: "bg-[#FAF0ED] text-terracotta",
};

export default async function FarmerFundRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const db = createAdminClient();

  const { data: requests } = await db
    .from("fund_requests")
    .select(
      `
      id, reference, amount, purpose, status, rejection_reason, created_at,
      investment:investments!investment_id (
        id, reference,
        offering:steward_plan_offerings!offering_id (
          investment_plans ( name_en )
        )
      )
      `,
    )
    .eq("farmer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          My Fund Requests
        </h1>
        <p className="text-[13px] text-ink-secondary">
          Track funds you have requested from your steward.
        </p>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            You haven&apos;t submitted any fund requests yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r: any) => {
            const inv = r.investment;
            const planName =
              inv?.offering?.investment_plans?.name_en ?? "Unknown plan";
            return (
              <div
                key={r.id}
                className="rounded-xl border border-border-light bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-ink-muted">
                      {r.reference}
                    </span>
                    <div className="mt-0.5 text-[12px] text-ink-secondary">
                      {new Date(r.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                      STATUS_STYLE[r.status] ?? "bg-stone text-ink-muted"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] md:grid-cols-3">
                  <div>
                    <span className="text-[10px] uppercase text-ink-muted">
                      Plan
                    </span>
                    <div className="font-semibold text-ink">{planName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-ink-muted">
                      Purpose
                    </span>
                    <div className="font-semibold capitalize text-ink">
                      {r.purpose.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-ink-muted">
                      Amount
                    </span>
                    <div className="font-bold text-terracotta">
                      {formatBDT(r.amount)}
                    </div>
                  </div>
                </div>

                {r.status === "rejected" && r.rejection_reason && (
                  <div className="mt-3 rounded bg-[#FAF0ED] p-2 text-[11px] text-[#A13D2B]">
                    <strong>Rejected:</strong> {r.rejection_reason}
                  </div>
                )}

                <div className="mt-3 border-t border-border-light pt-3">
                  <Link
                    href={`/farmer/investments/${inv?.id}`}
                    className="text-[12px] font-semibold text-terracotta hover:underline"
                  >
                    View investment →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}