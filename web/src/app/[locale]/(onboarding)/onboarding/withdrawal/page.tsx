import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getWithdrawalPreference } from "@/lib/auth/current-user";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { WithdrawalForm } from "@/components/onboarding/WithdrawalForm";
import { Heading } from "@/components/ui/Heading";

export default async function OnboardingWithdrawalPage() {
  const session = await getSessionFromCookie();
  if (!session) redirect("/login");

  const existing = await getWithdrawalPreference(session.sub);
  const t = await getTranslations("onboarding.step3");

  return (
    <OnboardingShell
      exitLabel={t("exitLabel")}
      aside={
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Heading as="h1" size="subsection" className="lg:text-[36px]">
              {t("asideHeading")}
            </Heading>
            <p className="text-[14px] leading-[1.6] text-ink-secondary">
              {t("asideParagraph")}
            </p>
          </div>

          <OnboardingProgress currentStep={3} />
        </div>
      }
      main={<WithdrawalForm initial={existing} />}
    >
      {null}
    </OnboardingShell>
  );
}