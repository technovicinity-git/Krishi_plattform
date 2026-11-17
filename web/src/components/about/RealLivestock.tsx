import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function RealLivestock() {
  const t = useTranslations("aboutPage.realLivestock");

  return (
    <Section size="lg" className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[440px_minmax(0,1fr)] lg:items-center lg:gap-20">
          <div className="relative aspect-[440/380] w-full overflow-hidden rounded-xl">
            <Image
              src="/images/hero-image-wrapper.png"
              alt={t("imageAlt")}
              fill
              sizes="(min-width: 1024px) 440px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col gap-6">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" className="lg:text-[40px]">
              {t("heading")}
            </Heading>
            <p className="max-w-[760px] text-[16px] leading-[1.65] text-ink-secondary">
              {t("paragraph")}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}