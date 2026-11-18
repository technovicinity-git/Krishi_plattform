import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth/password";
import { toE164, isValidBDPhone } from "@/lib/auth/phone";
import { LIMITS, clientIp, tooManyRequests, withinLimits } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const VERIFIED_WINDOW_MINUTES = 15;

const schema = z.object({
  phone: z.string().trim().refine(isValidBDPhone, "Invalid phone number"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export async function POST(request: Request) {
  try {
    if (!(await withinLimits(LIMITS.resetPassword(clientIp(request))))) {
      return tooManyRequests(900);
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

    // Look for a recently verified, unconsumed, unexpired reset OTP
    const windowStart = new Date(
      Date.now() - VERIFIED_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    const { data: otpRow } = await admin
      .from("otp_codes")
      .select("id")
      .eq("phone", e164)
      .eq("purpose", "reset")
      .is("consumed_at", null)
      .not("verified_at", "is", null)
      .gte("verified_at", windowStart)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return NextResponse.json(
        {
          error:
            "Verification expired. Please enter your code again to continue.",
        },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);

    const { error: updateError } = await admin
      .from("users")
      .update({ password_hash: newHash })
      .eq("phone", e164);

    if (updateError) {
      console.error("[auth/reset-password] update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 },
      );
    }

    // Consume the OTP + clean dev row
    await admin
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    await admin.from("dev_otps").delete().eq("phone", e164);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[auth/reset-password] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}