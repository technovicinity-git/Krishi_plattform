import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  not_approved: "Not Approved",
  onboarding: "Onboarding",
  converted: "Active Investment",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-[#FEF6E5] text-[#C48A2E]",
  under_review: "bg-[#FEF6E5] text-[#C48A2E]",
  approved: "bg-[#E8F0EA] text-green-deep",
  not_approved: "bg-[#F5EBE6] text-terracotta",
  onboarding: "bg-[#E8F0EA] text-green-deep",
  converted: "bg-[#E8F0EA] text-green-deep",
  expired: "bg-stone text-ink-muted",
  cancelled: "bg-stone text-ink-muted",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function InvestorInterestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") {
    redirect("/login");
  }

  const db = createAdminClient();

  const { data: interests } = await db
    .from("investment_interests")
    .select(
      `
      id, reference, status, requested_units, created_at, reviewed_at,
      offering:steward_plan_offerings!offering_id (
        id,
        investment_plans ( name_en, name_bn, duration_months )
      )
      `,
    )
    .eq("investor_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          My Interests
        </h1>
        <p className="text-[13px] text-ink-secondary">
          Plans you have expressed interest in. Click any entry to see its
          current status.
        </p>
      </div>

      {!interests || interests.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            You haven&apos;t expressed interest in any plans yet.
          </p>
          <Link
            href="/plans"
            className="mt-4 inline-flex h-[44px] items-center justify-center rounded-[4px] bg-terracotta px-6 text-[13px] font-semibold text-white hover:bg-[#B85A3F]"
          >
            Explore Investment Plans →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Reference
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Plan
                </th>
                <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Units
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Submitted
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {interests.map((interest: any) => {
                const planName =
                  interest.offering?.investment_plans?.name_en ??
                  "Unknown plan";
                const style =
                  STATUS_STYLE[interest.status] ?? "bg-stone text-ink-muted";
                const label = STATUS_LABEL[interest.status] ?? interest.status;
                return (
                  <tr
                    key={interest.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-stone/40"
                  >
                    <td className="px-5 py-3 font-mono text-[12px] text-ink">
                      {interest.reference}
                    </td>
                    <td className="px-5 py-3 text-[13px] font-semibold text-ink">
                      {planName}
                    </td>
                    <td className="px-5 py-3 text-center text-[13px] text-ink-secondary">
                      {interest.requested_units}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-[4px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.02em] ${style}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-ink-secondary">
                      {formatDate(interest.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/interest/${interest.reference}`}
                        className="text-[12px] font-semibold text-terracotta hover:underline"
                      >
                        View →
                      </Link>
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