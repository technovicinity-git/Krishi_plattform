import { useTranslations } from "next-intl";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingContext } from "@/components/onboarding/OnboardingContext";
import { KycForm } from "@/components/onboarding/KycForm";
import { Heading } from "@/components/ui/Heading";

export default function OnboardingKycPage() {
  const t = useTranslations("onboarding.step2");

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

          <OnboardingProgress currentStep={2} />

          {/* Context block — shown only when the user arrives via an approved interest.
            For now we hide it; we'll wire the interest_requests check in a later phase. */}
        {false && (
          <OnboardingContext
            planTitle="Cow Fattening Plan"
            units={2}
            unitPrice={100000}
            total={200000}
          />
        )}
        </div>
      }
      main={<KycForm />}
    >
      {null}
    </OnboardingShell>
  );
}