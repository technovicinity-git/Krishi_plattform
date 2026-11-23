"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ChevronDownIcon } from "@/components/icons";
import { delay } from "./motion";

const ITEMS = ["q1", "q2", "q3", "q4", "q5"] as const;

export function Faq() {
  const t = useTranslations("home.faq");
  const [openKey, setOpenKey] = useState<string | null>("q1");

  return (
    <Section size="xl" className="bg-stone">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-24">
          {/* Left intro */}
          <div data-reveal className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="text-[14px] leading-[1.7] text-ink-tertiary">
              {t("paragraph")}
            </p>
          </div>

          {/* Accordion */}
          <div data-reveal style={delay(120)} className="flex flex-col gap-0.5">
            {ITEMS.map((key, index) => {
              const isOpen = openKey === key;
              const isFirst = index === 0;
              const isLast = index === ITEMS.length - 1;

              // Rounded corners only on first + last items
              const radiusClass = isFirst
                ? "rounded-t-[10px]"
                : isLast
                  ? "rounded-b-[10px]"
                  : "rounded-[2px]";

              return (
                <div
                  key={key}
                  className={`bg-white p-7 transition-colors hover:bg-[#FDFCFA] ${radiusClass}`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="text-[15px] font-bold leading-tight text-ink">
                      {t(`items.${key}.question`)}
                    </span>
                    <ChevronDownIcon
                      className={`shrink-0 text-ink-tertiary transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                    aria-hidden={!isOpen}
                  >
                    <div className="overflow-hidden">
                      <p className="pt-3.5 text-[14px] leading-[1.7] text-ink-secondary">
                        {t(`items.${key}.answer`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}