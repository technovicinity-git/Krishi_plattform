import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { AlertTriangleIcon } from "@/components/icons";

export function RiskDisclosure() {
  const t = useTranslations("home.riskDisclosure");

  return (
    <Section size="md" className="bg-stone">
      <Container>
        <div className="mx-auto max-w-[1000px] rounded-xl border-l-4 border-brand bg-white p-10">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <AlertTriangleIcon className="text-brand" />
              <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-brand">
                {t("label")}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[15px] font-bold leading-tight text-ink">
                {t("title")}
              </h3>
              <p className="text-[13px] leading-[1.7] text-ink-secondary">
                {t("body")}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}