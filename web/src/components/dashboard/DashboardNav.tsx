"use client";

import { useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Link as LocaleLink } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { NavIcon, type NavIconName } from "./NavIcon";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: NavIconName;
  /** Match only the exact path (for section roots like /steward). */
  exact?: boolean;
  /** Small count pill, e.g. items waiting for review. Hidden when 0. */
  badge?: number;
}

export interface DashboardNavSection {
  label?: string;
  items: DashboardNavItem[];
  /** Render items as disabled "coming soon" rows. */
  locked?: boolean;
}

interface NavProps {
  sections: DashboardNavSection[];
  /** Locale-aware links (keeps /en). False for routes outside [locale]. */
  localized: boolean;
  lockedLabel?: string;
}

/** Path without the /en prefix, so it can be compared with nav hrefs. */
function useCurrentPath() {
  const raw = usePathname() ?? "/";
  return raw.replace(/^\/en(?=\/|$)/, "") || "/";
}

function isActive(path: string, item: DashboardNavItem) {
  return item.exact
    ? path === item.href
    : path === item.href || path.startsWith(item.href + "/");
}

function NavLink({
  localized,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  localized: boolean;
  href: string;
}) {
  return localized ? <LocaleLink {...props} /> : <NextLink {...props} />;
}

function Badge({ count, active }: { count?: number; active?: boolean }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
        active ? "bg-brand text-white" : "bg-brand-tint text-brand",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function DashboardSidebar({
  sections,
  localized,
  lockedLabel,
  title,
  subtitle,
  signOutLabel,
  signingOutLabel,
  logoutEndpoint,
  logoutRedirect,
}: NavProps & {
  title: string;
  subtitle?: string;
  signOutLabel: string;
  signingOutLabel: string;
  logoutEndpoint: string;
  logoutRedirect: string;
}) {
  const path = useCurrentPath();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(logoutEndpoint, { method: "POST" });
      router.push(logoutRedirect);
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[256px] shrink-0 flex-col border-r border-border-light bg-white lg:flex">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 rounded-xl bg-brand-tint px-3.5 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <NavIcon name="leaf" className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-green-deep">
              {title}
            </div>
            {subtitle && (
              <div className="truncate text-[11px] text-sage">{subtitle}</div>
            )}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
        {sections.map((section, i) => (
          <div key={section.label ?? i} className="flex flex-col gap-0.5">
            {section.label && (
              <span className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                {section.label}
              </span>
            )}
            {section.items.map((item) => {
              if (section.locked) {
                return (
                  <div
                    key={item.href}
                    aria-disabled="true"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-muted"
                  >
                    <NavIcon name={item.icon} className="opacity-60" />
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.04em]">
                      <NavIcon name="lock" className="h-3 w-3" />
                      {lockedLabel}
                    </span>
                  </div>
                );
              }
              const active = isActive(path, item);
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  localized={localized}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                    active
                      ? "bg-brand-tint font-semibold text-green-deep"
                      : "font-medium text-ink-secondary hover:bg-stone/60 hover:text-ink",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 -left-3 w-[3px] rounded-r-full bg-brand"
                    />
                  )}
                  <NavIcon
                    name={item.icon}
                    className={active ? "text-brand" : "text-ink-tertiary"}
                  />
                  <span className="truncate">{item.label}</span>
                  <Badge count={item.badge} active={active} />
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border-light p-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium text-ink-secondary transition-colors hover:bg-[#FAF0ED] hover:text-danger disabled:opacity-60"
        >
          <NavIcon name="logout" />
          {loggingOut ? signingOutLabel : signOutLabel}
        </button>
      </div>
    </aside>
  );
}

/** Horizontal, scrollable nav used below the lg breakpoint. */
export function DashboardMobileNav({ sections, localized }: NavProps) {
  const path = useCurrentPath();
  const items = sections.filter((s) => !s.locked).flatMap((s) => s.items);

  return (
    <nav className="sticky top-16 z-20 flex gap-1.5 overflow-x-auto border-b border-border-light bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
      {items.map((item) => {
        const active = isActive(path, item);
        return (
          <NavLink
            key={item.href}
            href={item.href}
            localized={localized}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors",
              active
                ? "bg-brand font-semibold text-white"
                : "bg-stone/60 font-medium text-ink-secondary hover:text-ink",
            )}
          >
            <NavIcon name={item.icon} className="h-4 w-4" />
            {item.label}
            {!!item.badge && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold",
                  active ? "bg-white/25 text-white" : "bg-brand-tint text-brand",
                )}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
