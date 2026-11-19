import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { checkRefund } from "@/lib/payments/refund";

export const runtime = "nodejs";

/** Admin checks with SSLCommerz whether a pending refund has gone through. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await checkRefund(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  return NextResponse.json({ success: true, status: result.status, gatewayStatus: result.gatewayStatus });
}
