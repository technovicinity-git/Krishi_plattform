import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { showOtpOnScreen } from "@/lib/auth/dev-flags";

/**
 * DEV-ONLY endpoint. Returns the most recent OTP for a phone number,
 * so the OTP form can display it during development.
 *
 * Hard-gated by showOtpOnScreen() (DEV_SHOW_OTP, never on a live site).
 * Otherwise this endpoint returns 404 (as if it doesn't exist).
 */
export async function GET(request: Request) {
  if (!showOtpOnScreen()) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dev_otps")
    .select("otp")
    .eq("phone", phone)
    .gt("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json({ otp: data.otp });
}