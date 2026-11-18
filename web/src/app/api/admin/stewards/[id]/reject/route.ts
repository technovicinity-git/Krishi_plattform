import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(10).max(500),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const db = createAdminClient();

  const { data: steward } = await db
    .from("users")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();

  if (!steward || steward.role !== "steward") {
    return NextResponse.json({ error: "Steward not found" }, { status: 404 });
  }

  const { error } = await db
    .from("users")
    .update({
      steward_approval_status: "rejected",
    })
    .eq("id", id);

  if (error) {
    console.error("[admin/stewards/reject] update failed:", error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }

  await notify("steward_rejected", { userId: id, href: "/steward" }, { reason: parsed.data.reason });

  await logAdminAction({
    adminId: admin.id,
    action: "steward.reject",
    targetType: "user",
    targetId: id,
    metadata: { reason: parsed.data.reason },
    request,
  });

  return NextResponse.json({ success: true });
}