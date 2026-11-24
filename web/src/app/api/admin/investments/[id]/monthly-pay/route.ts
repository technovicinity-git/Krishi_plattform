import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

const schema = z.object({ amount: z.number().min(0).max(10_000_000) });

/**
 * Admin changes one batch's monthly steward pay. Months already sent keep
 * their amount; months not sent yet (and settlement) use the new one.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Enter an amount of 0 or more" }, { status: 400 });

  const db = createAdminClient();
  const { data: inv } = await db
    .from("investments")
    .select("id, reference, current_stage, steward_monthly_pay")
    .eq("id", id)
    .maybeSingle();
  if (!inv) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  if (inv.current_stage === "settled") {
    return NextResponse.json({ error: "This batch is settled; its monthly pay can no longer change" }, { status: 409 });
  }

  const amount = Math.round(parsed.data.amount * 100) / 100;
  const { error } = await db
    .from("investments")
    .update({ steward_monthly_pay: amount })
    .eq("id", id)
    .neq("current_stage", "settled");
  if (error) {
    console.error("[admin/investments/monthly-pay] failed:", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "investment.monthly_pay",
    targetType: "investment",
    targetId: id,
    metadata: { reference: inv.reference, from: inv.steward_monthly_pay, to: amount },
    request,
  });

  return NextResponse.json({ success: true });
}
