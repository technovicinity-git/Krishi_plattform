import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOtpHash } from "@/lib/auth/otp";
import { toE164, isValidBDPhone } from "@/lib/auth/phone";
import { LIMITS, clientIp, tooManyRequests, withinLimits } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

const schema = z.object({
  phone: z.string().trim().refine(isValidBDPhone, "Invalid phone number"),
  otp: z.string().regex(/^\d{6}$/, "Invalid code"),
});

export async function POST(request: Request) {
  try {
    if (!(await withinLimits(LIMITS.verifyCode(clientIp(request))))) {
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

    const { data: otpRow } = await admin
      .from("otp_codes")
      .select("id, code_hash, attempts")
      .eq("phone", e164)
      .eq("purpose", "reset")
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return NextResponse.json(
        { error: "Code expired or not found. Please request a new code." },
        { status: 400 },
      );
    }

    if (otpRow.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
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
              : "Too many attempts. Please request a new code.",
        },
        { status: 400 },
      );
    }

    // Mark as verified but NOT consumed — the password reset will consume it.
    await admin
      .from("otp_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[auth/verify-reset-otp] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}