import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const schema = z.object({
  nameEn: z.string().trim().min(2).max(60).optional(),
  nameBn: z.string().trim().min(1).max(60).optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.nameEn !== undefined)    updates.name_en    = parsed.data.nameEn;
  if (parsed.data.nameBn !== undefined)    updates.name_bn    = parsed.data.nameBn;
  if (parsed.data.icon !== undefined)      updates.icon       = parsed.data.icon;
  if (parsed.data.isActive !== undefined)  updates.is_active  = parsed.data.isActive;
  if (parsed.data.sortOrder !== undefined) updates.sort_order = parsed.data.sortOrder;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db
    .from("livestock_categories")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("[admin/categories] update failed:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }

  await logAdminAction({
    adminId: admin.id,
    action: "category.update",
    targetType: "livestock_category",
    targetId: id,
    metadata: updates,
    request,
  });

  return NextResponse.json({ success: true });
}