import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const ITEMS: { key: string; icon: NavIconName }[] = [
  { key: "kyc", icon: "shield" },
  { key: "participants", icon: "users" },
  { key: "escrow", icon: "lock" },
  { key: "photoUpdates", icon: "leaf" },
  { key: "expenseApprovals", icon: "receipt" },
  { key: "settlements", icon: "clipboard" },
];

export function TrustGrid() {
  const t = useTranslations("home.trust");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-10 lg:gap-[72px]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5">
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <Heading as="h2" size="section">
                {t("heading")}
              </Heading>
            </div>
            <p className="max-w-[380px] text-[14px] leading-[1.65] text-ink-muted lg:text-right">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {ITEMS.map((item) => (
              <article
                key={item.key}
                className="flex gap-4 rounded-xl border border-border-light bg-white p-5 transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] md:flex-col md:gap-5 md:p-7"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                  <NavIcon name={item.icon} className="h-5 w-5" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-serif text-[18px] leading-[1.35] text-ink md:text-[20px]">
                    {t(`items.${item.key}.title`)}
                  </h3>
                  <p className="text-[13px] leading-[1.65] text-ink-secondary">
                    {t(`items.${item.key}.description`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
