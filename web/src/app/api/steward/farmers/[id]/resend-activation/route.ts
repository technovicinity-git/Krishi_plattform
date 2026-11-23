import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { generateOtp, hashOtp, getOtpExpiry } from "@/lib/auth/otp";
import { showOtpOnScreen } from "@/lib/auth/dev-flags";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "steward") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = createAdminClient();

    const { data: farmer } = await db
      .from("users")
      .select("id, role, phone, status, assigned_steward_id")
      .eq("id", id)
      .eq("role", "farmer")
      .eq("assigned_steward_id", user.id)
      .maybeSingle();

    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    if (farmer.status === "active") {
      return NextResponse.json(
        { error: "This account is already activated." },
        { status: 409 },
      );
    }

    // Invalidate any pending signup OTPs for this phone
    await db
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("phone", farmer.phone)
      .eq("purpose", "signup")
      .is("consumed_at", null);

    // Generate fresh OTP
    const otp = generateOtp();
    const codeHash = await hashOtp(otp);
    const expiresAt = getOtpExpiry();

    await db.from("otp_codes").insert({
      phone: farmer.phone,
      code_hash: codeHash,
      purpose: "signup",
      expires_at: expiresAt.toISOString(),
    });

    if (showOtpOnScreen()) {
      await db.from("dev_otps").delete().eq("phone", farmer.phone);
      await db.from("dev_otps").insert({ phone: farmer.phone, otp });
      console.log(`[DEV] Farmer activation OTP for ${farmer.phone}: ${otp}`);
    }

    // TODO: send SMS via the local provider in production.

    return NextResponse.json({ success: true, ...(showOtpOnScreen() ? { devOtp: otp } : {}) });
  } catch (err) {
    console.error("[resend-activation] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}