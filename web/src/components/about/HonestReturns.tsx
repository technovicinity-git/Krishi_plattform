import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { ChevronRightIcon } from "@/components/icons";

export function HonestReturns() {
  const t = useTranslations("aboutPage.honestReturns");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-10">
          <div className="h-0.5 w-12 bg-brand" />
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
            <Heading as="h2" size="section">
              {t("headingLine1")}
              <br />
              {t("headingLine2")}
            </Heading>
            <div className="flex flex-col gap-6 lg:pt-3">
              <p className="text-[16px] leading-[1.65] text-ink-secondary">
                {t("paragraph")}
              </p>
              <p className="font-serif text-[24px] leading-[1.35] text-ink md:text-[26px]">
                {t("qualification")}
              </p>
              <Link
                href="/risk-disclosure"
                className="inline-flex items-center gap-1 text-[14px] font-semibold text-brand hover:underline"
              >
                {t("link")}
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}