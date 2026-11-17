"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { UserIcon } from "@/components/icons";

interface NavItem {
  key: string;
  href: string;
  icon?: React.ReactNode;
}

const AVAILABLE_ITEMS: NavItem[] = [
  { key: "profile", href: "/portal/profile", icon: <UserIcon className="h-4 w-4" /> },
  { key: "kyc", href: "/portal/kyc" },
  { key: "interests", href: "/portal/interests" },
  { key: "investments", href: "/portal/investments" }, // Unlocked
  { key: "wallet", href: "/portal/wallet" },           // Unlocked
  { key: "transactions", href: "/portal/transactions" },// Unlocked
  { key: "accountSettings", href: "/portal/settings" },
];

const LOCKED_ITEMS: NavItem[] = [
  { key: "livestock", href: "/portal/livestock" },
  { key: "reports", href: "/portal/reports" },
];

export function PortalSidebar() {
  const t = useTranslations("portal.sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

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
        <div className="flex flex-col gap-2">
          <span className="px-3 text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("yourAccount")}
          </span>
          <nav className="flex flex-col">
            {AVAILABLE_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-stone text-ink"
                      : "text-ink-secondary hover:bg-stone/60 hover:text-ink",
                  )}
                >
                  {item.icon}
                  {t(`items.${item.key}`)}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-left text-[14px] font-medium text-ink-secondary transition-colors hover:bg-stone/60 hover:text-ink disabled:opacity-60"
            >
              {loggingOut ? "Signing out..." : t("items.logout")}
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-2">
          <span className="px-3 text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            {t("availableAfterKyc")}
          </span>
          <nav className="flex flex-col">
            {LOCKED_ITEMS.map((item) => (
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