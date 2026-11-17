import { useTranslations } from "next-intl";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingContext } from "@/components/onboarding/OnboardingContext";
import { PhoneVerifyForm } from "@/components/onboarding/PhoneVerifyForm";
import { Heading } from "@/components/ui/Heading";

export default function OnboardingPhonePage() {
  const t = useTranslations("onboarding.step1");

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

          <OnboardingProgress currentStep={1} />

          <OnboardingContext
            planTitle="Cow Fattening Plan"
            units={2}
            unitPrice={100000}
            total={200000}
          />
        </div>
      }
      main={<PhoneVerifyForm />}
    >
      {null}
    </OnboardingShell>
  );
}