"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const LOCALES = [
  { code: "bn", label: "বাংলা", ariaLabel: "বাংলায় দেখুন" },
  { code: "en", label: "EN", ariaLabel: "Switch to English" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];

/**
 * Segmented Bangla / English toggle. Keeps the current path and query
 * string when switching, and highlights the active language.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("app.common");
  const locale = useLocale() as LocaleCode;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeIndex = Math.max(
    0,
    LOCALES.findIndex((l) => l.code === locale),
  );

  const switchTo = (next: LocaleCode) => {
    if (next === locale) return;
    // Preserve the query string (filters, pagination, etc.)
    const search = typeof window !== "undefined" ? window.location.search : "";
    startTransition(() => {
      router.replace(`${pathname}${search}`, { locale: next });
    });
  };

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border-light bg-stone/50 py-[3px] pl-2.5 pr-[3px]",
        isPending && "opacity-70",
        className,
      )}
    >
      <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />
      <div className="relative grid grid-cols-2">
        {/* Sliding indicator */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              onClick={() => switchTo(l.code)}
              aria-pressed={active}
              aria-label={l.ariaLabel}
              disabled={isPending}
              className={cn(
                "relative z-10 flex h-7 min-w-[52px] items-center justify-center rounded-full px-3 text-[12px] leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                active
                  ? "font-semibold text-ink"
                  : "font-medium text-ink-tertiary hover:text-ink",
              )}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5" />
      <path d="M8 1.75c1.7 1.8 2.6 3.9 2.6 6.25S9.7 12.45 8 14.25C6.3 12.45 5.4 10.35 5.4 8S6.3 3.55 8 1.75z" />
    </svg>
  );
}
