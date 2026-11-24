import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { clearSessionCookie, endAllSessions } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * POST — signs the person out of every browser and phone, including this
 * one (e.g. a lost phone, or a shared computer they forgot to sign out of).
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await endAllSessions(user.id);
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
