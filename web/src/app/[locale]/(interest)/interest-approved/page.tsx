import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/AuthShell";
import { InterestStatus } from "@/components/interest/InterestStatus";
import { CheckCircleOutlineIcon } from "@/components/icons";

export default function InterestApprovedPage() {
  const t = useTranslations("interest.approved");

  return (
    <AuthShell backHref="/plans" backLabel={t("backLabel")}>
      <InterestStatus
        icon={<CheckCircleOutlineIcon className="h-7 w-7" />}
        tone="success"
        heading={t("heading")}
        description={t("description")}
        referenceLabel={t("referenceLabel")}
        badgeLabel={t("badgeLabel")}
        badgeTone="success"
        rows={[
          { label: t("rowApprovedPlan"), value: "Cow Fattening Plan" },
          { label: t("rowAllocatedUnits"), value: "2 Units" },
          { label: t("rowTotalInvestment"), value: "৳2,00,000", valueTone: "brand" },
        ]}
        primaryAction={{ label: t("primaryAction"), href: "/onboarding/phone", variant: "brand" }}
        secondaryAction={{ label: t("secondaryAction"), href: "/plans" }}
        tertiaryNote={t("tertiaryNote")}
      />
    </AuthShell>
  );
}