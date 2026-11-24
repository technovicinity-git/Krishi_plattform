import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { investmentParties, notify } from "@/lib/notifications/notify";

export const runtime = "nodejs";

const schema = z.object({
  items: z
    .array(z.object({ investment_id: z.string().uuid(), month_no: z.number().int().min(1).max(1200) }))
    .min(1)
    .max(300),
});

const ERRORS: Record<string, string> = {
  NOT_DUE: "This month is not due (already sent, not ended yet, or the batch was settled)",
  STEWARD_NOT_ACTIVE: "The steward's account is not active",
};

/**
 * Admin sends due monthly pay to stewards' wallets. Each month is sent by the
 * database (send_monthly_pay), which checks it is due and not sent yet, so a
 * double click or two admins can never pay a month twice.
 */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const db = createAdminClient();
  const sent: { investmentId: string; monthNo: number; id: string }[] = [];
  const failed: { investmentId: string; monthNo: number; error: string }[] = [];

  // Oldest month first, so a batch's months go out in order.
  const items = [...parsed.data.items].sort((a, b) => a.month_no - b.month_no);
  for (const item of items) {
    const { data, error } = await db.rpc("send_monthly_pay", {
      p_investment_id: item.investment_id,
      p_month_no: item.month_no,
      p_admin_id: admin.id,
    });
    if (error) {
      const code = Object.keys(ERRORS).find((k) => error.message?.includes(k));
      if (!code) console.error("[admin/steward-pay/send] failed:", error);
      failed.push({ investmentId: item.investment_id, monthNo: item.month_no, error: code ? ERRORS[code] : "Could not send" });
    } else {
      sent.push({ investmentId: item.investment_id, monthNo: item.month_no, id: data as string });
    }
  }

  // One notification per batch, with the total sent for it.
  if (sent.length) {
    const ids = [...new Set(sent.map((s) => s.investmentId))];
    const { data: rows } = await db.from("steward_monthly_payments").select("investment_id, amount").in("id", sent.map((s) => s.id));
    for (const id of ids) {
      const amount = (rows ?? []).filter((r) => r.investment_id === id).reduce((t, r) => t + Number(r.amount), 0);
      const parties = await investmentParties(id);
      if (parties?.stewardId) {
        await notify(
          "monthly_pay_sent",
          { userId: parties.stewardId, href: "/steward/wallet" },
          { reference: parties.reference, plan: parties.plan, planBn: parties.planBn, amount },
        );
      }
    }
    await logAdminAction({
      adminId: admin.id,
      action: "steward_pay.send",
      targetType: "steward_monthly_payment",
      targetId: sent.length === 1 ? sent[0].id : undefined,
      metadata: {
        months: sent.map((s) => ({ investment_id: s.investmentId, month: s.monthNo, payment_id: s.id })),
        total: (rows ?? []).reduce((t, r) => t + Number(r.amount), 0),
      },
      request,
    });
  }

  if (sent.length === 0) {
    return NextResponse.json({ error: failed[0]?.error ?? "Nothing was sent", failed }, { status: 409 });
  }
  return NextResponse.json({ success: true, sent: sent.length, failed });
}
