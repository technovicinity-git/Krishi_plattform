import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { investmentRoleFor } from "@/lib/investments/access";
import { totalLossBlocker } from "@/lib/investments/total-loss";
import { notify, investmentParties, notifyAdmins } from "@/lib/notifications/notify";
import { timeline } from "@/lib/investments/timeline";

export const runtime = "nodejs";

const schema = z.object({
  note: z.string().trim().min(5, "Explain what happened (at least 5 characters)").max(1000),
});

const BLOCKER_MESSAGES: Record<string, string> = {
  not_growing: "Only a batch that is being raised can be closed as a total loss",
  no_animals: "This batch has no animal records",
  animals_alive: "Some animals are still alive. Record their sale instead",
  death_pending: "Review the reported animal deaths first",
  fund_requests: "Answer the pending fund requests first",
  sale_exists: "A sale or closing is already in progress for this batch",
};

/**
 * Steward closes a batch whose animals all died. Creates a total-loss
 * "sale" (no animals, no money) waiting for the admin to settle it; the
 * investor then gets back whatever capital was not spent.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const access = await investmentRoleFor(user, id);
  if (access?.role !== "steward") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const note = parsed.data.note;

  const db = createAdminClient();
  const [{ data: inv }, { data: animals }, { count: pendingFundRequests }, { data: existing }] = await Promise.all([
    db.from("investments").select("id, farmer_id, current_stage").eq("id", id).maybeSingle(),
    db.from("animals").select("status").eq("investment_id", id),
    db.from("fund_requests").select("id", { count: "exact", head: true }).eq("investment_id", id).eq("status", "pending"),
    db.from("investment_sales").select("id, status").eq("investment_id", id).maybeSingle(),
  ]);
  if (!inv) return NextResponse.json({ error: "Investment not found" }, { status: 404 });

  const blocker = totalLossBlocker({
    stage: inv.current_stage ?? "",
    animalStatuses: (animals ?? []).map((a) => a.status),
    pendingFundRequests: pendingFundRequests ?? 0,
    saleStatus: existing?.status ?? null,
  });
  if (blocker) {
    return NextResponse.json({ error: BLOCKER_MESSAGES[blocker] }, { status: blocker === "sale_exists" ? 409 : 400 });
  }
  if (!inv.farmer_id) {
    return NextResponse.json({ error: "This batch has no farmer" }, { status: 400 });
  }

  // Claim the stage first so a double submit can't create two closings.
  const { data: moved } = await db
    .from("investments")
    .update({ current_stage: "sale_pending" })
    .eq("id", id)
    .eq("current_stage", "growing_care")
    .select("id");
  if (!moved?.length) {
    return NextResponse.json({ error: BLOCKER_MESSAGES.sale_exists }, { status: 409 });
  }

  const now = new Date().toISOString();
  const row = {
    farmer_id: inv.farmer_id,
    kind: "total_loss",
    animals_sold: 0,
    sale_amount: 0,
    sale_date: now.slice(0, 10),
    note,
    buyer_name: null,
    buyer_phone: null,
    photo_path: null,
    animal_ids: null,
    status: "remittance_submitted",
    rejection_reason: null,
    reviewed_by: user.id,
    reviewed_at: now,
    remit_method: null,
    remit_txn_id: null,
    remit_sender: null,
    remit_note: null,
    remit_proof_path: null,
    remitted_at: now,
    remit_rejection_reason: null,
  };
  const { data: sale, error } = existing
    ? await db.from("investment_sales").update(row).eq("id", existing.id).eq("status", "rejected").select("id, reference").maybeSingle()
    : await db.from("investment_sales").insert({ investment_id: id, ...row }).select("id, reference").maybeSingle();

  if (error || !sale) {
    console.error("[steward/total-loss] save failed:", error);
    await db.from("investments").update({ current_stage: "growing_care" }).eq("id", id).eq("current_stage", "sale_pending");
    return NextResponse.json({ error: "Could not close the batch" }, { status: 500 });
  }

  const count = (animals ?? []).length;
  await db.from("investment_updates").insert({
    investment_id: id,
    author_id: user.id,
    author_role: "steward",
    update_type: "sale",
    title: "Closing as a total loss",
    body: note,
    amount: 0,
    metadata: { reference: sale.reference, i18n: timeline("total_loss_requested", { count }, note) },
  });

  const parties = await investmentParties(id);
  await notifyAdmins("admin_total_loss", `/krishi-console/sales/${sale.id}`, {
    reference: parties?.reference ?? sale.reference,
    plan: parties?.plan,
    name: user.fullName ?? "The steward",
  });
  if (parties) {
    const params = { reference: parties.reference, plan: parties.plan, planBn: parties.planBn };
    await notify("total_loss_requested", [
      { userId: parties.investorId, href: `/portal/investments/${id}` },
      { userId: parties.farmerId, href: `/farmer/investments/${id}` },
    ], params);
  }

  return NextResponse.json({ success: true });
}
