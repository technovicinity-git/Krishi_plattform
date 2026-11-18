import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { approveDeposit } from "@/lib/deposits/approve";

export const runtime = "nodejs";

/** Admin approves a manual deposit; this creates the investment. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await approveDeposit(id, admin.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  await logAdminAction({
    adminId: admin.id,
    action: "deposit.approve",
    targetType: "deposit",
    targetId: id,
    metadata: { investment_id: result.investmentId },
    request,
  });

  return NextResponse.json({ success: true, investment_reference: result.investmentReference });
}
