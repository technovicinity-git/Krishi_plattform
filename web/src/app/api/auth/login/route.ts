import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAgainstNothing, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, isMobileClient, mobileToken } from "@/lib/auth/session";
import { toE164, isValidBDPhone } from "@/lib/auth/phone";
import { LIMITS, clientIp, tooManyRequests, withinLimits } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().trim().refine(isValidBDPhone, "Invalid phone number"),
  password: z.string().min(1, "Password is required"),
  /** "mobile": return the session token in the body instead of a cookie. */
  client: z.enum(["web", "mobile"]).optional().default("web"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const e164 = toE164(parsed.data.phone);
    if (!(await withinLimits(LIMITS.login(clientIp(request), e164)))) {
      return tooManyRequests(900);
    }
    const admin = createAdminClient();

    const { data: user } = await admin
      .from("users")
      .select("id, role, password_hash, status")
      .eq("phone", e164)
      .maybeSingle();

    // Generic error to prevent enumeration
    const genericError = "Incorrect phone number or password";

    // Always check a password (a dummy one when there is no account) so the
    // answer takes as long either way.
    const ok =
      user?.password_hash
        ? await verifyPassword(parsed.data.password, user.password_hash)
        : await verifyAgainstNothing(parsed.data.password);
    if (!user || !ok) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    // Only someone with the right password learns the account is blocked.
    if (user.status === "suspended" || user.status === "deleted") {
      return NextResponse.json(
        { error: "This account is not accessible. Contact support." },
        { status: 403 },
      );
    }

    const role = user.role as "investor" | "steward" | "farmer" | "admin";
    if (parsed.data.client === "mobile" || isMobileClient(request)) {
      // The app is for investors, stewards and farmers; admins use the console.
      if (role === "admin") {
        return NextResponse.json({ error: "Admins sign in on the Krishi console" }, { status: 403 });
      }
      const token = await mobileToken({ sub: user.id, role });
      return NextResponse.json({ success: true, role, token });
    }

    const response = NextResponse.json({
      success: true,
      role: user.role,
    });

    await setSessionCookie(response, {
      sub: user.id,
      role: user.role as "investor" | "steward" | "farmer" | "admin",
    });

    return response;
  } catch (err) {
    console.error("[auth/login] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}