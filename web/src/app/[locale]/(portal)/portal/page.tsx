import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWallet } from "@/lib/wallet";
import { localizeUpdate, type TimelineI18n } from "@/lib/investments/timeline";
import { formatBDT } from "@/lib/utils";
import { EmptyState, PageHeader, StatCard, StatusBadge, rowActionClass, toneFor } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

interface InvestmentRow {
  id: string;
  reference: string;
  units: number;
  amount: number | string;
  current_stage: string | null;
  created_at: string;
  farmer: { full_name: string | null } | null;
  offering: {
    users: { full_name: string | null } | null;
    investment_plans: { name_en: string | null; name_bn: string | null; duration_months: number } | null;
  } | null;
}

const CLOSED_STAGES = ["settled"];
/** A batch's stages, in order, for the progress bar on each card. */
const STEPS = ["awaiting_farmer", "awaiting_purchase", "growing_care", "sale_pending", "sold", "settled"];
const KYC_DONE = ["verified"];
const KYC_WAITING = ["pending", "under_review"];

/** Investor home: what needs doing, money at a glance, active batches, latest activity. */
export default async function InvestorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getLocale();
  const bn = locale === "bn";
  // Other roles have their own dashboards.
  if (user.role !== "investor") {
    redirect(user.role === "admin" ? "/krishi-console" : `${bn ? "" : `/${locale}`}/${user.role}`);
  }

  const [t, tst, tTimeline, tPurpose] = await Promise.all([
    getTranslations("app.investorDash"),
    getTranslations("app.stage"),
    getTranslations("app.timeline"),
    getTranslations("app.purpose"),
  ]);
  const db = createAdminClient();

  const [{ data: investmentRows }, { data: interestRows }, { data: settlementRows }, wallet] = await Promise.all([
    db
      .from("investments")
      .select(`
        id, reference, units, amount, current_stage, created_at,
        farmer:users!farmer_id ( full_name ),
        offering:steward_plan_offerings!offering_id (
          users!steward_id ( full_name ),
          investment_plans ( name_en, name_bn, duration_months )
        )
      `)
      .eq("investor_id", user.id)
      .order("created_at", { ascending: false }),
    db
      .from("investment_interests")
      .select(`
        id, reference, status, requested_units,
        offering:steward_plan_offerings!offering_id ( investment_plans ( name_en, name_bn ) )
      `)
      .eq("investor_id", user.id)
      .in("status", ["submitted", "under_review", "approved", "onboarding"])
      .order("created_at", { ascending: false }),
    db
      .from("investment_settlements")
      .select("capital, investor_payout, investment:investments!investment_id!inner ( investor_id )")
      .eq("investment.investor_id", user.id),
    getWallet(user.id),
  ]);

  const investments = (investmentRows ?? []) as unknown as InvestmentRow[];
  const active = investments.filter((i) => !CLOSED_STAGES.includes(i.current_stage ?? ""));
  const invested = active.reduce((sum, i) => sum + Number(i.amount), 0);
  const unitsActive = active.reduce((sum, i) => sum + i.units, 0);
  // Profit or loss on settled batches: payout minus the capital put in.
  const returns = (settlementRows ?? []).reduce(
    (sum, s) => sum + Number(s.investor_payout) - Number(s.capital),
    0,
  );

  type InterestRow = {
    id: string;
    reference: string;
    status: string;
    requested_units: number;
    offering: { investment_plans: { name_en: string | null; name_bn: string | null } | null } | null;
  };
  const interests = (interestRows ?? []) as unknown as InterestRow[];
  const toPay = interests.filter((i) => i.status === "approved");
  const waitingInterests = interests.filter((i) => i.status === "submitted" || i.status === "under_review");
  // Paid; Krishi is checking the payment before the batch starts.
  const checking = interests.filter((i) => i.status === "onboarding");

  // Latest activity across all the investor's batches.
  const ids = investments.map((i) => i.id);
  const { data: updateRows } = ids.length
    ? await db
        .from("investment_updates")
        .select("id, investment_id, title, body, amount, created_at, metadata")
        .in("investment_id", ids)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] };
  const byId = new Map(investments.map((i) => [i.id, i]));

  const planName = (plan: { name_en: string | null; name_bn: string | null } | null | undefined, fallback: string) =>
    (bn ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? fallback;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(bn ? "bn-BD" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const kycNeeded = !KYC_DONE.includes(user.kycStatus);
  const kycWaiting = KYC_WAITING.includes(user.kycStatus);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("welcome", { name: user.fullName?.split(" ")[0] ?? "" })}
        description={t("subtitle")}
      />

      {(kycNeeded || toPay.length > 0 || checking.length > 0 || waitingInterests.length > 0) && (
        <div className="flex flex-col gap-3">
          {kycNeeded && (
            <ActionCard
              href="/portal/kyc"
              tone={kycWaiting ? "info" : "warning"}
              title={kycWaiting ? t("kycWaitingTitle") : user.kycStatus === "not_started" ? t("kycStartTitle") : t("kycFixTitle")}
              body={
                kycWaiting
                  ? t("kycWaitingBody")
                  : user.kycStatus === "not_started"
                    ? t("kycStartBody")
                    : user.kycRejectionReason
                      ? t("kycFixBodyReason", { reason: user.kycRejectionReason })
                      : t("kycFixBody")
              }
              cta={kycWaiting ? t("kycView") : t("kycCta")}
            />
          )}
          {toPay.map((i) => (
            <ActionCard
              key={i.id}
              href={`/onboarding/${i.reference}`}
              tone="success"
              title={t("payTitle", { plan: planName(i.offering?.investment_plans, i.reference) })}
              body={t("payBody", { reference: i.reference, count: i.requested_units })}
              cta={t("payCta")}
            />
          ))}
          {checking.map((i) => (
            <ActionCard
              key={i.id}
              href={`/onboarding/${i.reference}`}
              tone="info"
              title={t("checkingTitle", { plan: planName(i.offering?.investment_plans, i.reference) })}
              body={t("checkingBody", { reference: i.reference })}
              cta={t("checkingCta")}
            />
          ))}
          {waitingInterests.length > 0 && (
            <ActionCard
              href="/portal/interests"
              tone="neutral"
              title={t("waitingTitle", { count: waitingInterests.length })}
              body={t("waitingBody")}
              cta={t("waitingCta")}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("statInvested")} value={formatBDT(invested)} icon="briefcase" tone="brand" href="/portal/investments" />
        <StatCard
          label={t("statBatches")}
          value={active.length}
          hint={t("statUnits", { count: unitsActive })}
          icon="leaf"
          href="/portal/livestock"
        />
        <StatCard label={t("statWallet")} value={formatBDT(wallet.balance)} hint={t("statWalletHint")} icon="wallet" href="/portal/wallet" />
        <StatCard
          label={t("statReturns")}
          value={`${returns > 0 ? "+" : returns < 0 ? "−" : ""}${formatBDT(Math.abs(returns))}`}
          hint={t("statReturnsHint")}
          icon="chart"
          tone={returns < 0 ? "warning" : "default"}
          href="/portal/reports"
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[17px] font-semibold text-ink">{t("batches")}</h2>
            <p className="text-[13px] text-ink-muted">{t("batchesHint")}</p>
          </div>
          {investments.length > 0 && (
            <Link href="/portal/investments" className="text-[13px] font-semibold text-brand hover:underline">
              {t("viewAll")}
            </Link>
          )}
        </div>

        {active.length === 0 ? (
          <EmptyState
            icon="leaf"
            title={waitingInterests.length > 0 ? t("emptyWaiting") : t("empty")}
            description={waitingInterests.length > 0 ? t("emptyWaitingHint", { count: waitingInterests.length }) : t("emptyHint")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {active.slice(0, 4).map((i) => {
              const stage = i.current_stage ?? "";
              return (
                <Link
                  key={i.id}
                  href={`/portal/investments/${i.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-6 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-mono text-[11px] font-semibold text-ink-muted">{i.reference}</span>
                      <h3 className="font-serif text-[21px] leading-tight text-ink">
                        {planName(i.offering?.investment_plans, i.reference)}
                      </h3>
                    </div>
                    <StatusBadge tone={toneFor(stage)}>{tst.has(stage) ? tst(stage) : stage}</StatusBadge>
                  </div>
                  {/* Where this batch is */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1">
                      {STEPS.map((s, n) => (
                        <span
                          key={s}
                          className={cn("h-1.5 flex-1 rounded-full", n <= Math.max(0, STEPS.indexOf(stage)) ? "bg-brand" : "bg-stone")}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-ink-muted">
                      {t("stepOf", { step: Math.max(0, STEPS.indexOf(stage)) + 1, total: STEPS.length })}
                    </span>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 rounded-xl bg-cream px-4 py-3 text-[12px]">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-ink-muted">{t("invested")}</dt>
                      <dd className="font-semibold text-ink">{formatBDT(Number(i.amount))}</dd>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <dt className="text-ink-muted">{t("steward")}</dt>
                      <dd className="truncate font-semibold text-ink">{i.offering?.users?.full_name ?? "—"}</dd>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <dt className="text-ink-muted">{t("farmer")}</dt>
                      <dd className="truncate font-semibold text-ink">{i.farmer?.full_name ?? t("notAssigned")}</dd>
                    </div>
                  </dl>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-ink-muted">{t("started", { date: fmtDate(i.created_at) })}</span>
                    {/* The whole card is the link; this just looks like its button. */}
                    <span className={rowActionClass()}>{t("open")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {(updateRows ?? []).length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-[17px] font-semibold text-ink">{t("activity")}</h2>
          <ul className="divide-y divide-border-light overflow-hidden rounded-2xl border border-border-light bg-white">
            {(updateRows ?? []).map((u) => {
              const meta = (u.metadata ?? {}) as { i18n?: TimelineI18n; superseded?: boolean };
              const text = localizeUpdate(
                { title: u.title, body: u.body, i18n: meta.i18n ?? null },
                tTimeline,
                tPurpose,
                formatBDT,
              );
              const inv = byId.get(u.investment_id);
              return (
                <li key={u.id}>
                  <Link
                    href={`/portal/investments/${u.investment_id}`}
                    className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-cream/60"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className={`text-[13.5px] font-semibold text-ink ${meta.superseded ? "line-through opacity-60" : ""}`}>
                        {text.title}
                      </span>
                      <span className="text-[12px] text-ink-muted">
                        {inv ? `${planName(inv.offering?.investment_plans, inv.reference)} · ` : ""}
                        {fmtDate(u.created_at)}
                      </span>
                    </div>
                    {u.amount !== null && Number(u.amount) > 0 && (
                      <span className="shrink-0 text-[13px] font-semibold text-ink">{formatBDT(Number(u.amount))}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function ActionCard({
  href,
  tone,
  title,
  body,
  cta,
}: {
  href: string;
  tone: "warning" | "info" | "success" | "neutral";
  title: string;
  body: string;
  cta: string;
}) {
  const style =
    tone === "warning"
      ? "border-[#EBD9A8] bg-[#FBF5E6]"
      : tone === "info"
        ? "border-[#C9DCEA] bg-[#EAF1F6]"
        : tone === "neutral"
          ? "border-border-light bg-white"
          : "border-brand/30 bg-brand-tint";
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 rounded-2xl border px-5 py-4 transition-shadow hover:shadow-[0_10px_24px_-18px_rgba(0,0,0,0.3)] sm:flex-row sm:items-center sm:justify-between ${style}`}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[14px] font-semibold text-ink">{title}</span>
        <span className="text-[12.5px] text-ink-secondary">{body}</span>
      </div>
      {/* The whole card is the link; this just looks like its button. */}
      <span className={cn(rowActionClass(tone === "success" || tone === "warning" ? "primary" : "default"), "self-start sm:self-auto")}>{cta}</span>
    </Link>
  );
}
