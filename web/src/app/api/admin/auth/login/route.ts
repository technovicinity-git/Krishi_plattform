import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAgainstNothing, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { password } = parsed.data;
    const admin = createAdminClient();

    // Rate limit: count failed attempts in window
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count: failedCount } = await admin
      .from("admin_login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .eq("succeeded", false)
      .gte("created_at", windowStart);

    if ((failedCount ?? 0) >= MAX_ATTEMPTS) {
      await logAdminAction({
        adminId: "00000000-0000-0000-0000-000000000000", // anonymous
        action: "admin.login.rate_limited",
        targetType: "email",
        targetId: email,
        request,
      });
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    }

    // Lookup admin user
    const { data: user } = await admin
      .from("users")
      .select("id, role, password_hash, status, full_name")
      .eq("email", email)
      .eq("role", "admin")
      .maybeSingle();

    let succeeded = false;
    let adminId: string | null = null;

    if (user && user.password_hash && user.status === "active") {
      const ok = await verifyPassword(password, user.password_hash);
      if (ok) {
        succeeded = true;
        adminId = user.id;
      }
    } else {
      // Same time as a real check, so unknown emails are not revealed.
      await verifyAgainstNothing(password);
    }

    // Log attempt (never store the password)
    await admin.from("admin_login_attempts").insert({
      email,
      ip_address: ip,
      succeeded,
    });

    if (!succeeded || !adminId) {
      // Audit failed login
      if (user?.id) {
        await logAdminAction({
          adminId: user.id,
          action: "admin.login.failure",
          targetType: "email",
          targetId: email,
          request,
        });
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Success — set session, log, return
    const response = NextResponse.json({ success: true });
    await setSessionCookie(response, { sub: adminId, role: "admin" });

    await logAdminAction({
      adminId,
      action: "admin.login.success",
      targetType: "email",
      targetId: email,
      request,
    });

    return response;
  } catch (err) {
    console.error("[admin/login] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}