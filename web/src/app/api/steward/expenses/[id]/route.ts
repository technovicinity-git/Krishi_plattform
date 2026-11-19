import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { notify } from "@/lib/notifications/notify";
import { timeline } from "@/lib/investments/timeline";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional().default(""),
});

/** Steward approves or rejects an expense the farmer logged. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { action, reason } = parsed.data;
  if (action === "reject" && !reason) {
    return NextResponse.json({ error: "Give a reason" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: expense } = await db
    .from("expenses")
    .select(`
      id, investment_id, amount, category, farmer_id,
      investment:investments!investment_id (
        offering:steward_plan_offerings!offering_id ( steward_id )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  const stewardId = (
    expense.investment as unknown as { offering: { steward_id: string } | null } | null
  )?.offering?.steward_id;
  if (stewardId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const approve = action === "approve";
  const { data: updated, error } = await db
    .from("expenses")
    .update({
      status: approve ? "approved" : "rejected",
      rejection_reason: approve ? null : reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", expense.id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("[steward/expenses] update failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  if (!updated?.length) {
    return NextResponse.json({ error: "Expense already reviewed" }, { status: 409 });
  }

  if (!approve) {
    const amount = Number(expense.amount);
    await db.from("investment_updates").insert({
      investment_id: expense.investment_id,
      author_id: user.id,
      author_role: "steward",
      update_type: "note",
      title: "Expense not accepted",
      body: `৳${amount.toLocaleString("en-IN")} for ${String(expense.category).replace(/_/g, " ")} was not accepted. Reason: ${reason}`,
      metadata: { i18n: timeline("expense_rejected", { amount, purpose: String(expense.category), reason }) },
    });
    await notify(
      "expense_rejected",
      { userId: expense.farmer_id, href: `/farmer/investments/${expense.investment_id}` },
      { amount, reason },
    );
  }

  return NextResponse.json({ success: true });
}
