import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { parsePlanFormData } from "@/lib/admin/plan-helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const parsed = await parsePlanFormData(form, { requireImage: true });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = createAdminClient();

    const { data: existing } = await db
      .from("investment_plans")
      .select("id")
      .eq("slug", parsed.data.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists. Choose a different one." },
        { status: 409 },
      );
    }

    const { data, error } = await db
      .from("investment_plans")
      .insert({
        ...parsed.data,
        created_by: admin.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[admin/plans] insert failed:", error);
      return NextResponse.json(
        { error: "Failed to create plan" },
        { status: 500 },
      );
    }

    await logAdminAction({
      adminId: admin.id,
      action: "plan.create",
      targetType: "investment_plan",
      targetId: data.id,
      metadata: { slug: parsed.data.slug },
      request,
    });

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("[admin/plans] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}