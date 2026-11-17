"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Dashboard", href: "/krishi-console" },
  { label: "KYC Queue", href: "/krishi-console/kyc" },
  { label: "Plans", href: "/krishi-console/plans" },
  { label: "Investors", href: "/krishi-console/investors" },
  { label: "Stewards", href: "/krishi-console/stewards" },
  { label: "Farmers", href: "/krishi-console/farmers" },
  { label: "Deposits", href: "/krishi-console/deposits" },
  { label: "Categories", href: "/krishi-console/categories" },
  { label: "Locations", href: "/krishi-console/locations" },
  { label: "Audit Log", href: "/krishi-console/audit" },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/krishi-console"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar() {
  const isActive = useIsActive();

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border-light bg-white lg:flex">
      <div className="border-b border-border-light px-6 py-5">
        <span className="font-serif text-[18px] leading-tight text-ink">
          Krishi Console
        </span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.02em] text-ink-muted">
          Internal Tool
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-[6px] px-3 py-2.5 text-[13px] font-medium transition-colors",
              isActive(item.href)
                ? "bg-ink text-white"
                : "text-ink-secondary hover:bg-stone hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

/** Horizontal, scrollable nav shown below the lg breakpoint (the sidebar is hidden there). */
export function AdminMobileNav() {
  const isActive = useIsActive();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border-light bg-white px-4 py-2 lg:hidden">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors",
            isActive(item.href)
              ? "bg-ink text-white"
              : "text-ink-secondary hover:bg-stone hover:text-ink",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
