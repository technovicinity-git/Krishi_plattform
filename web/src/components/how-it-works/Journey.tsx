import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { NavIcon, type NavIconName } from "@/components/dashboard/NavIcon";

const TOP = ["explore", "express", "approved", "kyc", "deposit"] as const;
const BOTTOM = ["assigned", "care", "updates", "sale", "settlement"] as const;

const ICON: Record<string, NavIconName> = {
  explore: "eye",
  express: "inbox",
  approved: "check",
  kyc: "shield",
  deposit: "wallet",
  assigned: "tag",
  care: "leaf",
  updates: "chart",
  sale: "receipt",
  settlement: "coins",
};

export function Journey() {
  const t = useTranslations("howItWorks.journey");

  const renderRow = (keys: readonly string[], startNumber: number) => (
    <div className="relative grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5 lg:gap-4">
      {/* Joins the five steps on wide screens. */}
      <span aria-hidden className="k-grow-x absolute left-[10%] right-[10%] top-[44px] hidden h-px bg-brand/25 lg:block" />
      {keys.map((key, i) => {
        const number = String(startNumber + i).padStart(2, "0");
        const isSecondHalf = startNumber > 1;
        return (
          <article
            key={key}
            className="group relative flex items-center gap-4 rounded-xl border border-border-light bg-cream p-4 lg:flex-col lg:items-stretch lg:p-6 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.2)]"
          >
            <div className="flex shrink-0 items-center justify-between">
              <span
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-white ring-4 ring-cream transition-transform duration-300 group-hover:scale-110",
                  isSecondHalf ? "bg-green-olive" : "bg-brand",
                )}
              >
                <NavIcon name={ICON[key]} className="h-[18px] w-[18px]" />
              </span>
              <span
                className={cn(
                  "hidden text-[12px] font-bold leading-none lg:inline",
                  isSecondHalf ? "text-green-olive" : "text-brand",
                )}
              >
                {number}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif text-[18px] leading-[1.4] text-ink">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-[12px] leading-[1.4] text-ink-secondary">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <Section size="lg" className="bg-stone">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          <div className="flex flex-col gap-4">
            {renderRow(TOP, 1)}
            {renderRow(BOTTOM, 6)}
          </div>
        </div>
      </Container>
    </Section>
  );
}