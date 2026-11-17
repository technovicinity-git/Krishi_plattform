"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  { key: "dashboard", href: "/steward", exact: true },
  { key: "farmers", href: "/steward/farmers" },
  { key: "interests", href: "/steward/interests" },
  { key: "investments", href: "/steward/investments" },
  { key: "fundRequests", href: "/steward/fund-requests" },
  { key: "profile", href: "/steward/profile" },
];

const LOCKED = [
  { key: "livestock", href: "/steward/livestock" },
  { key: "expenses", href: "/steward/expenses" },
  { key: "sales", href: "/steward/sales" },
  { key: "reports", href: "/steward/reports" },
];

export function StewardSidebar() {
  const t = useTranslations("stewardPortal.sidebar");
  const tu = useTranslations("app.userMenu");
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-full shrink-0 border-b border-border-light bg-white px-6 py-6 sm:px-10 lg:w-[260px] lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
      <div className="flex flex-col gap-6">
        {/* Primary nav */}
        <div className="flex flex-col gap-2">
          <span className="px-3 text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("stewardConsole")}
          </span>
          <nav className="flex flex-col">
            {NAV.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "rounded-[6px] px-3 py-2.5 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-stone text-ink"
                      : "text-ink-secondary hover:bg-stone/60 hover:text-ink",
                  )}
                >
                  {t(`items.${item.key}`)}
                </Link>
              );
            })}
            <Link
              href="/onboarding/kyc"
              className={cn(
                "rounded-[6px] px-3 py-2.5 text-[14px] font-medium transition-colors",
                pathname === "/onboarding/kyc"
                  ? "bg-stone text-ink"
                  : "text-ink-secondary hover:bg-stone/60 hover:text-ink",
              )}
            >
              {t("items.kyc")}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-[6px] px-3 py-2.5 text-left text-[14px] font-medium text-ink-secondary transition-colors hover:bg-stone/60 hover:text-ink disabled:opacity-60"
            >
              {loggingOut ? tu("signingOut") : t("items.logout")}
            </button>
          </nav>
        </div>

        {/* Locked items */}
        <div className="flex flex-col gap-2">
          <span className="px-3 text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("comingSoon")}
          </span>
          <nav className="flex flex-col">
            {LOCKED.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-[6px] px-3 py-2.5 text-[14px] font-medium text-ink-muted"
                aria-disabled="true"
              >
                <span>{t(`items.${item.key}`)}</span>
                <span className="text-[11px] font-semibold text-ink-muted">
                  {t("locked")}
                </span>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}