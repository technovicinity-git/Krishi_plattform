"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { NavIcon } from "@/components/dashboard/NavIcon";
import type { NotificationItem } from "@/lib/notifications/read";
import { NotificationRow } from "./NotificationRow";

const POLL_MS = 60_000;

/** Header bell with unread count and a dropdown of the latest notifications. */
export function NotificationBell({
  initialUnread,
  allHref,
  localized = true,
}: {
  initialUnread: number;
  /** The role's full notifications page, e.g. "/portal/notifications". */
  allHref: string;
  /** false for the admin console, whose paths have no locale. */
  localized?: boolean;
}) {
  const LinkTag = localized ? Link : NextLink;
  const t = useTranslations("app.notifications");
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=8", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: NotificationItem[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Offline or signed out: keep what we have.
    }
  }, []);

  // Keep the badge fresh while the page stays open.
  useEffect(() => {
    const id = window.setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = async (ids?: string[]) => {
    const now = new Date().toISOString();
    setItems((prev) => prev?.map((n) => (!ids || ids.includes(n.id) ? { ...n, readAt: n.readAt ?? now } : n)) ?? prev);
    setUnread((u) => (ids ? Math.max(0, u - ids.length) : 0));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    }).catch(() => {});
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? t("bellUnread", { count: unread }) : t("bell")}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-brand-tint hover:text-green-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <NavIcon name="bell" className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[68px] z-40 overflow-hidden rounded-2xl border border-border-light bg-white shadow-xl sm:absolute sm:inset-x-auto sm:top-[calc(100%+10px)] sm:right-0 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
            <span className="text-[14px] font-semibold text-ink">{t("heading")}</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                className="text-[12px] font-semibold text-brand hover:underline"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items === null ? (
              <p className="px-4 py-6 text-center text-[13px] text-ink-muted">{t("loading")}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-ink-muted">{t("empty")}</p>
            ) : (
              <ul className="divide-y divide-border-light">
                {items.map((n) => (
                  <li key={n.id}>
                    <NotificationRow
                      item={n}
                      compact
                      localized={localized}
                      onOpen={(item) => {
                        if (!item.readAt) markRead([item.id]);
                        setOpen(false);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <LinkTag
            href={allHref}
            onClick={() => setOpen(false)}
            className="block border-t border-border-light px-4 py-3 text-center text-[13px] font-semibold text-brand hover:bg-brand-tint/50"
          >
            {t("viewAll")}
          </LinkTag>
        </div>
      )}
    </div>
  );
}
