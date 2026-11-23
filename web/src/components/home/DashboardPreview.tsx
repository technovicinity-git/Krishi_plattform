import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { delay } from "./motion";

export function DashboardPreview() {
  const t = useTranslations("home.dashboard");

  return (
    <Section size="xl" className="bg-dark">
      <Container>
        <div className="flex flex-col items-center gap-16">
          <div data-reveal className="flex max-w-[760px] flex-col items-center gap-4 text-center">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section" variant="onDark">
              {t("heading")}
            </Heading>
            {/* Figma uses ink-secondary (#6B6560) — low contrast on dark.
                Using ink-muted for readability. Flag: review against Figma. */}
            <p className="text-[15px] leading-[1.7] text-ink-muted">
              {t("paragraph")}
            </p>
          </div>

          <div data-reveal="zoom" style={delay(150)} className="relative aspect-[1040/447] w-full max-w-[1040px] overflow-hidden rounded-2xl border border-[#2E2C28] shadow-2xl">
            <Image
              src="/images/dashboard-mockup.png"
              alt={t("imageAlt")}
              fill
              sizes="(min-width: 1024px) 1040px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}