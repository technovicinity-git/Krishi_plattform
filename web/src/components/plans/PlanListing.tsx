"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { PlanCard } from "@/components/plans/PlanCard";
import { ChevronDownIcon, SearchIcon, XCircleIcon } from "@/components/icons";
import type { OfferingListItem } from "@/lib/public/plans";

interface PlanListingProps {
  items: OfferingListItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

export function PlanListing({ items, total, page, hasMore }: PlanListingProps) {
  const t = useTranslations("plansPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read current filter values from URL
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "all";
  const division = searchParams.get("division") ?? "all";
  const duration = searchParams.get("duration") ?? "any";
  const roi = searchParams.get("roi") ?? "any";
  const status = searchParams.get("status") ?? "open";

  // Controlled input for search — syncs with URL
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === "all" || value === "any") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset page on filter change
    if (key !== "page") params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    !!search ||
    category !== "all" ||
    division !== "all" ||
    duration !== "any" ||
    roi !== "any" ||
    status !== "open";

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  };

  return (
    <Container>
      <div className="flex flex-col gap-6 pb-20">
        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParam("search", searchInput.trim() || null);
            }}
            className="flex h-10 w-full items-center gap-2.5 rounded-[6px] border border-border-light bg-white px-4 sm:w-[280px]"
          >
            <SearchIcon className="text-ink-tertiary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("filters.search")}
              className="w-full bg-transparent text-[13px] text-ink placeholder:text-ink-tertiary focus:outline-none"
            />
          </form>

          <FilterSelect
            label={t("filters.categoryLabel")}
            value={category}
            onChange={(v) => updateParam("category", v)}
            options={[
              { value: "all", label: t("filters.categoryAll") },
              { value: "cow", label: t("filters.categoryCow") },
              { value: "goat", label: t("filters.categoryGoat") },
              { value: "buffalo", label: t("filters.categoryBuffalo") },
              { value: "sheep", label: t("filters.categorySheep") },
            ]}
          />

          <FilterSelect
            label={t("filters.divisionLabel")}
            value={division}
            onChange={(v) => updateParam("division", v)}
            options={[
              { value: "all", label: t("filters.divisionAll") },
              { value: "dhaka", label: "Dhaka" },
              { value: "chattogram", label: "Chattogram" },
              { value: "khulna", label: "Khulna" },
              { value: "mymensingh", label: "Mymensingh" },
              { value: "rajshahi", label: "Rajshahi" },
              { value: "sylhet", label: "Sylhet" },
              { value: "barishal", label: "Barishal" },
              { value: "rangpur", label: "Rangpur" },
            ]}
          />

          <FilterSelect
            label={t("filters.durationLabel")}
            value={duration}
            onChange={(v) => updateParam("duration", v)}
            options={[
              { value: "any", label: t("filters.durationAny") },
              { value: "short", label: t("filters.durationShort") },
              { value: "medium", label: t("filters.durationMedium") },
              { value: "long", label: t("filters.durationLong") },
            ]}
          />

          <FilterSelect
            label={t("filters.roiLabel")}
            value={roi}
            onChange={(v) => updateParam("roi", v)}
            options={[
              { value: "any", label: t("filters.roiAny") },
              { value: "10-15", label: "10–15%" },
              { value: "15-20", label: "15–20%" },
              { value: "20-30", label: "20–30%" },
            ]}
          />

          <FilterSelect
            label={t("filters.statusLabel")}
            value={status}
            onChange={(v) => updateParam("status", v)}
            options={[
              { value: "open", label: t("filters.statusOpen") },
              { value: "all", label: t("filters.statusAll") },
              { value: "coming_soon", label: t("statuses.comingSoon") },
              { value: "fully_funded", label: t("statuses.fullyFunded") },
            ]}
          />
        </div>

        {/* Active filters row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-light pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-[0.02em] text-ink-tertiary">
              {t("filters.activeFiltersLabel")}
            </span>
            {category !== "all" && (
              <Chip
                label={t(`filters.category${capitalize(category)}`)}
                onRemove={() => updateParam("category", null)}
              />
            )}
            {division !== "all" && (
              <Chip label={division} onRemove={() => updateParam("division", null)} />
            )}
            {duration !== "any" && (
              <Chip
                label={t(`filters.duration${capitalize(duration)}`)}
                onRemove={() => updateParam("duration", null)}
              />
            )}
            {roi !== "any" && (
              <Chip
                label={roi.replace("-", "–") + "%"}
                onRemove={() => updateParam("roi", null)}
              />
            )}
            {search && (
              <Chip label={`"${search}"`} onRemove={() => updateParam("search", null)} />
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[13px] font-semibold text-terracotta hover:underline"
              >
                {t("filters.clearAll")}
              </button>
            )}
          </div>
          <span className="text-[13px] font-medium text-ink-secondary">
            {t("filters.showing", { shown: items.length, total })}
          </span>
        </div>

        {/* Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <OfferingCard key={item.offeringId} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-border-light bg-stone p-12 text-center">
            <p className="text-[14px] font-semibold text-ink-secondary">
              No opportunities match your filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || isPending}
            className="rounded-[4px] border border-border-light px-4 py-2.5 text-[13px] font-semibold text-ink-secondary disabled:opacity-50"
          >
            {t("pagination.previous")}
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-ink text-[13px] font-bold text-white">
            {page}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={!hasMore || isPending}
            className="rounded-[4px] border border-border-light px-4 py-2.5 text-[13px] font-semibold text-ink-secondary disabled:opacity-50"
          >
            {t("pagination.next")}
          </button>
        </div>
      </div>
    </Container>
  );
}

// ─── Card adapter ───────────────────────────────────────────────────

function OfferingCard({ item }: { item: OfferingListItem }) {
  const t = useTranslations("plansPage");

  const fundingValue = `${
    item.unitsFunded
  } of ${item.unitsOffered} Units`;
  const percentage =
    item.unitsOffered > 0 ? (item.unitsFunded / item.unitsOffered) * 100 : 0;

  const statusLabel =
    item.status === "open"
      ? t("statuses.accepting")
      : item.status === "coming_soon"
        ? t("statuses.comingSoon")
        : t("statuses.fullyFunded");

  const statusVariant =
    item.status === "open"
      ? ("approved" as const)
      : item.status === "coming_soon"
        ? ("neutral" as const)
        : ("funded" as const);

  const ctaLabel =
    item.status === "open"
      ? t("card.viewOpportunity")
      : item.status === "coming_soon"
        ? t("card.registerInterest")
        : t("statuses.fullyFunded");

  const ctaVariant =
    item.status === "open"
      ? ("dark" as const)
      : item.status === "coming_soon"
        ? ("outline" as const)
        : ("disabled" as const);

  const imageUrl = item.imagePath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/plan-images/${item.imagePath}`
    : "/images/card-image.png";

  const money = (n: number) => {
    // Approximate lakh-style formatting
    const s = String(Math.round(n));
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return `${rest},${last3}`;
  };

  return (
    <PlanCard
      image={imageUrl}
      imageAlt={item.planNameEn}
      title={item.planNameEn}
      meta={`${item.districtNameEn} · ${item.durationMonths} months · ${item.steward.name}`}
      status={statusLabel}
      statusVariant={statusVariant}
      estimatedReturn={`${item.roiMin}–${item.roiMax}%`}
      estimatedReturnLabel={t("card.estimatedReturn")}
      investmentPerUnit={`৳${money(item.unitPrice)}`}
      investmentPerUnitLabel={t("card.investmentPerUnit")}
      breakdown={`Animal ৳${money(item.animalAllocation)} + Care ৳${money(
        item.careAllocation,
      )}`}
      fundingProgress={{
        label: t("card.fundingProgress"),
        value: fundingValue,
        percentage,
      }}
      ctaLabel={ctaLabel}
      ctaHref={`/plans/${item.offeringSlug}`}
      ctaVariant={ctaVariant}
    />
  );
}

// ─── UI helpers ─────────────────────────────────────────────────────

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
    <div className="relative flex h-[54px] min-w-[120px] flex-1 flex-col justify-center rounded-[6px] border border-border-light bg-white py-3 pl-4 pr-10 lg:flex-initial">
      <span className="text-[10px] font-medium uppercase leading-none text-ink-muted">
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

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone py-1.5 pl-3 pr-2.5 text-[12px] font-medium text-ink-secondary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-ink-tertiary hover:text-ink"
        aria-label={`Remove ${label} filter`}
      >
        <XCircleIcon />
      </button>
    </span>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}