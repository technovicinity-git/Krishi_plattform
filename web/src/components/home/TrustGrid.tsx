import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ITEMS = [
  { number: "01", key: "kyc" },
  { number: "02", key: "participants" },
  { number: "03", key: "escrow" },
  { number: "04", key: "photoUpdates" },
  { number: "05", key: "expenseApprovals" },
  { number: "06", key: "settlements" },
] as const;

export function TrustGrid() {
  const t = useTranslations("home.trust");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-[72px]">
          <div className="flex flex-col gap-5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <Heading as="h2" size="section">
                {t("heading")}
              </Heading>
              <p className="max-w-[380px] text-[14px] leading-[1.65] text-ink-muted lg:text-right">
                {t("subtitle")}
              </p>
            </div>
            <div className="h-px w-full bg-border-divider" />
          </div>

          <div className="grid grid-cols-1 gap-px bg-border-light md:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map((item) => (
              <article
                key={item.key}
                className="flex flex-col gap-5 bg-cream p-9"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
                  {item.number}
                </span>
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-serif text-[20px] leading-[1.35] text-ink">
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