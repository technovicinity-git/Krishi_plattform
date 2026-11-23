import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const ROLES = ["investor", "steward", "farmer"] as const;

const ICON: Record<(typeof ROLES)[number], NavIconName> = { investor: "user", steward: "clipboard", farmer: "leaf" };

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

            <div className="flex flex-col divide-y divide-border-light overflow-hidden rounded-xl border border-border-light bg-white">
              {ROLES.map((key) => (
                <div key={key} className="flex flex-col gap-2 px-6 py-6 transition-colors hover:bg-brand-tint/40 sm:flex-row sm:items-center sm:gap-6">
                  <span className="flex items-center gap-3 sm:w-[190px] sm:shrink-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                      <NavIcon name={ICON[key]} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-serif text-[20px] leading-tight text-ink">{t(`roles.${key}.title`)}</span>
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

          <div className="group relative aspect-[480/480] w-full overflow-hidden rounded-xl">
            <Image
              src="/images/hero-image-container.png"
              alt={t("imageAlt")}
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}