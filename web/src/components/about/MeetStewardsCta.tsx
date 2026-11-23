import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function MeetStewardsCta() {
  const t = useTranslations("aboutPage.meetStewards");

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-6">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading as="h2" size="section" className="lg:text-[40px]">
            {t("heading")}
          </Heading>
          <p className="max-w-[720px] text-[16px] leading-[1.65] text-ink-secondary">
            {t("paragraph")}
          </p>
          <Link
            href="/stewards"
            className="mt-2 inline-flex w-fit items-center justify-center rounded-[5px] bg-ink px-6 py-3.5 text-[14px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand"
          >
            {t("cta")}
          </Link>
        </div>
      </Container>
    </Section>
  );
}