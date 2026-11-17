import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
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

    const admin = createAdminClient();
    const { data: row } = await admin
      .from("users")
      .select("password_hash")
      .eq("id", user.id)
      .single();

    if (!row?.password_hash) {
      return NextResponse.json(
        { error: "No password set for this account" },
        { status: 400 },
      );
    }

    const ok = await verifyPassword(parsed.data.currentPassword, row.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    const { error } = await admin
      .from("users")
      .update({ password_hash: newHash })
      .eq("id", user.id);

    if (error) {
      console.error("[account/change-password] update failed:", error);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account/change-password] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}