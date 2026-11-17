import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOtpHash } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { toE164, isValidBDPhone } from "@/lib/auth/phone";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

const schema = z.object({
  phone: z.string().trim().refine(isValidBDPhone, "Invalid phone number"),
  otp: z.string().regex(/^\d{6}$/, "Invalid code"),
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

    const e164 = toE164(parsed.data.phone);
    const admin = createAdminClient();

    // Find user
    const { data: user } = await admin
      .from("users")
      .select("id, role, status")
      .eq("phone", e164)
      .maybeSingle();

    if (!user || user.role !== "farmer") {
      return NextResponse.json(
        { error: "No farmer account found with this phone number." },
        { status: 404 },
      );
    }

    if (user.status === "active") {
      return NextResponse.json(
        { error: "This account is already activated. Please log in." },
        { status: 409 },
      );
    }

    // Find OTP
    const { data: otpRow } = await admin
      .from("otp_codes")
      .select("id, code_hash, attempts")
      .eq("phone", e164)
      .eq("purpose", "signup")
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return NextResponse.json(
        { error: "Code expired or not found. Contact your steward to resend." },
        { status: 400 },
      );
    }

    if (otpRow.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Contact your steward for a new code." },
        { status: 429 },
      );
    }

    const valid = await verifyOtpHash(parsed.data.otp, otpRow.code_hash);
    if (!valid) {
      await admin
        .from("otp_codes")
        .update({ attempts: otpRow.attempts + 1 })
        .eq("id", otpRow.id);

      const remaining = MAX_ATTEMPTS - (otpRow.attempts + 1);
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Too many attempts. Contact your steward for a new code.",
        },
        { status: 400 },
      );
    }

    // Consume OTP
    await admin
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    // Set password + activate
    const hash = await hashPassword(parsed.data.password);
    await admin
      .from("users")
      .update({
        password_hash: hash,
        status: "active",
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Clean up dev row
    await admin.from("dev_otps").delete().eq("phone", e164);

    // Set session
    const response = NextResponse.json({ success: true });
    await setSessionCookie(response, { sub: user.id, role: "farmer" });
    return response;
  } catch (err) {
    console.error("[auth/farmer-activate] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}