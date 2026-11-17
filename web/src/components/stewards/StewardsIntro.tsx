import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";

export function StewardsIntro() {
  const t = useTranslations("stewardsPage.intro");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("headingLine1")}
              <br />
              {t("headingLine2")}
            </Heading>
          </div>

          <div className="flex flex-col gap-5 lg:pt-14">
            <p className="text-[16px] leading-[1.65] text-ink-secondary">
              {t("paragraph1")}
            </p>
            <p className="text-[13px] leading-[1.65] text-ink-secondary">
              {t("paragraph2")}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}