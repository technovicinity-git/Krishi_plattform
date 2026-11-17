import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import type { Steward } from "@/lib/stewards";

export function StewardAtAGlance({ steward }: { steward: Steward }) {
  const t = useTranslations("stewardProfile.glance");

  const fields = [
    { key: "operatingArea", label: t("fields.operatingArea"), value: steward.operatingArea ?? steward.location },
    { key: "livestockFocus", label: t("fields.livestockFocus"), value: steward.livestockFocus ?? "—" },
    { key: "stewardType", label: t("fields.stewardType"), value: steward.stewardTypeLabel ?? t(`types.${steward.type}`) },
    { key: "currentOpportunities", label: t("fields.currentOpportunities"), value: String(steward.currentOpportunitiesCount ?? 0) },
  ];

  return (
    <Section size="md" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-6">
          <Heading as="h2" size="section">
            {t("heading")}
          </Heading>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {fields.map((f) => (
              <div
                key={f.key}
                className="flex flex-col gap-2 rounded-[8px] border border-border-light bg-cream px-5 py-4"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.02em] text-sage">
                  {f.label}
                </span>
                <span className="font-serif text-[18px] leading-tight text-ink">
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}