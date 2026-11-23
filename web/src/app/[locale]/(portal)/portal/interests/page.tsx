import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/ui";
import { RowAction } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-[#FEF6E5] text-[#C48A2E]",
  under_review: "bg-[#FEF6E5] text-[#C48A2E]",
  approved: "bg-[#E8F0EA] text-green-deep",
  not_approved: "bg-[#FAF0ED] text-danger",
  onboarding: "bg-[#E8F0EA] text-green-deep",
  converted: "bg-[#E8F0EA] text-green-deep",
  expired: "bg-stone text-ink-muted",
  cancelled: "bg-stone text-ink-muted",
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** The columns this page selects (Supabase can't infer the join's shape). */
type InterestRow = {
  id: string;
  reference: string;
  status: string;
  requested_units: number;
  created_at: string;
  offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null;
};

export default async function InvestorInterestsPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  const tp = await getTranslations("app.onlinePayment");
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") {
    redirect("/login");
  }

  const t = await getTranslations("app.myInterests");
  const locale = await getLocale();
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
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {payment === "review" && (
        <div className="rounded-xl border border-[#C9DCEA] bg-[#EAF1F6] px-4 py-3 text-[13px] text-[#2F5D7C]">
          {tp("review")}
        </div>
      )}
      {(payment === "failed" || payment === "fail" || payment === "cancel") && (
        <div className="rounded-xl border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-danger">
          {payment === "cancel" ? tp("cancelled") : tp("failedReturn")}
        </div>
      )}

      {!interests || interests.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            {t("empty")}
          </p>
          <Link
            href="/plans"
            className="mt-4 inline-flex h-[44px] items-center justify-center rounded-[4px] bg-brand px-6 text-[13px] font-semibold text-white hover:bg-brand-hover"
          >
            {t("explorePlans")}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-border-light bg-cream">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("reference")}
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("plan")}
                </th>
                <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("units")}
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("status")}
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("submitted")}
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(interests as unknown as InterestRow[]).map((interest) => {
                const plan = interest.offering?.investment_plans;
                const planName =
                  (locale === "bn" ? plan?.name_bn : plan?.name_en) ??
                  plan?.name_en ??
                  t("unknownPlan");
                const style =
                  STATUS_STYLE[interest.status] ?? "bg-stone text-ink-muted";
                const label = t.has(`statusLabel.${interest.status}`) ? t(`statusLabel.${interest.status}`) : interest.status;
                return (
                  <tr
                    key={interest.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-cream/60"
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
                      {formatDate(interest.created_at, locale)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RowAction href={`/interest/${interest.reference}`} icon="eye" localized>
                        {t("view")}
                      </RowAction>
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