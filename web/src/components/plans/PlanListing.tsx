"use client";

import { useId, useMemo, useRef, useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { PlanCard } from "@/components/plans/PlanCard";
import { CheckIcon, ChevronDownIcon, SearchIcon, XCircleIcon } from "@/components/icons";
import type { OfferingListItem } from "@/lib/public/plans";

interface PlanListingProps {
  items: OfferingListItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

export function PlanListing({ items, total, page, hasMore }: PlanListingProps) {
  const t = useTranslations("plansPage");
  const tpl = useTranslations("app.planText");
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
            className="flex h-[54px] w-full items-center gap-2.5 rounded-[6px] border border-border-light bg-white px-4 transition-colors focus-within:border-ink-tertiary hover:border-ink-tertiary sm:w-[280px]"
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
              { value: "dhaka", label: tpl("division.dhaka") },
              { value: "chattogram", label: tpl("division.chattogram") },
              { value: "khulna", label: tpl("division.khulna") },
              { value: "mymensingh", label: tpl("division.mymensingh") },
              { value: "rajshahi", label: tpl("division.rajshahi") },
              { value: "sylhet", label: tpl("division.sylhet") },
              { value: "barishal", label: tpl("division.barishal") },
              { value: "rangpur", label: tpl("division.rangpur") },
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
              <Chip
                label={tpl.has(`division.${division}`) ? tpl(`division.${division}`) : division}
                onRemove={() => updateParam("division", null)}
              />
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
                className="text-[13px] font-semibold text-brand hover:underline"
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
              {tpl("noResults")}
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
  const tp = useTranslations("app.planText");
  const bn = useLocale() === "bn";
  const planName = bn ? item.planNameBn : item.planNameEn;

  const fundingValue = tp("unitsOf", { funded: item.unitsFunded, total: item.unitsOffered });
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
      imageAlt={planName}
      title={planName}
      meta={`${bn ? item.districtNameBn : item.districtNameEn} · ${tp("months", { count: item.durationMonths })} · ${item.steward.name}`}
      status={statusLabel}
      statusVariant={statusVariant}
      estimatedReturn={`${item.roiMin}–${item.roiMax}%`}
      estimatedReturnLabel={t("card.estimatedReturn")}
      investmentPerUnit={`৳${money(item.unitPrice)}`}
      investmentPerUnitLabel={t("card.investmentPerUnit")}
      breakdown={tp("breakdown", { animal: `৳${money(item.animalAllocation)}`, care: `৳${money(item.careAllocation)}` })}
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
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const openList = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    const opt = options[index];
    setOpen(false);
    buttonRef.current?.focus();
    if (opt && opt.value !== value) onChange(opt.value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative min-w-[140px] flex-1 lg:flex-initial"
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={`flex h-[54px] w-full items-center justify-between gap-3 rounded-[6px] border bg-white pl-4 pr-3 text-left transition-colors hover:border-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 ${
          open ? "border-ink-tertiary" : "border-border-light"
        }`}
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-medium uppercase leading-none tracking-[0.02em] text-ink-muted">
            {label}
          </span>
          <span className="truncate text-[13px] font-semibold leading-none text-ink">
            {selected?.label}
          </span>
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-30 mt-1.5 max-h-[280px] w-full min-w-[200px] overflow-y-auto rounded-[8px] border border-border-light bg-white py-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`mx-1.5 flex cursor-pointer items-center justify-between gap-3 rounded-[5px] px-3 py-2.5 text-[13px] ${
                  isActive ? "bg-stone" : ""
                } ${isSelected ? "font-semibold text-brand" : "text-ink"}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <CheckIcon className="h-3 w-3 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
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