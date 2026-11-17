import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import type { Steward } from "@/lib/stewards";

export function StewardAbout({ steward }: { steward: Steward }) {
  const t = useTranslations("stewardProfile.about");
  const bio = steward.longBio ?? [steward.description];

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

          <div className="flex flex-col gap-4 lg:pt-8">
            <span className="text-[13px] font-semibold text-sage">
              {t("bioLabel", { name: steward.name.split(" ")[0] })}
            </span>
            {bio.map((para, i) => (
              <p
                key={i}
                className="text-[15px] leading-[1.7] text-ink-secondary md:text-[16px]"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}