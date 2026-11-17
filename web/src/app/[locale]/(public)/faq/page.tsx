import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FaqAccordion } from "@/components/faq/FaqAccordion";

const HOME_ITEMS = ["q1", "q2", "q3", "q4", "q5"] as const;
const DETAIL_ITEMS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

export default async function FaqPage() {
  const t = await getTranslations("home.faq");
  const tDetail = await getTranslations("howItWorks.faqPreview");

  return (
    <Section size="xl" className="bg-stone">
      <Container>
        <div className="mx-auto flex max-w-[760px] flex-col gap-12">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h1" size="section">
              {t("heading")}
            </Heading>
            <p className="text-[14px] leading-[1.7] text-ink-tertiary">
              {t("paragraph")}
            </p>
          </div>

          <FaqAccordion namespace="home.faq.items" keys={HOME_ITEMS} />

          <div className="flex flex-col gap-6">
            <Heading as="h2" size="card">
              {tDetail("heading")}
            </Heading>
            <FaqAccordion namespace="howItWorks.faqPreview.items" keys={DETAIL_ITEMS} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
