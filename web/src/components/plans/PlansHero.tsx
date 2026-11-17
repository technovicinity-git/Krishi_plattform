import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { ShieldIcon, EyeIcon, ActivityIcon } from "@/components/icons";

export function PlansHero() {
  const t = useTranslations("plansPage.hero");

  const trust = [
    { key: "trust1", icon: <ShieldIcon className="text-sage" /> },
    { key: "trust2", icon: <EyeIcon className="h-4 w-4 text-sage" /> },
    { key: "trust3", icon: <ActivityIcon className="text-sage" /> },
  ];

  return (
    <section className="bg-cream">
      <Container>
        <div className="flex flex-col gap-6 pt-14 pb-8 md:pt-16 md:pb-10 lg:pt-20 lg:pb-12">
          <Pill>{t("tag")}</Pill>

          <Heading as="h1" size="section" className="max-w-[1280px]">
            {t("heading")}
          </Heading>

          <p className="max-w-[640px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
            {t("paragraph")}
          </p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4">
            {trust.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                {item.icon}
                <span className="text-[13px] font-semibold text-ink-secondary">
                  {t(item.key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}