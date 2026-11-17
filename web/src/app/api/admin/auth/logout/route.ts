import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionFromCookie } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (session) {
    await logAdminAction({
      adminId: session.sub,
      action: "admin.logout",
      request,
    });
  }

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}