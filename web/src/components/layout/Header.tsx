"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { getMenuItemsForRole } from "@/lib/auth/menu-items";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const NAV_LINKS = [
  { key: "investmentPlans", href: "/plans" },
  { key: "howItWorks", href: "/how-it-works" },
  { key: "stewards", href: "/stewards" },
  { key: "about", href: "/about" },
  { key: "faq", href: "/faq" },
] as const;

export interface HeaderUser {
  fullName: string | null;
  phone: string | null;
  role: string;
}

export function Header({ user }: { user: HeaderUser | null }) {
  const t = useTranslations("nav");
  const tu = useTranslations("app.userMenu");
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const menuItems = user ? getMenuItemsForRole(user.role, locale) : [];

  const handleMobileLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setMobileOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <header className="border-b border-border-light bg-cream">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 md:px-12 lg:px-20">
        <Logo />
        <nav className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "border-b-2 pb-1 text-[13px] leading-none transition-colors",
                  active
                    ? "border-brand font-semibold text-brand"
                    : "border-transparent font-medium text-ink-nav hover:text-ink",
                )}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {user ? (
            <UserMenu
              fullName={user.fullName ?? tu("user")}
              phone={user.phone}
              items={menuItems}
              logoutRedirect={`/${locale}/login`}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
              >
                {t("login")}
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center rounded-[4px] bg-brand px-[22px] py-[11px] text-[13px] font-semibold leading-none text-white transition-colors hover:bg-brand-hover"
              >
                {t("explorePlans")}
              </Link>
            </>
          )}
          <LanguageSwitcher className="ml-1" />
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? tu("closeMenu") : tu("openMenu")}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center text-ink lg:hidden"
        >
          {mobileOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-6 w-6"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-6 w-6"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border-light bg-cream lg:hidden">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-6 sm:px-8">
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "text-[15px]",
                      active
                        ? "font-semibold text-brand"
                        : "font-medium text-ink-nav",
                    )}
                  >
                    {t(link.key)}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col gap-3 border-t border-border-light pt-6">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
                      {(user.fullName ?? "U").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-ink">
                        {user.fullName ?? tu("user")}
                      </span>
                      {user.phone && (
                        <span className="text-[11px] text-ink-muted">
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 pt-2">
                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-[6px] py-2 text-[14px] font-medium text-ink-secondary hover:text-ink"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleMobileLogout}
                      disabled={loggingOut}
                      className="mt-2 rounded-[6px] border-t border-border-light py-3 text-left text-[14px] font-medium text-danger hover:text-[#8A2F20] disabled:opacity-60"
                    >
                      {loggingOut ? tu("signingOut") : tu("signOut")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-[14px] font-medium text-ink-secondary"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/plans"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center rounded-[4px] bg-brand px-6 py-3 text-[14px] font-semibold text-white"
                  >
                    {t("explorePlans")}
                  </Link>
                </>
              )}
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

