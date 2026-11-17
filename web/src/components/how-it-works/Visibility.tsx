import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { EyeIcon } from "@/components/icons";

const ITEMS = [
  "investment", "livestock", "purchase", "photos", "expenses",
  "sale", "transactions", "documents", "reports", "settlement",
] as const;

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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map((key) => (
              <article
                key={key}
                className="flex flex-col gap-3 rounded-[8px] border border-border-divider bg-white p-7"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F0EA] text-green-olive">
                  <EyeIcon />
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