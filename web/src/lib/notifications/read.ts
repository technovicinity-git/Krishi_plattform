import { createAdminClient } from "@/lib/supabase/admin";

export interface NotificationItem {
  id: string;
  kind: string;
  params: Record<string, string | number>;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Latest notifications and the unread count for one user. Server-only. */
export async function getNotifications(
  userId: string,
  limit = 20,
): Promise<{ items: NotificationItem[]; unread: number }> {
  const db = createAdminClient();
  const [{ data }, { count }] = await Promise.all([
    db
      .from("notifications")
      .select("id, kind, params, href, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
  ]);
  return {
    items: (data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind,
      params: (n.params ?? {}) as Record<string, string | number>,
      href: n.href,
      readAt: n.read_at,
      createdAt: n.created_at,
    })),
    unread: count ?? 0,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await createAdminClient()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
