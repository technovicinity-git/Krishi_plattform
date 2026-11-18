"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { NotificationItem } from "@/lib/notifications/read";
import { EmptyState } from "@/components/dashboard/ui";
import { NotificationRow } from "./NotificationRow";

/** Full notifications page body. */
export function NotificationList({ initial }: { initial: NotificationItem[] }) {
  const t = useTranslations("app.notifications");
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const unread = items.filter((n) => !n.readAt).length;

  const markRead = async (ids?: string[]) => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, readAt: n.readAt ?? now } : n)));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    }).catch(() => {});
    router.refresh();
  };

  if (items.length === 0) {
    return <EmptyState icon="bell" title={t("empty")} description={t("emptyHint")} />;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border-light bg-white">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3 sm:px-6">
        <span className="text-[13px] text-ink-secondary">{t("unreadCount", { count: unread })}</span>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markRead()}
            className="text-[12.5px] font-semibold text-brand hover:underline"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>
      <ul className="divide-y divide-border-light">
        {items.map((n) => (
          <li key={n.id}>
            <NotificationRow item={n} onOpen={(item) => !item.readAt && markRead([item.id])} />
          </li>
        ))}
      </ul>
    </section>
  );
}
