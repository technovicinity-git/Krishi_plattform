import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { refundPayment } from "@/lib/payments/refund";

export const runtime = "nodejs";

const schema = z
  .object({
    method: z.enum(["gateway", "manual"]),
    reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500),
    reference: z.string().trim().max(120).optional().default(""),
    allow_retry: z.boolean().optional().default(false),
  })
  .refine((d) => d.method === "gateway" || d.reference.length > 0, {
    message: "Enter the transaction ID or reference of the refund you sent",
  });

/**
 * Admin refunds a paid online payment that didn't become an investment.
 * Body: { method: "gateway" | "manual", reason, reference?, allow_retry? }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  const result = await refundPayment({
    paymentId: id,
    adminId: admin.id,
    method: d.method,
    reason: d.reason,
    reference: d.reference || undefined,
    allowRetry: d.allow_retry,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });

  await logAdminAction({
    adminId: admin.id,
    action: d.method === "gateway" ? "payment.refund_gateway" : "payment.refund_manual",
    targetType: "online_payment",
    targetId: id,
    metadata: { reason: d.reason, reference: d.reference || null, allow_retry: d.allow_retry },
    request,
  });

  return NextResponse.json({ success: true, status: result.status });
}
