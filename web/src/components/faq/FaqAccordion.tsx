"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "@/components/icons";

export function FaqAccordion({
  namespace,
  keys,
}: {
  namespace: string;
  keys: readonly string[];
}) {
  const t = useTranslations(namespace);
  const [openKey, setOpenKey] = useState<string | null>(keys[0] ?? null);

  return (
    <div className="flex flex-col gap-0.5">
      {keys.map((key, index) => {
        const isOpen = openKey === key;
        const radiusClass =
          index === 0
            ? "rounded-t-[10px]"
            : index === keys.length - 1
              ? "rounded-b-[10px]"
              : "rounded-[2px]";

        return (
          <div key={key} className={`bg-white p-7 ${radiusClass}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenKey(isOpen ? null : key)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="text-[15px] font-bold leading-tight text-ink">
                {t(`${key}.question`)}
              </span>
              <ChevronDownIcon
                className={`shrink-0 text-ink-tertiary transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <p className="mt-3.5 text-[14px] leading-[1.7] text-ink-secondary">
                {t(`${key}.answer`)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
