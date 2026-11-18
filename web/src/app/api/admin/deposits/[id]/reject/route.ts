import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().min(3),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createAdminClient();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Reason is required" }, { status: 400 });

  // 1. Reject the deposit, only if it is still pending (guards against double submits)
  const { data: rejected } = await db
    .from("deposits")
    .update({
      status: "rejected",
      rejection_reason: parsed.data.reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("interest_id, investor_id, reference, amount");
  const deposit = rejected?.[0];
  if (!deposit) return NextResponse.json({ error: "Deposit not found or already processed" }, { status: 400 });

  // 2. Revert interest back to 'approved' so they can try again
  await db.from("investment_interests").update({ status: "approved" }).eq("id", deposit.interest_id);

  await notify(
    "deposit_rejected",
    { userId: deposit.investor_id, href: "/portal/interests" },
    { reference: deposit.reference, amount: Number(deposit.amount), reason: parsed.data.reason },
  );

  await logAdminAction({
    adminId: admin.id,
    action: "deposit.reject",
    targetType: "deposit",
    targetId: id,
    metadata: { reason: parsed.data.reason },
    request,
  });

  return NextResponse.json({ success: true });
}