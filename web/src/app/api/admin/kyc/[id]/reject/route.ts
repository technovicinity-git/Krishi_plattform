import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(500),
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

  const { data: kyc } = await db
    .from("kyc_profiles")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!kyc) {
    return NextResponse.json({ error: "KYC not found" }, { status: 404 });
  }

  const { error } = await db
    .from("kyc_profiles")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      rejection_reason: parsed.data.reason,
    })
    .eq("id", id);

  if (error) {
    console.error("[admin/kyc/reject] update failed:", error);
    return NextResponse.json(
      { error: "Failed to update KYC" },
      { status: 500 },
    );
  }

  const { data: owner } = await db.from("users").select("role").eq("id", kyc.user_id).maybeSingle();
  await notify(
    "kyc_rejected",
    { userId: kyc.user_id, href: owner?.role === "steward" ? "/steward/profile" : "/portal/kyc" },
    { reason: parsed.data.reason },
  );

  await logAdminAction({
    adminId: admin.id,
    action: "kyc.reject",
    targetType: "kyc_profile",
    targetId: id,
    metadata: { user_id: kyc.user_id, reason: parsed.data.reason },
    request,
  });

  return NextResponse.json({ success: true });
}