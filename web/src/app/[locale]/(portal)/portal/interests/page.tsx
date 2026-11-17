import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

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

export default async function InvestorInterestsPage() {
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
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-[13px] text-ink-secondary">
          {t("subtitle")}
        </p>
      </div>

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
        <div className="overflow-hidden rounded-2xl border border-border-light bg-white">
          <table className="w-full">
            <thead className="border-b border-border-light bg-stone">
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
              {interests.map((interest: any) => {
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
                      {formatDate(interest.created_at, locale)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/interest/${interest.reference}`}
                        className="text-[12px] font-semibold text-brand hover:underline"
                      >
                        {t("view")}
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