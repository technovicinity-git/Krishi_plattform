import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ROLES = ["investor", "steward", "farmer"] as const;

export function ClearRoles() {
  const t = useTranslations("aboutPage.clearRoles");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:gap-20">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <Heading as="h2" size="section">
                {t("heading")}
              </Heading>
            </div>

            <div className="flex flex-col divide-y divide-border-light rounded-[8px] border border-border-light bg-white">
              {ROLES.map((key) => (
                <div key={key} className="flex items-center gap-6 px-7 py-7">
                  <span className="w-[160px] shrink-0 font-serif text-[20px] leading-tight text-ink">
                    {t(`roles.${key}.title`)}
                  </span>
                  <span className="text-[15px] leading-[1.65] text-ink-secondary">
                    {t(`roles.${key}.description`)}
                  </span>
                </div>
              ))}
            </div>

            <p className="max-w-[720px] text-[15px] leading-[1.65] text-ink-secondary">
              {t("paragraph")}
            </p>
          </div>

          <div className="relative aspect-[480/480] w-full overflow-hidden rounded-xl">
            <Image
              src="/images/hero-image-container.png"
              alt={t("imageAlt")}
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}