import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { parsePlanFormData } from "@/lib/admin/plan-helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient();

  const { data: existing } = await db
    .from("investment_plans")
    .select("id, slug, image_path")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  try {
    const form = await request.formData();
    const parsed = await parsePlanFormData(form, { requireImage: false });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (parsed.data.slug !== existing.slug) {
      const { data: clash } = await db
        .from("investment_plans")
        .select("id")
        .eq("slug", parsed.data.slug)
        .neq("id", id)
        .maybeSingle();
      if (clash) {
        return NextResponse.json(
          { error: "Slug already exists. Choose a different one." },
          { status: 409 },
        );
      }
    }

    const { error } = await db
      .from("investment_plans")
      .update(parsed.data)
      .eq("id", id);

    if (error) {
      console.error("[admin/plans] update failed:", error);
      return NextResponse.json(
        { error: "Failed to update plan" },
        { status: 500 },
      );
    }

    // Running batches of this plan that have no monthly pay yet take the rate.
    const { data: batchesUpdated } = await db.rpc("apply_plan_monthly_pay", { p_plan_id: id });

    await logAdminAction({
      adminId: admin.id,
      action: "plan.update",
      targetType: "investment_plan",
      targetId: id,
      metadata: {
        slug: parsed.data.slug,
        steward_monthly_pay: parsed.data.steward_monthly_pay,
        batches_given_monthly_pay: batchesUpdated ?? 0,
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/plans] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient();

  const { error } = await db
    .from("investment_plans")
    .update({ status: "closed" })
    .eq("id", id);

  if (error) {
    console.error("[admin/plans] close failed:", error);
    return NextResponse.json({ error: "Failed to close plan" }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "plan.close",
    targetType: "investment_plan",
    targetId: id,
    request,
  });

  return NextResponse.json({ success: true });
}