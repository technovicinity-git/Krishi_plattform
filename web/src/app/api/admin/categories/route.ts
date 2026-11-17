import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const schema = z.object({
  nameEn: z.string().trim().min(2).max(60),
  nameBn: z.string().trim().min(1).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("livestock_categories")
      .insert({
        slug: parsed.data.slug,
        name_en: parsed.data.nameEn,
        name_bn: parsed.data.nameBn,
        icon: parsed.data.icon || null,
        sort_order: parsed.data.sortOrder ?? 100,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Slug already exists. Choose a different one." },
          { status: 409 },
        );
      }
      console.error("[admin/categories] insert failed:", error);
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 },
      );
    }

    await logAdminAction({
      adminId: admin.id,
      action: "category.create",
      targetType: "livestock_category",
      targetId: data.id,
      metadata: { slug: data.slug },
      request,
    });

    return NextResponse.json({ success: true, category: data });
  } catch (err) {
    console.error("[admin/categories] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}