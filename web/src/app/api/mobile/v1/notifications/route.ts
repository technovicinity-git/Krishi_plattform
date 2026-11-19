import { requireMobileUser, json, localeOf, translators, notificationText, investmentIdFromHref } from "@/lib/mobile/api";
import { getNotifications } from "@/lib/notifications/read";

export const runtime = "nodejs";

/** GET ?limit=50 — notifications with their text in the app's language. Mark read via POST /api/notifications/read. */
export async function GET(request: Request) {
  const user = await requireMobileUser();
  if (user instanceof Response) return user;
  const locale = localeOf(request);
  const limit = Math.min(100, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 50));
  const [{ items, unread }, t] = await Promise.all([getNotifications(user.id, limit), translators(locale)]);
  return json({
    unread,
    items: items.map((n) => ({
      id: n.id,
      kind: n.kind,
      ...notificationText(t, locale, n),
      investmentId: investmentIdFromHref(n.href),
      href: n.href,
      read: Boolean(n.readAt),
      createdAt: n.createdAt,
    })),
  });
}
