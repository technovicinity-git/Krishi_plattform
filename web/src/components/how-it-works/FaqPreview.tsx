"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { ChevronDownIcon } from "@/components/icons";

const ITEMS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

export function FaqPreview() {
  const t = useTranslations("howItWorks.faqPreview");
  const [openKey, setOpenKey] = useState<string | null>("q1");

  return (
    <Section size="xl" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
          </div>

          <div className="flex flex-col gap-0.5">
            {ITEMS.map((key) => {
              const isOpen = openKey === key;
              return (
                <div key={key} className="rounded-[4px] border border-border-light bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left"
                  >
                    <span className="text-[15px] font-bold leading-tight text-ink">
                      {t(`items.${key}.question`)}
                    </span>
                    <ChevronDownIcon
                      className={`shrink-0 text-ink-tertiary transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6">
                      <p className="text-[14px] leading-[1.6] text-ink-secondary">
                        {t(`items.${key}.answer`)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="text-[14px] text-ink-tertiary">{t("moreHelp")}</span>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center rounded-[4px] border border-ink px-6 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
            >
              {t("viewAll")}
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}