import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient();

  const { data: steward } = await db
    .from("users")
    .select("id, role, steward_approval_status")
    .eq("id", id)
    .maybeSingle();

  if (!steward || steward.role !== "steward") {
    return NextResponse.json({ error: "Steward not found" }, { status: 404 });
  }

  const { error } = await db
    .from("users")
    .update({ steward_approval_status: "approved" })
    .eq("id", id);

  if (error) {
    console.error("[admin/stewards/approve] update failed:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "steward.approve",
    targetType: "user",
    targetId: id,
    request,
  });

  return NextResponse.json({ success: true });
}