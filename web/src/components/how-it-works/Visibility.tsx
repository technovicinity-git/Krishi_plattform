import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const ITEMS = [
  "investment", "livestock", "purchase", "photos", "expenses",
  "sale", "transactions", "documents", "reports", "settlement",
] as const;

const ICON: Record<(typeof ITEMS)[number], NavIconName> = {
  investment: "briefcase",
  livestock: "tag",
  purchase: "receipt",
  photos: "eye",
  expenses: "clipboard",
  sale: "coins",
  transactions: "history",
  documents: "inbox",
  reports: "chart",
  settlement: "wallet",
};

export function Visibility() {
  const t = useTranslations("howItWorks.visibility");

  return (
    <Section size="xl" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="max-w-[640px] text-[15px] leading-[1.65] text-ink-secondary md:text-[16px]">
              {t("paragraph")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ITEMS.map((key) => (
              <article
                key={key}
                className="group flex flex-col gap-3 rounded-xl border border-border-divider bg-white p-6 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_12px_28px_-16px_rgba(0,0,0,0.2)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                  <NavIcon name={ICON[key]} className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-[18px] leading-tight text-ink">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="text-[12px] leading-[1.4] text-ink-secondary">
                  {t(`items.${key}.description`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}