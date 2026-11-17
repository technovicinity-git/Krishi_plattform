import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StarIcon } from "@/components/icons";
import type { StewardListItem } from "@/lib/public/stewards";

function humanize(s: string): string {
  return s
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StewardCard({ steward }: { steward: StewardListItem }) {
  const t = useTranslations("stewardsPage.directory");

  // Map DB category slugs → translation keys.
  const categoryKeyMap: Record<string, string> = {
    cow: "cattle",
    goat: "goats",
    cattle: "cattle",
    goats: "goats",
    sheep: "sheep",
    buffalo: "buffalo",
    dumba: "dumba",
    "garole-sheep": "garoleSheep",
    "garole_sheep": "garoleSheep",
    "garole sheep": "garoleSheep",
    garole: "garoleSheep",
    other: "other",
  };

  // Safe access to t.has() — available in next-intl v4.
  const tAny = t as unknown as { has?: (k: string) => boolean };
  const hasKey = (k: string) =>
    typeof tAny.has === "function" ? tAny.has(k) : false;

  const image = "/images/why-visual.png";

  return (
    <article className="flex flex-col overflow-hidden rounded-[8px] border border-border-card bg-white">
      <div className="relative aspect-[410/220] w-full bg-stone">
        <Image
          src={image}
          alt={steward.name}
          fill
          sizes="(min-width: 1024px) 410px, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-80 mix-blend-multiply"
        />
      </div>

      <div className="flex flex-col gap-[18px] p-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-serif text-[24px] leading-[1.2] text-ink">
            {steward.name}
          </h3>
          <span className="text-[12px] font-semibold text-sage">
            {steward.type === "organization"
              ? t("types.organization")
              : t("types.individual")}
          </span>
          <span className="text-[13px] leading-[1.5] text-ink-secondary">
            {steward.operatingArea ?? "Bangladesh"}
          </span>

          {steward.ratingAvg ? (
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <StarIcon className="h-3.5 w-3.5 text-terracotta" />
              {steward.ratingAvg.toFixed(1)} ·{" "}
              {t("card.ratingCount", { count: steward.ratingCount })}
            </span>
          ) : (
            <span className="text-[13px] font-medium text-ink-muted">
              {t("card.noReviews")}
            </span>
          )}
        </div>

        <div className="border-y border-stone py-3">
          <span className="text-[12px] font-semibold text-sage">
            {t("card.livestockFocus")}
          </span>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
            {steward.categories.map((cat) => {
              const lower = cat.toLowerCase();
              const key = categoryKeyMap[lower] ?? lower;
              const fullKey = `categories.${key}`;
              const label = hasKey(fullKey)
                ? t(fullKey)
                : humanize(cat);
              return (
                <span
                  key={cat}
                  className="text-[12px] font-semibold text-ink"
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        <p className="text-[13px] leading-[1.65] text-ink-secondary">
          Currently offering <strong>{steward.offeringsCount}</strong> active
          investment {steward.offeringsCount === 1 ? "plan" : "plans"}.
        </p>

        <Link
          href={`/stewards/${steward.id}`}
          className="mt-1 inline-flex h-[44px] w-full items-center justify-center rounded-[4px] border border-border-light text-[13px] font-semibold text-ink-nav transition-colors hover:bg-stone"
        >
          {t("card.viewProfile")}
        </Link>
      </div>
    </article>
  );
}