import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser, getWithdrawalPreference } from "@/lib/auth/current-user";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/dashboard/ui";
import { WithdrawalForm } from "@/components/onboarding/WithdrawalForm";

export default async function StewardPayoutAccountPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") redirect("/login");

  const [existing, t] = await Promise.all([
    getWithdrawalPreference(user.id),
    getTranslations("app.wallet"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={<BackLink href="/steward/wallet">{t("backToWallet")}</BackLink>}
        title={t("payoutAccount")}
        description={t("payoutHint")}
      />
      <div className="rounded-2xl border border-border-light bg-white p-6 sm:p-8">
        <WithdrawalForm initial={existing} redirectTo="/steward/wallet" />
      </div>
    </div>
  );
}
