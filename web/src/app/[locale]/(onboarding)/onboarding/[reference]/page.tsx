import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepositForm } from "@/components/onboarding/DepositForm";
import { PayOnlineButton } from "@/components/onboarding/PayOnlineButton";
import { isSslcommerzEnabled, isSslcommerzSandbox } from "@/lib/payments/sslcommerz";

export const dynamic = "force-dynamic";

export default async function OnboardingWizardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; reference: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { locale, reference } = await params;
  const { payment } = await searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "investor") redirect("/login");

  const db = createAdminClient();

  // 1. Fetch Interest
  const { data: interest } = await db
    .from("investment_interests")
    .select(`
      id, status, requested_units, reference,
      offering:steward_plan_offerings!offering_id (
        investment_plans ( name_en, name_bn, unit_price )
      )
    `)
    .eq("reference", reference)
    .eq("investor_id", user.id)
    .maybeSingle();

  if (!interest) redirect("/portal/interests");
  if (interest.status === "converted") redirect(`/interest/${reference}`); // Already done

  // 2. Fetch KYC
  const { data: kyc } = await db.from("kyc_profiles").select("status").eq("user_id", user.id).maybeSingle();
  const isKycVerified = kyc?.status === "verified";

  // 3. Fetch Withdrawal Preference
  const { data: withdrawPref } = await db.from("withdrawal_preferences").select("id").eq("user_id", user.id).maybeSingle();
  const hasWithdrawalPref = !!withdrawPref;

  // 4. Fetch Existing Deposit
  const { data: deposit } = await db
    .from("deposits")
    .select("*")
    .eq("interest_id", interest.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Determine current step (1 to 4)
  let currentStep = 1;
  if (isKycVerified) currentStep = 2;
  if (isKycVerified && hasWithdrawalPref) currentStep = 3;
  if (deposit && deposit.status === "pending") currentStep = 4;
  if (deposit && deposit.status === "approved") currentStep = 5;

  // Fetch active platform accounts for the deposit step
  const { data: accounts } = await db.from("platform_accounts").select("*").eq("is_active", true);

  const t = await getTranslations("app.onboardingWizard");
  // Supabase types many-to-one joins as arrays; at runtime they are objects.
  const offering = interest.offering as unknown as {
    investment_plans: { name_en: string | null; name_bn: string | null; unit_price: number | null } | null;
  } | null;
  const plan = offering?.investment_plans;
  const planName = (locale === "bn" ? plan?.name_bn : plan?.name_en) ?? plan?.name_en ?? t("defaultPlanName");
  const unitPrice = Number(plan?.unit_price ?? 0);
  const totalAmount = unitPrice * interest.requested_units;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-[32px] text-ink">{t("title")}</h1>
        <p className="mt-2 text-[14px] text-ink-secondary">
          {t("subtitle", { plan: planName })}
        </p>
      </div>

      {(payment === "fail" || payment === "cancel" || payment === "failed") && currentStep === 3 && (
        <div className="mb-6 rounded-xl border border-[#F0C9C0] bg-[#FAF0ED] px-4 py-3 text-[13px] text-danger">
          {payment === "cancel" ? t("paymentCancelled") : t("paymentFailed")}
        </div>
      )}

      {/* Stepper */}
      <Stepper
        current={currentStep}
        labels={[t("stepKyc"), t("stepWithdrawal"), t("stepDeposit"), t("stepActivation")]}
      />

      {/* Content based on step */}
      <div className="rounded-xl border border-border-light bg-white p-8">
        
        {/* Step 1: KYC */}
        {currentStep === 1 && (
          <div className="text-center">
            <h2 className="font-serif text-[24px] text-ink">{t("kycTitle")}</h2>
            <p className="mt-2 text-[13px] text-ink-secondary">
              {t("kycBody")}
            </p>
            <Link href={`/${locale}/onboarding/kyc`} className="mt-6 inline-flex h-[48px] w-full items-center justify-center rounded bg-brand text-[14px] font-bold text-white hover:bg-brand-hover">
              {t("kycCta")}
            </Link>
          </div>
        )}

        {/* Step 2: Withdrawal Preference */}
        {currentStep === 2 && (
          <div className="text-center">
            <h2 className="font-serif text-[24px] text-ink">{t("withdrawalTitle")}</h2>
            <p className="mt-2 text-[13px] text-ink-secondary">
              {t("withdrawalBody")}
            </p>
            <Link href={`/${locale}/onboarding/withdrawal`} className="mt-6 inline-flex h-[48px] w-full items-center justify-center rounded bg-brand text-[14px] font-bold text-white hover:bg-brand-hover">
              {t("withdrawalCta")}
            </Link>
          </div>
        )}

        {/* Step 3: Deposit */}
        {currentStep === 3 && (
          <div>
            <h2 className="font-serif text-[24px] text-ink">{t("depositTitle")}</h2>
            <p className="mt-2 text-[13px] text-ink-secondary">
              {t.rich("depositBody", {
                amount: `৳${totalAmount.toLocaleString("en-IN")}`,
                strong: (chunks) => <strong className="text-ink">{chunks}</strong>,
              })}
            </p>
            
            {isSslcommerzEnabled() && (
              <>
                <PayOnlineButton
                  interestId={interest.id}
                  amount={totalAmount}
                  locale={locale === "en" ? "en" : "bn"}
                  sandbox={isSslcommerzSandbox()}
                />
                <div className="mt-8 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  <span className="h-px flex-1 bg-border-light" />
                  {t("orManual")}
                  <span className="h-px flex-1 bg-border-light" />
                </div>
              </>
            )}

            <div className="mt-6 flex flex-col gap-3">
              {accounts?.map((acc) => (
                <div key={acc.id} className="rounded-lg border border-border-light bg-cream p-4">
                  <div className="text-[11px] font-bold uppercase text-ink-muted">{acc.method === "mfs" ? acc.provider : t("bankTransfer")}</div>
                  <div className="text-[15px] font-semibold text-ink">{acc.account_number}</div>
                  <div className="text-[12px] text-ink-secondary">{acc.account_name} {acc.branch_name ? `(${acc.branch_name})` : ""}</div>
                </div>
              ))}
            </div>

            <DepositForm interestId={interest.id} expectedAmount={totalAmount} />
          </div>
        )}

        {/* Step 4: Pending Review */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF6E5] text-[#C48A2E]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <h2 className="mt-4 font-serif text-[24px] text-ink">{t("reviewTitle")}</h2>
            <p className="mt-2 text-[13px] text-ink-secondary">
              {t("reviewBody", { txn: deposit?.txn_id ?? "" })}
            </p>
          </div>
        )}

        {/* Step 5: Done */}
        {currentStep === 5 && (
          <div className="text-center">
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF5EB] text-green-deep">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.5l4 4 10-10"/></svg>
            </div>
            <h2 className="mt-4 font-serif text-[24px] text-ink">{t("activeTitle")}</h2>
            <p className="mt-2 text-[13px] text-ink-secondary">{t("activeBody")}</p>
            <Link href={`/${locale}/portal/investments`} className="mt-6 inline-flex h-[48px] w-full items-center justify-center rounded bg-ink text-[14px] font-bold text-white hover:bg-[#2A2A2A]">
              {t("goToDashboard")}
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * Steps with a line joining them. The line fills up to the current step;
 * finished steps show a tick. `current` is 1-based (past the last = all done).
 */
function Stepper({ current, labels }: { current: number; labels: string[] }) {
  const last = labels.length;
  // Share of the track between the first and last circle that is filled.
  const filled = Math.min(Math.max(current - 1, 0), last - 1) / (last - 1);
  // The track runs between the centres of the first and last column.
  const inset = `${50 / last}%`;
  return (
    <ol className="relative mb-10 grid" style={{ gridTemplateColumns: `repeat(${last}, minmax(0, 1fr))` }}>
      <div aria-hidden className="absolute top-4 h-[3px] -translate-y-1/2 rounded-full bg-stone" style={{ left: inset, right: inset }} />
      <div
        aria-hidden
        className="absolute top-4 h-[3px] -translate-y-1/2 rounded-full bg-green-deep transition-[width] duration-500"
        style={{ left: inset, width: `calc((100% - 2 * ${inset}) * ${filled})` }}
      />
      {labels.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <li key={label} className="relative z-10 flex flex-col items-center gap-2 px-1" aria-current={active ? "step" : undefined}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ring-4 ring-cream ${
                done ? "bg-green-deep text-white" : active ? "bg-brand text-white" : "bg-stone text-ink-muted"
              }`}
            >
              {done ? "✓" : n}
            </div>
            <span
              className={`text-center text-[10.5px] font-semibold uppercase leading-tight ${
                done ? "text-green-deep" : active ? "text-brand" : "text-ink-muted"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
