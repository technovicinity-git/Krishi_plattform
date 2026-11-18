import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getNotifications } from "@/lib/notifications/read";

export const runtime = "nodejs";

/** GET ?limit=10 — the signed-in user's latest notifications and unread count. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(50, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 10));
  const data = await getNotifications(user.id, limit);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
