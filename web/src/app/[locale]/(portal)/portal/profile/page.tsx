import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Heading } from "@/components/ui/Heading";
import { ArrowRightIcon } from "@/components/icons";
import {
  getCurrentUser,
  getWithdrawalPreference,
} from "@/lib/auth/current-user";

export default async function PortalProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const t = await getTranslations("portal.profile");
  const withdrawal = await getWithdrawalPreference(user.id);

  const statusLabels: Record<typeof user.kycStatus, string> = {
    not_started: t("kycStatusNotStarted"),
    pending: t("kycStatusPending"),
    under_review: t("kycStatusUnderReview"),
    verified: t("kycStatusVerified"),
    rejected: t("kycStatusRejected"),
    requires_update: t("kycStatusRequiresUpdate"),
  };

  const showKycCta = user.kycStatus !== "verified";
  const ctaLabel =
    user.kycStatus === "not_started"
      ? t("kycCta")
      : user.kycStatus === "rejected" || user.kycStatus === "requires_update"
        ? t("kycCtaResubmit")
        : t("kycCtaView");
  // Start / resubmit opens the KYC form; "view submission" opens the status page.
  const kycHref =
    user.kycStatus === "pending" || user.kycStatus === "under_review"
      ? "/portal/kyc"
      : "/onboarding/kyc";

  const details = [
    { labelKey: "detailAccountType", value: capitalize(user.role) },
    { labelKey: "detailFullName", value: user.fullName ?? "—" },
    { labelKey: "detailPhone", value: user.phone ?? "—" },
    { labelKey: "detailEmail", value: user.email ?? t("detailEmailValue") },
  ];

  const withdrawalSummary = (() => {
    if (!withdrawal) return null;
    if (withdrawal.method === "mobile") {
      const provider =
        withdrawal.mfsProvider === "bkash"
          ? "bKash"
          : withdrawal.mfsProvider === "nagad"
            ? "Nagad"
            : "Rocket";
      return `${provider} · ${maskNumber(withdrawal.mobileNumber)}`;
    }
    return `${withdrawal.bankName} · ${maskNumber(withdrawal.bankAccountNumber)}`;
  })();

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-8">
      <Heading as="h1" size="subsection" className="lg:text-[36px]">
        {t("heading")}
      </Heading>

      {/* KYC card */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-white p-8 lg:p-10">
        <div className="h-0.5 w-12 bg-brand" />

        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-sage">
            {t("kycEyebrow")}
          </span>
          <h2 className="font-serif text-[32px] leading-[1.15] text-ink lg:text-[36px]">
            {user.kycStatus === "verified"
              ? t("kycHeadingVerified")
              : t("kycHeading")}
          </h2>
          <p className="text-[15px] leading-[1.6] text-ink-secondary">
            {user.kycStatus === "verified"
              ? t("kycParagraphVerified")
              : t("kycParagraph")}
          </p>
        </div>

        <div className="border-t border-border-light pt-5">
          <span className="text-[14px] font-semibold text-ink">
            {t("kycStatusPrefix")} {statusLabels[user.kycStatus]}
          </span>
          {user.kycRejectionReason && (
            <p className="mt-2 text-[13px] text-[#A13D2B]">
              {user.kycRejectionReason}
            </p>
          )}
        </div>

        {showKycCta && (
          <Link
            href={kycHref}
            className="inline-flex h-[52px] w-fit items-center justify-center gap-2 rounded-[8px] bg-brand px-8 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
          >
            {ctaLabel}
            <ArrowRightIcon />
          </Link>
        )}
      </div>

      {/* Withdrawal preference card */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-white p-8 lg:p-10">
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-sage">
            {t("withdrawalEyebrow")}
          </span>
          <h2 className="font-serif text-[28px] leading-[1.15] text-ink lg:text-[32px]">
            {withdrawal
              ? t("withdrawalHeadingSet")
              : t("withdrawalHeadingUnset")}
          </h2>
          <p className="text-[15px] leading-[1.6] text-ink-secondary">
            {withdrawal
              ? t("withdrawalParagraphSet")
              : t("withdrawalParagraphUnset")}
          </p>
        </div>

        {withdrawal && (
          <div className="rounded-[10px] border border-border-light bg-cream px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] font-semibold text-ink">
                {withdrawalSummary}
              </span>
              <span className="text-[12px] text-ink-muted">
                {withdrawal.accountHolderName}
              </span>
            </div>
          </div>
        )}

        {/* Only allow setting withdrawal preference AFTER KYC is verified */}
        {user.kycStatus === "verified" && (
          <Link
            href="/onboarding/withdrawal"
            className={`inline-flex h-[52px] w-fit items-center justify-center gap-2 rounded-[8px] px-8 text-[15px] font-bold transition-colors ${
              withdrawal
                ? "border border-border-light bg-white text-ink-nav hover:bg-stone"
                : "bg-brand text-white hover:bg-brand-hover"
            }`}
          >
            {withdrawal ? t("withdrawalCtaEdit") : t("withdrawalCta")}
            <ArrowRightIcon />
          </Link>
        )}

        {user.kycStatus !== "verified" && !withdrawal && (
          <p className="text-[13px] leading-[1.6] text-ink-muted">
            {t("withdrawalLockedNote")}
          </p>
        )}
      </div>

      {/* Account details card */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border-light bg-white p-8 lg:p-10">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-[24px] leading-tight text-ink">
            {t("detailsHeading")}
          </h2>
          <p className="text-[13px] text-ink-muted">{t("detailsSubheading")}</p>
        </div>

        <div className="flex flex-col">
          {details.map((row, i) => (
            <div
              key={row.labelKey}
              className={`flex items-center justify-between gap-4 py-4 ${
                i < details.length - 1 ? "border-b border-border-light" : ""
              }`}
            >
              <span className="text-[14px] text-ink-secondary">
                {t(row.labelKey)}
              </span>
              <span className="text-[14px] font-semibold text-ink">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function maskNumber(value: string | null): string {
  if (!value) return "—";
  const last4 = value.slice(-4);
  return `•••• ${last4}`;
}