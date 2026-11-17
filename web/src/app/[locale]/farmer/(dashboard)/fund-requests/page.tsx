import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#FEF6E5] text-[#C48A2E]",
  approved: "bg-[#E8F0EA] text-green-deep",
  disbursed: "bg-[#E8F0EA] text-green-deep",
  rejected: "bg-[#FAF0ED] text-danger",
};

export default async function FarmerFundRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "farmer") redirect("/login");

  const t = await getTranslations("app.farmerFundRequests");
  const tf = await getTranslations("app.fundRequests");
  const tp = await getTranslations("app.purpose");
  const ts = await getTranslations("app.status");
  const locale = await getLocale();
  const db = createAdminClient();

  const { data: requests } = await db
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

      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white px-8 py-16 text-center">
          <p className="text-[14px] text-ink-secondary">
            {t("empty")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r: any) => {
            const inv = r.investment;
            const plan = inv?.offering?.investment_plans;
            const planName =
              (locale === "bn" ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? tf("unknownPlan");
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
                      {new Date(r.created_at).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
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
                    {ts.has(r.status) ? ts(r.status) : r.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] md:grid-cols-3">
                  <div>
                    <span className="text-[10px] uppercase text-ink-muted">
                      {tf("plan")}
                    </span>
                    <div className="font-semibold text-ink">{planName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-ink-muted">
                      {tf("purpose")}
                    </span>
                    <div className="font-semibold capitalize text-ink">
                      {tp.has(r.purpose) ? tp(r.purpose) : r.purpose.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-ink-muted">
                      {tf("amount")}
                    </span>
                    <div className="font-bold text-brand">
                      {formatBDT(r.amount)}
                    </div>
                  </div>
                </div>

                {r.status === "rejected" && r.rejection_reason && (
                  <div className="mt-3 rounded bg-[#FAF0ED] p-2 text-[11px] text-[#A13D2B]">
                    <strong>{tf("rejectedLabel")}</strong> {r.rejection_reason}
                  </div>
                )}

                <div className="mt-3 border-t border-border-light pt-3">
                  <Link
                    href={`/farmer/investments/${inv?.id}`}
                    className="text-[12px] font-semibold text-brand hover:underline"
                  >
                    {tf("viewInvestment")}
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