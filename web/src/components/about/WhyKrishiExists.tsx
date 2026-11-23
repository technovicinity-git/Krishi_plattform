import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function WhyKrishiExists() {
  const t = useTranslations("aboutPage.whyKrishi");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" className="[text-wrap:balance]">
              {t("headingLine1")} {t("headingLine2")}
            </Heading>
          </div>

          <div className="flex flex-col gap-6 lg:pt-6">
            <p className="text-[16px] leading-[1.65] text-ink-secondary">
              {t("paragraph")}
            </p>
            <p className="border-l-[3px] border-brand pl-5 font-serif text-[24px] leading-[1.35] text-ink md:text-[26px]">
              {t("purpose")}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}