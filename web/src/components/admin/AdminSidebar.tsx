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
  { label: "Deposits", href: "/krishi-console/deposits", icon: "..." },
  { label: "Categories", href: "/krishi-console/categories" },
  { label: "Locations", href: "/krishi-console/locations" },
  { label: "Audit Log", href: "/krishi-console/audit" },
];

export function AdminSidebar() {
  const pathname = usePathname();

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
        {NAV.map((item) => {
          const active =
            item.href === "/krishi-console"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-[6px] px-3 py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-ink text-white"
                  : "text-ink-secondary hover:bg-stone hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}