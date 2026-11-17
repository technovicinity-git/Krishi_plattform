"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface MenuItem {
  label: string;
  href: string;
}

interface UserMenuProps {
  fullName: string;
  phone?: string | null;
  items: MenuItem[];
  logoutRedirect?: string;
  avatar?: React.ReactNode;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({
  fullName,
  phone,
  items,
  logoutRedirect = "/login",
  avatar,
}: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(logoutRedirect);
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const initials = getInitials(fullName);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border-light bg-white py-1 pl-1 pr-2.5 transition-colors hover:bg-stone"
      >
        {avatar ?? (
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
            {initials}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-ink-nav sm:block">
          {fullName.split(" ")[0]}
        </span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "h-3 w-3 text-ink-tertiary transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-[240px] overflow-hidden rounded-xl border border-border-light bg-white shadow-lg"
        >
          <div className="flex flex-col gap-0.5 border-b border-border-light px-4 py-3">
            <span className="truncate text-[13px] font-semibold text-ink">
              {fullName}
            </span>
            {phone && (
              <span className="truncate text-[11px] text-ink-muted">{phone}</span>
            )}
          </div>

          <nav className="flex flex-col p-1.5">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-stone hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-1 rounded-[6px] border-t border-border-light px-3 pt-3 pb-2.5 text-left text-[13px] font-medium text-terracotta transition-colors hover:bg-[#FAF0ED] disabled:opacity-60"
            >
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}