"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { formatBDT } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import type { NotificationItem } from "@/lib/notifications/read";

/** "5 min ago" / "3 days ago" in the reader's language. */
export function useTimeAgo() {
  const locale = useLocale();
  const rtf = new Intl.RelativeTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { numeric: "auto" });
  return (iso: string) => {
    const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const abs = Math.abs(seconds);
    if (abs < 60) return rtf.format(0, "second");
    if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
    if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), "day");
    return new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
}

/** Title and body for a notification, in the reader's language. */
export function useNotificationText() {
  const t = useTranslations("app.notify");
  const bn = useLocale() === "bn";
  return (n: NotificationItem) => {
    const p = n.params;
    const values: Record<string, string> = {
      reference: String(p.reference ?? ""),
      name: String(p.name ?? ""),
      plan: String((bn ? p.planBn : p.plan) ?? p.plan ?? ""),
      reason: String(p.reason ?? ""),
      title: String(p.title ?? ""),
      amount: typeof p.amount === "number" ? formatBDT(p.amount) : String(p.amount ?? ""),
    };
    if (!t.has(`${n.kind}.title`)) return { title: n.kind, body: "" };
    return {
      title: t(`${n.kind}.title`, values),
      body: t.has(`${n.kind}.body`) ? t(`${n.kind}.body`, values) : "",
    };
  };
}

export function NotificationRow({
  item,
  onOpen,
  compact = false,
}: {
  item: NotificationItem;
  onOpen?: (item: NotificationItem) => void;
  compact?: boolean;
}) {
  const text = useNotificationText()(item);
  const timeAgo = useTimeAgo();
  const unread = !item.readAt;

  const inner = (
    <>
      <span
        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", unread ? "bg-brand" : "bg-transparent")}
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-[13.5px] leading-snug text-ink", unread ? "font-bold" : "font-semibold")}>
          {text.title}
        </span>
        {text.body && (
          <span className={cn("text-[12.5px] leading-[1.5] text-ink-secondary", compact && "line-clamp-2")}>
            {text.body}
          </span>
        )}
        <span className="text-[11px] text-ink-muted">{timeAgo(item.createdAt)}</span>
      </span>
    </>
  );

  const className = cn(
    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-tint/50",
    unread && "bg-brand-tint/30",
  );

  return item.href ? (
    <Link href={item.href} onClick={() => onOpen?.(item)} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={() => onOpen?.(item)} className={className}>
      {inner}
    </button>
  );
}
