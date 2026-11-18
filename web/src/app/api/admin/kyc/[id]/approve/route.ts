import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/notify";

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

  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!kyc) {
    return NextResponse.json({ error: "KYC not found" }, { status: 404 });
  }

  if (kyc.status === "verified") {
    return NextResponse.json({ success: true, message: "Already verified" });
  }

  const { error } = await db
    .from("kyc_profiles")
    .update({
      status: "verified",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      rejection_reason: null,
    })
    .eq("id", id);

  if (error) {
    console.error("[admin/kyc/approve] update failed:", error);
    return NextResponse.json(
      { error: "Failed to update KYC" },
      { status: 500 },
    );
  }

  const { data: owner } = await db.from("users").select("role").eq("id", kyc.user_id).maybeSingle();
  await notify(
    "kyc_approved",
    { userId: kyc.user_id, href: owner?.role === "steward" ? "/steward/profile" : "/portal/kyc" },
    {},
  );

  await logAdminAction({
    adminId: admin.id,
    action: "kyc.approve",
    targetType: "kyc_profile",
    targetId: id,
    metadata: { user_id: kyc.user_id },
    request,
  });

  return NextResponse.json({ success: true });
}