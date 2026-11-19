import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/admin/current-admin";
import { logAdminAction } from "@/lib/admin/audit";
import { previewSettlement } from "@/lib/investments/settle";
import { notify, investmentParties } from "@/lib/notifications/notify";
import { timeline } from "@/lib/investments/timeline";

export const runtime = "nodejs";

const schema = z.object({
  note: z.string().trim().max(1000).optional().default(""),
});

/**
 * Admin confirms the farmer's sale money arrived and settles the batch:
 * saves the profit/loss split, marks the sale settled and the investment
 * completed. All three writes happen in one database function.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const preview = await previewSettlement(id);
  if (!preview.ok) return NextResponse.json({ error: preview.error }, { status: 404 });
  if (preview.sale.status === "settled") {
    return NextResponse.json({ error: "This sale was already settled" }, { status: 409 });
  }
  if (preview.sale.status !== "remittance_submitted") {
    return NextResponse.json(
      { error: "The farmer has not reported sending the money yet" },
      { status: 400 },
    );
  }

  const b = preview.breakdown;
  const db = createAdminClient();
  const { data: settlementId, error } = await db.rpc("settle_investment_sale", {
    p_sale_id: id,
    p_admin_id: admin.id,
    p_capital: b.capital,
    p_funds_released: b.fundsReleased,
    p_sale_amount: b.saleAmount,
    p_total_return: b.totalReturn,
    p_net_result: b.netResult,
    p_outcome: b.outcome,
    p_investor_payout: b.investorPayout,
    p_farmer_share: b.farmerShare,
    p_steward_share: b.stewardShare,
    p_platform_share: b.platformShare,
    p_split: b.split,
    p_note: parsed.data.note || null,
  });

  if (error) {
    if (error.message?.includes("SALE_NOT_READY") || error.code === "23505") {
      return NextResponse.json({ error: "This sale was already settled" }, { status: 409 });
    }
    console.error("[admin/sales/settle] failed:", error);
    return NextResponse.json({ error: "Failed to settle" }, { status: 500 });
  }

  const fmt = (n: number) => `৳${n.toLocaleString("en-IN")}`;
  const totalLoss = preview.sale.kind === "total_loss";
  await db.from("investment_updates").insert({
    investment_id: preview.sale.investmentId,
    author_id: admin.id,
    author_role: "admin",
    update_type: "settlement",
    title: totalLoss
      ? "Closed as a total loss"
      : b.outcome === "profit"
        ? `Settled with a profit of ${fmt(b.netResult)}`
        : b.outcome === "loss"
          ? `Settled with a loss of ${fmt(Math.abs(b.netResult))}`
          : "Settled at break-even",
    body: totalLoss
      ? `All animals died. The investor gets back the unspent capital: ${fmt(b.investorPayout)}.`
      : `Krishi received the sale money. Investor payout: ${fmt(b.investorPayout)}.`,
    amount: b.investorPayout,
    metadata: {
      reference: preview.sale.reference,
      settlement_id: settlementId,
      i18n: totalLoss
        ? timeline("settled_total_loss", { net: Math.abs(b.netResult), amount: b.investorPayout })
        : timeline(
            b.outcome === "profit" ? "settled_profit" : b.outcome === "loss" ? "settled_loss" : "settled_even",
            { net: Math.abs(b.netResult), amount: b.investorPayout },
          ),
    },
  });

  const parties = await investmentParties(preview.sale.investmentId);
  if (parties) {
    const params = { reference: parties.reference, plan: parties.plan, planBn: parties.planBn };
    await notify(
      "settled_investor",
      { userId: parties.investorId, href: "/portal/wallet" },
      { ...params, amount: b.investorPayout },
    );
    if (b.farmerShare > 0) {
      await notify("settled_share", { userId: parties.farmerId, href: "/farmer/wallet" }, { ...params, amount: b.farmerShare });
    }
    if (b.stewardShare > 0) {
      await notify("settled_share", { userId: parties.stewardId, href: "/steward/wallet" }, { ...params, amount: b.stewardShare });
    }
  }

  await logAdminAction({
    adminId: admin.id,
    action: "sale.settle",
    targetType: "investment_sale",
    targetId: id,
    metadata: {
      reference: preview.sale.reference,
      kind: preview.sale.kind,
      outcome: b.outcome,
      net_result: b.netResult,
      investor_payout: b.investorPayout,
    },
    request,
  });

  return NextResponse.json({ success: true });
}
