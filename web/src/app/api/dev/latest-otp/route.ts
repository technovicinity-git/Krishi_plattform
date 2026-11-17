import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DEV-ONLY endpoint. Returns the most recent OTP for a phone number,
 * so the OTP form can display it during development.
 *
 * Hard-gated by DEV_SHOW_OTP env var. If the env var is not "true",
 * this endpoint returns 404 (as if it doesn't exist).
 */
export async function GET(request: Request) {
  if (process.env.DEV_SHOW_OTP !== "true") {
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