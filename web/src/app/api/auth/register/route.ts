import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth/password";
import { generateOtp, hashOtp, getOtpExpiry } from "@/lib/auth/otp";
import { setSessionCookie } from "@/lib/auth/session";
import { toE164, isValidBDPhone } from "@/lib/auth/phone";
import { showOtpOnScreen } from "@/lib/auth/dev-flags";
import { LIMITS, clientIp, tooManyRequests, withinLimits } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().refine(isValidBDPhone, "Invalid phone number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
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

    const { fullName, phone, email, password } = parsed.data;
    const e164 = toE164(phone);
    if (!(await withinLimits(LIMITS.register(clientIp(request), e164)))) {
      return tooManyRequests(3600);
    }
    const admin = createAdminClient();

    // Phone uniqueness — return generic message to avoid enumeration.
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("phone", e164)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This phone number cannot be registered." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const { data: user, error: insertError } = await admin
      .from("users")
      .insert({
        role: "investor",
        full_name: fullName,
        phone: e164,
        email: email || null,
        password_hash: passwordHash,
        status: "pending_activation",
      })
      .select("id, role")
      .single();

    if (insertError || !user) {
      console.error("[register] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 },
      );
    }

    const otp = generateOtp();
    const codeHash = await hashOtp(otp);
    const expiresAt = getOtpExpiry();

    const { error: otpError } = await admin.from("otp_codes").insert({
      phone: e164,
      code_hash: codeHash,
      purpose: "signup",
      expires_at: expiresAt.toISOString(),
    });

    if (otpError) {
      console.error("[register] otp insert error:", otpError);
    }

    // Dev-only plaintext log for the on-screen banner.
    if (showOtpOnScreen()) {
      await admin.from("dev_otps").insert({ phone: e164, otp });
      console.log(`[DEV] OTP for ${e164}: ${otp}`);
    }

    // TODO: send SMS via the local provider in production.

    const response = NextResponse.json({ success: true });
    await setSessionCookie(response, {
      sub: user.id,
      role: "investor",
    });
    return response;
  } catch (err) {
    console.error("[register] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}