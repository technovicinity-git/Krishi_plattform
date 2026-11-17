"use client";

import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { key: "dashboard", href: "/farmer" },
  { key: "fundRequests", href: "/farmer/fund-requests" },
  { key: "settings", href: "/farmer/settings" },
];

export function FarmerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/farmer" && pathname.startsWith(href + "/"));

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

  const t = (key: string) => {
    // Simple hardcoded translation fallback for now
    const labels: Record<string, string> = {
      dashboard: "My Assignments",
      fundRequests: "Fund Requests",
      settings: "Account Settings",
      logout: "Log Out"
    };
    return labels[key] || key;
  };

  return (
    <aside className="w-full shrink-0 border-b border-border-light bg-white px-6 py-6 sm:px-10 lg:w-[260px] lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="px-3 text-[10px] font-bold uppercase tracking-[0.02em] text-ink-muted">
            Farmer Console
          </span>
          <nav className="flex flex-col">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
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
                  {t(item.key)}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-2 rounded-[6px] px-3 py-2.5 text-left text-[14px] font-medium text-danger transition-colors hover:bg-[#FAF0ED] disabled:opacity-60"
            >
              {loggingOut ? "Signing out..." : t("logout")}
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
}