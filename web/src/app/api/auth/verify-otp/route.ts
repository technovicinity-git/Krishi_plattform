import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOtpHash } from "@/lib/auth/otp";
import { getSessionFromCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

const schema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Invalid code"),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json(
        { error: "Session expired. Please register again." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: user } = await admin
      .from("users")
      .select("phone, phone_verified_at")
      .eq("id", session.sub)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.phone_verified_at) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const { data: otpRow } = await admin
      .from("otp_codes")
      .select("id, code_hash, attempts, expires_at, consumed_at")
      .eq("phone", user.phone)
      .eq("purpose", "signup")
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return NextResponse.json(
        { error: "Code expired or not found" },
        { status: 400 },
      );
    }

    if (otpRow.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Request a new code." },
        { status: 429 },
      );
    }

    const valid = await verifyOtpHash(parsed.data.otp, otpRow.code_hash);

    if (!valid) {
      await admin
        .from("otp_codes")
        .update({ attempts: otpRow.attempts + 1 })
        .eq("id", otpRow.id);

      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Consume the OTP
    await admin
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    // Clean up dev_otps row (harmless if DEV_SHOW_OTP was off)
    await admin.from("dev_otps").delete().eq("phone", user.phone);

    // Mark user verified
    await admin
      .from("users")
      .update({
        phone_verified_at: new Date().toISOString(),
        status: "active",
      })
      .eq("id", session.sub);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-otp] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}