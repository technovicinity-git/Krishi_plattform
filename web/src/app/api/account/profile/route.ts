import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export async function PUT(request: Request) {
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
    const { error } = await admin
      .from("users")
      .update({
        full_name: parsed.data.fullName,
        email: parsed.data.email || null,
      })
      .eq("id", user.id);

    if (error) {
      console.error("[account/profile] update failed:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account/profile] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}