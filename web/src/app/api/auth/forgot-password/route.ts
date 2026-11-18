import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtp, hashOtp, getOtpExpiry } from "@/lib/auth/otp";
import { toE164, isValidBDPhone } from "@/lib/auth/phone";
import { showOtpOnScreen } from "@/lib/auth/dev-flags";
import { LIMITS, clientIp, tooManyRequests, withinLimits } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const MAX_REQUESTS_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;

const schema = z.object({
  phone: z.string().trim().refine(isValidBDPhone, "Invalid phone number"),
});

export async function POST(request: Request) {
  try {
    if (!(await withinLimits(LIMITS.forgotPassword(clientIp(request))))) {
      return tooManyRequests(3600);
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const e164 = toE164(parsed.data.phone);
    const admin = createAdminClient();

    // Rate limit: max 3 requests per phone per 15 minutes
    const windowStart = new Date(
      Date.now() - WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    const { count: recentCount } = await admin
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("phone", e164)
      .eq("purpose", "reset")
      .gte("created_at", windowStart);

    if ((recentCount ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait 15 minutes before trying again." },
        { status: 429 },
      );
    }

    const { data: user } = await admin
      .from("users")
      .select("id, status")
      .eq("phone", e164)
      .maybeSingle();

    if (!user || user.status === "suspended" || user.status === "deleted") {
      return NextResponse.json(
        { error: "No account found with this phone number." },
        { status: 404 },
      );
    }

    const otp = generateOtp();
    const codeHash = await hashOtp(otp);
    const expiresAt = getOtpExpiry();

    await admin.from("otp_codes").insert({
      phone: e164,
      code_hash: codeHash,
      purpose: "reset",
      expires_at: expiresAt.toISOString(),
    });

    if (showOtpOnScreen()) {
      await admin.from("dev_otps").insert({ phone: e164, otp });
      console.log(`[DEV] Reset OTP for ${e164}: ${otp}`);
    }

    // TODO: send SMS via the local provider in production.

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[auth/forgot-password] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}