import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toE164, isValidBDPhone } from "@/lib/auth/phone";
import { generateOtp, hashOtp, getOtpExpiry } from "@/lib/auth/otp";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().refine(isValidBDPhone, "Invalid phone number"),
  nidNumber: z
    .string()
    .trim()
    .regex(/^\d{10,17}$/, "NID number must be 10–17 digits"),
  presentAddress: z.string().trim().min(5).max(500),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "steward") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Phone must be unique
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("phone", e164)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A user with this phone number already exists." },
        { status: 409 },
      );
    }

    // Create farmer account (no password — farmer sets it during activation)
    const { data: farmer, error: insertError } = await admin
      .from("users")
      .insert({
        role: "farmer",
        full_name: parsed.data.fullName,
        phone: e164,
        status: "pending_activation",
        created_by: user.id,
        assigned_steward_id: user.id,
      })
      .select("id")
      .single();

    if (insertError || !farmer) {
      console.error("[steward/farmers] insert failed:", insertError);
      return NextResponse.json(
        { error: "Failed to create farmer account" },
        { status: 500 },
      );
    }

    // Store KYC draft — will be completed during activation
    await admin.from("kyc_profiles").insert({
      user_id: farmer.id,
      status: "not_started",
      nid_number: parsed.data.nidNumber,
      present_address: parsed.data.presentAddress,
    });

    // Generate activation OTP
    const otp = generateOtp();
    const codeHash = await hashOtp(otp);
    const expiresAt = getOtpExpiry();

    await admin.from("otp_codes").insert({
      phone: e164,
      code_hash: codeHash,
      purpose: "signup",
      expires_at: expiresAt.toISOString(),
    });

    if (process.env.DEV_SHOW_OTP === "true") {
      await admin.from("dev_otps").insert({ phone: e164, otp });
      console.log(`[DEV] Farmer activation OTP for ${e164}: ${otp}`);
    }

    // TODO: send SMS to farmer with activation link + OTP

    return NextResponse.json({ success: true, farmerId: farmer.id });
  } catch (err) {
    console.error("[steward/farmers] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}