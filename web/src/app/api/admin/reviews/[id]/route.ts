import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("hide"), reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500) }),
  z.object({ action: z.literal("show") }),
]);

/** Admin hides a review (e.g. abusive or off-topic) or shows it again. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const hide = parsed.data.action === "hide";
  const { data, error } = await createAdminClient()
    .from("steward_reviews")
    .update(
      hide
        ? { status: "hidden", hidden_reason: parsed.data.action === "hide" ? parsed.data.reason : null, hidden_by: admin.id, hidden_at: new Date().toISOString() }
        : { status: "published", hidden_reason: null, hidden_by: null, hidden_at: null },
    )
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("[admin/reviews] update failed:", error);
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }
  if (!data?.length) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  await logAdminAction({
    adminId: admin.id,
    action: hide ? "review.hide" : "review.show",
    targetType: "steward_review",
    targetId: id,
    metadata: hide && parsed.data.action === "hide" ? { reason: parsed.data.reason } : undefined,
    request,
  });
  return NextResponse.json({ success: true });
}
