import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/AuthShell";
import { InterestStatus } from "@/components/interest/InterestStatus";
import { AlertTriangleIcon } from "@/components/icons";

export default function InterestAlreadySubmittedPage() {
  const t = useTranslations("interest.submitted");

  return (
    <AuthShell backHref="/plans" backLabel={t("backLabel")}>
      <InterestStatus
        icon={<AlertTriangleIcon className="h-7 w-7" />}
        tone="warning"
        heading={t("heading")}
        description={t("description")}
        referenceLabel={t("referenceLabel")}
        badgeLabel={t("badgeLabel")}
        badgeTone="warning"
        rows={[
          { label: t("rowOpportunity"), value: "Cow Fattening Plan" },
          { label: t("rowRequestedUnits"), value: "2 Units" },
          { label: t("rowSubmissionDate"), value: "05 September 2026" },
        ]}
        primaryAction={{ label: t("primaryAction"), href: "/plans", variant: "dark" }}
        secondaryAction={{ label: t("secondaryAction"), href: "/plans" }}
      />
    </AuthShell>
  );
}