import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/AuthShell";
import { InterestStatus } from "@/components/interest/InterestStatus";
import { CheckCircleOutlineIcon } from "@/components/icons";

export default function InterestReceivedPage() {
  const t = useTranslations("interest.received");

  return (
    <AuthShell backHref="/plans" backLabel={t("backLabel")}>
      <InterestStatus
        icon={<CheckCircleOutlineIcon className="h-7 w-7" />}
        tone="success"
        heading={t("heading")}
        description={t("description")}
        referenceLabel={t("referenceLabel")}
        badgeLabel={t("badgeLabel")}
        badgeTone="warning"
        rows={[
          { label: t("rowOpportunity"), value: "Cow Fattening Plan" },
          { label: t("rowIntendedUnits"), value: "2 Units" },
          { label: t("rowIntendedInvestment"), value: "৳2,00,000", valueTone: "brand" },
        ]}
        primaryAction={{ label: t("primaryAction"), href: "/plans", variant: "dark" }}
        secondaryAction={{ label: t("secondaryAction"), href: "/plans" }}
        tertiaryNote={t("tertiaryNote")}
      />
    </AuthShell>
  );
}