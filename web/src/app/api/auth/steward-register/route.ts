import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { toE164, isValidBDPhone } from "@/lib/auth/phone";

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

    const e164 = toE164(parsed.data.phone);
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("phone", e164)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This phone number is already registered." },
        { status: 409 },
      );
    }

    const hash = await hashPassword(parsed.data.password);

    const { data: user, error: insertError } = await admin
      .from("users")
      .insert({
        role: "steward",
        full_name: parsed.data.fullName,
        phone: e164,
        email: parsed.data.email || null,
        password_hash: hash,
        status: "active",
        steward_approval_status: "pending",
        phone_verified_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !user) {
      console.error("[steward-register] insert failed:", insertError);
      return NextResponse.json(
        { error: "Failed to create steward account" },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ success: true });
    await setSessionCookie(response, { sub: user.id, role: "steward" });
    return response;
  } catch (err) {
    console.error("[steward-register] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}