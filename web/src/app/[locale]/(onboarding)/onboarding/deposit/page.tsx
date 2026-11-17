import { useTranslations } from "next-intl";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingBatchCard } from "@/components/onboarding/OnboardingBatchCard";
import { DepositForm } from "@/components/onboarding/DepositForm";
import { Heading } from "@/components/ui/Heading";

export default function OnboardingDepositPage() {
  const t = useTranslations("onboarding.step4");

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

          <OnboardingProgress currentStep={4} />

          <OnboardingBatchCard
            reference="KR-INV-000125"
            status={t("batchStatus")}
            planTitle="Cow Fattening Plan"
            units={2}
            deposit={200000}
          />
        </div>
      }
      main={<DepositForm />}
    >
      {null}
    </OnboardingShell>
  );
}