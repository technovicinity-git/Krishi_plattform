"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Pill } from "@/components/ui/Pill";
import { StewardCard } from "./StewardCard";
import { ChevronDownIcon, SearchIcon } from "@/components/icons";
import type { StewardListItem } from "@/lib/public/stewards";

type LocationFilter = "all" | string;
type CategoryFilter = "all" | "cattle" | "goats" | "sheep" | "buffalo";

interface Props {
  items: StewardListItem[];
}

export function StewardsDirectory({ items }: Props) {
  const t = useTranslations("stewardsPage.directory");

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<LocationFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");

  // Extract unique divisions from the real data for the filter dropdown
  const divisions = useMemo(() => {
    const set = new Set(items.map((s) => s.divisionName).filter(Boolean));
    return Array.from(set) as string[];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((s) => {
      if (query) {
        const q = query.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !(s.operatingArea ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (location !== "all" && s.divisionName !== location) return false;
      
      if (category !== "all") {
        // Categories in DB might be stored as 'cow' but frontend expects 'cattle'
        const catMap: Record<string, string> = {
          cattle: "cow",
          goats: "goat",
          sheep: "sheep",
          buffalo: "buffalo",
        };
        if (!s.categories.includes(catMap[category])) return false;
      }
      return true;
    });
  }, [query, location, category, items]);

  return (
    <Section size="lg" className="bg-cream">
      <Container>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <Pill>{t("tag")}</Pill>
            <Heading as="h2" size="section">
              {t("heading")}
            </Heading>
            <p className="text-[13px] leading-[1.65] text-ink-secondary">
              {t("disclaimer")}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="flex h-[52px] w-full items-center gap-2.5 rounded-[6px] border border-border-light bg-white px-4 lg:w-[600px]">
              <SearchIcon className="text-ink-tertiary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-transparent text-[13px] text-ink placeholder:text-ink-secondary focus:outline-none"
              />
            </div>

            <FilterSelect
              label={t("locationLabel")}
              value={location}
              onChange={setLocation}
              options={[
                { value: "all", label: t("locationAll") },
                ...divisions.map((d) => ({ value: d, label: d })),
              ]}
            />

            <FilterSelect
              label={t("categoryLabel")}
              value={category}
              onChange={(v) => setCategory(v as CategoryFilter)}
              options={[
                { value: "all", label: t("categoryAll") },
                { value: "cattle", label: t("categories.cattle") },
                { value: "goats", label: t("categories.goats") },
                { value: "sheep", label: t("categories.sheep") },
                { value: "buffalo", label: t("categories.buffalo") },
              ]}
            />
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <StewardCard key={s.id} steward={s} />
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-border-light bg-stone p-12 text-center">
              <p className="text-[14px] font-semibold text-ink-secondary">
                {t("emptyState")}
              </p>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative flex h-[56px] flex-1 flex-col justify-center rounded-[6px] border border-border-light bg-white py-3 pl-4 pr-10">
      <span className="text-[10px] font-medium uppercase leading-none tracking-[0.02em] text-ink-secondary">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full appearance-none bg-transparent text-[13px] font-semibold leading-none text-ink focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
    </div>
  );
}