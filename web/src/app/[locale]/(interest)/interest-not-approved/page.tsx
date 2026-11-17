import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/AuthShell";
import { InterestStatus } from "@/components/interest/InterestStatus";
import { InfoCircleIcon } from "@/components/icons";

export default function InterestNotApprovedPage() {
  const t = useTranslations("interest.notApproved");

  return (
    <AuthShell backHref="/plans" backLabel={t("backLabel")}>
      <InterestStatus
        icon={<InfoCircleIcon className="h-7 w-7" />}
        tone="info"
        heading={t("heading")}
        description={t("description")}
        referenceLabel={t("referenceLabel")}
        badgeLabel={t("badgeLabel")}
        badgeTone="info"
        rows={[
          { label: t("rowOpportunity"), value: "Cow Fattening Plan" },
          { label: t("rowIntendedUnits"), value: "2 Units" },
          { label: t("rowIntendedInvestment"), value: "৳2,00,000", valueTone: "terracotta" },
        ]}
        primaryAction={{ label: t("primaryAction"), href: "/plans", variant: "dark" }}
        secondaryAction={{ label: t("secondaryAction"), href: "/contact" }}
        tertiaryNote={t("tertiaryNote")}
      />
    </AuthShell>
  );
}